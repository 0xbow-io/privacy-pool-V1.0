import {
  NewPrivacyPoolState,
  type OnChainPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { GetOnChainPrivacyPoolByPoolID } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import type { WorkerMsg, WorkerResponse } from "../eventListener"
import {
  CCommitment,
  type Commitment,
  PrivacyKey,
  RecoverCommitments,
  TCommitment
} from "@privacy-pool-v1/domainobjs/ts"
import CommitmentC = CCommitment.CommitmentC
import type { Hex } from "viem"
import CommitmentJSON = TCommitment.CommitmentJSON

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
  console.log("gps", poolId, range)
  // check that poolID and privateKeys are provided
  if (poolId === undefined) {
    throw new Error("FetchCiphers Error: poolID and range must be provided")
  }
  const pool = GetOnChainPrivacyPoolByPoolID(poolId)

  try {
    console.log("getPoolState start")
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
    console.log("return from getPoolState")
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

export const recoverPoolCommits = (
  keys: Hex[],
  msg: WorkerResponse
): Map<string, CommitmentJSON[][]> => {
  const commitments = new Map<string, CommitmentJSON[][]>()
  console.log("recoverPoolCommits called with keys:", keys)
  console.log("recoverPoolCommits called with msg:", msg)

  if (!msg.syncedPools) {
    console.log("No synced pools found in the message")
    return commitments
  }

  msg.syncedPools.forEach((syncedPool) => {
    const { poolId, ciphers } = syncedPool
    console.log(`Processing poolId: ${poolId}, ciphers:`, ciphers)

    const rC = RecoverCommitments(
      keys.map((key) => PrivacyKey.from(key, 0n)),
      ciphers
    )
    console.log('commits recovered, mapping them')

    const recoveredCommitments = rC.map((commits) => commits.map((c) => c.toJSON()))

    console.log(
      `Recovered commitments for poolId ${poolId}:`,
      recoveredCommitments
    )
    commitments.set(poolId, recoveredCommitments)
  })

  console.log("Final commitments:", commitments)
  return commitments
}
