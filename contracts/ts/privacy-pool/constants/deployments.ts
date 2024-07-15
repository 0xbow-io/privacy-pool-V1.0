import type { Address } from "viem"
import type { Chain } from "viem/chains"
import { sepolia, gnosis } from "viem/chains"
import type { PrivacyPoolMeta } from "@privacy-pool-v1/contracts"

export const SUPPORTED_CHAINS = [sepolia, gnosis]
export const DEFAULT_CHAIN = sepolia

/// TODO: Somehow autogenerate mapping with deployment script
export const ExistingPrivacyPools: Map<Chain, PrivacyPoolMeta[]> = new Map<
  Chain,
  PrivacyPoolMeta[]
>([
  [
    sepolia,
    [
      {
        chain: sepolia,
        id: "Sepolia Eth Pool 1",
        address: "0x35F9acbaD838b12AA130Ef6386C14d847bdC1642" as Address,
        verifier: "0x3eFc6308888bC3EC39c596c8776846fA5C0bFDA7" as Address,
        scope:
          11049869816642268564454296009173568684966369147224378104485796423384633924130n,
        genesis: 6311941n,
        fieldElement: "ETH",
        precision: 18,
        minmaxCommit: [0n, 1000000000000000000n]
      }
    ]
  ],
  [
    gnosis,
    [
      {
        chain: gnosis,
        id: "Gnosis xDAI Pool 1",
        address: "0x0C606138Aa02600c55e0d427cf4B2a7319a808fe" as Address,
        verifier: "0xD925FC406cAaD1186f0Fc91C0c04bf65878EF68a" as Address,
        genesis: 34972988n,
        scope:
          1594601211935923806427821481643004967624986397998197460555337643549018639657n,
        fieldElement: "xDAI",
        precision: 18,
        minmaxCommit: [0n, 1000000000000000000n]
      }
    ]
  ]
])

export const getDefaultPool = (): PrivacyPoolMeta => {
  if (ExistingPrivacyPools.has(DEFAULT_CHAIN)) {
    const _metas = ExistingPrivacyPools.get(DEFAULT_CHAIN)
    if (_metas) return _metas[0]
  }
  throw new Error("No default pool found")
}
