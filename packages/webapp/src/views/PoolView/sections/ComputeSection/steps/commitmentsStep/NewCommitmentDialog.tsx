import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.tsx"
import { cn } from "@/lib/utils.ts"
import React, { memo } from "react"
import { formatUnits, parseUnits } from "viem"
import { useBoundStore } from "@/stores"
import { debounce } from "@/utils"

type NewCommitmentDialogProps = {
  className: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  newSlot: number
}

const NewCommitmentDialog = ({
  className,
  isOpen,
  onOpenChange,
  newSlot
}: NewCommitmentDialogProps) => {
  const { currPoolFe, masterKeyIndex, insertNew, newValues } =
    useBoundStore(
      ({ privacyKeys, currPoolFe, insertNew, masterKeyIndex, newValues }) => ({
        privacyKeys,
        currPoolFe,
        masterKeyIndex,
        insertNew,
        newValues
      })
    )

  const debouncedInsertNew = debounce(
    (
      value: string,
      precision: number,
      slot: number,
      insertNew: (keyIdx: number, value: bigint, slot: number) => void
    ) => {
      insertNew(masterKeyIndex, parseUnits(value, precision), slot)
    },
    500
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>Create a new Commitment:</DialogTitle>
          <DialogDescription>
            Adjust the value of the Commitment & bind the commitment to a
            privacy key.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-auto space-y-6">
          <div className="flex-auto flex flex-col gap-y-2 tablet:pt-6">
            <label
              htmlFor="new-amount"
              className={cn(
                "block mb-2 text-sm font-semibold text-blackmail ",
                "text-blackmail"
              )}
            >
              Set Value:
            </label>
            <input
              id="new-amount"
              type="number"
              placeholder={formatUnits(
                newValues[newSlot],
                Number(currPoolFe?.precision)
              )}
              onChange={(e) =>
                debouncedInsertNew(
                  e.target.value,
                  Number(currPoolFe?.precision),
                  newSlot,
                  insertNew
                )
              }
              className={cn(
                "px-4 py-3 text-sm font-semibold text-blackmail ",
                "text-blackmail"
              )}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default memo(NewCommitmentDialog)
