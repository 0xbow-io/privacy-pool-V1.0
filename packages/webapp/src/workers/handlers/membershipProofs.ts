import { LeanIMT } from "@zk-kit/lean-imt"
import { poseidon2 } from "poseidon-lite"
import type { WorkerMsg } from "@/workers/eventListener.ts"
import {
  CCommitment,
  type MembershipProofJSON,
  type TCommitment
} from "@privacy-pool-v1/domainobjs/ts"
import CommitmentC = CCommitment.CommitmentC

export const calculateMembershipProofs = (
  msg: WorkerMsg,
  poolStates: Map<string, string>,
  keyToCommitJSONs: Map<string, TCommitment.CommitmentJSON[][]>
) => {
  const outMap = new Map<string, MembershipProofJSON[][]>()

  for (const [key, commitsArray] of keyToCommitJSONs.entries()) {
    const proofsArray: MembershipProofJSON[][] = commitsArray.map((commits) => {
      return commits.map((json) => {
        const poolState = poolStates.get(key)!
        const recovered = CommitmentC.recoverFromJSON(json)
        // @ts-ignore
        const hash = (a, b) => poseidon2([a, b])
        const tree = LeanIMT.import(hash, poolState)
        return recovered.membershipProof(tree)
      })
    })

    outMap.set(key, proofsArray)
  }

  return outMap
}
