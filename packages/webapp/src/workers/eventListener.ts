import { StateSync, ComputeProof } from "./handlers"
import type { Hex } from "viem"
import type { TCommitment } from "@privacy-pool-v1/domainobjs"
import type { TPrivacyPool } from "@privacy-pool-v1/contracts"
import type { PrivacyPoolCircuitInput } from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import type { StdPackedGroth16ProofT } from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"

export const SYNC_POOL_STATE: number = 0
export const COMPUTE_PROOF_CMD: number = 1

export type WorkerMsg = {
  cmd: number
  poolID: string
  range?: [bigint, bigint]
  proofArgs?: PrivacyPoolCircuitInput
  privateKeys?: Hex[]
}

export type WorkerResponse = {
  cmd: number
  status: string
  poolID: string
  proof?: {
    verified: boolean
    packedProof: StdPackedGroth16ProofT<bigint>
  }
  roots?: string
  ciphers?: {
    rawSaltPk: [bigint, bigint]
    rawCipherText: [bigint, bigint, bigint, bigint, bigint, bigint, bigint]
    commitmentHash: bigint
    cipherStoreIndex: bigint
  }[]
  error?: Error
}

// event listener for the worker
export const eventListenerFn = async (event: MessageEvent) => {
  const msg = event.data as WorkerMsg

  const resp: WorkerResponse = {
    cmd: msg.cmd,
    status: "",
    poolID: msg.poolID
  }

  try {
    switch (resp.cmd) {
      case SYNC_POOL_STATE:
        await StateSync(msg)
          .then((result) => {
            resp.status = "success"
            resp.roots = result.roots
            resp.ciphers = result.ciphers
          })
          .catch((e) => {
            throw new Error(`cmd: ${resp.cmd} Error: ${e}`)
          })
        break
      case COMPUTE_PROOF_CMD:
        await ComputeProof(msg)
          .then((result) => {
            resp.status = "success"
            resp.proof = result
          })
          .catch((e) => {
            throw new Error(`cmd: ${resp.cmd} Error: ${e}`)
          })
        break
    }
  } catch (e) {
    // throw back the error to the main thread
    resp.status = "failed"
    resp.error = new Error(`Error: ${e}`)
  }

  self.postMessage(resp)
}
