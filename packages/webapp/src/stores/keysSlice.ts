import { type StateCreator, type StoreApi } from "zustand"
import { type Hex, numberToHex } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { downloadJSON } from "@/utils"
import type { CompleteStore, KeysSlice } from "@/stores/types.ts"
import { PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"
import memoizeOne from "memoize-one"

export const createKeysSlice: StateCreator<CompleteStore, [], [], KeysSlice> = (
  set,
  get
) => ({
  privKeys: [],
  privacyKeys: [],
  signerKey: numberToHex(0),

  importKeys: (data: string) =>
    set((state) => ({
      ...state,
      privKeys: JSON.parse(data).keys.map((k: Hex) => k),
      privacyKeys: computePrivacyKeys(JSON.parse(data).keys)
    })),
  addKey: () => addKey(set),
  hasKeys: (): boolean => get().privKeys.length > 0,
  setSigner: (key: Hex) => set((state) => ({ ...state, signerKey: key })),
  exportKeys: (fileName = "privacy_pool_keys.json") =>
    downloadJSON(JSON.stringify({ keys: get().privKeys }), fileName),
})

const addKey = (set: StoreApi<KeysSlice>["setState"]): Hex => {
  const newKey = generatePrivateKey()
  set((state) => {
    const keys = [...state.privKeys, newKey]
    downloadJSON(JSON.stringify({ keys: keys }), "privacy_pool_keys.json")
    return { ...state, privKeys: keys }
  })

  return newKey
}

const computePrivacyKeys = memoizeOne(
  (keys: Hex[]) => keys.map((key) => PrivacyKey.from(key, 0n)),
  (a, b) => a.toString() === b.toString()
)
