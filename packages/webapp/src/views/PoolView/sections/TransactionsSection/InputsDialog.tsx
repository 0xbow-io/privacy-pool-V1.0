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
    avilCommits,
    selectedKey,
    updateInCommit,
    updateSelectedKey,
    keyCommitHashes,
    selectedCommitmentIndexes
  } = useKeyStore((state) => state)

  const walletSelectOptions = keys.map((key) => key.publicAddr)

  const commitsSelectOptions = keyCommitHashes[selectedKey?.pKey || "0x"]
    .map((hash, index) => ({ hash, index }))
    .filter((_, index) => index !== selectedCommitmentIndexes[targetInputIndex])

  const currInCommit: string =
    inCommits[targetInputIndex] === ""
      ? "0x"
      : `0x${inCommits[targetInputIndex].substring(0, 14)}....${inCommits[
          targetInputIndex
        ].substring(54)}`

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
                const shortenedHash = `0x${publicAddr.substring(0, 14)}....${publicAddr.substring(54)}`
                return (
                  <SelectItem key={index} value={publicAddr}>
                    {shortenedHash}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div>Commitment</div>
        <div className="flex-auto">
          <Select
            value={currInCommit}
            onValueChange={(value) => {
              const { hash, commitIndex } = JSON.parse(value)
              updateInCommit(targetInputIndex, hash, commitIndex)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">{currInCommit}</SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {commitsSelectOptions.map((commit, index) => {
                const { hash, index: commitIndex } = commit
                const shortenedHash = `0x${hash.substring(0, 14)}....${hash.substring(54)}`
                return (
                  <SelectItem
                    key={index}
                    value={JSON.stringify({ hash, commitIndex })}
                  >
                    {shortenedHash}
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
