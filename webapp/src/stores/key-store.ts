import { createStore } from 'zustand/vanilla'
import { downloadJSON } from '@/utils/files';


import type { PrivacyKey, Commitment } from '@privacy-pool-v1/core-ts/account/';
import { CreatePrivacyKey } from '@privacy-pool-v1/core-ts/account/';


export type AccountState = {
    keys: PrivacyKey[]
    currPoolID: string
    currUnitRepresentative: string
    avilCommits: Commitment[]
    inCommits: string[]
    inValues: bigint[]
    outValues: bigint[]
}

export interface AccountActions {
    generate: () => PrivacyKey
    notEmpty: () => boolean
    importFromJSON: (data: string) => void
    exportToJSON: (download: boolean) => string
    updateInValue: (index: number, value: string) => void
}
  
export type KeyStore = AccountState & AccountActions

export const initKeyStore = (): AccountState => {
    return { keys: [], currPoolID: '', currUnitRepresentative: 'ETH', inCommits: ['dummy', 'dummy'], inValues: [0n, 0n],  outValues: [0n, 0n],avilCommits: []}
}

export const defaultInitState: AccountState = {
    keys: [],
    currPoolID: '',
    currUnitRepresentative: 'ETH',
    avilCommits: [],
    inCommits: ['dummy', 'dummy'],
    inValues: [0n, 0n],
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
        updateInValue: (index: number, value: string) => {
            set((state) => {
                state.inCommits[index] = value;
                return state;
            })
        }
    }))
}