import type {
  TPrivacyPool,
  providerT,
  poolMetadataT
} from "@privacy-pool-v1/core-ts/pool"

import type { Hex } from "viem"

export namespace IPrivacyPool {
  export interface PoolI<
    ProcessResultT = Hex | boolean,
    ProviderT = providerT,
    MetaT = poolMetadataT,
    ProcessArgsT = {
      walletclient?: providerT
      input: TPrivacyPool.procesFn_in_T
      value?: bigint
    }
  > {
    meta: MetaT
    provider: ProviderT
    process: (args: ProcessArgsT) => Promise<ProcessResultT>
  }
}
