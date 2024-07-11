export const D_MAX_ALLOWED_EXISTING = 2
export const D_MAX_ALLOWED_NEW = 2
export const D_KEY_SIZE = 2

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
 */
export const D_NewNullRoot_StartIdx = 0
export const D_NewCommitmentRoot_StartIdx =
  D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW
export const D_NewCommitmentHash_StartIdx =
  D_NewCommitmentRoot_StartIdx + (D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW)
export const D_Scope_StartIdx =
  D_NewCommitmentHash_StartIdx + (D_MAX_ALLOWED_EXISTING + D_MAX_ALLOWED_NEW)
export const D_ActualTreeDepth_StartIdx = D_Scope_StartIdx + 1
export const D_Context_StartIdx = D_ActualTreeDepth_StartIdx + 1
export const D_ExternIO_StartIdx = D_Context_StartIdx + 1
export const D_ExistingStateRoot_StartIdx = D_ExternIO_StartIdx + 2
export const D_NewSaltPublicKey_StartIdx = D_ExistingStateRoot_StartIdx + 1
export const D_NewCiphertext_StartIdx =
  D_NewSaltPublicKey_StartIdx + D_KEY_SIZE * D_MAX_ALLOWED_NEW
