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
import React, { memo, useEffect, useState } from "react"
import { createWalletClient, http, numberToHex, publicActions } from "viem"
import { type Commitment, PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"
import { DEFAULT_CHAIN } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { cn } from "@/lib/utils.ts"
import { Label } from "@/components/ui/label.tsx"
import { BinaryIcon } from "lucide-react"
import IconButton from "@/components/IconButton/IconButton.tsx"
import { useBoundStore } from "@/stores"
import { formatValue, shortForm } from "@/utils"

type SelectionDialogProps = {
  className: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  existingSlot: number
}

const ExistingSelectionDialog = ({
  className,
  isOpen,
  onOpenChange,
  existingSlot
}: SelectionDialogProps) => {
  const {
    privKeys,
    commitments,
    existing,
    currPoolID,
    masterKey,
    masterKeyIndex,
    currPoolFe,
    selectExisting,
    downloadMembershipProof
  } = useBoundStore(
    ({
      privKeys,
      commitments,
      existing,
      selectExisting,
      masterKey,
      masterKeyIndex,
      currPoolFe,
      currPoolID,
      downloadMembershipProof
    }) => ({
      privKeys,
      currPoolFe,
      commitments,
      masterKey,
      masterKeyIndex,
      existing,
      selectExisting,
      currPoolID,
      downloadMembershipProof
    })
  )
  const poolCommitments = commitments.get(currPoolID) || []

  const [currentWalletBalance, setCurrentWalletBalance] = useState<
    bigint | null
  >(null)

  const getAvailCommitments = (): Commitment[] =>
    poolCommitments[masterKeyIndex] ?? []

  useEffect(() => {
    const updateBalance = async () => {
      const publicAddr = masterKey?.publicAddr
      const walletClient = createWalletClient({
        account: publicAddr,
        chain: DEFAULT_CHAIN, //todo: change for dynamic chain
        transport: http()
      }).extend(publicActions)

      const balance = await walletClient.getBalance({
        address: publicAddr || "0x"
      })
      return balance
    }

    const fetchBalance = async () => {
      const balance = await updateBalance()
      setCurrentWalletBalance(balance)
    }

    if (masterKeyIndex !== -1) {
      fetchBalance()
    }
  }, [masterKeyIndex, masterKey, privKeys])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Select Available Commitment</DialogTitle>
          <DialogDescription>
            Select an available commitment from your Master Key.
          </DialogDescription>
        </DialogHeader>

        <div>
          Wallet balance:{" "}
          {typeof currentWalletBalance === "bigint" &&
            `${parseFloat(Number(formatValue(currentWalletBalance, currPoolFe?.precision)).toFixed(8))} ${currPoolFe?.ticker}`}
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
              numberToHex(existing[existingSlot]?.commitmentRoot || 0)
            )}
            onValueChange={(value) => {
              selectExisting(masterKeyIndex, Number(value), existingSlot)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">
                {existing[existingSlot]?.commitmentRoot
                  ? shortForm(
                      numberToHex(existing[existingSlot]?.commitmentRoot)
                    )
                  : "Select commitment"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {getAvailCommitments().map((commit, index) => {
                return (
                  <SelectItem key={index} value={index.toString()}>
                    {shortForm(numberToHex(commit.commitmentRoot))} (
                    {commit.asTuple()[0] !== 0n
                      ? `${formatValue(commit.asTuple()[0], currPoolFe?.precision)} ${currPoolFe?.ticker}`
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

export default memo(ExistingSelectionDialog)
