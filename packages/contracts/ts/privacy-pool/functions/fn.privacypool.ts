import type {
  Address,
  PublicClient,
  Chain,
  Client,
  WalletClient,
  PublicActions,
  WalletActions,
  Hex
} from "viem"
import { PrivacyPoolABI } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { createPublicClient, http, parseEther } from "viem"

import type { TPrivacyPool } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import type { bufferToBigInt } from "@zk-kit/utils"

export const ScopeFn = (chain?: Chain, conn?: PublicClient) =>
  FnPrivacyPool.ScopeFn(chain, conn)

export const ContextFn = (chain?: Chain, conn?: PublicClient) =>
  FnPrivacyPool.Contextfn(chain, conn)

export const ProcessFn = <
  WalletClient extends PublicActions & WalletActions & Client
>(
  acc: WalletClient
) => FnPrivacyPool.ProcessFn(acc)

export const GetStateSizeFn = (chain?: Chain, conn?: PublicClient) =>
  FnPrivacyPool.GetStateSizeFn(chain, conn)

export const FetchRootsFn = (chain?: Chain, conn?: PublicClient) =>
  FnPrivacyPool.FetchRootsFn(chain, conn)

export const FetchCheckpointAtRootFn = (chain?: Chain, conn?: PublicClient) =>
  FnPrivacyPool.FetchCheckpointAtRootFn(chain, conn)

export const UnpackCiphersWithinRangeFn = (
  chain?: Chain,
  conn?: PublicClient
) => FnPrivacyPool.UnpackCiphersWithinRangeFn(chain, conn)

export namespace FnPrivacyPool {
  export const GetStateSizeFn =
    (chain?: Chain, conn?: PublicClient) =>
    (
      contract: Address,
      _conn: PublicClient = conn
        ? conn
        : createPublicClient({
            chain: chain as Chain,
            transport: http()
          })
    ): Promise<TPrivacyPool.GetStateSizeFn_out_T> =>
      _conn
        .readContract({
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "GetStateSize",
          account: contract
        })
        .then((result) => {
          return result
        })
        .catch((error) => {
          throw error
        })

  export const FetchRootsFn =
    (chain?: Chain, conn?: PublicClient) =>
    (
      contract: Address,
      args: TPrivacyPool.FetchRootsFn_in_T,
      _conn: PublicClient = conn
        ? conn
        : createPublicClient({
            chain: chain as Chain,
            transport: http()
          })
    ): Promise<TPrivacyPool.FetchRootsFn_out_T> =>
      _conn
        .readContract({
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "FetchRoots",
          args: args,
          account: contract
        })
        .then((result) => {
          return result
        })
        .catch((error) => {
          throw error
        })

  export const FetchCheckpointAtRootFn =
    (chain?: Chain, conn?: PublicClient) =>
    (
      contract: Address,
      root: bigint,
      _conn: PublicClient = conn
        ? conn
        : createPublicClient({
            chain: chain as Chain,
            transport: http()
          })
    ): Promise<[boolean, bigint]> =>
      _conn
        .readContract({
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "FetchCheckpointAtRoot",
          args: [root],
          account: contract
        })
        .then((result) => {
          return result
        })
        .catch((error) => {
          throw error
        }) as Promise<[boolean, bigint]>

  export const UnpackCiphersWithinRangeFn =
    (chain?: Chain, conn?: PublicClient) =>
    (
      contract: Address,
      range: [bigint, bigint],
      _conn: PublicClient = conn
        ? conn
        : createPublicClient({
            chain: chain as Chain,
            transport: http()
          })
    ): Promise<
      readonly [
        TPrivacyPool.CipherTexts_T,
        TPrivacyPool.SaltPublicKeys_T,
        TPrivacyPool.CommitmentHashes_T
      ]
    > =>
      _conn
        .readContract({
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "UnpackCiphersWithinRange",
          args: range,
          account: contract
        })
        .then((result) => {
          return result
        })
        .catch((error) => {
          throw error
        })

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
      args: TPrivacyPool.ProcessFn_in_T,
      value: bigint,
      simOnly = true
    ): Promise<boolean | Hex> =>
      await acc
        .simulateContract({
          account: acc.account,
          address: contract,
          abi: PrivacyPoolABI,
          functionName: "Process",
          args: args,
          value: BigInt(value)
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
