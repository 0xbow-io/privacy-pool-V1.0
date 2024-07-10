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
import { PrivacyPoolABI } from "@privacy-pool-v1/contracts"
import { createPublicClient, http } from "viem"

import type { TPrivacyPool, providersT } from "@privacy-pool-v1/contracts"
import { textChangeRangeIsUnchanged } from "typescript"

export const ScopeFn = (chain?: Chain, conn?: PublicClient) =>
  FnPrivacyPool.ScopeFn(chain, conn)

export const ContextFn = (chain?: Chain, conn?: PublicClient) =>
  FnPrivacyPool.Contextfn(chain, conn)

export const ProcessFn = <
  WalletClient extends PublicActions & WalletActions & Client
>(
  acc: WalletClient
) => FnPrivacyPool.ProcessFn(acc)

export namespace FnPrivacyPool {
  export const ScopeFn =
    (chain?: Chain, conn?: PublicClient) =>
    (
      contract: Address,
      _conn: PublicClient = conn
        ? conn
        : createPublicClient({
            chain: chain as Chain,
            transport: http()
          })
    ): Promise<TPrivacyPool.ScopeFn_out_T> =>
      _conn
        .readContract({
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "Scope",
          account: contract
        })
        .then((result) => {
          return result
        })
        .catch((error) => {
          throw error
        })

  export const Contextfn =
    (chain?: Chain, conn?: PublicClient) =>
    (
      contract: Address,
      Request: TPrivacyPool.RequestT,
      _conn: PublicClient = conn
        ? conn
        : createPublicClient({
            chain: chain as Chain,
            transport: http()
          })
    ): Promise<TPrivacyPool.ContextFn_out_T> =>
      _conn
        .readContract({
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "Context",
          args: [Request],
          account: contract
        })
        .then((result) => {
          return result
        })
        .catch((error) => {
          throw error
        })

  export const ProcessFn =
    <WalletClient extends PublicActions & WalletActions & Client>(
      acc: WalletClient
    ) =>
    async (
      contract: Address,
      Request: TPrivacyPool.RequestT,
      Proof: TPrivacyPool.ProofT,
      value = 0n,
      simOnly = true
    ): Promise<boolean | Hex> =>
      await acc
        .simulateContract({
          account: acc.account,
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "Process",
          args: [Request, Proof],
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
