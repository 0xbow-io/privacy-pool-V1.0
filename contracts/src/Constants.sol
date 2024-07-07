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

/**
 * @dev below are the are the default starting indices of certain fields
 * in the _pubSignals array
 * Note: Output Signals will apear first before input signals
 *     "newNullRoot",
 *     "newCommitmentRoot",
 *     "newCommitmentHash"
 *     "scope",
 *     "actualTreeDepth",
 *     "context",
 *     "externIO",
 *     "existingStateRoot",
 *     "newSaltPublicKey",
 *     "newCiphertext"
 *
 */
uint8 constant D_NewNullRoot_StartIdx = 0;
uint8 constant D_NewCommitmentRoot_StartIdx = (D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW);
uint8 constant D_NewCommitmentHash_StartIdx =
    D_NewCommitmentRoot_StartIdx + (D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW);
uint8 constant D_Scope_StartIdx = D_NewCommitmentHash_StartIdx + (D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW);
uint8 constant D_ActualTreeDepth_StartIdx = D_Scope_StartIdx + 1;
uint8 constant D_Context_StartIdx = D_ActualTreeDepth_StartIdx + 1;
uint8 constant D_ExternIO_StartIdx = D_Context_StartIdx + 1;
uint8 constant D_ExistingStateRoot_StartIdx = D_ExternIO_StartIdx + 2;
uint8 constant D_NewSaltPublicKey_StartIdx = D_ExistingStateRoot_StartIdx + 1;
uint8 constant D_NewCiphertext_StartIdx = D_NewSaltPublicKey_StartIdx + (D_KEY_SIZE * D_MAX_ALLOWED_NEW);

/// @dev The Snark Scalar field value
/// used to handle overflows / underflows
uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
