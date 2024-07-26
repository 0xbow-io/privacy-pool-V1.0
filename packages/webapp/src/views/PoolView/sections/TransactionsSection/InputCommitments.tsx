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
import { InputsDialog } from "@/views/PoolView/sections/TransactionsSection/InputsDialog.tsx"

type InputCommitmentsProps = {
  className: string
}
export const InputCommitments = ({ className }: InputCommitmentsProps) => {
  const {
    isInputValid,
    getInTotalValueFormatted,
    currUnitRepresentative,
    inCommits
  } = useKeyStore((state) => state)
  const [inputsIsOpen, setInputIsOpen] = React.useState(false)
  const [isInputDialogOpen, setIsInputDialogOpen] = React.useState(false)
  const [targetInputIndex, setTargetInputIndex] = React.useState(0)

  const { ok, reason } = isInputValid()

  return (
    <div>
      <Collapsible
        open={inputsIsOpen}
        onOpenChange={setInputIsOpen}
        className={cn(
          "space-y-2 border-2 p-2",
          className,
          ok ? "border-tropical-forest" : "border-rust-effect"
        )}
      >
        <div className="flex items-center justify-between space-x-4">
          <h2 className="text-sm font-semibold text-blackmail ">
            Input Commitments:
          </h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-3 text-sm">
          <h2 className="font-semibold text-blackmail text-sm">
            Total: {getInTotalValueFormatted().toString()}{" "}
            {currUnitRepresentative.ticker}{" "}
          </h2>
          <h2 className="font-semibold text-rust-effect text-sm">{reason}</h2>
        </div>
        <CollapsibleContent className="space-y-2">
          {inCommits.map((c, index) => {
            const commitVal: string =
              c === "" ? "0x" : `0x${c.substring(0, 14)}....${c.substring(54)}`

            return (
              <div
                key={`input:${c}`}
                className="rounded-md border px-4 py-3 text-sm items-center justify-between flex flex-row w-full"
              >
                <h2 className="font-semibold text-blackmail ">
                  Input ({index}): {commitVal}
                </h2>
                <Button
                  onClick={() => {
                    setTargetInputIndex(index)
                    setIsInputDialogOpen(true)
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
      </Collapsible>
      <InputsDialog
        className="absolute"
        isOpen={isInputDialogOpen}
        onOpenChange={setIsInputDialogOpen}
        targetInputIndex={targetInputIndex}
      />
    </div>
  )
}
