"use client"

import { type ReactNode, createContext, useRef, useContext } from "react"
import { useStore, type StoreApi } from "zustand"

import { useGlobalStore, type GlobalStore } from "@/stores/global-store.ts"

export type GlobalStoreApi = StoreApi<GlobalStore>

export const GlobalStoreContext = createContext<GlobalStoreApi | undefined>(
  undefined
)

export interface GlobalStoreProviderProps {
  children: ReactNode
}

export const GlobalStoreProvider = ({ children }: GlobalStoreProviderProps) => {
  const storeRef = useRef<GlobalStoreApi>()
  if (!storeRef.current) {
    storeRef.current = useGlobalStore
  }
  return (
    <GlobalStoreContext.Provider value={storeRef.current}>
      {children}
    </GlobalStoreContext.Provider>
  )
}
