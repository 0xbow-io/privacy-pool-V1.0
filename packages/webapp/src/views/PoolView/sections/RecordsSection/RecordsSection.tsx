import React, { useEffect, useState, useMemo } from "react"
import { useBoundStore } from "@/stores"
import { Loader } from "@/components/Loader/Loader.tsx"
import { JSONTree } from "react-json-tree"
import { PrivacyKey, type TCommitment } from "@privacy-pool-v1/domainobjs/ts"
import {
  useReactTable,
  type ColumnDef,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type Row
} from "@tanstack/react-table"
import { RecordsTable } from "@/views/PoolView/sections/RecordsSection/RecordsTable/RecordsTable.tsx"

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

  const theme = {
    base00: "transparent", // Background color
    base07: "" // Text color
    // Add other color properties as needed
  }

  return (
    <div>
      {isSyncing ? (
        <Loader loading={true} />
      ) : (
        <div>
          <h2>JSON Commitments Tree</h2>
          <JSONTree
            data={keyToCommits}
            hideRoot
            getItemString={(itemType) => <span>{itemType}</span>}
            theme={theme}
          />
          <RecordsTable keyToCommits={keyToCommits} />
        </div>
      )}
    </div>
  )
}
