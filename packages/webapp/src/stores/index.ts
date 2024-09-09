import type { CompleteStore } from "@/stores/types.ts"
import { createAppStateSlice } from "@/stores/appStateSlice.ts"
import { create } from "zustand"
import { createKeysSlice } from "@/stores/keysSlice.ts"
import { createPoolsSlice } from "@/stores/poolsSlice.ts"
import { createRequestSlice } from "@/stores/requestSlice.ts"
import { createGlobalStoreSlice } from "@/stores/globalStoreSlice.ts"

export const useBoundStore = create<CompleteStore>()((...a) => ({
  ...createAppStateSlice(...a),
  ...createKeysSlice(...a),
  ...createPoolsSlice(...a),
  ...createRequestSlice(...a),
  ...createGlobalStoreSlice(...a),
}))