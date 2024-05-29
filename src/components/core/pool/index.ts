export * from './state';
export * from './events';
export * from './proof';

import { Address } from 'viem';
import { Chain, sepolia } from 'viem/chains';
import { stateManager } from './state';

export type PrivacyPool = {
  name: string;
  pool: Address;
  genesis: bigint;
  chain: Chain;
  identifier: string;
  state: stateManager;
};

export type PrivacyPoolChain = {
  chain: Chain;
  pools: Map<string, PrivacyPool[]>;
};

export const PrivacyPools: Map<string, PrivacyPool[]> = new Map<string, PrivacyPool[]>([
  [
    'Sepolia',
    [
      {
        name: 'ETH',
        pool: '0x4c98530c52218cD9b314d7D4257b8b3F1ab9a901',
        chain: sepolia,
        genesis: 5939242n,
        identifier: 'ETH @ Sepolia',
        state: new stateManager(sepolia, '0x4c98530c52218cD9b314d7D4257b8b3F1ab9a901', 5939242n),
      },
    ],
  ],
]);

// identifier is formatted as name @ chain
export function getPoolFromIdentifier(identifier: string): PrivacyPool | undefined {
  // split the identifier into name and chain
  // split the chain into name and chain
  // find the pool with the name and chain
  // return the pool
  // if no pool is found, return undefined
  let [name, chain] = identifier.split(' @ ');
  let pools = PrivacyPools.get(chain) as PrivacyPool[];
  return pools.find((pool) => pool.name === name);
}

export function getSupportedChains(): string[] {
  return Array.from(PrivacyPools.keys());
}

export function getPoolsforChain(chain: string): string[] {
  return Array.from(PrivacyPools.get(chain) as PrivacyPool[]).map((pool) => pool.identifier);
}

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
