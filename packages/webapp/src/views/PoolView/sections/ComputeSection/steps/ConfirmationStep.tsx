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
import { useBoundStore } from "@/stores"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion.tsx"

export const ConfirmationStep: React.FC<CommonProps> = ({
  setPrimaryButtonProps,
  setBackButtonProps,
  fe
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
    currPoolFe
  } = useBoundStore(
    ({
      isGeneratingProof,
      proof,
      src,
      sink,
      fee,
      feeCollector,
      feeCollectorID,
      externIO,
      newValues,
      existing,
      sumNewValues,
      currPoolID,
      keyIdx,
      privKeys,
      currPoolFe
    }) => {
      const pool = PrivacyPools.get(currPoolID)
      return {
        isGeneratingProof: isGeneratingProof,
        proof: proof,
        src: src,
        sink: sink,
        feeAmt: fee,
        feeCollector: feeCollector,
        feeCollectorID: feeCollectorID,
        externIO: externIO,
        _new: newValues.map((val, i) =>
          CreateNewCommitment({
            _pK: privKeys[keyIdx[i + 2]],
            // auto set nonce to 0n for now
            _nonce: 0n,
            _scope: pool ? pool.scope : 0n,
            _value: val
          })
        ) as [Commitment, Commitment],
        existing: existing,
        keys: keyIdx.map((idx) => privKeys[idx]),
        sumNewValues: sumNewValues,
        currPoolFe: currPoolFe
      }
    }
  )

  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({
        disabled: isGeneratingProof,
        text: isGeneratingProof ? "Generating proof" : "Confirm & Execute"
      })

    setBackButtonProps &&
      setBackButtonProps({
        disabled: isGeneratingProof,
        text: isGeneratingProof ? "Generating proof" : "Back"
      })
  }, [isGeneratingProof, setPrimaryButtonProps, setBackButtonProps])

  const formatValue = (value: bigint) =>
    formatUnits(value, Number(currPoolFe?.precision))

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full text-left">
        <h1 className="text-2xl font-bold">Confirmation</h1>
        <p className="text-sm">Please review the details below:</p>
      </div>
      <Accordion type="single" collapsible className="w-full my-4">
        <AccordionItem value="existing">
          <AccordionTrigger className="text-sm mb-2 font-semibold text-blackmail">
            Existing commitments
          </AccordionTrigger>
          <AccordionContent>
            <CommitmentsInfo isInput={true} commits={existing} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="new">
          <AccordionTrigger className="text-sm mb-2 font-semibold text-blackmail">
            New commitments
          </AccordionTrigger>
          <AccordionContent>
            <CommitmentsInfo isInput={false} commits={_new} />
            <StatGrid
              stats={[
                {
                  header: "Value sum for New Commitments:",
                  value: `${formatValue(sumNewValues)} ${currPoolFe?.ticker}`
                }
              ]}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="io">
          <AccordionTrigger className="text-sm mb-2 font-semibold text-blackmail">
            External IO
          </AccordionTrigger>
          <AccordionContent>
            <StatGrid
              stats={[
                {
                  header: "Input Value",
                  value: formatValue(externIO[0]) + " " + currPoolFe?.ticker
                },
                { header: "Input Source", value: src },
                {
                  header: "Output Value",
                  value: formatValue(externIO[1]) + " " + currPoolFe?.ticker
                },
                { header: "Output Sink", value: sink }
              ]}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="fee">
          <AccordionTrigger className="text-sm mb-2 font-semibold text-blackmail">
            Commitment Fee
          </AccordionTrigger>
          <AccordionContent>
            <StatGrid
              stats={[
                { header: "Fee Collector ID", value: feeCollectorID },
                {
                  header: "Fee Amount",
                  value: formatValue(feeAmt) + " " + currPoolFe?.ticker
                },
                { header: "Fee Collector", value: feeCollector }
              ]}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="w-full my-4">
        {/*<h2 className="text-sm mb-2 font-semibold text-blackmail">*/}
        {/*  External IO:*/}
        {/*</h2>*/}
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
