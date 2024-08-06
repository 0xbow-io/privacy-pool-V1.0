import { Button } from "@/components/ui/button.tsx"
import { ChevronRightSquareIcon, ChevronsUpDown } from "lucide-react"
import React, { useState } from "react"
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
  const [isInputDialogOpen, setIsInputDialogOpen] = React.useState(false)
  const [targetInputIndex, setTargetInputIndex] = React.useState(0)

  const { ok, reason } = isInputValid()

  return (
    <div>
      <div className="flex items-center justify-between space-x-4">
        <h2 className="text-sm font-semibold text-blackmail ">
          Input Commitments:
        </h2>
      </div>
      {inCommits.map((c, index) => {
        const commitVal: string =
          c === "" ? "0x" : `0x${c.substring(0, 14)}....${c.substring(54)}`

        return (
          <div
            key={`input:${index}`}
            className="rounded-md border my-2 px-4 py-3 text-sm items-center justify-between flex flex-row w-full"
            style={{ minHeight: "4rem" }}
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
      <div className="rounded-md border px-4 py-3 text-sm space-y-2">
        <h2 className="font-semibold text-blackmail text-sm">
          Total: {getInTotalValueFormatted().toString()}{" "}
          {currUnitRepresentative.ticker}{" "}
        </h2>
        <h2 className="font-semibold text-rust-effect text-sm">{reason}</h2>
      </div>
      <InputsDialog
        className="absolute"
        isOpen={isInputDialogOpen}
        onOpenChange={setIsInputDialogOpen}
        targetInputIndex={targetInputIndex}
      />
    </div>
  )
}
