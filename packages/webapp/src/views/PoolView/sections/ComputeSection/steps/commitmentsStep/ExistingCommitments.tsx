import { Button } from "@/components/ui/button.tsx"
import { cn } from "@/lib/utils.ts"
import { ChevronRightSquareIcon, ChevronsUpDown, SigmaIcon } from "lucide-react"
import React, {
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition
} from "react"
import { PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { formatUnits, numberToHex, type Hex, parseUnits } from "viem"
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
import { debounce, formatValue, shortForm } from "@/utils"
import { useBoundStore } from "@/stores"

type ExistingCommitmentsProps = {
  className: string
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
    currPoolID,
    getTotalNew,
    getTotalExisting,
    privKeys,
    updateSrc,
    setExternIO
  } = useBoundStore(
    ({
      externIO,
      existing,
      src,
      currPoolID,
      privKeys,
      getTotalNew,
      getTotalExisting,
      updateSrc,
      setExternIO
    }) => ({
      externIO,
      existing,
      src,
      currPoolID,
      privKeys,
      getTotalNew,
      getTotalExisting,
      updateSrc,
      setExternIO
    })
  )
  const privacyKeys = useMemo(
    () => privKeys.map((key) => PrivacyKey.from(key, 0n).asJSON),
    [privKeys]
  ) // TODO: this is reused across components and should be moved to a parent component to avoid recalc
  const fe = useMemo(
    () => PrivacyPools.get(currPoolID)?.fieldElement,
    [currPoolID]
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
          const newVal = parseUnits(value, Number(fe?.precision))
          if (newVal >= 0n && newVal !== externIO[0]) {
            setExternIO([newVal, externIO[1]])
          }
        })
      }
    },
    [externIO, fe?.precision, setExternIO, startTransition]
  )
  // useEffect(() => {}, [fe?.precision, setExternIO, externIO])

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
      {existing.map((c, index) => (
        <div
          key={`Existing:${index}`}
          className={cn(
            "rounded-md border px-4 py-2 my-2 text-sm items-center justify-between flex flex-row w-full",
            "bg-tropical-forest text-ghost-white min"
          )}
          style={{ minHeight: "4rem" }}
        >
          <div className="flex flex-col">
            <div>
              <h2 className="font-semibold">
                {shortForm(numberToHex(c.commitmentRoot))}
              </h2>
            </div>
            <div>
              <h2 className="font-semibold">
                ({formatValue(c.asTuple()[0], fe?.precision)} {fe?.ticker})
              </h2>
            </div>
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
              {privacyKeys.map((pK, index) => (
                <SelectItem key={index} value={pK.pubAddr}>
                  {shortForm(pK.pubAddr)}
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
          value={formatUnits(externIO[0], Number(fe?.precision))}
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
          Total: {formatValue(getTotalExisting(), fe?.precision)} {fe?.ticker}
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
