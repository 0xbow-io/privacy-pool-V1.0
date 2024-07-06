// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

/**
 *
 *
 * @title Default Values for PrivacyPool contract
 * @notice Values prefixed with D_ are default values for the PrivacyPool contract
 *
 *
 */

/// @dev Minimum & Maximum supported merkle-tree depth.
uint8 constant D_MIN_MT_DEPTH = 1;
uint8 constant D_MAX_MT_DEPTH = 32;

/// @dev Number of elements a ciphertext has
uint8 constant D_CIPHERTEXT_SIZE = 7;
/// @dev number of elements a commitment tuple has
/// +1 value
/// +1 scope
/// +2 Secret Key (x, y)
uint8 constant D_COMMIT_TUPLE_SIZE = 1 + 1 + D_KEY_SIZE;

/// @dev Number of elements a key has
uint8 constant D_KEY_SIZE = 2;

/// @dev number of existing or new
/// commitments allowed in a single transaction
uint8 constant D_MAX_ALLOWED_EXISTING = 2;
uint8 constant D_MAX_ALLOWED_NEW = 2;

/// @dev the reference to the default primitive which is the chain gas token
address constant D_NATIVE_PRIMITIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

/// @dev below are the index mappings of these public inputs / outputs:
///
/**
 *
 *     "scope",
 *     "actualTreeDepth",
 *     "context",
 *     "externIO",
 *     "existingStateRoot",
 *     "newSaltPublicKey",
 *     "newCiphertext"
 *     "newNullRoot",
 *     "newCommitmentRoot",
 *     "newCommitmentHash"
 *
 */
///
uint8 constant D_SCOPE_IDX = 0;
uint8 constant D_ACTUAL_TREE_DEPTH_IDX = 1;
uint8 constant D_CONTEXT_IDX = 2;
uint8 constant D_EXTERN_IO_IDX_MIN = 3;
uint8 constant D_EXTERN_IO_IDX_MAX = 4;
uint8 constant D_EXISTING_STATE_ROOT_IDX = D_EXTERN_IO_IDX_MAX + 1;
uint8 constant D_NEW_SALT_PUBLIC_KEY_IDX_MIN = D_EXISTING_STATE_ROOT_IDX + 1;
uint8 constant D_NEW_SALT_PUBLIC_KEY_IDX_MAX = D_EXISTING_STATE_ROOT_IDX + D_KEY_SIZE;
uint8 constant D_NEW_CIPHERTEXT_IDX_MIN = D_NEW_SALT_PUBLIC_KEY_IDX_MAX + 1;
uint8 constant D_NEW_CIPHERTEXT_IDX_MAX = D_NEW_SALT_PUBLIC_KEY_IDX_MAX + (D_MAX_ALLOWED_NEW * D_CIPHERTEXT_SIZE);
uint8 constant D_NEW_NULL_ROOT_IDX_MIN = D_NEW_CIPHERTEXT_IDX_MAX + 1;
uint8 constant D_NEW_NULL_ROOT_IDX_MAX = D_NEW_NULL_ROOT_IDX_MIN + (D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW);
uint8 constant D_NEW_COMMITMENT_ROOT_IDX_MIN = D_NEW_NULL_ROOT_IDX_MAX + 1;
uint8 constant D_NEW_COMMITMENT_ROOT_IDX_MAX = D_NEW_NULL_ROOT_IDX_MAX + (D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW);
uint8 constant D_NEW_COMMITMENT_HASH_IDX_MIN = D_NEW_COMMITMENT_ROOT_IDX_MAX + 1;
uint8 constant D_NEW_COMMITMENT_HASH_IDX_MAX =
    D_NEW_COMMITMENT_ROOT_IDX_MAX + (D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW);

/// @dev The Snark Scalar field value
/// used to handle overflows / underflows
uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
