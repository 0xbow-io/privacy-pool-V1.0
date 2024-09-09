import { type StateCreator, type StoreApi } from "zustand"
import { type Hex, numberToHex } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { downloadJSON } from "@/utils"
import type { CompleteStore, KeysSlice } from "@/stores/types.ts"

export const createKeysSlice: StateCreator<CompleteStore, [], [], KeysSlice> = (
  set,
  get
) => ({
  privKeys: [],
  signerKey: numberToHex(0),

  importKeys: (data: string) =>
    set((state) => ({
      ...state,
      privKeys: JSON.parse(data).keys.map((k: Hex) => k)
    })),
  addKey: () => addKey(set),
  hasKeys: (): boolean => get().privKeys.length > 0,
  setSigner: (key: Hex) => set((state) => ({ ...state, signerKey: key })),
  exportKeys: (fileName = "privacy_pool_keys.json") =>
    downloadJSON(JSON.stringify({ keys: get().privKeys }), fileName)
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
