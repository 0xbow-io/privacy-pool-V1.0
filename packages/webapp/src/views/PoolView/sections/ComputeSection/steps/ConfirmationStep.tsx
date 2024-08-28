import { useGlobalStore } from "@/stores/global-store.ts"
import { PrivacyPools } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { formatUnits, numberToHex } from "viem"
import {
  CreateNewCommitment,
  type Commitment
} from "@privacy-pool-v1/domainobjs/ts"
import { useEffect } from "react"
import type { CommonProps } from "./types"

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
    keys,
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
        <h2 className="text-lg font-bold">Existing Commitments</h2>
        {existing.map((commitment, idx) => (
          <div key={idx} className="my-2">
            <h3 className="text-md font-bold">Commitment {idx + 1}</h3>
            <p>CommitmentRoot: {numberToHex(commitment.commitmentRoot)}</p>
            <p>NullRoot: {numberToHex(commitment.nullRoot)}</p>
            <p>Binded To: {keys[idx]}</p>
            <p>
              Value: {formatValue(commitment.asTuple()[0])} {fe?.ticker}
            </p>
          </div>
        ))}
      </div>
      <div className="w-full my-4">
        <h2 className="text-lg font-bold">External IO</h2>
        <p>
          Input Value: {formatValue(externIO[0])} {fe?.ticker}
        </p>
        <p>Input Source: {src}</p>
        <p>
          Output Value: {formatValue(externIO[1])} {fe?.ticker}
        </p>
        <p>Output Sink: {sink}</p>
      </div>
      <div className="w-full my-4">
        <h2 className="text-lg font-bold">Value sum for New Commitments</h2>
        <p>
          {formatValue(sumNewValues)} {fe?.ticker}
        </p>
      </div>
      <div className="w-full my-4">
        <h2 className="text-lg font-bold">New Commitments</h2>
        {_new.map((commitment, idx) => (
          <div key={idx} className="my-2">
            <h3 className="text-md font-bold">Commitment {idx + 1}</h3>
            <p>CommitmentRoot: {numberToHex(commitment.commitmentRoot)}</p>
            <p>NullRoot: {numberToHex(commitment.nullRoot)}</p>
            <p>Binded To: {keys[idx + 2]}</p>
            <p>
              Value: {formatValue(commitment.asTuple()[0])} {fe?.ticker}
            </p>
          </div>
        ))}
      </div>
      <div className="w-full my-4">
        <h2 className="text-lg font-bold">Commitment Fee</h2>
        <p>Fee Collector ID: {feeCollectorID}</p>
        <p>
          Fee Amount: {formatValue(feeAmt)} {fe?.ticker}
        </p>
        <p>Fee Collector: {feeCollector}</p>
      </div>
      <h1 className="text-2xl font-bold">
        Proof Generated: {!isGeneratingProof && proof ? "Yes" : "No"}{" "}
      </h1>
      <h1 className="text-2xl font-bold">
        Proof Verified: {!isGeneratingProof && proof?.verified ? "Yes" : "No"}{" "}
      </h1>
    </div>
  )
}

export default ConfirmationStep
