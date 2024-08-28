import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.tsx"
import { cn } from "@/lib/utils.ts"
import { useGlobalStore } from "@/stores/global-store.ts"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"
import React from "react"
import { formatUnits, parseUnits } from "viem"

type NewCommitmentDialogProps = {
  className: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  newSlot: number
}

export const NewCommitmentDialog = ({
  className,
  isOpen,
  onOpenChange,
  newSlot
}: NewCommitmentDialogProps) => {
  const { privKeys, request, insertNew, currPoolID } = useGlobalStore(
    (state) => state
  )

  const privacyKeys = privKeys.map((key) => PrivacyKey.from(key, 0n).asJSON)
  const [targetKeyIndex, setTargetKeyIndex] = React.useState(0)

  const fe = PrivacyPools.get(currPoolID)?.fieldElement

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
                request.newValues[newSlot],
                Number(fe?.precision)
              )}
              onChange={(e) =>
                insertNew(
                  targetKeyIndex,
                  parseUnits(e.target.value, Number(fe?.precision)),
                  newSlot
                )
              }
              className={cn(
                "px-4 py-3 text-sm font-semibold text-blackmail ",
                "text-blackmail"
              )}
            />
          </div>

          <div className="flex-auto flex flex-col gap-y-2 tablet:pt-6">
            <label
              htmlFor="output-amount"
              className={cn("block mb-2 text-sm font-semibold text-blackmail ")}
            >
              Binded To:
            </label>
            <Select
              value={privacyKeys[targetKeyIndex].pubAddr}
              onValueChange={(value) => {
                setTargetKeyIndex(
                  privacyKeys.findIndex((key) => key.pubAddr === value)!
                )
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select">
                  {privacyKeys[targetKeyIndex].pubAddr}
                </SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" id="putput-key-dropdown">
                {privacyKeys.map((pK, index) => {
                  const short = `0x${pK.pubAddr.substring(0, 14)}....${pK.pubAddr.substring(54)}`
                  return (
                    <SelectItem key={index} value={pK.pubAddr}>
                      {short}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
