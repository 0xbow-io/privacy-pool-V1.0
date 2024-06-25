import type { Address, PublicClient, WalletClient, Hex } from "viem"
import { PrivacyPoolABI } from "@privacy-pool-v1/global"

import type { TPrivacyPool, providersT } from "@privacy-pool-v1/core-ts/pool"

export const getPublicCLient = (providers: providersT) => {
  return providers.find(
    (provider) => provider.type === "public"
  ) as PublicClient
}

export const getWalletClient = (providers: providersT) => {
  return providers.find(
    (provider) => provider.type === "wallet"
  ) as WalletClient
}

export namespace FnPrivacyPool {
  export const sim_process_Fn = async (
    publicClient: PublicClient,
    contract: Address,
    args: TPrivacyPool.procesFn_in_T,
    value?: bigint,
    from?: Address
  ) => {
    const { result, request } = await publicClient
      .simulateContract({
        address: contract,
        abi: PrivacyPoolABI,
        functionName: "process",
        args,
        value,
        account: from ? from : contract
      })
      .then(({ result, request }) => {
        return { result, request }
      })
      .catch((error) => {
        throw error
      })
    return { result, request }
  }

  export const process_Fn = async (
    publicClient: PublicClient,
    walletClient: WalletClient,
    contract: Address,
    args: TPrivacyPool.procesFn_in_T,
    value?: bigint,
    from?: Address,
    simOnly?: boolean
  ): Promise<Hex | boolean> => {
    // get the request first
    const response = await FnPrivacyPool.sim_process_Fn(
      publicClient,
      contract,
      args,
      value,
      from
    )
      .then(({ request }) => {
        if (!simOnly) {
          return walletClient.writeContract(request)
        }
      })
      .catch((error) => {
        console.error(error)
        return false
      })
    return response ?? true
  }
}
