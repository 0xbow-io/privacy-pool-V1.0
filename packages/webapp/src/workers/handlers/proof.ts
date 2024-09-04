import type {
  TPrivacyPool,
  OnChainPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import type { WorkerMsg } from "../eventListener"

import type { TCommitment } from "@privacy-pool-v1/domainobjs/index"
import type { Hex } from "viem"
import { GetOnChainPrivacyPoolByPoolID } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import type { StdPackedGroth16ProofT } from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"

// using remote paths for now
const paths = {
  wasm: "https://raw.githubusercontent.com/0xbow-io/privacy-pool-V1.0/dev_webapp_fix/global/artifacts/circom/privacy-pool/PrivacyPool_V1/PrivacyPool_V1_js/PrivacyPool_V1.wasm",
  vKey: "https://raw.githubusercontent.com/0xbow-io/privacy-pool-V1.0/dev_webapp_fix/global/artifacts/circom/privacy-pool/PrivacyPool_V1/groth16_vkey.json",
  zKey: "https://raw.githubusercontent.com/0xbow-io/privacy-pool-V1.0/dev_webapp_fix/global/artifacts/circom/privacy-pool/PrivacyPool_V1/groth16_pkey.zkey"
}

// we only need 1 function to handle both commits and releases
// commit is when Sum(Output) = Sum(Input) + External_Input
// release is shen Sum(Output) = Sum(Input) - External_Output
export const ComputeProof = async (
  msg: WorkerMsg,
  pool: OnChainPrivacyPool = GetOnChainPrivacyPoolByPoolID(msg.poolID)
): Promise<{
  verified: boolean
  packedProof: StdPackedGroth16ProofT<bigint>
}> => {
  try {
    // check that poolID and privateKeys are provided
    if (msg.proofArgs === undefined) {
      throw new Error("ComputeProof Error: proofArgs must be provided")
    }
    const proof = await pool.computeProof(msg.proofArgs, paths).catch((e) => {})
    if (proof === undefined) {
      throw new Error("ComputeProof Error: unable to build proof")
    }
    return proof
  } catch (e) {
    throw new Error(`FetchCommitments Error: ${e}`)
  }
}
