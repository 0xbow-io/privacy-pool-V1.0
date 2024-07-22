import type { Address } from "viem"
import type { Chain } from "viem/chains"
import { sepolia, gnosis } from "viem/chains"
import { _sepolia_public_client, _gnosis_public_client } from "./clients"
import { SUPPORTED_CHAINS, DEFAULT_CHAIN } from "@privacy-pool-v1/contracts"

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

export const getDefaultRepresentation = (): SimpleFEMeta => {
  if (SupportSimpleFieldElements.has(DEFAULT_CHAIN)) {
    const _metas = SupportSimpleFieldElements.get(DEFAULT_CHAIN)
    if (_metas) return _metas[0]
  }
  throw new Error("No default pool found")
}

export const ChainNameToChain: Map<string, Chain> = new Map<string, Chain>([
  ["Sepolia", sepolia],
  ["Gnosis", gnosis]
])
