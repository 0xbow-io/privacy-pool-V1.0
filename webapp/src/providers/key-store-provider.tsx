"use client"

import { type ReactNode, createContext, useRef, useContext } from "react"
import { useStore } from "zustand"

import { type KeyStore, createKeyStore, initKeyStore } from "@/stores/key-store"

export type KeyStoreApi = ReturnType<typeof createKeyStore>

export const KeyStoreContext = createContext<KeyStoreApi | undefined>(undefined)

export interface KeyStoreProviderProps {
  children: ReactNode
}

export const KeyStoreProvider = ({ children }: KeyStoreProviderProps) => {
  const storeRef = useRef<KeyStoreApi>()
  if (!storeRef.current) {
    storeRef.current = createKeyStore(initKeyStore())
  }
  return (
    <KeyStoreContext.Provider value={storeRef.current}>
      {children}
    </KeyStoreContext.Provider>
  )
}

export const useKeyStore = <T,>(selector: (store: KeyStore) => T): T => {
  const keyStoreContext = useContext(KeyStoreContext)
  if (!keyStoreContext) {
    throw new Error("useKeyStore must be used within KeyStoreProvider")
  }
  return useStore(keyStoreContext, selector)
}
