import { GetOnChainPrivacyPoolByPoolID } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import type { WorkerMsg, WorkerResponse } from "../eventListener"
import {
  PrivacyKey,
  recoverCommitments,
  type TCommitment
} from "@privacy-pool-v1/domainobjs/ts"
import type { Hex } from "viem"

export type StateSyncDTO = {
  poolId: string
  roots: string
  ciphers: {
    rawSaltPk: [bigint, bigint]
    rawCipherText: [bigint, bigint, bigint, bigint, bigint, bigint, bigint]
    commitmentHash: bigint
    cipherStoreIndex: bigint
  }[]
}

const getPoolState = async (
  poolId: string,
  range?: [bigint, bigint]
): Promise<StateSyncDTO> => {
  // check that poolID and privateKeys are provided
  if (poolId === undefined) {
    throw new Error("FetchCiphers Error: poolID and range must be provided")
  }
  const pool = GetOnChainPrivacyPoolByPoolID(poolId)

  try {
    // sync the pool with the chain
    const synced = await pool.sync()
    if (!synced) {
      throw new Error("Sync Error: unable to sync pool with chain")
    }
    const ciphers = await pool.getCiphers(range).catch((e) => {
      throw new Error(`getCiphers Error: ${e}`)
    })
    if (ciphers === undefined) {
      throw new Error("FetchCiphers Error: unable to fetch ciphers")
    }
    return {
      poolId,
      roots: pool.export(),
      ciphers
    }
  } catch (e) {
    throw new Error(`FetchCommitments Error: ${e}`)
  }
}

export const getAllPoolsStates = async (
  msg: WorkerMsg
): Promise<StateSyncDTO[]> => {
  if (!msg.poolIds) {
    throw new Error("getAllPoolsStates: no poolIds was provided")
  }

  const poolStates: StateSyncDTO[] = []
  for (const poolId of msg.poolIds) {
    const state = await getPoolState(poolId, msg.range)
    poolStates.push(state)
  }

  return poolStates
}

export const recoverPoolCommits = async (
  keys: Hex[],
  msg: WorkerResponse
): Promise<Map<string, TCommitment.CommitmentJSON[][]>> => {
  const commitments = new Map<string, TCommitment.CommitmentJSON[][]>()

  if (!msg.syncedPools) {
    console.log("No synced pools found in the message")
    return commitments
  }

  await Promise.all(
    msg.syncedPools.map(async (syncedPool) => {
      const { poolId, ciphers } = syncedPool
      const pool = GetOnChainPrivacyPoolByPoolID(poolId)

      const rC = await recoverCommitments(
        keys.map((key) => PrivacyKey.from(key, 0n)),
        ciphers,
        pool
      )

      const recoveredCommitments = rC.map((commits) =>
        commits.map((c) => c.toJSON())
      )

      commitments.set(poolId, recoveredCommitments)
    })
  )

  return commitments
}
