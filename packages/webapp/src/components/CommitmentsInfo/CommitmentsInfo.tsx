import React from "react"
import { numberToHex } from "viem"
import { formatValue } from "@/utils"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { CommitmentContainer, CommitmentDetail, Label, Value } from "./styled"
import { useBoundStore } from "@/stores"
import type { IOCommitments } from "@/stores/types.ts"
import { ShortenedVersion } from "@/components/ShortenedVersion/ShortenedVersion.tsx"

type CommitmentsInfoProps = {
  isInput: boolean
  commits: IOCommitments
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
        {/*<h2 className="text-sm mb-2 font-semibold text-blackmail ">*/}
        {/*  {isInput ? "Input" : "New"} Commitments:*/}
        {/*</h2>*/}
      </div>
      {commits &&
        commits.map((c, index) => {
          if (!c) return
          return (
            <CommitmentContainer key={`commitment:${index}`}>
              <CommitmentDetail>
                <Label>Commitment ({index}):</Label>
                <Value>
                  <ShortenedVersion>
                    {numberToHex(c.commitmentRoot)}
                  </ShortenedVersion>
                </Value>
              </CommitmentDetail>
              <CommitmentDetail>
                <Label>NullRoot:</Label>
                <Value>
                  <ShortenedVersion>{numberToHex(c.nullRoot)}</ShortenedVersion>
                </Value>
              </CommitmentDetail>
              <CommitmentDetail>
                <Label>Key:</Label>
                <Value>
                  <ShortenedVersion>{keys[index]}</ShortenedVersion>
                </Value>
              </CommitmentDetail>
              <CommitmentDetail>
                <Label>Value:</Label>
                <Value>
                  {formatValue(c.asTuple()[0], fe?.precision)} {fe?.ticker}
                </Value>
              </CommitmentDetail>
            </CommitmentContainer>
          )
        })}
    </div>
  )
}
