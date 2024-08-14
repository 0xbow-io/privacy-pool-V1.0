"use client"

import React, { type ReactNode } from "react"
import { MetaMaskProvider } from "@metamask/sdk-react"
import { KeyStoreProvider } from "@/providers/global-store-provider.tsx"

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
      <KeyStoreProvider>{children}</KeyStoreProvider>
    </MetaMaskProvider>
  )
}
