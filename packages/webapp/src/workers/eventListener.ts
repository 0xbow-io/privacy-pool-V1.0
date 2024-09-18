import {
  calculateMembershipProofs,
  ComputeProof,
  getAllPoolsStates,
  recoverPoolCommits,
  type StateSyncDTO
} from "./handlers"
import type {
  MembershipProofJSON,
  TCommitment
} from "@privacy-pool-v1/domainobjs"
import type {
  PrivacyPoolCircuitInput,
  StdPackedGroth16ProofT
} from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import type { Hex } from "viem"
import CommitmentJSON = TCommitment.CommitmentJSON

export enum WorkerCmd {
  SYNC_POOL_STATE = 0,
  COMPUTE_PROOF_CMD = 1,
  COMPUTE_MEMBERSHIP_PROOF_CMD = 2
}

export type WorkerMsg = {
  cmd: number
  poolID: string
  poolIds: string[]
  range?: [bigint, bigint]
  proofArgs?: PrivacyPoolCircuitInput
  poolStates?: Map<string, string>
  keyToCommitJSONs?: Map<string, TCommitment.CommitmentJSON[][]>
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
  syncedPools?: StateSyncDTO[]
  processedCommits?: Map<string, CommitmentJSON[][]>
  error?: Error
  membershipProofs?: Map<string, MembershipProofJSON[][]>
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
      case WorkerCmd.SYNC_POOL_STATE:
        await getAllPoolsStates(msg)
          .then((result) => {
            console.log('aboba')
            resp.syncedPools = result
            const commitsJSONs = recoverPoolCommits(msg.privateKeys!, resp)
            console.log('will return', commitsJSONs)
            resp.status = "success"
            resp.processedCommits = commitsJSONs
          })
          .catch((e) => {
            throw new Error(`cmd: ${resp.cmd} Error: ${e}`)
          })
        break
      case WorkerCmd.COMPUTE_PROOF_CMD:
        await ComputeProof(msg)
          .then((result) => {
            resp.status = "success"
            resp.proof = result
          })
          .catch((e) => {
            throw new Error(`cmd: ${resp.cmd} Error: ${e}`)
          })
        break
      case WorkerCmd.COMPUTE_MEMBERSHIP_PROOF_CMD:
        if (!msg.poolStates || !msg.keyToCommitJSONs) return
        const proofs = calculateMembershipProofs(
          msg,
          msg.poolStates,
          msg.keyToCommitJSONs
        )
        resp.membershipProofs = proofs
        break
    }
  } catch (e) {
    // throw back the error to the main thread
    resp.status = "failed"
    resp.error = new Error(`Error: ${e}`)
  }

  self.postMessage(resp)
}
