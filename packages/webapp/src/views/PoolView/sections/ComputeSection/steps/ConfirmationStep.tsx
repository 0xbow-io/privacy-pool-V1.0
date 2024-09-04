import { useGlobalStore } from "@/stores/global-store.ts"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { formatUnits, numberToHex } from "viem"
import {
  CreateNewCommitment,
  type Commitment
} from "@privacy-pool-v1/domainobjs/ts"
import React, { useEffect } from "react"
import type { CommonProps } from "./types"
import { CommitmentsInfo } from "@/components/CommitmentsInfo/CommitmentsInfo.tsx"
import StatGrid from "@/components/ASPStat/StatGrid.tsx"

export const ConfirmationStep: React.FC<CommonProps> = ({
  setPrimaryButtonProps,
  setbackButtonProps
}) => {
  const {
    isGeneratingProof,
    proof,
    src,
    sink,
    feeAmt,
    feeCollector,
    feeCollectorID,
    externIO,
    _new,
    existing,
    sumNewValues,
    fe
  } = useGlobalStore((state) => {
    const pool = PrivacyPools.get(state.currPoolID)
    return {
      isGeneratingProof: state.isGeneratingProof,
      proof: state.proof,
      src: state.request.src,
      sink: state.request.sink,
      feeAmt: state.request.fee,
      feeCollector: state.request.feeCollector,
      feeCollectorID: state.request.feeCollectorID,
      externIO: state.request.externIO,
      _new: state.request.newValues.map((val, i) =>
        CreateNewCommitment({
          _pK: state.privKeys[state.request.keyIdx[i + 2]],
          // auto set nonce to 0n for now
          _nonce: 0n,
          _scope: pool ? pool.scope : 0n,
          _value: val
        })
      ) as [Commitment, Commitment],
      existing: state.request.existing,
      keys: state.request.keyIdx.map((idx) => state.privKeys[idx]),
      sumNewValues: state.request.sumNewValues,
      fe: PrivacyPools.get(state.currPoolID)?.fieldElement
    }
  })

  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({
        disabled: isGeneratingProof,
        text: isGeneratingProof ? "Generating proof" : "Confirm & Execute"
      })

    setbackButtonProps &&
      setbackButtonProps({
        disabled: isGeneratingProof,
        text: isGeneratingProof ? "Generating proof" : "Back"
      })
  }, [isGeneratingProof, setPrimaryButtonProps, setbackButtonProps])

  const formatValue = (value: bigint) =>
    formatUnits(value, Number(fe?.precision))

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full text-left">
        <h1 className="text-2xl font-bold">Confirmation</h1>
        <p className="text-sm">Please review the details below:</p>
      </div>
      <div className="w-full my-4">
        <CommitmentsInfo isInput={true} commits={existing} />
      </div>
      <div className="w-full my-4">
        <h2 className="text-sm mb-2 font-semibold text-blackmail">
          External IO:
        </h2>
        <StatGrid
          stats={[
            {
              header: "Input Value",
              value: formatValue(externIO[0]) + " " + fe?.ticker
            },
            { header: "Input Source", value: src },
            {
              header: "Output Value",
              value: formatValue(externIO[1]) + " " + fe?.ticker
            },
            { header: "Output Sink", value: sink }
          ]}
        />
      </div>
      <div className="w-full my-4">
        <div className="text-sm mb-2 font-semibold text-blackmail">
          <CommitmentsInfo isInput={false} commits={_new} />
        </div>
      </div>
      <div className="w-full my-4">
        <h2 className="text-sm mb-2 font-semibold text-blackmail">
          Value sum for New Commitments:
        </h2>
        <p>
          {formatValue(sumNewValues)} {fe?.ticker}
        </p>
      </div>
      <div className="w-full my-4">
        <h2 className="text-sm mb-2 font-semibold text-blackmail">
          Commitment Fee:
        </h2>
        <StatGrid
          stats={[
            { header: "Fee Collector ID", value: feeCollectorID },
            {
              header: "Fee Amount",
              value: formatValue(feeAmt) + " " + fe?.ticker
            },
            { header: "Fee Collector", value: feeCollector }
          ]}
        />
      </div>
      <div className="w-full my-4">
        <h2 className="text-sm mb-2 font-semibold text-blackmail">
          External IO:
        </h2>
        <StatGrid
          stats={[
            { header: "Proof Generated", value: !isGeneratingProof && !!proof },
            {
              header: "Proof Verified",
              value: !isGeneratingProof && !!proof?.verified
            }
          ]}
        />
      </div>
    </div>
  )
}

export default ConfirmationStep
