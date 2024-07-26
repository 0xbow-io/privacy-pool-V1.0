import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible.tsx"
import { cn } from "@/lib/utils.ts"
import { Button } from "@/components/ui/button.tsx"
import { ChevronRightSquareIcon, ChevronsUpDown } from "lucide-react"
import React from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import { OutputsDialog } from "@/views/PoolView/sections/TransactionsSection/OutputsDialog.tsx"

export const OutputCommitments = ({className} : {className: string}) => {
  const {
    isOutputValid,
    outTotalValue,
    currUnitRepresentative,
    outValues,
    outputAmountIsValid
  } = useKeyStore((state) => state)
  const [ouptutsIsOpen, setOutputsIsOpen] = React.useState(false)
  const [isOutputDialogOpen, setIsOutputDialogOpen] = React.useState(false)
  const [targetOutputIndex, setTargetOutputIndex] = React.useState(0)

  const { ok, reason } = isOutputValid()

  return (
    <Collapsible
      open={ouptutsIsOpen}
      onOpenChange={setOutputsIsOpen}
      className={cn(
        "space-y-2 border-2 p-2",
        className,
        ok ? "border-tropical-forest" : "border-rust-effect"
      )}
    >
      <div className="flex items-center justify-between space-x-4">
        <h2 className="text-sm font-semibold">Output Commitments:</h2>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-3 text-sm space-y-2">
        <h2 className="font-semibold  text-sm">
          Expected Total: {outTotalValue.toString()}{" "}
          {currUnitRepresentative.ticker}{" "}
        </h2>
        <h2 className="font-semibold text-sm text-rust-effect">{reason}</h2>
      </div>
      <CollapsibleContent className="space-y-2">
        {outValues.map((value, index) => {
          return (
            <div
              key={`output:${value.toString()}`}
              className={cn(
                "rounded-md border px-4 py-3 text-sm items-center justify-between flex flex-row w-full",
                outputAmountIsValid[targetOutputIndex]
                  ? "bg-tropical-forest text-ghost-white"
                  : "bg-rust-effect text-ghost-white"
              )}
            >
              <h2 className="font-semibold">
                Output ({index}): {value.toString()}{" "}
                {currUnitRepresentative.ticker}
              </h2>
              <Button
                onClick={() => {
                  setTargetOutputIndex(index)
                  setIsOutputDialogOpen(true)
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
      </CollapsibleContent>
      <OutputsDialog
        className="absolute"
        isOpen={isOutputDialogOpen}
        onOpenChange={setIsOutputDialogOpen}
        targetOutputIndex={targetOutputIndex}
      />
    </Collapsible>
  )
}
