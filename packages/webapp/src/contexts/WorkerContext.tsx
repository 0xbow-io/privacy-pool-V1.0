import React, { createContext, useContext, useEffect, useState } from "react"
import { loadWorkerDynamically } from "@/workers/WorkerLazyLoader.ts"

const WorkerContext = createContext<Worker | null>(null)

export const WorkerProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [worker, setWorker] = useState<Worker | null>(null)

  useEffect(() => {
    const workerInstance = loadWorkerDynamically()
    setWorker(workerInstance)

    return () => {
      workerInstance?.terminate()
    }
  }, [])

  return (
    <WorkerContext.Provider value={worker}>{children}</WorkerContext.Provider>
  )
}

export const useWorker = (): Worker | null => {
  return useContext(WorkerContext)
}
