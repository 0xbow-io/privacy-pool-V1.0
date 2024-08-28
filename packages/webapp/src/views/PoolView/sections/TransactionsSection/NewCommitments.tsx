import { Button } from "@/components/ui/button.tsx"
import { cn } from "@/lib/utils.ts"
import { useGlobalStore } from "@/stores/global-store.ts"
import { NewCommitmentDialog } from "@/views/PoolView/sections/TransactionsSection/NewCommitmentDialog.tsx"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool/constants"
import type { Commitment } from "@privacy-pool-v1/domainobjs/ts"
import { ChevronRightSquareIcon, ChevronsUpDown } from "lucide-react"
import React from "react"
import { formatUnits } from "viem"
import { Label } from "@/components/ui/label"

export const NewCommitments = ({ className }: { className: string }) => {
  const { currPoolID, request } = useGlobalStore((state) => state)
  const [isOutputDialogOpen, setIsNewCommmitmentDialogOpen] =
    React.useState(false)
  const [newSlot, setNewSlot] = React.useState(0)

  const fe = PrivacyPools.get(currPoolID)?.fieldElement

  const formatValue = (val: bigint): string => {
    return formatUnits(val, Number(fe?.precision))
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between space-x-4">
        <Label
          htmlFor=""
          className={cn("block mb-2 text-sm font-semibold text-blackmail")}
        >
          New Commitments:
        </Label>
      </div>
      {request.newValues.map((val, index) => {
        return (
          <div
            key={`New Commitment:${index}`}
            className={cn(
              "rounded-md border px-4 py-3 my-2 text-sm items-center justify-between flex flex-row w-full",
              "bg-tropical-forest text-ghost-white"
            )}
            style={{ minHeight: "4rem" }}
          >
            <h2 className="font-semibold">
              {formatValue(val)} {fe?.ticker}
            </h2>
            <Button
              onClick={() => {
                setNewSlot(index)
                setIsNewCommmitmentDialogOpen(true)
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
      <NewCommitmentDialog
        className="absolute"
        isOpen={isOutputDialogOpen}
        onOpenChange={setIsNewCommmitmentDialogOpen}
        newSlot={newSlot}
      />
    </div>
  )
}
