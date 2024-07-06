// SPDX-License-Identifier: MITs
pragma solidity ^0.8.4;

import {InternalLeanIMT, LeanIMTData} from "@zk-kit/lean-imt.sol/InternalLeanIMT.sol";
import {IState} from "../interfaces/IState.sol";
import {IPrivacyPool} from "../interfaces/IPrivacyPool.sol";

import {
    D_CIPHERTEXT_SIZE,
    D_KEY_SIZE,
    D_EXTERN_IO_IDX_MIN,
    D_MAX_ALLOWED_EXISTING,
    D_MAX_ALLOWED_NEW,
    D_NEW_NULL_ROOT_IDX_MIN,
    D_NEW_COMMITMENT_HASH_IDX_MIN,
    D_NEW_COMMITMENT_ROOT_IDX_MIN,
    D_NEW_CIPHERTEXT_IDX_MIN,
    D_NEW_SALT_PUBLIC_KEY_IDX_MIN
} from "../Constants.sol";

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

contract State is IState {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToUintMap;

    /// @dev  Lean Incremental Merkle Tree from zk-kit
    /// Dynamic depth but with a cap set to default 32
    /// Designed to do minimum amount of hashing required when inserting leaves into the tree
    /// * LeanIMT does not store the actual tree nodes, only the side nodes
    /// * and leaf node values are not actually stored, but used instead as map keys
    /// * to map between leaf and their corresponding index.
    /// * therefore still requires off-chain re-construction of state tree
    /// * compute membership/inclusion proofs
    using InternalLeanIMT for LeanIMTData;

    /// @dev _ciphers: encrypted commitments (ciphertext) using Poseidon encryption
    /// combined with a public key & a hash value.
    /// Encryption key is derived through ECDH from a Salt key & EdSA KeyPair.
    /// The actual Salt key is not stored within the state and is assumed unrecoverable.
    /// The computed encryption key can be discarded (i.e. via the UI)
    /// as the public key that was derived from the Salt is sufficient to recover the key
    /// when paired with the correct EdSA private-key.
    /// To assist indexers, the salt public-key (x,y coordinates) is stored within
    /// the last elements of the cipher, with the last element being the commitment hash.
    /// The commitment hash, and ciphertext elements (excluding salt public-key)
    /// are required to compute the commitment-root.
    /// The commitment hash is a hash of the commitment tuple (value, scope, secret)
    /// and is a public output of the zk circuit.
    uint256[][] ciphers;

    /// @dev dataset os a set containing the commitment-roots & null-root of all data
    /// stored in the pool (as ciphers)
    /// null-roots function as nullifiers to the commitment-roots
    /// commitment-roots can be verified / computed without zk
    /// null-roots are computed using zk
    /// * Using the EnumerableSet library for easy iteration of leaves.
    /// * As the leaves map in LeanIMT lib is easily iterable
    EnumerableSet.UintSet dataset;

    /// @dev stateTree represents the stateSet (The Privacy Pool) as a merkle-tree
    /// where all elements of the set holds sufficient membership (via merkle inclusion-proofs).
    /// The leaf nodes of the stateTree are the commitment-roots & null-roots found in stateSet.
    /// Commitment-roots & null-roots are stored in a batch
    /// to reduce gas costs from computing hashes
    /// After each batch inserts, the new root & tree depth
    /// is stored in the stateRoots map.
    LeanIMTData tree;

    /// roots: map of state roots to the depth recorded at that root
    /// stateRoot and depth is a public input to the Privacy Pool Verifier
    EnumerableMap.UintToUintMap roots;

    /// @dev unpackCipherAt unpacks a
    /// cipher stored at specific index in the state's ciphers array
    function UnpackCipherAtPtr(uint256 index)
        public
        view
        returns (
            uint256[D_CIPHERTEXT_SIZE] memory cipherText,
            uint256[D_KEY_SIZE] memory saltPubkey,
            uint256 commitmentHash
        )
    {
        require(index < ciphers.length, "Index out of bounds");
        for (uint256 i = 0; i < D_CIPHERTEXT_SIZE; i++) {
            cipherText[i] = ciphers[index][i];
        }
        for (uint256 i = D_CIPHERTEXT_SIZE; i < D_CIPHERTEXT_SIZE + D_KEY_SIZE; i++) {
            saltPubkey[i] = ciphers[index][i];
        }
        commitmentHash = ciphers[index][D_CIPHERTEXT_SIZE + D_KEY_SIZE];
    }

    /// @dev unpackCipherFromTo unpacks ciphers from a range
    /// of indices in the ciphers array
    /// This function is utilised to quickly identify
    /// which cipher can be decrypted
    function UnpackCiphersWithinRange(uint256 from, uint256 to)
        public
        view
        returns (
            uint256[D_CIPHERTEXT_SIZE][] memory cipherTexts,
            uint256[D_KEY_SIZE][] memory saltPubkeys,
            uint256[] memory commitmentHashes
        )
    {
        require(from < ciphers.length, "Index out of bounds");
        require(to < ciphers.length, "Index out of bounds");
        require(from <= to, "Invalid range");
        cipherTexts = new uint256[D_CIPHERTEXT_SIZE][](to - from + 1);
        saltPubkeys = new uint256[D_KEY_SIZE][](to - from + 1);
        commitmentHashes = new uint256[](to - from + 1);
        for (uint256 i = from; i <= to; i++) {
            for (uint256 j = 0; j < D_CIPHERTEXT_SIZE; j++) {
                cipherTexts[i - from][j] = ciphers[i][j];
            }
            for (uint256 j = D_CIPHERTEXT_SIZE; j < D_CIPHERTEXT_SIZE + D_KEY_SIZE; j++) {
                saltPubkeys[i - from][j] = ciphers[i][j];
            }
            commitmentHashes[i - from] = ciphers[i][D_CIPHERTEXT_SIZE + D_KEY_SIZE];
        }
    }
    /// @dev SeekDataSetPointer retuns the leaf index of
    /// a uint256 data if it exists in the dataset & the state tree
    /// else it will return false, 0

    function SeekDataSetPointer(uint256 data) public view returns (bool ok, uint256 idx) {
        if (dataset.contains(data)) {
            /// _indexOf will revert if not found as a leaf node in the state tree
            return (true, tree._indexOf(data));
        }
        return (false, 0);
    }

    /// @dev SeekDataSetPointers samev as SeekDataSetPointer but for a data subset
    function SeekDataSetPointers(uint256[] memory data) public view returns (bool[] memory ok, uint256[] memory idx) {
        ok = new bool[](data.length);
        idx = new uint256[](data.length);
        for (uint256 i = 0; i < data.length; i++) {
            if (dataset.contains(data[i])) {
                ok[i] = true;
                idx[i] = tree._indexOf(data[i]);
            }
        }
    }

    function GrabDataAtPointer(uint256 idx) public view returns (uint256 element) {
        return dataset.at(idx);
    }

    function GrabDataWithinRange(uint256 from, uint256 to) public view returns (uint256[] memory elements) {
        require(from < dataset.length(), "Index out of bounds");
        require(to < dataset.length(), "Index out of bounds");
        require(from <= to, "Invalid range");

        elements = new uint256[](to - from + 1);
        for (uint256 i = from; i <= to; i++) {
            elements[i - from] = dataset.at(i);
        }
    }

    function PackCipher(
        uint256[D_CIPHERTEXT_SIZE] memory cipherText,
        uint256[D_KEY_SIZE] memory saltPubkey,
        uint256 commitmentHash
    ) public pure returns (uint256[D_CIPHERTEXT_SIZE + D_KEY_SIZE + 1] memory cipher) {
        for (uint256 i = 0; i < D_CIPHERTEXT_SIZE; i++) {
            cipher[i] = cipherText[i];
        }
        for (uint256 i = D_CIPHERTEXT_SIZE; i < D_CIPHERTEXT_SIZE + D_KEY_SIZE; i++) {
            cipher[i] = saltPubkey[i];
        }
        cipher[D_CIPHERTEXT_SIZE + D_KEY_SIZE] = commitmentHash;
    }

    function _storeCipher(
        uint256[D_CIPHERTEXT_SIZE] memory cipherText,
        uint256[D_KEY_SIZE] memory saltPubkey,
        uint256 commitmentHash
    ) internal {
        uint256[D_CIPHERTEXT_SIZE + D_KEY_SIZE + 1] memory cipher = PackCipher(cipherText, saltPubkey, commitmentHash);
        ciphers.push(cipher);
    }

    function FetchCipherComponentsFromProof(IPrivacyPool.GROTH16Proof calldata _proof, uint256 idx)
        public
        pure
        returns (
            uint256[D_CIPHERTEXT_SIZE] memory cipherText,
            uint256[D_KEY_SIZE] memory saltPubkey,
            uint256 commitmentHash
        )
    {
        require(idx <= D_MAX_ALLOWED_NEW - 1, "idx out of bounds");
        uint256 _startPos = D_NEW_CIPHERTEXT_IDX_MIN + idx * D_CIPHERTEXT_SIZE;
        for (uint256 i = 0; i < D_CIPHERTEXT_SIZE; i++) {
            cipherText[i] = _proof._pubSignals[_startPos + i];
        }
        _startPos = D_NEW_SALT_PUBLIC_KEY_IDX_MIN + idx * D_KEY_SIZE;
        for (uint256 i = 0; i < D_KEY_SIZE; i++) {
            saltPubkey[i] = _proof._pubSignals[_startPos + i];
        }
        commitmentHash = _proof._pubSignals[D_NEW_COMMITMENT_HASH_IDX_MIN + idx];
    }

    /// @dev ensures that the newly inserted set of elements
    /// were also inserted in the dataset
    /// by comparing the dataset length before and after the insert
    /// with the tree size before and after the insert
    modifier DataSetIsInSync() {
        uint256 _prev_dataset_len = dataset.length();
        uint256 _prev_tree_size = tree.size;
        _;
        uint256 _datset_growth = dataset.length() - _prev_dataset_len;
        uint256 _tree_growth = tree.size - _prev_tree_size;
        if (_datset_growth != _tree_growth) {
            revert DataSetOutOfSync(_datset_growth, _tree_growth);
        }
    }

    /// @dev given a GROTH16 Proof
    /// update the state accordingly
    /// with the values extracted from the
    /// proof's public inpus & output signals
    function ApplyProofToState(IPrivacyPool.GROTH16Proof calldata _proof)
        internal
        // checks if the dataset is in sync with the state tree
        DataSetIsInSync
        returns (uint256 newStateRoot, uint256 newSetSize)
    {
        // insert null roots
        for (uint8 i = 0; i < D_MAX_ALLOWED_EXISTING; i++) {
            uint256 datapoint = _proof._pubSignals[D_NEW_NULL_ROOT_IDX_MIN + i];
            // insert into tree
            tree._insert(datapoint);

            // add to dataset
            // revert if duplicate
            if (!dataset.add(datapoint)) {
                revert ElementExistsInDataSet(datapoint);
            }
        }
        // insert commitment roots
        // extract & store ciphers
        for (uint8 i = D_MAX_ALLOWED_EXISTING; i < D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW; i++) {
            uint256 datapoint = _proof._pubSignals[D_NEW_COMMITMENT_ROOT_IDX_MIN + i];
            // insert new commitment roots to tree
            tree._insert(datapoint);

            // add to dataset
            // revert if duplicate
            if (!dataset.add(datapoint)) {
                revert ElementExistsInDataSet(datapoint);
            }

            /// fetch cipher components
            (
                uint256[D_CIPHERTEXT_SIZE] memory cipherText,
                uint256[D_KEY_SIZE] memory saltPubkey,
                uint256 commitmentHash
            ) = FetchCipherComponentsFromProof(_proof, i);
            // store the cipher
            _storeCipher(cipherText, saltPubkey, commitmentHash);
        }

        newStateRoot = tree._root();
        newSetSize = dataset.length();
        /// record the new state root and depth
        roots.set(newStateRoot, tree.depth);
    }

    function FetchTreeDepthForRoot(uint256 stateRoot) public view returns (uint256 depth) {
        /// get will revert if there are no mmatches
        return roots.get(stateRoot);
    }

    function GetStateRoot() public view returns (uint256) {
        return tree._root();
    }
}
