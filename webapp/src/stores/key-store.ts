import { createStore } from 'zustand/vanilla'
import { type PrivacyKey } from '@privacy-pool-v1/core-ts/account/classes';
import { CreatePrivacyKey } from '@privacy-pool-v1/core-ts/account/classes';
import { downloadJSON } from '@/utils/files';



export type AccountState = {
    keys: PrivacyKey[]
}

export interface AccountActions {
    generate: () => PrivacyKey
    notEmpty: () => boolean
    importFromJSON: (data: string) => void
    exportToJSON: (download: boolean) => string
}
  
export type KeyStore = AccountState & AccountActions

export const initKeyStore = (): AccountState => {
    return { keys: []}
}

export const defaultInitState: AccountState = {
    keys: [],
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
    }))
}