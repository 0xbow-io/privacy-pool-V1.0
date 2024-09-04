import { cn } from "@/lib/utils.ts"
import { ExistingCommitments } from "@/views/PoolView/sections/ComputeSection/steps/commitmentsStep/ExistingCommitments.tsx"
import { NewCommitments } from "@/views/PoolView/sections/ComputeSection/steps/commitmentsStep/NewCommitments.tsx"
import {
  Container,
  LoaderIcon
} from "@/views/PoolView/sections/ComputeSection/steps/styled.ts"
import React, { useEffect, useState } from "react"
import { useGlobalStore } from "@/stores/global-store.ts"
import type { CommonProps } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import { parseUnits, formatUnits, type Hex, numberToHex } from "viem"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import {
  PrivacyKey,
  DummyCommitment,
  type Commitment
} from "@privacy-pool-v1/domainobjs/ts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import { GetNewSum } from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import { Button } from "@/components/ui/button.tsx"
import { SigmaIcon } from "lucide-react"
import IconButton from "@/components/IconButton/IconButton.tsx"
import { StatusField } from "@/components/StatusField/StatusField.tsx"

export const CommitmentsStep = ({ setPrimaryButtonProps }: CommonProps) => {
  const { isSyncing, status } = useGlobalStore((state) => {
    let {
      isSyncing,
      setExternIO,
      request,
      currPoolID,
      privKeys,
      updateSrc,
      updateSink
    } = state
    let status = "valid"

    if (request.existing[0].nullRoot === request.existing[1].nullRoot) {
      status = "duplicate existing commitments"
    }

    if (request.externIO[0] < 0n || request.externIO[1] < 0n) {
      status = "invalid external input / output"
    }
    if (request.src === numberToHex(0) && request.externIO[0] !== 0n) {
      status = "invalid external input / output"
    }
    if (request.sink === numberToHex(0) && request.externIO[1] !== 0n) {
      status = "invalid external input / output"
    }

    const { expected, actual } = GetNewSum(
      {
        new: request.newValues.map((v) => DummyCommitment(v)),
        existing: request.existing
      },
      request.externIO
    )

    if (expected !== actual || expected < 0n || actual < 0n) {
      status = "invalid values"
    }

    return {
      isSyncing,
      setExternIO,
      request,
      currPoolID,
      privKeys,
      updateSrc,
      updateSink,
      status
    }
  })

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
              <ExistingCommitments className="" />
            </div>
            <div className="col-span-1 laptop:col-start-2">
              <div className="flex-auto flex-col gap-y-4 pt-6 laptop:pt-0">
                <div className="flex-auto">
                  <NewCommitments className="border-2" />
                </div>
              </div>
            </div>
          </div>
          <StatusField statusIsValid={status === "valid"} status={status} />
        </div>
      )}
    </Container>
  )
}
