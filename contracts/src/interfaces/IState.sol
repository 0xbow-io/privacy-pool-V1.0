// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title State contract interface.
interface IState {
    function latestMerkleRoot() external view returns (uint256);
    function merkleTreeSize() external view returns (uint256);
    function merkleTreeDepth() external view returns (uint256);
    function isMerkleRootKnown(uint256 root) external view returns (bool);
    function isNullifierKnown(uint256 nullifier) external view returns (bool);
}
