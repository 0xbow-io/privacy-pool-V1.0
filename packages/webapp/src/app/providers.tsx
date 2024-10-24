"use client"

import { WorkerProvider } from "@/contexts/WorkerContext.tsx"
import type { ReactNode } from "react"

export const Providers = ({ children }: { children: ReactNode }) => {
  return <WorkerProvider>{children}</WorkerProvider>
}
