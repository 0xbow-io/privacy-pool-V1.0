// SPDX-License-Identifier: MITs
pragma solidity ^0.8.4;

/*  OpenZeppelin Imports */
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
/*  Zk-kit Imports */
import {InternalLeanIMT, LeanIMTData} from "zk-kit.solidity/packages/lean-imt/contracts/InternalLeanIMT.sol";
/*  Local Imports */
import "../Constants.sol";
import "../interfaces/IState.sol";
import "../interfaces/IPrivacyPool.sol";

/**
 * Privacy Pool commitment scheme binds a field-element's value to a scope (domain identifier) & a secret.
 * This results in a tuple (value, scope, secret) that is hashed to create a commitment hash.
 * Privacy-preservation involves the encryption of the this commitment tuple using poseidon encryption.
 * Encryption key is derived through ECDH from a Salt key & EdSA KeyPair.
 * The actual Salt key is not stored within the state and is assumed unrecoverable.
 * The computed encryption key is assumed to be discarded.
 * This is acceptable as the public key that was derived from the Salt
 * when paired with the correct EdSA private-key is sufficient to recover the encryption key.
 * To assist indexers, the salt public-key (x,y coordinates) is stored within
 * the last elements of the cipher, with the last element being the commitment hash.
 * The commitment hash, and ciphertext elements (excluding salt public-key)
 * are required to compute the commitment-root.
 * The commitment hash is a hash of the commitment tuple (value, scope, secret)
 * and can be found within the proof's public output signals
 */
