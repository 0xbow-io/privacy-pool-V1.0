"use client"

import React, { type ReactNode } from "react"
import { MetaMaskProvider } from "@metamask/sdk-react"

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <MetaMaskProvider
      debug={true}
      sdkOptions={{
        dappMetadata: {
          name: "0xbow privacy pool",
          url: "https://www.0xbow.io/"
        },
        infuraAPIKey: process.env.INFURA_PROJECT_ID
      }}
    >
      {children}
    </MetaMaskProvider>
  )
}