"use client"

import React, { useCallback, useEffect, useState } from "react"
import { SettingsDrawer } from "@/views/PoolView/sections/SettingsDrawer.tsx"
import { PoolHeader } from "@/components/PoolHeader/PoolHeader.tsx"
import Footer from "@/components/Footer/Footer.tsx"
import { PoolTabs } from "@/views/PoolView/sections/PoolTabs.tsx"
import { WorkerCmd, type WorkerResponse } from "@/workers/eventListener.ts"
import { useBoundStore } from "@/stores"
import { useZKWorker } from "@/hooks/useZKWorker.ts"
import type { TCommitment } from "@privacy-pool-v1/domainobjs/ts"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"

export default function PoolView() {
  const { worker, postMessage, addMessageHandler } = useZKWorker()

  const {
    commitments,
    startSync,
    updatePoolSync,
    pools,
    privKeys,
    updateMembershipProofs
  } = useBoundStore(
    ({
      commitments,
      startSync,
      updatePoolSync,
      pools,
      privKeys,
      updateMembershipProofs
    }) => ({
      commitments,
      startSync,
      updatePoolSync,
      pools,
      privKeys,
      updateMembershipProofs
    })
  )

  const computeProofs = useCallback(() => {
    if (!commitments.size) {
      console.warn("no commitments to process. Is pool synced?")
      return
    }

    const poolIds = Array.from(pools.keys())

    const keyToCommitJSONs = new Map<string, TCommitment.CommitmentJSON[][]>()
    let poolStates = new Map<string, string>()
    for (const [poolId, pState] of pools.entries()) {
      poolStates.set(poolId, pState.stateTree.export())
    }

    poolIds.forEach((id) => {
      const poolCommits = commitments.get(id)
      const commitJSONs = poolCommits?.map((keyCommits) =>
        keyCommits.map((commit) => commit.toJSON())
      )
      if (!commitJSONs) return
      keyToCommitJSONs.set(id, commitJSONs)
    })

    postMessage({
      cmd: WorkerCmd.COMPUTE_MEMBERSHIP_PROOF_CMD,
      poolStates,
      keyToCommitJSONs
    })
  }, [pools, worker, commitments])

  useEffect(() => {
    if (!worker || !privKeys.length) {
      return
    }
    startSync()
    console.log("loop check")
    if (!commitments.size) {
      const poolIds = Array.from(PrivacyPools.keys())
      postMessage({
        cmd: WorkerCmd.SYNC_POOL_STATE,
        poolIds,
        privateKeys: privKeys
      })
    } else {
      computeProofs()
    }
    addMessageHandler((event) => {
      const resp = event.data as WorkerResponse
      if (resp.cmd === WorkerCmd.SYNC_POOL_STATE) {
        updatePoolSync(resp)
        computeProofs()
      }
      if (resp.cmd === WorkerCmd.COMPUTE_MEMBERSHIP_PROOF_CMD) {
        const resp = event.data as WorkerResponse
        if (!resp.membershipProofs) return
        console.log("updating proofs")
        updateMembershipProofs(resp.membershipProofs)
      }
    })
  }, [worker, commitments.size, privKeys.length])

  return (
    <div className="bg-page-background min-w-screen w-full min-h-screen h-full flex mb-12 flex-col">
      <div className="flex-grow">
        <div className="grid grid-cols-2 items-center justify-center p-6 tablet:grid-cols-6 laptop:grid-cols-6 2xl:grid-cols-12">
          <div className="flex flex-col gap-y-5 col-span-2 tablet:col-start-1 tablet:col-span-6 laptop:col-span-4 laptop:col-start-2 2xl:col-span-6 2xl:col-start-4">
            <PoolHeader />
            <PoolTabs />
            <SettingsDrawer />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