contract State is IState {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToUintMap;

    /**
     * @dev Lean Incremental Merkle merkleTree from zk-kit
     * note:
     *  LeanIMT does not store the actual merkleTree nodes, only the side nodes
     *  Leaf values are not actually stored, but used instead as map keys
     *  to map between leaf value and their corresponding leaf index.
     *  Therefore off-chain re-construction of state merkleTree is required
     *  in order to compute membership/inclusion proofs`
     */
    using InternalLeanIMT for LeanIMTData;

    /**
     * @dev cipherStore: storage of the ciphertext elements of an encrypted commitment tuple
     *  combined with with the associated saltPubKey & commitment hash.
     */
    uint256[][] private cipherStore;

    /// @dev rootSet is a set of commitment-roots & null-roots
    /// derived from ciphers
    /// -- null-roots function as nullifiers to the commitment-roots
    /// -- commitment-roots can be verified / computed without zk
    /// -- null-roots are computed using zk
    /// note: Using the EnumerableSet library for easy iteration over set elements.
    EnumerableSet.UintSet private rootSet;

    /// @dev merkleTree represents the rootSet as a merkle-merkleTree (lean IMT type).
    /// It is used to compute inclusion proofs for any data in the rootSet
    /// Which are commitment-roots & null-roots are stored in a batch
    /// to reduce gas costs from computing hashes
    /// After each batch inserts, the new root & merkleTree depth
    /// is stored in the stateRoots map.
    LeanIMTData private merkleTree;

    /// @dev mapping of merkleTree merkle-roots & merkleTree depth
    /// assumed size can be calculated from the depth value
    /// size = 2 ** depth
    EnumerableMap.UintToUintMap private merkleTreeCheckPoints;

    /*//////////////////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev ensures that new entries in the rootSet
    /// are also inserted into the state merkleTree
    modifier SyncTree() {
        uint256 _prev_rootSet_len = rootSet.length();
        uint256 _prev_merkleTree_size = merkleTree.size;

        _; // execute function body here
        // get number of new entries
        uint256 _new_entries = rootSet.length() - _prev_rootSet_len;
        // then for each new entry, grab the root and insert it into the merkleTree
        uint256 newRoot = 0;
        for (uint256 i = 0; i < _new_entries; i++) {
            uint256 _root = rootSet.at(_prev_rootSet_len + i);
            newRoot = merkleTree._insert(_root);
        }

        /// verify that the number of new entries in the rootSet
        /// is equal to the number of new entries in the merkleTree
        uint256 _merkleTree_growth = merkleTree.size - _prev_merkleTree_size;
        if (_new_entries != _merkleTree_growth) {
            revert RootSetOutOfSync(_new_entries, _merkleTree_growth);
        }

        /// record the new state root & depth
        merkleTreeCheckPoints.set(newRoot, merkleTree.depth);
    }

    modifier UpdateCipherStore(IPrivacyPool.GROTH16Proof calldata _proof) {
        _;
        for (uint8 i = 0; i < D_MAX_ALLOWED_NEW; i++) {
            // extract & store cipher
            (
                uint256[D_CIPHERTEXT_SIZE] memory cipherText,
                uint256[D_KEY_SIZE] memory saltPubkey,
                uint256 commitmentHash
            ) = FetchCipherComponentsFromProof(_proof, i);
            // store the cipher
            _storeCipher(cipherText, saltPubkey, commitmentHash);
        }
    }

    /*//////////////////////////////////////////////////////////////////////////
                                PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @dev UnpackCipherAtIdx unpacks a
    /// cipher stored in specific index in the state's cipherStore array
    function UnpackCipherAtIdx(
        uint256 _index
    )
        public
        view
        returns (
            uint256[D_CIPHERTEXT_SIZE] memory cipherText,
            uint256[D_KEY_SIZE] memory saltPubkey,
            uint256 commitmentHash
        )
    {
        require(_index < cipherStore.length, "Index out of bounds");
        for (uint256 i = 0; i < D_CIPHERTEXT_SIZE; i++) {
            cipherText[i] = cipherStore[_index][i];
        }
        for (uint256 i = 0; i < D_KEY_SIZE; i++) {
            saltPubkey[i] = cipherStore[_index][i + D_CIPHERTEXT_SIZE];
        }
        commitmentHash = cipherStore[_index][D_CIPHERTEXT_SIZE + D_KEY_SIZE];
    }

    /// @dev UnpackCiphersWithinRange unpacks cipherStore from a range
    /// of indices in the cipherStore array
    /// This function is utilised to quickly identify
    /// which cipher can be decrypted
    function UnpackCiphersWithinRange(
        uint256 _from,
        uint256 _to
    )
        public
        view
        returns (
            uint256[D_CIPHERTEXT_SIZE][] memory cipherTexts,
            uint256[D_KEY_SIZE][] memory saltPubkeys,
            uint256[] memory commitmentHashes
        )
    {
        require(_from < cipherStore.length, "_from out of bounds");
        require(_to < cipherStore.length, "_to out of bounds");
        require(_from <= _to, "Invalid range");

        cipherTexts = new uint256[D_CIPHERTEXT_SIZE][](_to - _from + 1);
        saltPubkeys = new uint256[D_KEY_SIZE][](_to - _from + 1);
        commitmentHashes = new uint256[](_to - _from + 1);

        for (uint256 i = _from; i <= _to; i++) {
            for (uint256 j = 0; j < D_CIPHERTEXT_SIZE; j++) {
                cipherTexts[i - _from][j] = cipherStore[i][j];
            }
            for (uint256 j = 0; j < D_KEY_SIZE; j++) {
                saltPubkeys[i - _from][j] = cipherStore[i][
                    j + D_CIPHERTEXT_SIZE
                ];
            }
            commitmentHashes[i - _from] = cipherStore[i][
                D_CIPHERTEXT_SIZE + D_KEY_SIZE
            ];
        }
    }

    /// @dev SeekRootIdx retuns the leaf index of
    /// a uint256 value if it exists in the rootSet & the state merkleTree
    /// else it will return false, 0
    function SeekRootIdx(
        uint256 _root
    ) public view returns (bool ok, uint256 idx) {
        if (rootSet.contains(_root)) {
            /// _indexOf will revert if not found as a leaf node in the state merkleTree
            return (true, merkleTree._indexOf(_root));
        }
        return (false, 0);
    }

    /// @dev SeekRootIdxs same as SeekrootSetPointer but for a data subset
    function SeekRootIdxs(
        uint256[] memory _roots
    ) public view returns (bool[] memory ok, uint256[] memory idx) {
        ok = new bool[](_roots.length);
        idx = new uint256[](_roots.length);
        for (uint256 i = 0; i < _roots.length; i++) {
            if (rootSet.contains(_roots[i])) {
                ok[i] = true;
                idx[i] = merkleTree._indexOf(_roots[i]);
            }
        }
    }

    function FetchRoot(uint256 idx) public view returns (uint256 root) {
        return rootSet.at(idx);
    }

    function FetchRoots(
        uint256 _from,
        uint256 _to
    ) public view returns (uint256[] memory roots) {
        require(_from < rootSet.length(), "Index out of bounds");
        require(_to < rootSet.length(), "Index out of bounds");
        require(_from <= _to, "Invalid range");

        roots = new uint256[](_to - _from + 1);
        for (uint256 i = _from; i <= _to; i++) {
            roots[i - _from] = rootSet.at(i);
        }
    }

    function PackCipher(
        uint256[D_CIPHERTEXT_SIZE] memory _cipherText,
        uint256[D_KEY_SIZE] memory _saltPubkey,
        uint256 _commitmentHash
    )
        public
        pure
        returns (uint256[D_CIPHERTEXT_SIZE + D_KEY_SIZE + 1] memory packed)
    {
        for (uint256 i = 0; i < D_CIPHERTEXT_SIZE; i++) {
            packed[i] = _cipherText[i];
        }
        for (uint256 i = 0; i < D_KEY_SIZE; i++) {
            packed[i + D_CIPHERTEXT_SIZE] = _saltPubkey[i];
        }
        packed[D_CIPHERTEXT_SIZE + D_KEY_SIZE] = _commitmentHash;
    }

    function FetchCipherComponentsFromProof(
        IPrivacyPool.GROTH16Proof calldata _proof,
        uint8 _idx
    )
        public
        pure
        returns (
            uint256[D_CIPHERTEXT_SIZE] memory cipherText,
            uint256[D_KEY_SIZE] memory saltPubkey,
            uint256 commitmentHash
        )
    {
        require(_idx <= D_MAX_ALLOWED_NEW - 1, "idx out of bounds");
        uint256 _startPos = D_NewCiphertext_StartIdx + _idx * D_CIPHERTEXT_SIZE;
        for (uint256 i = 0; i < D_CIPHERTEXT_SIZE; i++) {
            cipherText[i] = _proof._pubSignals[_startPos + i];
        }
        _startPos = D_NewSaltPublicKey_StartIdx + _idx * D_KEY_SIZE;
        for (uint256 i = 0; i < D_KEY_SIZE; i++) {
            saltPubkey[i] = _proof._pubSignals[_startPos + i];
        }
        commitmentHash = _proof._pubSignals[
            D_NewCommitmentHash_StartIdx + D_MAX_ALLOWED_EXISTING + _idx
        ];
    }

    function FetchCheckpointAtRoot(
        uint256 _stateRoot
    ) public view returns (bool found, uint256 depth) {
        /// get will revert if there are no matches
        /// but tryGet will return false if there are no matches
        return merkleTreeCheckPoints.tryGet(_stateRoot);
    }

    function GetLastCheckpoint()
        public
        view
        returns (uint256 root, uint256 depth)
    {
        uint256 len = merkleTreeCheckPoints.length();
        if (len == 0) {
            return (0, 0);
        }
        return merkleTreeCheckPoints.at(len - 1);
    }

    function FetchNullRootFromProof(
        IPrivacyPool.GROTH16Proof calldata _proof,
        uint8 _idx
    ) public pure returns (uint256 nullRoot) {
        return _proof._pubSignals[D_NewNullRoot_StartIdx + _idx];
    }

    function FetchCommitmentRootFromProof(
        IPrivacyPool.GROTH16Proof calldata _proof,
        uint8 _idx
    ) public pure returns (uint256 nullRoot) {
        return _proof._pubSignals[D_NewCommitmentRoot_StartIdx + _idx];
    }

    function GetStateRoot() public view returns (uint256) {
        return merkleTree._root();
    }

    function GetStateTreeDepth() public view returns (uint256) {
        return merkleTree.depth;
    }

    function GetStateSize() public view returns (uint256) {
        return rootSet.length();
    }

    /*//////////////////////////////////////////////////////////////////////////
                                INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    function _storeCipher(
        uint256[D_CIPHERTEXT_SIZE] memory _cipherText,
        uint256[D_KEY_SIZE] memory _saltPubkey,
        uint256 _commitmentHash
    ) internal {
        uint256[D_CIPHERTEXT_SIZE + D_KEY_SIZE + 1] memory packed = PackCipher(
            _cipherText,
            _saltPubkey,
            _commitmentHash
        );
        cipherStore.push(packed);
    }

    /// @dev given a GROTH16 Proof
    /// update the state accordingly
    /// with the values extracted from the
    /// proof's public inpus & output signals
    function ApplyProofToState(
        IPrivacyPool.GROTH16Proof calldata _proof
    )
        internal
        /// Makes sure that the state tree
        /// is in sync with the rootSet
        /// and capture the latest merkle-root & size
        /// after function execution
        SyncTree
        /// fetch the ciphers from the proof and insert it into the cipher store
        UpdateCipherStore(_proof)
    {
        // insert null roots
        for (uint8 i = 0; i < D_MAX_ALLOWED_EXISTING; i++) {
            uint256 nullRoot = FetchNullRootFromProof(_proof, i);
            // add to rootSet
            // revert if is duplicate
            if (!rootSet.add(nullRoot)) {
                revert NullRootExists(nullRoot);
            }
        }
        /// insert commitment roots
        uint8 offset = D_MAX_ALLOWED_EXISTING;
        for (uint8 i = 0; i < D_MAX_ALLOWED_NEW; i++) {
            // insert new commitment roots to merkleTree
            uint256 commitmentRoot = FetchCommitmentRootFromProof(
                _proof,
                offset + i
            );
            // add to rootSet
            // revert if duplicate
            if (!rootSet.add(commitmentRoot)) {
                revert CommitmentRootExists(commitmentRoot);
            }
        }
    }
}
