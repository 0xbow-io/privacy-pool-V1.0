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
    inCommits,
    keys,
    availCommits,
    selectedKey,
    updateInCommit,
    updateSelectedKey,
    keyCommitRoots,
    selectedCommitmentIndexes,
    getInCommitRoot
  } = useKeyStore((state) => state)

  const walletSelectOptions = keys.map((key) => key.publicAddr)

  const commitsSelectOptions = keyCommitRoots[selectedKey?.pKey || "0x"]
    .map((root, index) => ({ root, index }))
    .filter((_, index) => index !== selectedCommitmentIndexes[targetInputIndex])

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
            value={selectedKey?.publicAddr}
            onValueChange={(value) => {
              updateSelectedKey(
                keys.find((key) => key.publicAddr === value)!.pKey
              )
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">
                {selectedKey?.publicAddr}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {walletSelectOptions.map((publicAddr, index) => {
                const shortenedroot = `0x${publicAddr.substring(0, 14)}....${publicAddr.substring(54)}`
                return (
                  <SelectItem key={index} value={publicAddr}>
                    {shortenedroot}
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
                const shortenedroot = `0x${root.substring(0, 14)}....${root.substring(54)}`
                return (
                  <SelectItem
                    key={index}
                    value={JSON.stringify({ root, commitIndex })}
                  >
                    {shortenedroot}
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
