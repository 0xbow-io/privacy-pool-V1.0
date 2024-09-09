import React from "react"
import { formatEther, numberToHex } from "viem"
import type { ICommitment } from "@privacy-pool-v1/domainobjs/ts"
import { formatValue } from "@/utils"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { CommitmentContainer, CommitmentDetail, Label, Value } from "./styled"
import { useBoundStore } from "@/stores"

type CommitmentsInfoProps = {
  isInput: boolean
  commits: ICommitment.CommitmentI[]
}

export const CommitmentsInfo = ({ isInput, commits }: CommitmentsInfoProps) => {
  const { keys, fe } = useBoundStore(({ keyIdx, currPoolID, privKeys }) => {
    return {
      keys: keyIdx.map((idx) => privKeys[idx]),
      fe: PrivacyPools.get(currPoolID)?.fieldElement
    }
  })

  return (
    <div className="mt-4 laptop:mt-0">
      <div className="flex items-center justify-between space-x-4">
        <h2 className="text-sm mb-2 font-semibold text-blackmail ">
          {isInput ? "Input" : "New"} Commitments:
        </h2>
      </div>
      {commits &&
        commits.map((c, index) => {
          return (
            <CommitmentContainer key={`commitment:${index}`}>
              <CommitmentDetail>
                <Label>Commitment ({index}):</Label>
                <Value>{numberToHex(c.commitmentRoot)}</Value>
              </CommitmentDetail>
              <CommitmentDetail>
                <Label>NullRoot:</Label>
                <Value>{numberToHex(c.nullRoot)}</Value>
              </CommitmentDetail>
              <CommitmentDetail>
                <Label>Key:</Label>
                <Value>{keys[index]}</Value>
              </CommitmentDetail>
              <CommitmentDetail>
                <Label>Value:</Label>
                <Value>
                  {formatValue(c.asTuple()[0])} {fe?.ticker}
                </Value>
              </CommitmentDetail>
            </CommitmentContainer>
          )
        })}
    </div>
  )
}
