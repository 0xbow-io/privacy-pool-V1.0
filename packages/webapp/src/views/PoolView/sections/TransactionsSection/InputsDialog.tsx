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
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import { numberToHex } from "viem"

type InputsDialogProps = {
  className: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  targetInputIndex: number
}

export const InputsDialog = ({
  className,
  isOpen,
  onOpenChange,
  targetInputIndex
}: InputsDialogProps) => {
  const {
    keys,
    selectedKey,
    updateInCommit,
    updateSelectedKey,
    keyCommitRoots,
    selectedCommitmentIndexes,
    getInCommitRoot
  } = useKeyStore((state) => state)

  const walletSelectOptions = keys.map((key) => key.publicAddr)
  console.log('kcr', keyCommitRoots)

  console.log('crash:', selectedKey, selectedKey?.pKey, keyCommitRoots[selectedKey?.pKey])

  const commitsSelectOptions = selectedKey ? keyCommitRoots[selectedKey.pKey]
    .map((root, index) => ({ root, index }))
    .filter((_, index) => index !== selectedCommitmentIndexes[targetInputIndex]) : []

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Choose an Input Commitment</DialogTitle>
          <DialogDescription>
            Select any available wallet and an existing unused commitment from
            that wallet.
          </DialogDescription>
        </DialogHeader>

        <div>Wallet:</div>
        <div className="flex-auto">
          <Select
            value={selectedKey?.publicAddr || "0x..."}
            onValueChange={(value) => {
              updateSelectedKey(
                keys.find((key) => key.publicAddr === value)!.pKey
              )
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">
                {selectedKey?.publicAddr || "Select wallet"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {walletSelectOptions.map((publicAddr, index) => {
                const shortenedRoot = `${publicAddr.substring(0, 14)}....${publicAddr.substring(54)}`
                return (
                  <SelectItem key={index} value={publicAddr}>
                    {shortenedRoot}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div>Commitment</div>
        <div className="flex-auto">
          <Select
            value={getInCommitRoot(targetInputIndex)}
            onValueChange={(value) => {
              const { root, commitIndex } = JSON.parse(value)
              updateInCommit(targetInputIndex, root, commitIndex)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">
                {getInCommitRoot(targetInputIndex)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {commitsSelectOptions.map((commit, index) => {
                const { root, index: commitIndex } = commit
                const shortenedRoot = `${root.substring(0, 14)}....${root.substring(54)}`
                return (
                  <SelectItem
                    key={index}
                    value={JSON.stringify({ root, commitIndex })}
                  >
                    {shortenedRoot}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  )
}
