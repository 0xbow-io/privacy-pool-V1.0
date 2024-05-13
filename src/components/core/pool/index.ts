export * from './state';
export * from './events';
export * from './proof';

import { Address } from 'viem'
import { Chain, sepolia } from 'viem/chains';
import {stateManager, StateManager} from './state'

export type PrivacyPool = {
    name: string,
    pool: Address,
    genesis: bigint,
    chain: Chain,
    state: StateManager | null
}

export type PrivacyPoolChain = {
    chain: Chain,
    pools: Map<string, PrivacyPool[]>
}

export const PrivacyPools : Map<Chain, PrivacyPool[]> = new Map<Chain, PrivacyPool[]>([
    [
        sepolia, [
                        {
                            name: 'Eth Pool 1', 
                            pool: '0x8e3E4702B4ec7400ef15fba30B3e4bfdc72aBC3B', 
                            chain: sepolia, 
                            genesis: 5471254n,
                        }
                    ]]
])


export const ChainToPoolsMap : Map<Chain, PrivacyPool[]> = new Map<Chain, PrivacyPool[]>([
        [
            sepolia, PrivacyPools.get(sepolia) as PrivacyPool[]
        ]
])
    

/*
export async function initPoolChains(): Promise<Map<Chain, PrivacyPool[]>>{
    let promises : Promise<void>[]= []
    ChainToPoolsMap.forEach((pools: PrivacyPool[], key: Chain) => {
        pools.forEach(async (pool: PrivacyPool) => {
            promises.push(pool.state.SyncFrom(pool.genesis, 10000)) 
        })
    })
    await Promise.all(promises)
    return ChainToPoolsMap
}
*/