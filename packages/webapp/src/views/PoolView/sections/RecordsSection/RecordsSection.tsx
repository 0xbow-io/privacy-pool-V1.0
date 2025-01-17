import React, { useEffect, useState } from "react"
import { useBoundStore } from "@/stores"
import { type TCommitment } from "@privacy-pool-v1/domainobjs/ts"
import RecordsTable from "@/components/RecordsTable/RecordsTable.tsx"
import { LoaderIcon } from "@/views/PoolView/sections/ComputeSection/steps/styled.ts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card.tsx"

export const RecordsSection = () => {
  const { poolToMembershipProofs, isSyncing, privacyKeys } = useBoundStore(
    ({ poolToMembershipProofs, isSyncing, privacyKeys }) => ({
      poolToMembershipProofs,
      isSyncing,
      privacyKeys
    })
  )

  const [keyToCommits, setKeyToCommits] = useState<{
    [key: string]: { [hash: string]: TCommitment.MembershipProofJSON }
  }>({})

  useEffect(() => {
    const result: {
      [key: string]: { [hash: string]: TCommitment.MembershipProofJSON }
    } = {}

    poolToMembershipProofs.forEach((value) => {
      value.forEach((proofArray, index) => {
        const publicKey = privacyKeys[index].publicAddr
        result[publicKey] = proofArray.reduce(
          (acc, proof) => {
            acc[proof.public.hash.hex] = proof
            return acc
          },
          {} as { [hash: string]: TCommitment.MembershipProofJSON }
        )
      })
    })

    setKeyToCommits(result)
  }, [poolToMembershipProofs, privacyKeys])

  return (
    <div>
      {isSyncing ? (
        <div className="flex flex-col items-center min-h-40 justify-center w-full h-full">
          <LoaderIcon />
          <p className="mt-2 text-sm">Syncing....</p>
        </div>
      ) : (
        <Card className="w-full">
          <CardHeader className="">
            <CardTitle>Pool Records</CardTitle>
          </CardHeader>
          <CardContent>
            <RecordsTable keyToCommits={keyToCommits} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
