import type { TCommitment, Commitment } from "@privacy-pool-v1/domainobjs/ts"
import type {
  OnChainPrivacyPool,
  TPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { GetOnChainPrivacyPoolByPoolID } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"
import type { WorkerMsg } from "../eventListener"
import type { Hex } from "viem"

export const StateSync = async (
  msg: WorkerMsg,
  pool: OnChainPrivacyPool = GetOnChainPrivacyPoolByPoolID(msg.poolID)
): Promise<{
  roots: string
  ciphers: {
    rawSaltPk: [bigint, bigint]
    rawCipherText: [bigint, bigint, bigint, bigint, bigint, bigint, bigint]
    commitmentHash: bigint
    cipherStoreIndex: bigint
  }[]
}> => {
  // check that poolID and privateKeys are provided
  if (msg.poolID === undefined) {
    throw new Error("FetchCiphers Error: poolID and range must be provided")
  }
  try {
    // sync the pool with the chain
    const synced = await pool.sync()
    if (!synced) {
      throw new Error("Sycn Error: unable to sync pool with chain")
    }
    const ciphers = await pool.getCiphers(msg.range).catch((e) => {
      throw new Error(`getCiphers Error: ${e}`)
    })
    if (ciphers === undefined) {
      throw new Error("FetchCiphers Error: unable to fetch ciphers")
    }
    return {
      roots: pool.export(),
      ciphers
    }
  } catch (e) {
    throw new Error(`FetchCommitments Error: ${e}`)
  }
}
