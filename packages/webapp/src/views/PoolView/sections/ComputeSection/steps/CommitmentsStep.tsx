import { cn } from "@/lib/utils.ts"
import { ExistingCommitments } from "@/views/PoolView/sections/TransactionsSection/ExistingCommitments.tsx"
import { NewCommitments } from "@/views/PoolView/sections/TransactionsSection/NewCommitments"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GetNewSum } from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import { Button } from "@/components/ui/button"
import { SigmaIcon } from "lucide-react"
import IconButton from "@/components/IconButton/IconButton"

export const CommitmentsStep = ({ setPrimaryButtonProps }: CommonProps) => {
  const {
    isSyncing,
    setExternIO,
    request,
    currPoolID,
    privKeys,
    updateSrc,
    updateSink,
    status
  } = useGlobalStore((state) => {
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
  const fe = PrivacyPools.get(currPoolID)?.fieldElement

  const privacyKeys = privKeys.map((key) => PrivacyKey.from(key, 0n).asJSON)
  const shortForm = (str: Hex): string => {
    return `${str.substring(0, 14)}....${str.substring(54)}`
  }

  const formatValue = (val: bigint): string => {
    return formatUnits(val, Number(fe?.precision))
  }

  const getTotalExisting = (): bigint =>
    request.existing.reduce((acc, val) => acc + val.asTuple()[0], 0n) +
    request.externIO[0]

  const getTotalNew = (): bigint =>
    request.newValues.reduce((acc, val) => acc + val, 0n) + request.externIO[1]

  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({
        disabled: status !== "valid",
        text: status === "valid" ? "Compute" : status
      })
  }, [setPrimaryButtonProps, status])

  return (
    <Container>
      {isSyncing && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <LoaderIcon />
          <p className="mt-2 text-sm">Syncing....</p>
        </div>
      )}
      {!isSyncing && (
        <div className="flex flex-col gap-y-4 laptop:flex-row laptop:items-start laptop:gap-4 justify-around">
          <div className="flex-auto flex-col gap-y-4 tablet:pt-6">
            <div className="flex-auto">
              <ExistingCommitments className="" />
            </div>
            <div className="flex-auto flex flex-col gap-y-2 px-4 py-4 tablet:pt-6 rounded-md border-blackmail border-2">
              <div>
                <Label
                  htmlFor=""
                  className={cn(
                    "block mb-2 text-base font-bold text-blackmail"
                  )}
                >
                  External Input:
                </Label>
              </div>
              <div>
                <Select
                  value={shortForm(request.src)}
                  onValueChange={(value) => updateSrc(value as Hex)}
                >
                  <SelectTrigger
                    className={cn(
                      "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
                    )}
                  >
                    <SelectValue placeholder="Select">
                      {shortForm(request.src)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {privacyKeys.map((pK, index) => {
                      return (
                        <SelectItem key={index} value={pK.pubAddr}>
                          {shortForm(pK.pubAddr)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  id="external-input"
                  type="number"
                  disabled={request.src === numberToHex(0)}
                  placeholder="Enter Input Value"
                  value={formatUnits(
                    request.externIO[0],
                    Number(fe?.precision)
                  )}
                  onChange={(e) => {
                    let newVal = parseUnits(
                      e.target.value,
                      Number(fe?.precision)
                    )
                    setExternIO([
                      newVal < 0n ? 0n : newVal,
                      request.externIO[1]
                    ])
                  }}
                  className={cn(
                    "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
                  )}
                />
              </div>
              <div className="flex-auto">
                <IconButton
                  onClick={() => {
                    const diff = getTotalNew() - getTotalExisting()
                    const val = diff > 0n ? request.externIO[0] + diff : 0n
                    setExternIO([val, request.externIO[1]])
                  }}
                  icon={<SigmaIcon />}
                  disabled={request.src === numberToHex(0)}
                >
                  Calculate
                </IconButton>
              </div>
            </div>
            <div className="rounded-md border-blackmail border-2 px-4 py-4 ">
              <Label
                htmlFor=""
                className={cn("block text-base font-bold text-blackmail")}
              >
                Total: {formatValue(getTotalExisting())} {fe?.ticker}{" "}
              </Label>
            </div>
          </div>
          <div className="flex-auto flex-col gap-y-4 tablet:pt-6">
            <div className="flex-auto">
              {<NewCommitments className="border-2" />}
            </div>
            <div className="flex-auto flex flex-col gap-y-2 px-4 py-4 tablet:pt-6 rounded-md border-blackmail border-2">
              <div>
                <Label
                  htmlFor=""
                  className={cn(
                    "block mb-2 text-base font-bold text-blackmail"
                  )}
                >
                  External Output:
                </Label>
              </div>
              <div>
                <Select
                  value={shortForm(request.sink)}
                  onValueChange={(value) => updateSink(value as Hex)}
                >
                  <SelectTrigger
                    className={cn(
                      "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
                    )}
                  >
                    <SelectValue placeholder="Select">
                      {shortForm(request.sink)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {privacyKeys.map((pK, index) => {
                      return (
                        <SelectItem key={index} value={pK.pubAddr}>
                          {shortForm(pK.pubAddr)}
                        </SelectItem>
                      )
                    })}
                    <SelectItem key={"0xgeneratekey"} value={"0xgeneratekey"}>
                      Generate New Key
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  id="external-output"
                  type="number"
                  disabled={request.sink === numberToHex(0)}
                  placeholder="Enter Input Value"
                  value={formatUnits(
                    request.externIO[1],
                    Number(fe?.precision)
                  )}
                  onChange={(e) => {
                    let newVal = parseUnits(
                      e.target.value,
                      Number(fe?.precision)
                    )
                    setExternIO([
                      request.externIO[0],
                      newVal < 0n ? 0n : newVal
                    ])
                  }}
                  className={cn(
                    "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
                  )}
                />
              </div>
              <div className="flex-auto">
                <IconButton
                  onClick={() => {
                    const diff = getTotalExisting() - getTotalNew()
                    const val = diff > 0n ? request.externIO[1] + diff : 0n
                    setExternIO([request.externIO[0], val])
                  }}
                  icon={<SigmaIcon />}
                  disabled={request.sink === numberToHex(0)}
                >
                  Calculate
                </IconButton>
              </div>
            </div>
            <div className="rounded-md border-blackmail border-2 px-4 py-4 ">
              <Label
                htmlFor=""
                className={cn("block text-base font-bold text-blackmail")}
              >
                Total: {formatValue(getTotalNew())} {fe?.ticker}{" "}
              </Label>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}