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
    inValues: number[]
    outValues: number[]
    outSplits: number[]
    outPrivacyKeys: PrivacyKey[]
    publicValue: number
}

export interface AccountActions {
    generate: () => PrivacyKey
    notEmpty: () => boolean
    importFromJSON: (data: string) => void
    exportToJSON: (download: boolean) => string
    updateTargetPoolChain: (value: string) => void
    getCurrentPool: () => PrivacyPoolMeta

    updateInValue: (index: number, value: string) => void
    udpatePublicValue: (value: number) => void
    udpateOutputSplit: (index: number, value: number) => void
    udpateOutputValue: (index: number, value: number) => void
    updateOutputPrivacyKey: (index: number, pubKeyHash: string) => void

    getTotalOutputValue: () => number
    getOutputValue: (index: number) => number
    getOutputSplit: (index: number) => number
    getOutputPubKeyHash: (index: number) => string 
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
        inValues: [0.0, 0.0],  
        outValues: [0.0, 0.0],
        outPrivacyKeys: [],
        outSplits: [100, 0],
        publicValue: 0.0,
        avilCommits: []
    }
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
    inValues: [0.0, 0.0],  
    publicValue: 0,
    outValues: [0.0, 0.0],  
    outSplits: [100, 0],
    outPrivacyKeys: [],
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
        udpatePublicValue: (value: number): void => {
            set((state) => ({
                publicValue: value
            }));
        },
        udpateOutputSplit: (index: number, value: number): void => {
            const curr_outSplits = get().outSplits;
            curr_outSplits[index] = value;
            set((state) => ({
                outSplits: curr_outSplits
            }));
        },
        udpateOutputValue: (index: number, value: number): void => {
            const curr_outValues = get().outValues;
            curr_outValues[index] = value;
            set((state) => ({
                outValues: curr_outValues
            }));
        },
        updateOutputPrivacyKey: (index: number, pubKeyHash: string): void => {
            // iterate through keys and find the one with matching pubKeyHash
            const key = get().keys.find((k) => '0x'+k.pubKeyHash.toString(16) === pubKeyHash);
            if (key === undefined) {
                throw new Error('No key found with pubKeyHash: ' + pubKeyHash);
            }
            const curr_outPrivacyKeys = get().outPrivacyKeys;
            curr_outPrivacyKeys[index] = key;
            set((state) => ({
                outPrivacyKeys: curr_outPrivacyKeys
            }));
        },
        getOutputPubKeyHash: (index: number): string => {
            const pK = get().outPrivacyKeys[index];
            if (pK === undefined) {
                return "0x"
            }
            return '0x'+pK.pubKeyHash.toString(16).substring(0,10)+'...';
        },
        getTotalOutputValue: (): number => {
            // Sum of all input values + public value
            return get().inValues.reduce((acc, val) => acc + val, 0) + get().publicValue;
        },
        getOutputValue: (index: number): number => {
        const _total_output = get().getTotalOutputValue();
        const _output_split = get().outSplits[index];
           return _total_output / 100 * _output_split;
        },
        getOutputSplit: (index: number): number => {
            const _total_output = get().getTotalOutputValue();
            const _output_value = get().outValues[index];
            return _output_value / _total_output * 100;
        }
    }))
}