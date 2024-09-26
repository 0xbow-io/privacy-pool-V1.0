import { create, type StateCreator } from "zustand"
import { loadWorkerDynamically } from "@/workers/WorkerLazyLoader.ts"
import { WorkerCmd, type WorkerResponse } from "@/workers/eventListener.ts"
import {
  GetOnChainPrivacyPoolByPoolID,
  PrivacyPools
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import {
  type Commitment,
  CreateNewCommitment
} from "@privacy-pool-v1/domainobjs/ts"
import type { GlobalStore, CompleteStore } from "@/stores/types.ts"

export const createGlobalStoreSlice: StateCreator<
  CompleteStore,
  [],
  [],
  GlobalStore
> = (set, get) => ({
  proof: null,
  computeProof: () => {
    const worker = loadWorkerDynamically()
    if (!worker) {
      throw new Error("Error: unable to load worker")
    }

    const poolID = get().currPoolID
    const poolState = get().pools.get(poolID)
    const meta = PrivacyPools.get(poolID)
    if (meta === undefined || poolState === undefined) {
      throw new Error(`Error: invalid poolID ${poolID}`)
    }

    const privKeys = get().privKeys
    const newValues = get().newValues
    const keyIdx = get().keyIdx
    const pkScalars = get().pkScalars
    const nonces = get().nonces
    const existing = get().existing
    const externIO = get().externIO

    const newCommitments =
      get().new ??
      (newValues.map((val, i) =>
        CreateNewCommitment({
          _pK: privKeys[keyIdx[i + 2]],
          _nonce: 0n,
          _scope: meta.scope,
          _value: val
        })
      ) as [Commitment, Commitment])

    GetOnChainPrivacyPoolByPoolID(poolID)
      .context({
        src: get().src,
        sink: get().sink,
        feeCollector: get().feeCollector,
        fee: get().fee
      })
      .then((ctx) => {
        worker.postMessage({
          cmd: WorkerCmd.COMPUTE_PROOF_CMD,
          poolID: poolID,
          proofArgs: poolState.BuildCircuitInputs(
            meta.scope,
            ctx,
            pkScalars,
            nonces,
            existing,
            newCommitments,
            externIO
          )
        })
      })
      .catch((err) => {
        throw new Error(`Error: unable to build circuit input: ${err}`)
      })

    set((state) => {
      return { ...state, isGeneratingProof: true }
    })

    worker.onmessage = (event) => {
      const resp = event.data as WorkerResponse
      if (
        resp.cmd === WorkerCmd.COMPUTE_PROOF_CMD &&
        resp.proof !== undefined
      ) {
        console.log(`received proof, verified: ${resp.proof.verified}`)
        set((state) => {
          return {
            ...state,
            isGeneratingProof: false,
            proof: resp.proof,
            new: newCommitments
          }
        })
        worker.terminate()
      }
      if (resp.status == "failed") {
        console.log(`Received Error: ${resp.error}`)
      }
    }
  }
})
