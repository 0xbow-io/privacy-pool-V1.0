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
  type MembershipProofJSON
} from "@privacy-pool-v1/domainobjs/ts"
import type { StateCreator } from "zustand"
import { downloadJSON } from "@/utils"
import { type WorkerResponse } from "@/workers/eventListener.ts"
import type { CompleteStore, PoolsSlice } from "@/stores/types.ts"
import CommitmentC = CCommitment.CommitmentC
import memoizeOne from "memoize-one"

export const createPoolsSlice: StateCreator<
  CompleteStore,
  [],
  [],
  PoolsSlice
> = (set, get) => ({
  commitments: new Map<string, Commitment[][]>(),
  currPoolID: getDefaultPoolIDForChainID(DEFAULT_CHAIN.id),
  currPoolFe: getCurrPoolFe(getDefaultPoolIDForChainID(DEFAULT_CHAIN.id)),
  pools: new Map<string, PrivacyPoolState>(),
  poolToMembershipProofs: new Map<string, MembershipProofJSON[][]>(),

  setTargetPool: (poolID: string) => {
    set((state) => {
      if (PrivacyPools.has(poolID) && state.currPoolID !== poolID) {
        return {
          ...state,
          currPoolID: poolID,
          currPoolFe: getCurrPoolFe(poolID)
        }
      }
      return { ...state }
    })
  },
  updateMembershipProofs: (proofs) => {
    set((state) => ({
      ...state,
      isSyncing: false,
      syncComplete: true,
      poolToMembershipProofs: proofs
    }))
  },
  //todo: will be moved to a separate function
  downloadMembershipProof: (slot: number) => {
    const state = get()
    const { poolToMembershipProofs, currPoolID, existing } = state
    const commitment = existing[slot]!

    let existingProof: MembershipProofJSON | undefined
    for (const [_p, keys] of poolToMembershipProofs.entries()) {
      for (const key of keys) {
        for (const proof of key) {
          if (proof.private.root.raw === commitment.root.toString()) {
            existingProof = proof
            break
          }
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

      console.log("processed", resp.processedCommits)

      resp.processedCommits?.forEach((keyCommits, poolId) => {
        // TODO: split into chunks to avoid thread block
        const poolCommitments = keyCommits.map((commits) =>
          commits.map((c) => CommitmentC.recoverFromJSON(c))
        )
        commitments.set(poolId, poolCommitments)
      })

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

const getCurrPoolFe = memoizeOne(
  (currPoolID: string) => PrivacyPools.get(currPoolID)?.fieldElement
)
