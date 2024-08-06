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
import {
  ExistingPrivacyPools,
  getOnChainPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { createPublicClient, http } from "viem"
import { DEFAULT_RPC_URL, DEFAULT_TARGET_CHAIN } from "@/utils/consts.ts"
import { sepolia } from "viem/chains"

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
    avilCommits,
    selectedKey,
    updateInCommit,
    selectedCommitmentIndexes
  } = useKeyStore((state) => state)

  const [keyCommitHashes, setKeyCommitHashes] = useState<string[]>([])

  useEffect(() => {
    const getCommitHashes = async () => {
      const poolInstance = ExistingPrivacyPools.get(sepolia) //TODO: dynamic pool selection
      console.log("filter", selectedKey, selectedKey?.asJSON)
      if (!poolInstance || !selectedKey) {
        return
      }

      const privacyPool = getOnChainPrivacyPool(
        poolInstance[0],
        createPublicClient({
          chain: DEFAULT_TARGET_CHAIN,
          transport: DEFAULT_RPC_URL !== "" ? http(DEFAULT_RPC_URL) : http()
        })
      )
      const synced = await privacyPool.sync()

      if (!synced) {
        return
      }
      await privacyPool.decryptCiphers([selectedKey])
      const keyCommits = await selectedKey?.recoverCommitments(privacyPool)
      if (!keyCommits) {
        return
      }
      const commitHashes = keyCommits.map((commit) =>
        commit.hash().toString(16)
      )

      setKeyCommitHashes(commitHashes)
    }
    getCommitHashes()
  }, [])

  const selectOptions = avilCommits
    .map((c, index) => ({ hash: c.hash().toString(16), index }))
    .filter(
      ({ hash }, index) =>
        !selectedCommitmentIndexes.includes(index) &&
        keyCommitHashes.includes(hash)
    )

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
            Select an existing unused commitment.
          </DialogDescription>
        </DialogHeader>

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
              {selectOptions.map((commit, index) => {
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
