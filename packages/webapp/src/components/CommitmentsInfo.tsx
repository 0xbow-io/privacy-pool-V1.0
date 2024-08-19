import React from "react"
import BigNumber from "bignumber.js"

type CommitmentsInfoProps = {
  isInput: boolean
  total: BigNumber
  ticker: string
  reason: string | string[]
  inCommits?: string[]
  outValues?: number[]
}

export const CommitmentsInfo = ({
  isInput,
  inCommits,
  outValues,
  total,
  reason,
  ticker
}: CommitmentsInfoProps) => {
  return (
    <div className="mt-4 laptop:mt-0">
      <div className="flex items-center justify-between space-x-4">
        <h2 className="text-sm mb-2 font-semibold text-blackmail ">
          {isInput ? "Input" : "Output"} Commitments:
        </h2>
      </div>
      <div className="rounded-md border px-4 py-3 text-sm">
        <h2 className="font-semibold text-blackmail text-sm">
          {isInput ? "Total:" : "Expected total:"} {total.toString()} {ticker}{" "}
        </h2>
        <h2 className="font-semibold text-rust-effect text-sm">
          {reason.length ? reason[0] : reason}
        </h2>
      </div>
      {inCommits &&
        inCommits.map((c, index) => {
          const commitVal: string =
            c === "" ? "0x" : `0x${c.substring(0, 14)}....${c.substring(54)}`

          return (
            <div
              key={`commitment:${index}`}
              className="rounded-md border my-2 px-4 py-3 text-sm items-center justify-between flex flex-row w-full"
            >
              <h2 className="font-semibold text-blackmail ">
                Input ({index}): {commitVal}
              </h2>
            </div>
          )
        })}
      {outValues &&
        outValues.map((value, index) => {
          return (
            <div
              key={`split:${index}`}
              className="rounded-md border my-2 px-4 py-3 text-sm items-center justify-between flex flex-row w-full"
            >
              <h2 className="font-semibold text-blackmail ">
                Output ({index}): {value} {ticker}
              </h2>
            </div>
          )
        })}
    </div>
  )
}
