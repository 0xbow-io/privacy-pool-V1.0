import {
  DEFAULT_CHAIN,
  getDefaultPoolIDForChainID,
  NewPrivacyPoolState,
  PrivacyPools,
  type PrivacyPoolState
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import {
  type Commitment,
  PrivacyKey,
  RecoverCommitments
} from "@privacy-pool-v1/domainobjs/ts"
import type { StateCreator } from "zustand"
import { downloadJSON } from "@/utils"
import {
  WorkerCmd,
  type WorkerResponse
} from "@/workers/eventListener.ts"
import type { CompleteStore, PoolsSlice } from "@/stores/types.ts"

export const createPoolsSlice: StateCreator<CompleteStore, [], [], PoolsSlice> = (set, get) => ({
  commitments: new Map<string, Commitment[][]>(),
  currPoolID: getDefaultPoolIDForChainID(DEFAULT_CHAIN.id),
  pools: new Map<string, PrivacyPoolState>(),

  setTargetPool: (poolID: string) => {
    set((state) => {
      if (PrivacyPools.has(poolID) && state.currPoolID != poolID) {
        return { ...state, currPoolID: poolID }
      }
      return { ...state }
    })
  },
  //todo: will be moved to a separate function
  downloadMembershipProof: (slot: number) => {
    let poolId = get().currPoolID
    let commitment = get().existing[slot]
    let state = get().pools.get(poolId)
    downloadJSON(
      JSON.stringify({
        membership: commitment.membershipProof(state!.stateTree)
      }),
      `membership_proof_${commitment.commitmentRoot}_${poolId}.json`
    )
  },
  startSync: () => set((state) => ({ ...state, isSyncing: true })),
  updatePoolSync: (poolID: string, resp: WorkerResponse) => {
    if (
      resp.cmd === WorkerCmd.SYNC_POOL_STATE &&
      resp.ciphers !== undefined &&
      resp.roots !== undefined
    ) {
      const poolState = NewPrivacyPoolState()
      const { root, size } = poolState.import(resp.roots)

      console.log(`tree: ${poolState.stateTree.export()}`)

      console.log(`there are ${resp.ciphers.length} ciphers to decrypt,
          state size of ${root}
          with root ${size}`)

      set((state) => {
        const privKeys = state.privKeys
        const pools = state.pools
        const commitments = state.commitments

        pools.set(poolID, poolState)

        const poolCommitments = commitments.get(poolID) ?? []

        commitments.set(
          poolID,
          poolCommitments
            .concat(
              RecoverCommitments(
                privKeys.map((key) => PrivacyKey.from(key, 0n)),
                resp.ciphers!
              )
            )
            .map((x) => x.filter((c) => !poolState.has(c.nullRoot)))
        )

        console.log('before change isSyncing')

        return {
          ...state,
          pools: pools,
          commitments: commitments,
          isSyncing: false
        }
      })
    }
  }
})
