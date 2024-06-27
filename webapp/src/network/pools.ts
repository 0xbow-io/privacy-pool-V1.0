import type { Address } from "viem"
import type { Chain } from "viem/chains"
import { sepolia, gnosis } from "viem/chains"

import type { IVerifier } from "@privacy-pool-v1/core-ts/pool"

export const availChains = [sepolia, gnosis]
export const DEFAULT_CHAIN = sepolia
import { _sepolia_public_client, _gnosis_public_client } from "./clients"

export type PrivacyPoolMeta = {
  chain: Chain // network chain
  address: Address // contract address
  verifier: IVerifier.VerifierI // verifier contract address
  genesis: bigint // when pool was deployed
  id: string // reference id
  unitRepresentative: string // what representation of value is used
  minmaxCommitValue: bigint[] // minimum value to commit
}

export type UnitRepresentativeMeta = {
  name: string
  ticker: string
  address: Address
  decimals: bigint
  iconURI: string
}

export const SupportedUnitRepresentatives: Map<
  Chain,
  UnitRepresentativeMeta[]
> = new Map<Chain, UnitRepresentativeMeta[]>([
  [
    sepolia,
    [
      {
        name: "Native ETH",
        ticker: "ETH",
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        decimals: 18n,
        iconURI: "https://etherscan.io/images/svg/brands/ethereum-original.svg"
      }
    ]
  ],
  [
    gnosis,
    [
      {
        name: "Native xDAI",
        ticker: "xDAI",
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        decimals: 18n,
        iconURI:
          "https://gnosisscan.io/assets/xdai/images/svg/logos/token-light.svg"
      }
    ]
  ]
])

export const getDefaultRepresentation = (): UnitRepresentativeMeta => {
  if (SupportedUnitRepresentatives.has(DEFAULT_CHAIN)) {
    const _metas = SupportedUnitRepresentatives.get(DEFAULT_CHAIN)
    if (_metas) return _metas[0]
  }
  throw new Error("No default pool found")
}

export const ChainNameToChain: Map<string, Chain> = new Map<string, Chain>([
  ["Sepolia", sepolia],
  ["Gnosis", gnosis]
])

export const PrivacyPools: Map<Chain, PrivacyPoolMeta[]> = new Map<
  Chain,
  PrivacyPoolMeta[]
>([
  [
    sepolia,
    [
      {
        chain: sepolia,
        id: "Sepolia Eth Pool 1",
        address: "0xfd892e3845b3c16112bbc2581b23da80cd8d8557" as Address,
        verifier: GetVerifier(
          _sepolia_public_client,
          "0x52e41dc97ffcc4b67bd50c4253554ea73317be07" as Address
        ),
        genesis: 6179793n,
        unitRepresentative: "ETH", // reference by ticker
        minmaxCommitValue: [0n, 1000000000000000000n]
      }
    ]
  ],
  [
    gnosis,
    [
      {
        chain: gnosis,
        id: "Gnosis xDAI Pool 1",
        address: "0xfd892e3845b3c16112bbc2581b23da80cd8d8557" as Address,
        verifier: GetVerifier(
          _gnosis_public_client,
          "0x542a99775c5eee7f165cfd19954680ab85d586e5" as Address
        ),
        genesis: 34635522n,
        unitRepresentative: "xDAI", // reference by ticker
        minmaxCommitValue: [0n, 1000000000000000000n]
      }
    ]
  ]
])

export const getDefaultPool = (): PrivacyPoolMeta => {
  if (PrivacyPools.has(DEFAULT_CHAIN)) {
    const _metas = PrivacyPools.get(DEFAULT_CHAIN)
    if (_metas) return _metas[0]
  }
  throw new Error("No default pool found")
}
