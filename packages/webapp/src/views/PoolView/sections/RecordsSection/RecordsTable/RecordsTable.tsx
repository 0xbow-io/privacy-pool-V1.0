import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  type Row,
  useReactTable
} from "@tanstack/react-table"
import type { TCommitment } from "@privacy-pool-v1/domainobjs/ts"
import React, { useMemo } from "react"
import {
  Container,
  KeyValueContainer,
  Key,
  Value,
  Table,
  Th,
  Td,
  BorderlessTable,
  BorderlessTh,
  BorderlessTd,
  GridContainer,
  GridItem,
  CellWrapper
} from "./styled"

const RenderTypeA = ({
  data,
  header
}: {
  data: { [key: string]: string }
  header: string
}) => (
  <CellWrapper>
    <Key>{header}</Key>
    <BorderlessTable>
      <thead>
        <tr>
          {Object.keys(data).map((key) => (
            <BorderlessTh key={key}>{key}</BorderlessTh>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {Object.values(data).map((value, index) => (
            <BorderlessTd key={index}>{value}</BorderlessTd>
          ))}
        </tr>
      </tbody>
    </BorderlessTable>
  </CellWrapper>
)

const RenderTypeB = ({
  keyName,
  values
}: {
  keyName: string
  values: string[]
}) => (
  <CellWrapper>
    <Key>{keyName}</Key>
    <GridContainer>
      {values.map((value, index) => (
        <GridItem key={index}>
          <Key>{index + 1}:</Key>
          <Value>{value}</Value>
        </GridItem>
      ))}
    </GridContainer>
  </CellWrapper>
)

const RenderJSON = ({ data }: { data: TCommitment.MembershipProofJSON }) => (
  <Container>
    <RenderTypeA
      data={{ raw: data.public.scope.raw, hex: data.public.scope.hex }}
      header="Scope"
    />
    <RenderTypeB keyName="cipher" values={data.public.cipher} />
    <RenderTypeA
      data={{ raw: data.public.saltPk[0], hex: data.public.saltPk[1] }}
      header="SaltPk"
    />
    <RenderTypeA
      data={{ raw: data.public.hash.raw, hex: data.public.hash.hex }}
      header="Hash"
    />
    <RenderTypeA
      data={{
        raw: data.private.inclusion.stateRoot.raw,
        hex: data.private.inclusion.stateRoot.hex
      }}
      header="StateRoot"
    />
    <RenderTypeA
      data={{
        leafIndex: data.private.inclusion.leafIndex,
        index: data.private.inclusion.index,
        stateDepth: data.private.inclusion.stateDepth,
        nonce: data.private.nonce
      }}
      header=""
    />
    <RenderTypeB keyName="siblings" values={data.private.inclusion.siblings} />
    <RenderTypeA
      data={{ raw: data.private.pkScalar.raw, hex: data.private.pkScalar.hex }}
      header="PkScalar"
    />
    <RenderTypeA
      data={{ raw: data.private.root.raw, hex: data.private.root.hex }}
      header="Root"
    />
    <RenderTypeA
      data={{ raw: data.private.null.raw, hex: data.private.null.hex }}
      header="NullRoot"
    />
  </Container>
)

export const RecordsTable = ({
  keyToCommits
}: {
  keyToCommits: {
    [key: string]: { [hash: string]: TCommitment.MembershipProofJSON }
  }
}) => {
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
            style={{ cursor: "pointer", color: "blue" }}
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
      <div style={{ padding: "10px" }}>
        {row.original.details.map(({ hash, proof }) => (
          <div key={hash}>
            <strong>{hash}:</strong>
            <RenderJSON data={proof} />
          </div>
        ))}
      </div>
    )
  }

  const table = useReactTable({
    data,
    columns,
    getRowCanExpand: (_row) => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel()
  })

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
          {table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <tr>
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
