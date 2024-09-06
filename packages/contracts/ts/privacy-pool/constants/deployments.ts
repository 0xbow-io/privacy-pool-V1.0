import type { Address } from "viem"
import type { Chain } from "viem/chains"
import { sepolia, mainnet, gnosis } from "viem/chains"
import type {
  PrivacyPoolMeta,
  PoolMeta,
  FEMeta,
  OnChainPrivacyPool
} from "@privacy-pool-v1/contracts"

export const SUPPORTED_CHAINS = [sepolia, mainnet, gnosis]
export const DEFAULT_CHAIN = gnosis

export const ETH_Simple_FieldElement: FEMeta = {
  name: "Native ETH",
  type: 0, // simple
  ticker: "ETH",
  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",

  precision: 18n,
  iconURI: "htatps://etherscan.io/images/svg/brands/ethereum-original.svg"
}

export const XDAI_Simple_FieldElement: FEMeta = {
  name: "Native xDAI",
  type: 0, // simple
  ticker: "xDAI",
  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",

  precision: 18n,
  iconURI: "https://gnosisscan.io/assets/xdai/images/svg/logos/token-light.svg"
}

export const ChainNameToChain: Map<string, Chain> = new Map<string, Chain>([
  //  ["Sepolia", sepolia],
  ["Gnosis", gnosis]
])

export const ChainNameIDToChain: Map<number, Chain> = new Map<number, Chain>([
  // [sepolia.id, sepolia],
  [gnosis.id, gnosis]
])

export const ChainIDToPoolIDs: Map<number, string[]> = new Map<
  number,
  string[]
>([
  // [sepolia.id, ["SEPOLIA_ETH_POOL_1", "SEPOLIA_ETH_POOL_2"]],
  [gnosis.id, ["GNOSIS_ETH_POOL_1"]]
])

// Flat Map of Pool ID to Pool Meta
export const PrivacyPools: Map<string, PoolMeta> = new Map<string, PoolMeta>([
  [
    "GNOSIS_ETH_POOL_1",
    {
      id: "GNOSIS_ETH_POOL_1",
      name: "Gnosis xDAI Pool 1",
      chainID: gnosis.id,
      address: "0x555eb8F3C1C2bEDa8e8eA69F8c51317470Ab8fC1" as Address,
      verifier: "0x08311Cc0475Eab91DbFDeb2593aC3D859cB9d3f9" as Address,
      scope:
        19420586229045152356890556789607410844693215030122143238126523862419003191309n,
      genesis: 6311941n,
      fieldElement: XDAI_Simple_FieldElement,
      minmaxCommit: [0n, 1000000000000000000n]
    }
  ]
])

export const getDefaultPoolIDForChainID = (chainID: number): string => {
  const pools = ChainIDToPoolIDs.get(chainID)
  if (pools && pools.length > 0) {
    return pools[0]
  }
  return ""
}

export const getDefaultPoolMetaForChainID = (chain: number): PoolMeta => {
  return (
    PrivacyPools.get(getDefaultPoolIDForChainID(chain)) ?? {
      id: "",
      name: "",
      chainID: 0,
      address: "" as Address,
      verifier: "" as Address,
      scope: 0n,
      genesis: 0n,
      fieldElement: ETH_Simple_FieldElement,
      minmaxCommit: [0n, 0n]
    }
  )
}

/**
  @todo Depreciate this
*/
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
        fieldElement: ETH_Simple_FieldElement,
        minmaxCommit: [0n, 1000000000000000000n]
      },
      {
        chain: sepolia,
        id: "Sepolia Eth Pool 2",
        address: "0x0C606138Aa02600c55e0d427cf4B2a7319a808fe" as Address,
        verifier: "0xD925FC406cAaD1186f0Fc91C0c04bf65878EF68a" as Address,
        scope:
          11049869816642268564454296009173568684966369147224378104485796423384633924130n,
        genesis: 6311941n,
        fieldElement: ETH_Simple_FieldElement,
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
        fieldElement: XDAI_Simple_FieldElement,
        minmaxCommit: [0n, 1000000000000000000n]
      }
    ]
  ]
])

/**
  @todo Depreciate this
*/
export const getDefaultPool = (): PrivacyPoolMeta => {
  if (ExistingPrivacyPools.has(DEFAULT_CHAIN)) {
    const _metas = ExistingPrivacyPools.get(DEFAULT_CHAIN)
    if (_metas) return _metas[0]
  }
  throw new Error("No default pool found")
}
