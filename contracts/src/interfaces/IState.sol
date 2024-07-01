// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title State contract interface.
interface IState {
    function hasNullifier(uint256 nullifier) external view returns (bool, uint256);
    function hasCommitment(uint256 commitment) external view returns (bool, uint256);
    function stateRoot() external view returns (uint256);
}
