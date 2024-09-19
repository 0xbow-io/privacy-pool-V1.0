import React, { useState } from "react"
import type { TCommitment } from "@privacy-pool-v1/domainobjs/ts"
import {
  Container,
  ExpandButton,
  GridContainer,
  Key,
  StripedCell,
  StripedRow,
  StripedTable,
  Value,
  BackButton,
  ExpandedContent,
  RowContent
} from "./styled"
import { ChevronDown, ChevronRight } from "lucide-react"

const CommitmentDetails = ({
  data,
  onBack
}: {
  data: TCommitment.MembershipProofJSON
  onBack: () => void
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const renderRow = (
    key: string,
    label: string,
    value: string,
    expandedContent: React.ReactNode
  ) => (
    <StripedRow key={key} onClick={() => toggleRow(key)}>
      <StripedCell>
        <Key>{label}</Key>
      </StripedCell>
      <StripedCell>
        <RowContent>
          {!expandedRows.has(key) ? <Value>{value}</Value> : <div></div>}
          <ExpandButton>
            {expandedRows.has(key) ? <ChevronDown /> : <ChevronRight />}
          </ExpandButton>
        </RowContent>
        {expandedRows.has(key) && (
          <ExpandedContent>{expandedContent}</ExpandedContent>
        )}
      </StripedCell>
    </StripedRow>
  )

  return (
    <Container>
      <BackButton onClick={onBack}>← Back</BackButton>
      <StripedTable>
        {renderRow(
          "scope",
          "Scope",
          data.public.scope.hex,
          <GridContainer>
            <Value>Raw: {data.public.scope.raw}</Value>
            <Value>Hex: {data.public.scope.hex}</Value>
          </GridContainer>
        )}
        {renderRow(
          "cipher",
          "Cipher",
          "Show more",
          <GridContainer>
            {data.public.cipher.map((value, index) => (
              <div key={index}>
                <Key>{index + 1}:</Key>
                <Value>{value}</Value>
              </div>
            ))}
          </GridContainer>
        )}
        {renderRow(
          "saltPk",
          "SaltPk",
          data.public.saltPk[1],
          <GridContainer>
            <Value>Raw: {data.public.saltPk[0]}</Value>
            <Value>Hex: {data.public.saltPk[1]}</Value>
          </GridContainer>
        )}
        {renderRow(
          "hash",
          "Hash",
          data.public.hash.hex,
          <GridContainer>
            <Value>Raw: {data.public.hash.raw}</Value>
            <Value>Hex: {data.public.hash.hex}</Value>
          </GridContainer>
        )}
        {renderRow(
          "stateRoot",
          "StateRoot",
          data.private.inclusion.stateRoot.hex,
          <GridContainer>
            <Value>Raw: {data.private.inclusion.stateRoot.raw}</Value>
            <Value>Hex: {data.private.inclusion.stateRoot.hex}</Value>
          </GridContainer>
        )}
        {renderRow(
          "inclusion",
          "Inclusion",
          "Show more",
          <GridContainer>
            <div>
              <Key>LeafIndex:</Key>
              <Value>{data.private.inclusion.leafIndex}</Value>
            </div>
            <div>
              <Key>Index:</Key>
              <Value>{data.private.inclusion.index}</Value>
            </div>
            <div>
              <Key>StateDepth:</Key>
              <Value>{data.private.inclusion.stateDepth}</Value>
            </div>
            <div>
              <Key>Nonce:</Key>
              <Value>{data.private.nonce}</Value>
            </div>
          </GridContainer>
        )}
        {renderRow(
          "siblings",
          "Siblings",
          "Show more",
          <GridContainer>
            {data.private.inclusion.siblings.map((value, index) => (
              <div key={index}>
                <Key>{index + 1}:</Key>
                <Value>{value}</Value>
              </div>
            ))}
          </GridContainer>
        )}
        {renderRow(
          "pkScalar",
          "PkScalar",
          data.private.pkScalar.hex,
          <GridContainer>
            <Value>Raw: {data.private.pkScalar.raw}</Value>
            <Value>Hex: {data.private.pkScalar.hex}</Value>
          </GridContainer>
        )}
        {renderRow(
          "root",
          "Root",
          data.private.root.hex,
          <GridContainer>
            <Value>Raw: {data.private.root.raw}</Value>
            <Value>Hex: {data.private.root.hex}</Value>
          </GridContainer>
        )}
        {renderRow(
          "nullRoot",
          "NullRoot",
          data.private.null.hex,
          <GridContainer>
            <Value>Raw: {data.private.null.raw}</Value>
            <Value>Hex: {data.private.null.hex}</Value>
          </GridContainer>
        )}
      </StripedTable>
    </Container>
  )
}

export default CommitmentDetails
