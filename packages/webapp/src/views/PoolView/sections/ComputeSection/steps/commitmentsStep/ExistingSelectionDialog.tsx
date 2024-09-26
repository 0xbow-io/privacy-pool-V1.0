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
import React, { memo, useEffect, useMemo, useState } from "react"
import {
  formatUnits,
  numberToHex,
  type Hex,
  createWalletClient,
  http,
  publicActions,
  formatEther
} from "viem"
import { PrivacyKey, type Commitment } from "@privacy-pool-v1/domainobjs/ts"
import {
  DEFAULT_CHAIN,
  PrivacyPools
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { cn } from "@/lib/utils.ts"
import { Label } from "@/components/ui/label.tsx"
import { BinaryIcon, SigmaIcon } from "lucide-react"
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
    selectExisting,
    currPoolID,
    downloadMembershipProof
  } = useBoundStore(
    ({
      privKeys,
      commitments,
      existing,
      selectExisting,
      currPoolID,
      downloadMembershipProof
    }) => ({
      privKeys,
      commitments,
      existing,
      selectExisting,
      currPoolID,
      downloadMembershipProof
    })
  )
  const poolCommitments = commitments.get(currPoolID) || []

  const privacyKeys = useMemo(
    () => privKeys.map((key) => PrivacyKey.from(key, 0n).asJSON),
    [privKeys]
  )
  const fe = useMemo(
    () => PrivacyPools.get(currPoolID)?.fieldElement,
    [currPoolID]
  )

  const [targetKeyIndex, setTargetKeyIndex] = useState(-1)
  const [currentWalletBalance, setCurrentWalletBalance] = useState<
    bigint | null
  >(null)

  const getAvailCommitments = (): Commitment[] =>
    poolCommitments[targetKeyIndex] ?? []

  console.log('values', getAvailCommitments().map(c => console.log(c.asTuple()[0], formatValue(c.asTuple()[0], fe?.precision))))

  useEffect(() => {
    const updateBalance = async () => {
      const publicAddr = new PrivacyKey(privKeys[targetKeyIndex], 0n).publicAddr
      const walletClient = createWalletClient({
        account: publicAddr,
        chain: DEFAULT_CHAIN, //todo: change for dynamic chain
        transport: http()
      }).extend(publicActions)

      const balance = await walletClient.getBalance({ address: publicAddr })
      return balance
    }

    const fetchBalance = async () => {
      const balance = await updateBalance()
      setCurrentWalletBalance(balance)
    }

    if (targetKeyIndex !== -1) {
      fetchBalance()
    }
  }, [targetKeyIndex, privKeys])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Select Available Commitment</DialogTitle>
          <DialogDescription>
            Select Privacy Key and an available commitment from that Privacy
            Key.
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
            value={
              targetKeyIndex === -1
                ? ""
                : shortForm(privacyKeys[targetKeyIndex].pubAddr)
            }
            onValueChange={(value) => {
              setTargetKeyIndex(
                privacyKeys.findIndex((key) => key.pubAddr === value)!
              )
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Wallet">
                {targetKeyIndex === -1
                  ? ""
                  : shortForm(privacyKeys[targetKeyIndex].pubAddr)}
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
        {targetKeyIndex !== -1 && (
          <div>
            Wallet balance:{" "}
            {currentWalletBalance &&
              `${Number(formatValue(currentWalletBalance, fe?.precision)).toFixed(8)} ${fe?.ticker}`}
          </div>
        )}

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
              selectExisting(targetKeyIndex, Number(value), existingSlot)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select">
                {shortForm(
                  numberToHex(existing[existingSlot]?.commitmentRoot || 0)
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {getAvailCommitments().map((commit, index) => {
                return (
                  <SelectItem key={index} value={index.toString()}>
                    {shortForm(numberToHex(commit.commitmentRoot))} (
                    {commit.asTuple()[0] !== 0n
                      ? `${formatValue(commit.asTuple()[0], fe?.precision)} ${fe?.ticker}`
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
