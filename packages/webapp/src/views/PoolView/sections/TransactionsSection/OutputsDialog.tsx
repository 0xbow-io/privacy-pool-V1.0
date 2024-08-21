import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.tsx"
import { cn } from "@/lib/utils.ts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.tsx"
import React from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import { parseEther } from "viem"
import BigNumber from "bignumber.js"

type OutputsDialogProps = {
  className: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  targetOutputIndex: number
}

export const OutputsDialog = ({
  className,
  isOpen,
  onOpenChange,
  targetOutputIndex
}: OutputsDialogProps) => {
  const {
    outputAmountIsValid,
    outValues,
    updateOutputValue,
    outputAmountReasons,
    getOutputPubKeyHash,
    updateOutputPrivacyKey,
    keys
  } = useKeyStore((state) => state)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>Output Commitment:</DialogTitle>
          <DialogDescription>
            Adjust the value of the Commitment & specify which keypair owns it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-auto space-y-6">
          <div className="flex-auto flex flex-col gap-y-2 tablet:pt-6">
            <label
              htmlFor="output-amount"
              className={cn(
                "block mb-2 text-sm font-semibold text-blackmail ",
                outputAmountIsValid[targetOutputIndex]
                  ? "text-blackmail"
                  : "text-rust-effect"
              )}
            >
              Output Amount:
            </label>
            <input
              id="output-amount"
              type="number"
              placeholder={outValues[targetOutputIndex].toString()}
              onChange={(e) =>
                updateOutputValue(
                  targetOutputIndex,
                  new BigNumber(parseEther(e.target.value).toString())
                )
              }
              className={cn(
                "px-4 py-3 text-sm font-semibold text-blackmail ",
                outputAmountIsValid[targetOutputIndex]
                  ? "text-blackmail"
                  : "text-rust-effect"
              )}
            />
            <h2 className="mt-2 text-sm font-semibold text-rust-effect">
              {outputAmountReasons[targetOutputIndex]}
            </h2>
          </div>

          <div className="flex-auto flex flex-col gap-y-2 tablet:pt-6">
            <label
              htmlFor="output-amount"
              className={cn("block mb-2 text-sm font-semibold text-blackmail ")}
            >
              Owned by:
            </label>
            <Select
              value={`0x${getOutputPubKeyHash(targetOutputIndex).substring(0, 14)}....${getOutputPubKeyHash(targetOutputIndex).substring(40)}`}
              onValueChange={(value) =>
                updateOutputPrivacyKey(targetOutputIndex, value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select">
                  0x{getOutputPubKeyHash(targetOutputIndex).substring(0, 14)}
                  ....{getOutputPubKeyHash(targetOutputIndex).substring(30)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" id="putput-key-dropdown">
                {keys.map((key) => {
                  const pk = key.publicAddr
                  return (
                    <SelectItem key={key.publicAddr} value={pk}>
                      {`0x${pk.substring(0, 14)}....${pk.substring(30)}`}
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
