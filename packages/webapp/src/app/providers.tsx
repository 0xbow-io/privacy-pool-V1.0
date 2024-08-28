"use client"

import React, { type ReactNode } from "react"
import { MetaMaskProvider } from "@metamask/sdk-react"
//import { GlobalStoreProvider } from "@/stores/global-store.ts"

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <MetaMaskProvider
      debug={true}
      sdkOptions={{
        dappMetadata: {
          name: "0xbow privacy pool",
          url: window.location.href
        },
        infuraAPIKey: process.env.INFURA_PROJECT_ID
      }}
    >
      {children}
    </MetaMaskProvider>
  )
}
