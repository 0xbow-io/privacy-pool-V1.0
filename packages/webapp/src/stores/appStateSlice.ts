import type { StateCreator } from "zustand"
import type { AppStateSlice, CompleteStore } from "@/stores/types.ts"

export const createAppStateSlice: StateCreator<
  CompleteStore,
  [],
  [],
  AppStateSlice
> = (set) => ({
  isSyncing: false,
  isGeneratingProof: false,
  isExecutingRequest: false,

  tabs: new Set<string>(["account", "compute", "asp", "records", "settings"]),
  currentTab: "account",
  onTabChange: (tab: string) =>
    set((state) => ({
      ...state,
      currentTab: state.tabs.has(tab) ? tab : "account"
    })),

  _settingsDrawer: false,
  settingsDrawer: (open: boolean) =>
    set((state) => ({ ...state, _settingsDrawer: open }))
})
