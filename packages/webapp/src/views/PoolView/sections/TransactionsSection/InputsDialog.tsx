import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx"
import React from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"

type InputsDialogProps = {
  className: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  targetInputIndex: number
}

export const InputsDialog = ({ className, isOpen, onOpenChange, targetInputIndex }: InputsDialogProps ) => {
  const {inCommits, updateInCommit, getAvailableInputOptions } = useKeyStore((state) => state)
  const [inputSheetIsOpen, setInputSheetOpen] = React.useState(false)

  const currInCommit: string =
    inCommits[targetInputIndex] === ""
      ? "0x"
      : `0x${inCommits[targetInputIndex].substring(0, 14)}....${inCommits[
        targetInputIndex
        ].substring(54)}`


  return (
    <Dialog open={inputSheetIsOpen} onOpenChange={setInputSheetOpen}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Choose an Input Commitment</DialogTitle>
          <DialogDescription>
            Select an existing unused commitment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-auto">
          <Select
            value={currInCommit}
            onValueChange={(value) => updateInCommit(targetInputIndex, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">{currInCommit}</SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {getAvailableInputOptions(targetInputIndex).map((hash) => {
                const _hash_ = `0x${hash.substring(0, 14)}....${hash.substring(54)}`
                return (
                  <SelectItem key={hash} value={hash}>
                    {_hash_}
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