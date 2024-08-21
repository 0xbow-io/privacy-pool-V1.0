import React from "react"
import StatGrid from "@/components/ASPStat/StatGrid.tsx"
import { CommitmentsInfo } from "@/components/CommitmentsInfo.tsx"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import type {
  ASP,
  Stat
} from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import { formatEther, parseEther, numberToHex } from "viem"

type ConfirmationStepProps = {
  selectedASP: ASP
  inputWallet: string
}

export const ConfirmationStep = ({
  selectedASP,
  inputWallet
}: ConfirmationStepProps) => {
  const {
    inCommits,
    outValues,
    outTotalValue,
    outputAmountReasons,
    inTotalValue,
    currPool,
    publicValue,
    isInputValid
  } = useKeyStore((state) => state)

  const { name, fee, feeCollector } = selectedASP

  const stats: Stat[] = [
    { header: "Selected ASP", value: name as string },
    { header: "Input Wallet", value: inputWallet },
    { header: "Estimated Fee", value: formatEther(fee as bigint) },
    { header: "Fee Collector Address", value: feeCollector },
    {
      header: "Extra amount",
      value: formatEther(BigInt(publicValue.toString()))
    }
  ]

  const { reason } = isInputValid()

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full text-left">
        <h1 className="text-2xl font-bold">Confirmation</h1>
        <p className="text-sm">Please review the details below:</p>
      </div>
      <div className="w-full my-4">
        <StatGrid stats={stats} />
      </div>
      <h2 className="text-lg mt-2 text-left font-bold ">Commitments:</h2>
      <div className="w-full mt-4 flex flex-col laptop:flex-row justify-between">
        <CommitmentsInfo
          isInput
          total={inTotalValue}
          ticker={currPool.fieldElement.ticker}
          reason={reason}
          inCommits={inCommits.map((commit) =>
            numberToHex(commit.commitmentRoot)
          )}
        />
        <CommitmentsInfo
          isInput={false}
          total={outTotalValue}
          ticker={currPool.fieldElement.ticker}
          reason={outputAmountReasons}
          outValues={outValues}
        />
      </div>
    </div>
  )
}

export default ConfirmationStep
