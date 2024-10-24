import React, { useMemo, useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  type Row,
  useReactTable
} from "@tanstack/react-table"
import type { TCommitment } from "@privacy-pool-v1/domainobjs/ts"
import { Table, Td, Th, HashContainer } from "./styled"
import CommitmentDetails from "./CommitmentDetails"

const RecordsTable = ({
  keyToCommits
}: {
  keyToCommits: {
    [key: string]: { [hash: string]: TCommitment.MembershipProofJSON }
  }
}) => {
  const [selectedCommitment, setSelectedCommitment] = useState<{
    hash: string
    proof: TCommitment.MembershipProofJSON
  } | null>(null)

  const columns: ColumnDef<{
    publicKey: string
    details: { hash: string; proof: TCommitment.MembershipProofJSON }[]
  }>[] = useMemo(
    () => [
      {
        header: "Public Key",
        accessorKey: "publicKey"
      },
      {
        header: "Details",
        accessorKey: "details",
        cell: ({ row }) => (
          <span
            style={{
              width: "100%",
              display: "block",
              textAlign: "center",
              cursor: "pointer",
              color: "blue"
            }}
            onClick={row.getToggleExpandedHandler()}
          >
            {row.getIsExpanded() ? "Collapse" : "Expand"}
          </span>
        )
      }
    ],
    []
  )

  const data = useMemo(
    () =>
      Object.entries(keyToCommits).map(([publicKey, proofs]) => ({
        publicKey,
        details: Object.entries(proofs).map(([hash, proof]) => ({
          hash,
          proof
        }))
      })),
    [keyToCommits]
  )

  const renderRowSubComponent = ({
    row
  }: {
    row: Row<{
      publicKey: string
      details: { hash: string; proof: TCommitment.MembershipProofJSON }[]
    }>
  }) => {
    return (
      <>
        {row.original.details.map(({ hash, proof }, index) => (
          <HashContainer
            key={hash}
            index={index}
            onClick={() => setSelectedCommitment({ hash, proof })}
          >
            <strong>{hash}</strong>
          </HashContainer>
        ))}
      </>
    )
  }

  const table = useReactTable({
    data,
    columns,
    getRowCanExpand: (_row) => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel()
  })

  if (selectedCommitment) {
    return (
      <CommitmentDetails
        data={selectedCommitment.proof}
        onBack={() => setSelectedCommitment(null)}
      />
    )
  }

  return (
    <div>
      <Table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </Th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <React.Fragment key={row.id}>
              <tr
                style={{
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff"
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <Td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </tr>
              {row.getIsExpanded() && (
                <tr>
                  <td colSpan={columns.length}>
                    {renderRowSubComponent({ row })}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default RecordsTable
