// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

uint8 constant N_INPUT_COMMITMENTS = 2;
uint8 constant N_OUTPUT_COMMITMENTS = 2;

uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

/// @dev default address value for unit representation
address constant NATIVE_REPRESENTATION = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

/// @dev Minimum & Maximum supported tree depth.
uint8 constant MIN_DEPTH = 1;
uint8 constant MAX_DEPTH = 32;

// M-01
// C-05 Removed MAX_FEE as a comstamt.

/// @dev Indices of the public inputs
uint8 constant MerkleRootIndex = 0;
uint8 constant IsCommitFlagIndex = 1;
uint8 constant PublicValIndex = 2;
uint8 constant ScopeIndex = 3;
uint8 constant MerkleTreeDepthIndex = 4;
uint8 constant NewNullifierStartIndex = 5;
uint8 constant NewCommitmentStartIndex = NewNullifierStartIndex + N_OUTPUT_COMMITMENTS;
