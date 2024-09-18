"use client"

import React from "react"
import PoolView from "@/views/PoolView/PoolView.tsx"
import { Providers } from "@/app/providers.tsx"

export default function Page() {
  return (
    <Providers>
      <PoolView />
    </Providers>
  )
}
