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
import {
  ChainNameIDToChain,
  DEFAULT_CHAIN,
  PrivacyPools
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { useBoundStore } from "@/stores"

type TransactionProcessingStepProps = {
  onRestartCb: () => void
}

export const TransactionProcessingStep = ({
  setPrimaryButtonProps,
  onRestartCb
}: TransactionProcessingStepProps & CommonProps) => {
  const { reqStatus, reqTxHash, currPoolID, resetRequestState } = useBoundStore(
    ({
      proof,
      reqStatus,
      reqTxHash,
      currPoolID,
      getStatus,
      resetRequestState
    }) => ({
      proof,
      reqStatus,
      reqTxHash,
      currPoolID,
      status: getStatus(),
      resetRequestState
    })
  )

  const pool = PrivacyPools.get(currPoolID)
  const chain = ChainNameIDToChain.get(pool!.chainID) ?? DEFAULT_CHAIN

  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({
        disabled: reqStatus !== "success",
        text: "Finish"
      })
  }, [setPrimaryButtonProps, reqStatus])

  const formatTxHash = (txHash: string) => {
    return `${chain.blockExplorers!.default.url}/tx/${txHash}`
  }

  useEffect(() => {
    if (reqStatus === "success") {
      setPrimaryButtonProps &&
        setPrimaryButtonProps({
          disabled: false,
          text: "Compute Another Commitment",
          onClick: () => onRestartCb(0)
        })
    }
  }, [reqStatus])

  return (
    <Container>
      {reqStatus === "pending" && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <LoaderIcon />
          <p className="mt-2 text-sm">Pending onchain...</p>
          <div className="mt-2 text-sm">
            This may take up to 1min, please do not close or refresh the page.
            <a> {formatTxHash(reqTxHash)} </a>
          </div>
        </div>
      )}
      {reqStatus === "success" && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <BadgeCheck height={"2em"} />
          <p className="mt-2 text-sm">
            Transaction Successful: <a> {formatTxHash(reqTxHash)} </a>
          </p>
        </div>
      )}
      {reqStatus !== "pending" && reqStatus !== "success" && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <CircleAlert height={"2em"} />
          <p className="mt-2 text-sm">
            Transaction Failed: <a> {formatTxHash(reqTxHash)} </a>{" "}
          </p>
          <p className="mt-2 text-sm text-red-500">{reqStatus}</p>
        </div>
      )}
    </Container>
  )
}
