import type {
  Address,
  PublicClient,
  Chain,
  WalletClient,
  Client,
  Hex,
  PublicActions,
  WalletActions,
  PrivateKeyAccount,
  Account
} from "viem"
import { PrivacyPoolABI } from "@privacy-pool-v1/global"
import { createPublicClient, http } from "viem"

import type { TPrivacyPool, providersT } from "@privacy-pool-v1/core-ts/pool"
import { textChangeRangeIsUnchanged } from "typescript"

export const ComputeScopeFn = (chain?: Chain, conn?: PublicClient) =>
  FnPrivacyPool._computeScopeFn(chain, conn)

export const ProcessFn = <
  WalletClient extends PublicActions & WalletActions & Client
>(
  acc: WalletClient
) => FnPrivacyPool._processFn(acc)

export namespace FnPrivacyPool {
  export const _computeScopeFn =
    (chain?: Chain, conn?: PublicClient) =>
    (
      contract: Address,
      args: TPrivacyPool._computeScopeFn_argsT,
      _conn: PublicClient = conn
        ? conn
        : createPublicClient({
            chain: chain as Chain,
            transport: http()
          })
    ): Promise<TPrivacyPool._computeScopeFn_outputT> =>
      _conn
        .readContract({
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "_computeScope",
          args: [args],
          account: "0x8F01d566e1E9f47C0BEA72879083F355c4ABDD83"
        })
        .then((result) => {
          return result
        })
        .catch((error) => {
          throw error
        })

  export const _processFn =
    <WalletClient extends PublicActions & WalletActions & Client>(
      acc: WalletClient
    ) =>
    async (
      contract: Address,
      args: [
        TPrivacyPool._rT,
        TPrivacyPool._sT,
        TPrivacyPool._pAT,
        TPrivacyPool._pBT,
        TPrivacyPool._pCT,
        TPrivacyPool._pubSignalsT
      ],
      value = 0n,
      simOnly = true
    ): Promise<boolean | Hex> =>
      await acc
        .simulateContract({
          account: acc.account,
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "process",
          args: args,
          value: value
        })
        .then(async ({ request }) => {
          if (!simOnly) {
            return await acc.writeContract(request)
          }
          return true
        })
        .catch((error) => {
          console.error(error)
          return false
        })
}
