// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/// @title Processor contract interface.
interface IProcessor {
    error PoolIsNonNative();
    error InvalidCommitAmnt(uint256 got, uint256 expected);
    error InvalidReleaseAmnt(uint256 got, uint256 expected);
    error PoolIsNative();
}
