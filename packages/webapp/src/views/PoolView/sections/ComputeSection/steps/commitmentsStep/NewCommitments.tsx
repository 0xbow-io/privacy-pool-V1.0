import { Button } from "@/components/ui/button.tsx"
import { cn } from "@/lib/utils.ts"
import { ChevronRightSquareIcon, SigmaIcon } from "lucide-react"
import React, { lazy, useState, useTransition } from "react"
import { formatUnits, type Hex, numberToHex, parseUnits } from "viem"
import { Label } from "@/components/ui/label.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.tsx"
import { Input } from "@/components/ui/input.tsx"
import IconButton from "@/components/IconButton/IconButton.tsx"
import { formatValue, shortForm } from "@/utils"
import { useBoundStore } from "@/stores"
import { RequestType } from "@/stores/types.ts"

const NewCommitmentDialog = lazy(
  () =>
    import(
      "@/views/PoolView/sections/ComputeSection/steps/commitmentsStep/NewCommitmentDialog.tsx"
    )
)

export const NewCommitments = ({ className }: { className: string }) => {
  const {
    externIO,
    newValues,
    sink,
    updateSink,
    getTotalNew,
    getTotalExisting,
    setExternIO,
    privacyKeys,
    currPoolFe,
    reqType
  } = useBoundStore(
    ({
      externIO,
      newValues,
      sink,
      updateSink,
      currPoolID,
      getTotalNew,
      getTotalExisting,
      setExternIO,
      privacyKeys,
      currPoolFe,
      reqType
    }) => ({
      externIO,
      newValues,
      sink,
      updateSink,
      currPoolID,
      getTotalNew,
      getTotalExisting,
      setExternIO,
      privacyKeys,
      currPoolFe,
      reqType
    })
  )

  const [isOutputDialogOpen, setIsNewCommitmentDialogOpen] = useState(false)
  const [newSlot, setNewSlot] = useState(0)
  const [_, startTransition] = useTransition()
  const [rawInputValue, setRawInputValue] = useState("0")

  return (
    <div className="">
      <div className="flex items-center justify-between space-x-4">
        <Label
          htmlFor=""
          className={cn("block mb-2 text-sm font-semibold text-blackmail")}
        >
          New Commitment:
        </Label>
      </div>
      <div
        className={`flex flex-col justify-center ${reqType !== RequestType.OneToOne && "laptop:min-h-40"}`}
      >
        {(reqType === RequestType.OneToTwo ? [0, 1] : [0]).map((index) => {
          const val = newValues[index]
          return (
            <div
              key={`New Commitment:${index}`}
              className={cn(
                "rounded-md border px-4 py-2 my-2 text-sm items-center justify-between flex flex-row w-full",
                "bg-tropical-forest text-ghost-white"
              )}
              style={{ minHeight: "4rem" }}
            >
              <h2 className="font-semibold">
                {formatValue(val, currPoolFe?.precision)} {currPoolFe?.ticker}
              </h2>
              <Button
                onClick={() => {
                  setNewSlot(index)
                  setIsNewCommitmentDialogOpen(true)
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
      </div>

      <div
        className={`flex-auto flex flex-col gap-y-4 px-4 py-4 tablet:pt-6 rounded-md border-blackmail border-2 ${externIO[1] !== 0n && "min-h-64"}`}
      >
        <div>
          <Label
            htmlFor=""
            className={cn("block mb-2 text-base font-bold text-blackmail")}
          >
            External Output:
          </Label>
        </div>
        <Input
          id="external-output"
          // type="number"
          disabled={externIO[0] !== 0n}
          placeholder="Enter Input Value"
          value={rawInputValue}
          onChange={(e) => {
            const value = e.target.value
            const validNumberPattern = /^-?\d*\.?\d*$/

            if (validNumberPattern.test(value)) {
              let newVal = parseUnits(
                e.target.value,
                Number(currPoolFe?.precision)
              )
              setRawInputValue(value)
              startTransition(() => {
                setExternIO([externIO[0], newVal < 0n ? 0n : newVal])
              })
            }
          }}
          className={cn(
            "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
          )}
        />
        {externIO[1] !== 0n && (
          <div>
            <Input
              id="output-sink"
              placeholder="Enter Output Sink"
              value={sink}
              onChange={(e) => updateSink(e.target.value as Hex)}
              className={cn(
                "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
              )}
            />
          </div>
        )}
        <IconButton
          onClick={() => {
            const diff = getTotalExisting() - getTotalNew()
            const val = diff > 0n ? externIO[1] + diff : 0n
            setExternIO([externIO[0], val])
            setRawInputValue(formatUnits(val, Number(currPoolFe?.precision)))
          }}
          icon={<SigmaIcon />}
          disabled={sink === numberToHex(0)}
        >
          Calculate
        </IconButton>
      </div>

      <div className="rounded-md border-blackmail border-2 px-4 py-4 mt-4 ">
        <Label
          htmlFor=""
          className={cn("block text-base font-bold text-blackmail")}
        >
          Total: {formatValue(getTotalNew(), currPoolFe?.precision)}{" "}
          {currPoolFe?.ticker}{" "}
        </Label>
      </div>

      <NewCommitmentDialog
        className="absolute"
        isOpen={isOutputDialogOpen}
        onOpenChange={setIsNewCommitmentDialogOpen}
        newSlot={newSlot}
      />
    </div>
  )
}

export default NewCommitments
