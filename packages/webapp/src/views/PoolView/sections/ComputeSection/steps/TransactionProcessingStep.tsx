import React, { useEffect } from "react"
import { Loader } from "@/components/Loader/Loader.tsx"
import {
  type CommonProps,
  TransactionStatus
} from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import {
  Container,
  LoaderIcon
} from "@/views/PoolView/sections/ComputeSection/steps/styled.ts"
import { BadgeCheck, CircleAlert } from "lucide-react"

type TransactionProcessingStepProps = {
  status: TransactionStatus
  errorDetails?: string
  outcome?: object
}

export const TransactionProcessingStep = ({
  status,
  errorDetails,
  outcome,
  setPrimaryButtonProps
}: TransactionProcessingStepProps & CommonProps) => {
  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({
        disabled: status !== TransactionStatus.success,
        text: "close"
      })
  }, [])

  const handleDownload = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(outcome))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "outcome.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  return (
    <Container>
      {status === TransactionStatus.pending && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <LoaderIcon />
          <p className="mt-2 text-sm">Processing...</p>
          <div className="mt-2 text-sm">
            This may take up to 1min, please do not close or refresh the page
          </div>
        </div>
      )}
      {status === TransactionStatus.success && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <BadgeCheck height={"2em"} />
          <p className="mt-2 text-sm">Transaction Successful!</p>
          <button
            onClick={handleDownload}
            className="mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Download Outcome
          </button>
        </div>
      )}
      {status === TransactionStatus.failure && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <CircleAlert height={"2em"} />
          <p className="mt-2 text-sm">Transaction Failed</p>
          <p className="mt-2 text-sm text-red-500">{errorDetails}</p>
        </div>
      )}
    </Container>
  )
}
