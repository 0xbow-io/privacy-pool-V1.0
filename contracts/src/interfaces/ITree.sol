// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title ITree contract interface.
interface ITree {
    function latestMerkleRoot() external view returns (uint256);
    function merkleTreeSize() external view returns (uint256);
    function merkleTreeDepth() external view returns (uint256);
    function isMerkleRootKnown(uint256 root) external view returns (bool);
}
