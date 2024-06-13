import { Address } from 'viem'
import { Chain, sepolia, gnosis } from 'viem/chains';


export type PrivacyPoolMeta = {
    chain: Chain,       // network chain
    address: Address,   // contract address
    genesis: bigint,    // when pool was deployed
    id: string,         // reference id
    unitRepresentative: string, // what representation of value is used
}


export type UnitRepresentativeMeta = {
    name: string,
    ticker: string,
    address: Address,
    decimals: bigint,
    iconURI: string 
}

export const SupportedUnitRepresentatives : Map<Chain, UnitRepresentativeMeta[]> = new Map<Chain, UnitRepresentativeMeta[]>(
    [
        [
            sepolia, [
                        {
                            name: 'Native ETH', 
                            ticker: 'ETH', 
                            address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', 
                            decimals: 18n,
                            iconURI: 'https://etherscan.io/images/svg/brands/ethereum-original.svg'
                        }
                    ]
        ], 
        [
            gnosis, [
                        {
                            name: 'Native xDAI', 
                            ticker: 'xDAI', 
                            address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', 
                            decimals: 18n,
                            iconURI: 'https://gnosisscan.io/assets/xdai/images/svg/logos/token-light.svg'
                        }
                    ]
        ]
    ]
)




export const PrivacyPools : Map<Chain, PrivacyPoolMeta[]> = new Map<Chain, PrivacyPoolMeta[]>(
    [
        [
            sepolia, [
                        {
                            chain: sepolia, 
                            id: 'Eth Pool 1', 
                            address: '0x8e3E4702B4ec7400ef15fba30B3e4bfdc72aBC3B', 
                            genesis: 5471254n,
                            unitRepresentative: 'ETH' // reference by ticker
                        }
                    ]
        ],
        [

            gnosis, [
                {
                    chain: gnosis, 
                    id: 'xDAI Pool 1', 
                    address: '0x18AE7dbb48cF6b00D1AC7bb758eD28c5FCcafA4c', 
                    genesis: 5471254n,
                    unitRepresentative: 'xDAI' // reference by ticker
                }
            ]
        ]
    ]
)
