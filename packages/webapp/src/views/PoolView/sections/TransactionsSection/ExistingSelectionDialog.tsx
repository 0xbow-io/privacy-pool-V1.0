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
import React, { useEffect, useState } from "react"
import { useGlobalStore } from "@/stores/global-store.ts"
import { formatUnits, numberToHex, type Hex } from "viem"
import {
  PrivacyKey,
  type Commitment,
  type TCommitment
} from "@privacy-pool-v1/domainobjs/ts"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { BinaryIcon, SigmaIcon } from "lucide-react"
import IconButton from "@/components/IconButton/IconButton"
type SelectionDialogProps = {
  className: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  existingSlot: number
}

export const ExistingSelectionDialog = ({
  className,
  isOpen,
  onOpenChange,
  existingSlot
}: SelectionDialogProps) => {
  const {
    privKeys,
    request,
    commitments,
    selectExisting,
    currPoolID,
    downloadMembershipProof
  } = useGlobalStore((state) => state)
  const poolCommmitments = commitments.get(currPoolID) || []
  const privacyKeys = privKeys.map((key) => PrivacyKey.from(key, 0n).asJSON)

  const fe = PrivacyPools.get(currPoolID)?.fieldElement

  const [targetKeyIndex, setTargetKeyIndex] = React.useState(0)

  const getAvailCommitments = (): Commitment[] =>
    poolCommmitments[targetKeyIndex] ?? []

  const shortForm = (str: Hex): string => {
    return `${str.substring(0, 14)}....${str.substring(54)}`
  }

  const formatValue = (val: bigint): string => {
    return formatUnits(val, Number(fe?.precision))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Select Available Commitment</DialogTitle>
          <DialogDescription>
            Select Privacy Key and an avaiable commitment from that Privacy Key.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-auto">
          <Label
            htmlFor=""
            className={cn("block mb-2 text-base font-bold text-blackmail")}
          >
            Select Privacy Key:
          </Label>
        </div>
        <div className="flex-auto">
          <Select
            value={shortForm(privacyKeys[targetKeyIndex].pubAddr)}
            onValueChange={(value) => {
              setTargetKeyIndex(
                privacyKeys.findIndex((key) => key.pubAddr === value)!
              )
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">
                {shortForm(privacyKeys[targetKeyIndex].pubAddr)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {privacyKeys.map((pK, index) => {
                return (
                  <SelectItem key={index} value={pK.pubAddr}>
                    {shortForm(pK.pubAddr)}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-auto">
          <Label
            htmlFor=""
            className={cn("block mb-2 text-base font-bold text-blackmail")}
          >
            Select Commitment:
          </Label>
        </div>

        <div className="flex-auto">
          <Select
            value={shortForm(
              numberToHex(request.existing[existingSlot].commitmentRoot)
            )}
            onValueChange={(value) => {
              selectExisting(targetKeyIndex, Number(value), existingSlot)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">
                {shortForm(
                  numberToHex(request.existing[existingSlot].commitmentRoot)
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {getAvailCommitments().map((commit, index) => {
                return (
                  <SelectItem key={index} value={index.toString()}>
                    {shortForm(numberToHex(commit.commitmentRoot))} (
                    {commit.asTuple()[0] !== 0n
                      ? `${formatValue(commit.asTuple()[0])} ${fe?.ticker}`
                      : "VOID"}
                    )
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-auto">
          <IconButton
            onClick={() => downloadMembershipProof(existingSlot)}
            icon={<BinaryIcon />}
            disabled={false}
          >
            Download Membership Proof
          </IconButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
