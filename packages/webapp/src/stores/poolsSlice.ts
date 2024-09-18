import {
  DEFAULT_CHAIN,
  getDefaultPoolIDForChainID,
  NewPrivacyPoolState,
  PrivacyPools,
  type PrivacyPoolState
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import {
  CCommitment,
  type Commitment,
  type MembershipProofJSON,
  PrivacyKey,
  RecoverCommitments
} from "@privacy-pool-v1/domainobjs/ts"
import type { StateCreator } from "zustand"
import { downloadJSON } from "@/utils"
import { WorkerCmd, type WorkerResponse } from "@/workers/eventListener.ts"
import type { CompleteStore, PoolsSlice } from "@/stores/types.ts"
import CommitmentC = CCommitment.CommitmentC

export const createPoolsSlice: StateCreator<
  CompleteStore,
  [],
  [],
  PoolsSlice
> = (set, get) => ({
  commitments: new Map<string, Commitment[][]>(),
  currPoolID: getDefaultPoolIDForChainID(DEFAULT_CHAIN.id),
  pools: new Map<string, PrivacyPoolState>(),
  poolToMembershipProofs: new Map<string, MembershipProofJSON[][]>(),

  setTargetPool: (poolID: string) => {
    set((state) => {
      if (PrivacyPools.has(poolID) && state.currPoolID !== poolID) {
        return { ...state, currPoolID: poolID }
      }
      return { ...state }
    })
  },
  updateMembershipProofs: (proofs) => {
    set((state) => ({ ...state, poolToMembershipProofs: proofs }))
  },
  //todo: will be moved to a separate function
  downloadMembershipProof: (slot: number) => {
    const state = get()
    const { keyToMembershipProofs, currPoolID, existing } = state
    const commitment = existing[slot]

    let existingProof: MembershipProofJSON | undefined
    for (const [_k, proofs] of keyToMembershipProofs.entries()) {
      for (const proof of proofs) {
        if (proof.private.root.raw === commitment.root.toString()) {
          existingProof = proof
          break
        }
      }
      if (existingProof) break
    }

    const name = `membership_proof_${commitment.commitmentRoot}_${currPoolID}.json`

    if (!existingProof) {
      const poolState = get().pools.get(currPoolID)
      existingProof = commitment.membershipProof(poolState!.stateTree)
    }

    downloadJSON(
      JSON.stringify({
        membership: existingProof
      }),
      name
    )
  },
  startSync: () => set((state) => ({ ...state, isSyncing: true })),
  updatePoolSync: (resp: WorkerResponse) => {
    set((state) => {
      console.log('start updatePool')
      const pools = new Map(state.pools)
      const commitments = new Map(state.commitments)

      resp.syncedPools?.forEach((syncedPool) => {
        const { poolId, roots, ciphers } = syncedPool
        const poolState = NewPrivacyPoolState()
        const { root, size } = poolState.import(roots)

        console.log(`tree: ${poolState.stateTree.export()}`)
        console.log(`there are ${ciphers.length} ciphers to decrypt,
          state size of ${root}
          with root ${size}`)

        pools.set(poolId, poolState)
      })

      console.log('processed', resp.processedCommits)

      resp.processedCommits?.forEach((keyCommits, poolId) => {
        const poolCommitments = keyCommits.map((commits) =>
          commits.map((c) => CommitmentC.recoverFromJSON(c))
        )
        commitments.set(poolId, poolCommitments)
      })

      console.log("commitments set:", commitments)
      // .map((x) => x.filter((c) => !poolState.has(c.nullRoot)))
      return {
        ...state,
        pools: pools,
        commitments: commitments,
        isSyncing: false
      }
    })
  }
})
