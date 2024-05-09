// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IPoseidonT3 {
    function hash(uint256[2] memory) external pure returns (uint256);
}
