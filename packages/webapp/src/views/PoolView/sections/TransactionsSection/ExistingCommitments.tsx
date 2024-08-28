import { Button } from "@/components/ui/button.tsx"
import { cn } from "@/lib/utils.ts"
import { ChevronRightSquareIcon, ChevronsUpDown } from "lucide-react"
import React, { useState } from "react"
import { useGlobalStore } from "@/stores/global-store.ts"
import { ExistingSelectionDialog } from "@/views/PoolView/sections/TransactionsSection/ExistingSelectionDialog.tsx"
import type { Commitment } from "@privacy-pool-v1/domainobjs/ts"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { get } from "http"
import { formatUnits, numberToHex, type Hex } from "viem"
import { Label } from "@/components/ui/label"
type ExistingCommitmentsProps = {
  className: string
}
export const ExistingCommitments = ({
  className
}: ExistingCommitmentsProps) => {
  const { request, commitments, currPoolID } = useGlobalStore((state) => state)
  const [isSelectionDialogOpen, setSelectionDialog] = React.useState(false)
  const [existingSlot, setExistingSlot] = React.useState(0)

  const fe = PrivacyPools.get(currPoolID)?.fieldElement

  const formatValue = (val: bigint): string => {
    return formatUnits(val, Number(fe?.precision))
  }

  const getTotalValueFormatted = (vals: Commitment[]): number =>
    Number(formatValue(vals.reduce((acc, val) => acc + val.asTuple()[0], 0n)))

  const shortForm = (str: Hex): string => {
    return `${str.substring(0, 14)}....${str.substring(54)}`
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between space-x-4">
        <Label
          htmlFor=""
          className={cn("block mb-2 text-sm font-semibold text-blackmail")}
        >
          Existing Commitments:
        </Label>
      </div>
      {request.existing.map((c, index) => {
        return (
          <div
            key={`Existing:${index}`}
            className={cn(
              "rounded-md border px-4 py-3 my-2 text-sm items-center justify-between flex flex-row w-full",
              "bg-tropical-forest text-ghost-white"
            )}
            style={{ minHeight: "4rem" }}
          >
            <div className="flex flex-col">
              <div>
                <h2 className="font-semibold">
                  {shortForm(numberToHex(c.commitmentRoot))}
                </h2>
              </div>
              <div>
                <h2 className="font-semibold">
                  ({formatValue(c.asTuple()[0])} {fe?.ticker})
                </h2>
              </div>
            </div>
            <Button
              onClick={() => {
                setExistingSlot(index)
                setSelectionDialog(true)
              }}
              variant="ghost"
              size="sm"
              className="w-9 p-0"
            >
              <ChevronRightSquareIcon className="size-6" />
            </Button>
          </div>
        )
      })}
      <ExistingSelectionDialog
        className="absolute"
        isOpen={isSelectionDialogOpen}
        onOpenChange={setSelectionDialog}
        existingSlot={existingSlot}
      />
    </div>
  )
}
