import { cn } from "@/lib/utils.ts"
import { Button } from "@/components/ui/button.tsx"
import { ChevronRightSquareIcon, ChevronsUpDown } from "lucide-react"
import React from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import { OutputsDialog } from "@/views/PoolView/sections/TransactionsSection/OutputsDialog.tsx"

export const OutputCommitments = ({ className }: { className: string }) => {
  const {
    isOutputValid,
    outTotalValue,
    outValues,
    currPool,
    outputAmountIsValid
  } = useKeyStore((state) => state)
  const [isOutputDialogOpen, setIsOutputDialogOpen] = React.useState(false)
  const [targetOutputIndex, setTargetOutputIndex] = React.useState(0)

  const { reason } = isOutputValid()

  return (
    <div>
      <div className="flex items-center justify-between space-x-4">
        <h2 className="text-sm font-semibold">Output Commitments:</h2>
      </div>
      {outValues.map((value, index) => {
        return (
          <div
            key={`output:${index}`}
            className={cn(
              "rounded-md border px-4 py-3 my-2 text-sm items-center justify-between flex flex-row w-full",
              outputAmountIsValid[targetOutputIndex]
                ? "bg-tropical-forest text-ghost-white"
                : "bg-rust-effect text-ghost-white"
            )}
            style={{ minHeight: "4rem" }}
          >
            <h2 className="font-semibold">
              Output ({index}): {value.toString()}{" "}
              {currPool.fieldElement.ticker}
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
      <div className="rounded-md border px-4 py-3 text-sm space-y-2">
        <h2 className="font-semibold  text-sm">
          Expected Total: {outTotalValue.toString()}{" "}
          {currPool.fieldElement.ticker}{" "}
        </h2>
        <h2 className="font-semibold text-sm text-rust-effect">{reason}</h2>
      </div>
      <OutputsDialog
        className="absolute"
        isOpen={isOutputDialogOpen}
        onOpenChange={setIsOutputDialogOpen}
        targetOutputIndex={targetOutputIndex}
      />
    </div>
  )
}
