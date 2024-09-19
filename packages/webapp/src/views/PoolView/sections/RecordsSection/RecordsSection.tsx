import React, { useEffect, useState } from "react"
import { useBoundStore } from "@/stores"
import { Loader } from "@/components/Loader/Loader.tsx"
import { JSONTree } from "react-json-tree"
import { PrivacyKey, type TCommitment } from "@privacy-pool-v1/domainobjs/ts"
import RecordsTable from "@/components/RecordsTable/RecordsTable.tsx"

export const RecordsSection = () => {
  const { poolToMembershipProofs, isSyncing, privKeys } = useBoundStore(
    ({ poolToMembershipProofs, isSyncing, privKeys }) => ({
      poolToMembershipProofs,
      isSyncing,
      privKeys
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
        const publicKey = PrivacyKey.from(privKeys[index], 0n).publicAddr
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
  }, [poolToMembershipProofs, privKeys])

  return (
    <div>
      {isSyncing ? (
        <Loader loading={true} />
      ) : (
        <div>
          <RecordsTable keyToCommits={keyToCommits} />
        </div>
      )}
    </div>
  )
}
