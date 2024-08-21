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
import { type Hex, numberToHex } from "viem"

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
    inCommits,
    getInCommitRoot
  } = useKeyStore((state) => state)

  const walletSelectOptions = keys.map((key) => key.publicAddr)
  console.log("kcr", keyCommitRoots)

  console.log(
    "crash:",
    selectedKey,
    selectedKey?.pKey,
    keyCommitRoots[selectedKey?.pKey]
  )

  const commitsSelectOptions = selectedKey
    ? keyCommitRoots[selectedKey.pKey].filter(
        (root: Hex) =>
          !inCommits.map((c) => numberToHex(c.commitmentRoot)).includes(root)
      )
    : []

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
              updateInCommit(targetInputIndex, value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">
                {getInCommitRoot(targetInputIndex)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {commitsSelectOptions.map((root, index) => {
                const shortenedRoot = `${root.substring(0, 14)}....${root.substring(54)}`
                return (
                  <SelectItem key={index} value={root}>
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
