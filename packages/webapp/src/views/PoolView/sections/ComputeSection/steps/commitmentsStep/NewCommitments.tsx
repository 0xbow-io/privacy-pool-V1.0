import { Button } from "@/components/ui/button.tsx"
import { cn } from "@/lib/utils.ts"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool/constants"
import { PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"
import { ChevronRightSquareIcon, SigmaIcon } from "lucide-react"
import React, { lazy, memo, useMemo, useTransition } from "react"
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
    currPoolID,
    getTotalNew,
    getTotalExisting,
    privKeys,
    setExternIO
  } = useBoundStore(
    ({
      externIO,
      newValues,
      sink,
      updateSink,
      currPoolID,
      getTotalNew,
      getTotalExisting,
      privKeys,
      setExternIO
    }) => ({
      externIO,
      newValues,
      sink,
      updateSink,
      currPoolID,
      getTotalNew,
      getTotalExisting,
      privKeys,
      setExternIO
    })
  )

  const [isOutputDialogOpen, setIsNewCommitmentDialogOpen] =
    React.useState(false)
  const [newSlot, setNewSlot] = React.useState(0)
  const [_, startTransition] = useTransition()

  const privacyKeys = useMemo(
    () => privKeys.map((key) => PrivacyKey.from(key, 0n).asJSON),
    [privKeys]
  )
  const fe = useMemo(
    () => PrivacyPools.get(currPoolID)?.fieldElement,
    [currPoolID]
  )

  return (
    <div className="">
      <div className="flex items-center justify-between space-x-4">
        <Label
          htmlFor=""
          className={cn("block mb-2 text-sm font-semibold text-blackmail")}
        >
          New Commitments:
        </Label>
      </div>
      {newValues.map((val, index) => {
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
              {formatValue(val, fe?.precision)} {fe?.ticker}
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
      <div className="flex-auto flex flex-col gap-y-4 px-4 py-4 tablet:pt-6 rounded-md border-blackmail border-2">
        <div>
          <Label
            htmlFor=""
            className={cn("block mb-2 text-base font-bold text-blackmail")}
          >
            External Output:
          </Label>
        </div>
        <div>
          <Select
            value={shortForm(sink)}
            onValueChange={(value) => updateSink(value as Hex)}
          >
            <SelectTrigger
              className={cn(
                "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
              )}
            >
              <SelectValue placeholder="Select">{shortForm(sink)}</SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {privacyKeys.map((pK, index) => {
                return (
                  <SelectItem key={index} value={pK.pubAddr}>
                    {shortForm(pK.pubAddr)}
                  </SelectItem>
                )
              })}
              <SelectItem key={"0xgeneratekey"} value={"0xgeneratekey"}>
                Generate New Key
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          id="external-output"
          type="number"
          disabled={sink === numberToHex(0)}
          placeholder="Enter Input Value"
          value={formatUnits(externIO[1], Number(fe?.precision))}
          onChange={(e) => {
            let newVal = parseUnits(e.target.value, Number(fe?.precision))
            startTransition(() => {
              setExternIO([externIO[0], newVal < 0n ? 0n : newVal])
            })
          }}
          className={cn(
            "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
          )}
        />
        <IconButton
          onClick={() => {
            const diff = getTotalExisting() - getTotalNew()
            const val = diff > 0n ? externIO[1] + diff : 0n
            setExternIO([externIO[0], val])
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
          Total: {formatValue(getTotalNew(), fe?.precision)} {fe?.ticker}{" "}
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
