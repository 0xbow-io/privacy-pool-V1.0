// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// Privacy Pool State Library
/// is a reduced version of the lean-imt library from PSE.
/// wich utilises EnumerableSets for data storage.
/// https://github.com/privacy-scaling-explorations/zk-kit.solidity/blob/main/packages/lean-imt/contracts/InternalLeanIMT.sol

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {PoseidonT3} from "poseidon-solidity/PoseidonT3.sol";

error CommitmentGreaterThanSnarkScalarField();
error CommitmentCannotBeZero();
error CommitmentAlreadyExists();
error CommitmentDoesNotExist();
error WrongSiblingNodes();

uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

/// @title Lean Incremental binary Merkle tree.
/// @dev The LeanIMT is an optimized version of the BinaryIMT.
/// This implementation eliminates the use of zeroes, and make the tree depth dynamic.
/// When a node doesn't have the right child, instead of using a zero hash as in the BinaryIMT,
/// the node's value becomes that of its left child. Furthermore, rather than utilizing a static tree depth,
/// it is updated based on the number of commitments in the tree. This approach
/// results in the calculation of significantly fewer hashes, making the tree more efficient.
library PrivacyPoolState {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToUintMap;

    struct PrivacyPoolStateData {
        /// _ciphers: encrypted commitments using Poseidon encryption.
        /// with the encryption key as a ECDH secret key derived from a Salt & Keypair.
        /// The actual Salt is not stored in the Pool sate
        /// and is considered unrecoverable.
        /// However, a public key that was derived from the Salt
        /// is stored as the last 2 elements (x,y) in the cipher text.
        /// When paired with the correct private-key, it is possible to recover
        /// the Encryption key
        uint256[][] _ciphers;
        /// _roots: map of roots to the depth recorded at that root
        EnumerableMap.UintToUintMap _stateRoots;
        EnumerableMap.UintToUintMap _roots;
        EnumerableSet.UintSet _sideNodes;
    }

    /// Modifier to verify if commit is valid
    ///  ** Ensure that the commitment hash value is within valid range
    ///  ** Ensure that the commitment has not been inserted before
    modifier verifyCommit(PrivacyPoolStateData storage self, uint256 commitment) {
        CheckCommitmentWithinRange(commitment);
        if (self._roots.contains(commitment)) {
            revert CommitmentAlreadyExists();
        }
        _;
    }

    /// @dev Iterates through _roots starting from a specified index, and retrieves sate data between the index range.
    function _grabFromIndexRange(PrivacyPoolStateData storage self, uint256 _from, uint256 _to) public view {
        for (uint256 i = _from; i < _to; i++) {
            self._roots.at(i);
        }
    }

    /// @dev Inserts a new Commitment into the incremental merkle tree.
    /// The function ensures that the Commitment is valid according to the
    /// constraints of the tree (verifyCommit)
    /// and then updates the tree's structure accordingly based on the
    /// last set of sibling nodes.
    /// @param self: A storage reference to the 'PrivacyPoolStateData' struct.
    /// @param commitment: Hash of all the elements in the commitment tuple. Used as
    /// @param cipher: Poseidon encryption
    /// @return The new hash of the node after the Commitment has been inserted. (#also return the index of the commitment in the tree#)
    function _commit(PrivacyPoolStateData storage self, uint256 commitment, uint256[4] calldata cipher)
        internal
        verifyCommit(self, commitment)
        returns (uint256, uint256)
    {}

    function CheckCommitmentWithinRange(uint256 commitment) internal pure {
        if (commitment == 0 || commitment >= SNARK_SCALAR_FIELD) {
            revert CommitmentCannotBeZero();
        }
    }

    /// @dev Size is determiend by the length of the commitments set.
    function _depth(PrivacyPoolStateData storage self) internal view returns (uint256) {
        return self._sideNodes.length();
    }

    /// @dev Size is determiend by the length of the commitments set.
    function _size(PrivacyPoolStateData storage self) internal view returns (uint256) {
        return self._roots.length();
    }

    /// @dev Retrieves the root of the tree from the 'sideNodes' mapping using the
    /// current tree depth.
    /// @param self: A storage reference to the 'PrivacyPoolStateData' struct.
    /// @return The root hash of the tree.
    function _root(PrivacyPoolStateData storage self) internal view returns (uint256) {
        return self._sideNodes.at(_depth(self) - 1);
    }

    /// @dev Checks if a Commitment exists in the tree.
    /// @param self: A storage reference to the 'PrivacyPoolStateData' struct.
    /// @param commitment: The value of the Commitment to check for existence.
    /// @return A boolean value indicating whether the Commitment exists in the tree.
    function _hasCommitment(PrivacyPoolStateData storage self, uint256 commitment) internal view returns (bool) {
        return self._roots.contains(commitment);
    }

    /// @dev Retrieves the index of a given Commitment in the tree.
    /// @param self: A storage reference to the 'PrivacyPoolStateData' struct.
    /// @param commitment: The value of the Commitment whose index is to be found.
    /// @return The index of the specified Commitment within the tree. If the Commitment is not present, the function
    /// reverts with a custom error.
    function _indexOf(PrivacyPoolStateData storage self, uint256 commitment) internal view returns (uint256) {
        (bool ok, uint256 index) = self._roots.tryGet(commitment);
        if (!ok) {
            revert CommitmentDoesNotExist();
        }
        return index;
    }
}
