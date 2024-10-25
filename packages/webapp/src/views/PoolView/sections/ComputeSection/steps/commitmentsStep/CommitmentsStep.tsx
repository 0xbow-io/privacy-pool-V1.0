import ExistingCommitments from "@/views/PoolView/sections/ComputeSection/steps/commitmentsStep/ExistingCommitments.tsx"
import NewCommitments from "@/views/PoolView/sections/ComputeSection/steps/commitmentsStep/NewCommitments.tsx"
import {
  Container,
  LoaderIcon
} from "@/views/PoolView/sections/ComputeSection/steps/styled.ts"
import React, { useEffect } from "react"
import type { CommonProps } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import { StatusField } from "@/components/StatusField/StatusField.tsx"
import { useBoundStore } from "@/stores"

export const CommitmentsStep = ({
  setPrimaryButtonProps,
}: CommonProps) => {
  const { isSyncing, status } = useBoundStore((state) => ({
    isSyncing: state.isSyncing,
    status: state.getStatus()
  }))

  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({
        disabled: status !== "valid",
        text: status === "valid" ? "Compute" : "Invalid"
      })
  }, [setPrimaryButtonProps, status])

  return (
    <Container>
      {isSyncing ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <LoaderIcon />
          <p className="mt-2 text-sm">Syncing....</p>
        </div>
      ) : (
        <div className="w-full flex items-end flex-col">
          <div className="grid grid-cols-1 gap-4 laptop:grid-cols-2 w-full">
            <div className="col-span-1">
              <ExistingCommitments
                className=""
              />
            </div>
            <div className="col-span-1 laptop:col-start-2">
              <div className="flex-auto flex-col gap-y-4 pt-6 laptop:pt-0">
                <div className="flex-auto">
                  <NewCommitments
                    className="border-2"
                  />
                </div>
              </div>
            </div>
          </div>
          <StatusField />
        </div>
      )}
    </Container>
  )
}
