import { createStore } from 'zustand/vanilla'
import { downloadJSON } from '@/utils/files';
import { Chain, sepolia, gnosis } from 'viem/chains';


import type { PrivacyKey, Commitment } from '@privacy-pool-v1/core-ts/account/';
import { CreatePrivacyKey } from '@privacy-pool-v1/core-ts/account/';

import type {UnitRepresentativeMeta, PrivacyPoolMeta} from '@/network/pools'
import {PrivacyPools, SupportedUnitRepresentatives, ChainNameToChain} from '@/network/pools'


export type AccountState = {
    keys: PrivacyKey[]
    availChains: Chain[]
    avilPools:  Map<Chain, PrivacyPoolMeta[]>
    supportedUnitRepresentatives: Map<Chain, UnitRepresentativeMeta[]>

    currChain: Chain,
    currPool: PrivacyPoolMeta
    currUnitRepresentative: UnitRepresentativeMeta

    avilCommits: Commitment[]

    inCommits: string[]
    inValues: bigint[]
    outValues: bigint[]
    publicValue: bigint
}

export interface AccountActions {
    generate: () => PrivacyKey
    notEmpty: () => boolean
    importFromJSON: (data: string) => void
    exportToJSON: (download: boolean) => string
    updateInValue: (index: number, value: string) => void
    updateTargetPoolChain: (value: string) => void
    getCurrentPool: () => PrivacyPoolMeta

    udpatePublicValue: (value: bigint) => void
    getTotalOutputValue: () => bigint
}
  
export type KeyStore = AccountState & AccountActions

export const initKeyStore = (): AccountState => {
    return { 
        keys: [], 

        availChains: [sepolia, gnosis],
        avilPools: PrivacyPools,
        supportedUnitRepresentatives: SupportedUnitRepresentatives,

        currChain: sepolia,
        currPool: PrivacyPools.get(sepolia)![0], 
        currUnitRepresentative: SupportedUnitRepresentatives.get(sepolia)![0], 

        inCommits: ['dummy', 'dummy'], 
        inValues: [0n, 0n],  
        outValues: [0n, 0n],
        publicValue: 0n,
        avilCommits: []}
}

export const defaultInitState: AccountState = {
    keys: [],

    availChains: [sepolia, gnosis],
    avilPools: PrivacyPools,
    supportedUnitRepresentatives: SupportedUnitRepresentatives,

    currChain: sepolia,
    currPool: PrivacyPools.get(sepolia)![0], 
    currUnitRepresentative: SupportedUnitRepresentatives.get(sepolia)![0], 

    avilCommits: [],
    inCommits: ['dummy', 'dummy'],
    inValues: [0n, 0n],
    publicValue: 0n,
    outValues: [0n, 0n],
}

export const createKeyStore = (
    initState: AccountState = defaultInitState,
) => {
return createStore<KeyStore>()((set, get) => ({
        ...initState,
        generate: (): PrivacyKey => {
            const key: PrivacyKey = CreatePrivacyKey();
            set((state) => ({
              keys: [...state.keys, key],
            }));
            get().exportToJSON(true);
            return key;
          },
        notEmpty: (): boolean =>  {
            return get().keys.length > 0;
        },
        importFromJSON: (data: string) => {
            const jsonObj = JSON.parse(data);
            if (jsonObj.keys === undefined) {
              throw new Error('Invalid JSON data');
            }
            // reset keys
            set((state) => ({
                keys: [],
            }));

            jsonObj.keys.forEach((k: any) => {
                const key: PrivacyKey = CreatePrivacyKey(k.privateKey);
                set((state) => ({
                    keys: [...state.keys, key],
                }));
            });
          },
        exportToJSON: (download: boolean): string => {
            const keys = Array.from(get().keys.map((key) => {
                    return key.asJSON;
                }));
            const keysJSON = JSON.stringify({ keys });
            if (download) {
            downloadJSON(keysJSON, 'privacy_pool_keys.json');
            }
            return keysJSON;
        },
        updateTargetPoolChain: (value: string) => {
            // value is chain name:pool id
            const chainName = value.split(':')[0];
            const poolID = value.split(':')[1];

            if (!ChainNameToChain.has(chainName)) {
                throw new Error('Invalid chain name: ' + chainName);
            }

            const chain = ChainNameToChain.get(chainName)!;

            // find pool by id
            const pool = get().avilPools.get(chain)!.find((p) => p.id === poolID);
            if (pool === undefined) {
                throw new Error('Invalid pool id');
            }

            set((state) => ({
                currChain: chain,
                currPool: pool,
                currUnitRepresentative: SupportedUnitRepresentatives.get(chain)![0]
            }));

        },
        getCurrentPool: (): PrivacyPoolMeta => {
            return get().currPool;
        },
        updateInValue: (index: number, value: string) => {
            const curr_inCommits = get().inCommits;
            curr_inCommits[index] = value;
            set((state) => ({
                inCommits: curr_inCommits
            }));
        }, 
        udpatePublicValue: (value: bigint): void => {
            set((state) => ({
                publicValue: value
            }));
        },
        getTotalOutputValue: (): bigint => {
            // Sum of all input values + public value
            return get().inValues.reduce((acc, val) => acc + val, 0n) + get().publicValue;
        },
    }))
}