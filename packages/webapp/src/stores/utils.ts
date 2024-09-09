import type { GlobalStore } from "@/stores/global-store.ts"
import type { RequestSlice } from "@/stores/requestSlice.ts"
import  { type StoreApi } from "zustand"
import { generatePrivateKey } from "viem/accounts"
import { downloadJSON } from "@/utils"
import type { Hex } from "viem"
import * as zustand from "zustand"
import { PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"

/*** UTILITIES ***/



const updateSink = (
  setGlobalStore: zustand.StoreApi<GlobalStore>["setState"],
  setRequestStore: zustand.StoreApi<RequestSlice>["setState"],
  address: Hex
) => {
  if (address === "0xgeneratekey") {
    const newKey = addKey(setGlobalStore)
    address = PrivacyKey.from(newKey, 0n).publicAddr
  }

  setRequestStore((state) => {
    return { ...state, sink: address }
  })
}
