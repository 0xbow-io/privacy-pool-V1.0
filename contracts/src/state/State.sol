// SPDX-License-Identifier: MITs
pragma solidity ^0.8.4;

import {InternalLeanIMT, LeanIMTData} from "@zk-kit/lean-imt.sol/InternalLeanIMT.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IState} from "../interfaces/IState.sol";

contract State is IState {
    // @dev using the EnumerableSet library for sets
    using EnumerableSet for EnumerableSet.UintSet;

    /// @dev Incremental Merkle Tree
    /// where leaves are hashes of commitment ciphertexts
    using InternalLeanIMT for LeanIMTData;

    LeanIMTData commitmentTree;
    EnumerableSet.UintSet nullifiers


    // @dev knownNullifiers keep track of all nullifiers
    // that were used as inputs for new commitments
    mapping(uint256 => bool) public knownNullifiers;

    /// @dev keeps track of known merkle roots
    mapping(uint256 => bool) public knownRoots;

    /// @dev modifier to check if a prior merkle root exists
    function isMerkleRootKnown(uint256 root) public view returns (bool) {
        return knownRoots[root];
    }

    function hasCommitment(uint256 commitment) public view returns (bool) {
        return commitmentTree._has(commitment);
    }

    /// @dev modifier to check if a nullifier is known
    function isNullifierKnown(uint256 nullifier) public view returns (bool) {
        return knownNullifiers[nullifier];
    }

    function markNullifierAsKnown(uint256 nullifier) internal {
        knownNullifiers[nullifier] = true;
    }

    /// @dev insert commitments into the commitment tree
    /// and capture the latest known merkle root
    function insertCommitment(uint256 leaf) internal {
         knownRoots[commitmentTree._insert(leaf)] = true;
    }

    /// @dev modifier to check the latest
    /// merkle root of the commitment tree
    function latestMerkleRoot() public view returns (uint256) {
        return commitmentTree.sideNodes[commitmentTree.depth];
    }

    /// @dev modifier to check the number of commitments in the tree
    function merkleTreeSize() public view returns (uint256) {
        return commitmentTree.size;
    }

    /// @dev modifier to check the depth of the commitment tree
    function merkleTreeDepth() public view returns (uint256) {
        return commitmentTree.depth;
    }
}
