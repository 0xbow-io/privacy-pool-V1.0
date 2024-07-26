import type { Address } from "viem"
import type { Chain } from "viem/chains"
import { sepolia, gnosis } from "viem/chains"
import { _sepolia_public_client, _gnosis_public_client } from "./clients"
import { DEFAULT_TARGET_CHAIN } from "@/utils/consts.ts"
// import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from "@privacy-pool-v1/contracts"

export type PrivacyPoolMeta = {
  chain: Chain // network chain
  address: Address // contract address
  genesis: bigint // when pool was deployed
  id: string // reference id
  scope: bigint //
  unitRepresentative: string // what representation of value is used
  minmaxCommitValue: bigint[] // minimum value to commit
}

export type SimpleFEMeta = {
  name: string
  ticker: string
  address: Address
  decimals: bigint
  iconURI: string
}

export const SupportSimpleFieldElements: Map<Chain, SimpleFEMeta[]> = new Map<
  Chain,
  SimpleFEMeta[]
>([
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
        address: "0x8e3E4702B4ec7400ef15fba30B3e4bfdc72aBC3B",
        genesis: 5471254n,
        scope:
          11049869816642268564454296009173568684966369147224378104485796423384633924130n,
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
        address: "0x18AE7dbb48cF6b00D1AC7bb758eD28c5FCcafA4c",
        genesis: 34448288n,
        scope:
          1594601211935923806427821481643004967624986397998197460555337643549018639657n,
        unitRepresentative: "xDAI", // reference by ticker
        minmaxCommitValue: [0n, 1000000000000000000n]
      }
    ]
  ]
])

export const getDefaultRepresentation = (): SimpleFEMeta => {
  if (SupportSimpleFieldElements.has(DEFAULT_TARGET_CHAIN)) {
    const _metas = SupportSimpleFieldElements.get(DEFAULT_TARGET_CHAIN)
    if (_metas) return _metas[0]
  }
  throw new Error("No default pool found")
}

export const ChainNameToChain: Map<string, Chain> = new Map<string, Chain>([
  ["Sepolia", sepolia],
  ["Gnosis", gnosis]
])
