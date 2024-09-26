import { Button } from "@/components/ui/button.tsx"
import { cn } from "@/lib/utils.ts"
import { ChevronRightSquareIcon, SigmaIcon } from "lucide-react"
import React, { lazy, useCallback, useState, useTransition } from "react"
import { type PrivacyKeyJSON } from "@privacy-pool-v1/domainobjs/ts"
import { type FEMeta } from "@privacy-pool-v1/contracts/ts/privacy-pool"
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

type ExistingCommitmentsProps = {
  className: string
  fe?: FEMeta | undefined
  privacyKeys?: PrivacyKeyJSON[]
}

const ExistingSelectionDialog = lazy(
  () =>
    import(
      "@/views/PoolView/sections/ComputeSection/steps/commitmentsStep/ExistingSelectionDialog.tsx"
    )
)

export const ExistingCommitments = ({
  className
}: ExistingCommitmentsProps) => {
  const {
    externIO,
    existing,
    src,
    getTotalNew,
    getTotalExisting,
    updateSrc,
    setExternIO,
    privacyKeys,
    currPoolFe
  } = useBoundStore(
    ({
      externIO,
      existing,
      src,
      getTotalNew,
      getTotalExisting,
      updateSrc,
      setExternIO,
      privacyKeys,
      currPoolFe
    }) => ({
      externIO,
      existing,
      src,
      getTotalNew,
      getTotalExisting,
      updateSrc,
      setExternIO,
      privacyKeys,
      currPoolFe
    })
  )

  const [_, startTransition] = useTransition()
  const [isSelectionDialogOpen, setSelectionDialog] = useState(false)
  const [existingSlot, setExistingSlot] = useState(0)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const validNumberPattern = /^-?\d*\.?\d*$/

      if (validNumberPattern.test(value)) {
        startTransition(() => {
          const newVal = parseUnits(value, Number(currPoolFe?.precision))
          if (newVal >= 0n && newVal !== externIO[0]) {
            setExternIO([newVal, externIO[1]])
          }
        })
      }
    },
    [externIO, currPoolFe?.precision, setExternIO, startTransition]
  )

  return (
    <div className="">
      <div className="flex items-center justify-between space-x-4">
        <Label
          htmlFor=""
          className={cn("block mb-2 text-sm font-semibold text-blackmail")}
        >
          Existing Commitments:
        </Label>
      </div>
      {[0, 1].map((index) => (
        <div
          key={`Existing:${index}`}
          className={cn(
            "rounded-md border px-4 py-2 my-2 text-sm items-center justify-between flex flex-row w-full",
            "bg-tropical-forest text-ghost-white min"
          )}
          style={{ minHeight: "4rem" }}
        >
          <div className="flex flex-col">
            {existing && existing[index] ? (
              <>
                <div>
                  <h2 className="font-semibold">
                    {shortForm(numberToHex(existing[index].commitmentRoot))}
                  </h2>
                </div>
                <div>
                  <h2 className="font-semibold">
                    (
                    {formatValue(
                      existing[index].asTuple()[0],
                      currPoolFe?.precision
                    )}{" "}
                    {currPoolFe?.ticker})
                  </h2>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-semibold">Select commitment</h2>
              </>
            )}
          </div>

          <Button
            onClick={() => {
              setExistingSlot(index)
              setSelectionDialog(true)
            }}
            variant="ghost"
            size="sm"
            className="w-9 p-0"
          >
            <ChevronRightSquareIcon className="size-6" />
          </Button>
        </div>
      ))}

      <div className="flex-auto flex flex-col gap-y-4 px-4 py-4 tablet:pt-6 rounded-md border-blackmail border-2">
        <div>
          <Label
            htmlFor=""
            className={cn("block mb-2 text-base font-bold text-blackmail")}
          >
            External Input:
          </Label>
        </div>
        <div>
          <Select
            value={shortForm(src)}
            onValueChange={(value) => updateSrc(value as Hex)}
          >
            <SelectTrigger
              className={cn(
                "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
              )}
            >
              <SelectValue placeholder="Select">{shortForm(src)}</SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {privacyKeys &&
                privacyKeys.map((pK, index) => (
                  <SelectItem key={index} value={pK.publicAddr}>
                    {shortForm(pK.publicAddr)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          id="external-input"
          type="number"
          disabled={src === numberToHex(0)}
          placeholder="Enter Input Value"
          value={formatUnits(externIO[0], Number(currPoolFe?.precision))}
          onChange={(e) => handleInputChange(e)}
          className={cn(
            "px-4 py-3 text-sm font-semibold text-blackmail border-solid border-1 border-blackmail"
          )}
        />
        <IconButton
          onClick={() => {
            const diff = getTotalNew() - getTotalExisting()
            const val = diff > 0n ? externIO[0] + diff : 0n
            setExternIO([val, externIO[1]])
          }}
          icon={<SigmaIcon />}
          disabled={src === numberToHex(0)}
        >
          Calculate
        </IconButton>
      </div>

      <div className="rounded-md border-blackmail border-2 px-4 py-4 mt-4">
        <Label
          htmlFor=""
          className={cn("block text-base font-bold text-blackmail")}
        >
          Total: {formatValue(getTotalExisting(), currPoolFe?.precision)}{" "}
          {currPoolFe?.ticker}
        </Label>
      </div>

      <ExistingSelectionDialog
        className="absolute"
        isOpen={isSelectionDialogOpen}
        onOpenChange={setSelectionDialog}
        existingSlot={existingSlot}
      />
    </div>
  )
}

export default ExistingCommitments
