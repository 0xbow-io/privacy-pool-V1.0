import React, { useEffect, useState } from "react"
import Steps from "@/components/Steps/Steps.tsx"
import {
  ASPSelectionStep,
  CommitmentsStep,
  ConfirmationStep,
  SourceWalletStep,
  TransactionProcessingStep
} from "./steps"
import {
  type ASP,
  type ForwardButtonProps,
  TransactionStatus
} from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card.tsx"
import { loadWorkerDynamically } from "@/workers/WorkerLazyLoader.ts"
import { StepsIndicator } from "@/components/Steps/StepsIndicator.tsx"
import { ComputeSectionSteps } from "@/views/PoolView/sections/ComputeSection/types.ts"
import { StepsHelperAccordion } from "@/views/PoolView/sections/ComputeSection/steps/StepsHelperAccordion.tsx"

const ComputeSection = () => {
  const [currentStep, setCurrentStep] = useState(
    ComputeSectionSteps.ASPSelection
  )
  const [forwardBtnProps, setForwardBtnProps] = useState<ForwardButtonProps>({
    disabled: false,
    text: "Continue"
  })
  const {
    keys,
    inCommits,
    outValues,
    selectedKey,
    updateKeyCommitRoots,
    updateSelectedKey,
    outPrivacyKeys,
    currPool
  } = useKeyStore((state) => state)

  const [selectedASP, setSelectedASP] = useState<ASP>({
    name: "",
    id: "",
    fee: 0n,
    feeCollector: "0x00"
  })
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(
    TransactionStatus.pending
  )
  const [worker, setWorker] = useState<Worker | null>(null)
  const [transactionSent, setTransactionSent] = useState(false)

  useEffect(() => {
    console.log("loading worker")
    loadWorkerDynamically().then(setWorker)

    // Cleanup function to terminate the worker when the component unmounts
    return () => {
      if (worker) {
        worker.terminate()
      }
    }
  }, [])

  useEffect(() => {
    if (worker) {
      console.log("worker init")
      worker.onmessage = (event) => {
        const { action, payload } = event.data
        if (action === "makeCommitRes") {
          console.log("Message from worker:", payload)
          setTransactionStatus(TransactionStatus.success)
        } else if (action === "makeCommitErr") {
          console.error("Worker error(compute section):", payload)
          setTransactionStatus(TransactionStatus.failure)
        } else if (action === "getKeysCommitmentsRes") {
          updateKeyCommitRoots(payload)
        }
      }

      worker.onerror = (error) => {
        console.error("Worker error:", error)
        setTransactionStatus(TransactionStatus.failure)
      }

      // start processing the keys commitments as soon as worker is initialised
      worker?.postMessage({
        action: "getKeysCommitments",
        // specify the pool of interest
        poolID: currPool.id,
        privateKeys: keys.map((key) => key.pKey)
      })
    }
  }, [worker, keys, currPool.id, updateKeyCommitRoots])

  useEffect(() => {
    // start processing when user gets to the last step
    if (
      currentStep === ComputeSectionSteps.TransactionProcessing &&
      !transactionSent
    ) {
      if (!worker) {
        console.log("worker is not initialized")
        return
      }
      console.log("privateKey before", selectedKey?.pKey)
      setTransactionStatus(TransactionStatus.pending)
      setTransactionSent(true)
      // argument matches should contain the params for as privacyPool.process()
      worker?.postMessage({
        action: "makeCommit",
        poolID: currPool.id,
        accountKey: selectedKey?.pKey,
        _r: {
          src: "", // will fill this out later in the worker
          sink: "", // TODO: handle this for releases
          fee: selectedASP.fee,
          feeCollector: selectedASP.feeCollector
        },
        pKs: [
          outPrivacyKeys[0].pKey, // [0] is the first output key hex
          outPrivacyKeys[0].pKey, // [0] is the first output key hex
          outPrivacyKeys[1].pKey, // [1] is the second output key hex
          outPrivacyKeys[1].pKey // [1] is the second output key hex
        ],
        nonces: [0n, 0n, 0n, 0n],
        existingCommitmentJSONs: inCommits.map((c) => c.toJSON()),
        newCommitmentValues: outValues.map((n) => n.toString())
      })
    }
  }, [
    currPool,
    currentStep,
    selectedKey,
    selectedASP,
    inCommits,
    outPrivacyKeys,
    outValues,
    worker,
    transactionSent
  ])

  useEffect(() => {
    if (selectedKey) {
      updateSelectedKey(selectedKey.pKey)
    }
  }, [selectedKey, updateSelectedKey])

  const handleBack = () => {
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 0))
  }

  const handleContinue = () => {
    setCurrentStep((prevStep) =>
      Math.min(prevStep + 1, ComputeSectionSteps.TransactionProcessing)
    )
  }

  return (
    <Card className={"w-full"}>
      <CardHeader>
        <CardTitle>Compute Commitments & Releases</CardTitle>
        <CardDescription>
          <div className="flex-auto">
            <StepsIndicator
              steps={[
                "ASP Selection",
                "Select Commitments",
                "Confirm TX details",
                "Processing"
              ]}
              currentStep={currentStep}
            />
            <StepsHelperAccordion currentStep={currentStep} />
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="compute-section">
          <Steps
            currentStep={currentStep}
            onBack={handleBack}
            onContinue={handleContinue}
            backButtonProps={{ disabled: currentStep === 0 }}
            forwardButtonProps={forwardBtnProps}
          >
            <ASPSelectionStep
              selectedASP={selectedASP}
              setPrimaryButtonProps={setForwardBtnProps}
              ASPOptions={[
                {
                  name: "0xbow",
                  id: "0xbow",
                  fee: 0n,
                  feeCollector: "0x533ac3edff3b5a75fb257ea3d8c6e7e2c53d0b6d"
                }
              ]}
              onASPSelect={(ASP) => setSelectedASP(ASP)}
            />
            {/*<SourceWalletStep*/}
            {/*  selectedWallet={selectedKey?.publicAddr || ""}*/}
            {/*  setPrimaryButtonProps={setForwardBtnProps}*/}
            {/*  walletOptions={publicKeys}*/}
            {/*  onWalletSelect={(wallet) =>*/}
            {/*    setSelectedKey(keys.find((key) => key.publicAddr === wallet))*/}
            {/*  }*/}
            {/*/>*/}
            <CommitmentsStep setPrimaryButtonProps={setForwardBtnProps} />
            <ConfirmationStep
              selectedASP={selectedASP}
              inputWallet={selectedKey?.publicAddr || ""}
            />
            <TransactionProcessingStep
              status={transactionStatus}
              errorDetails={""}
              outcome={{ a: 1 }}
              setPrimaryButtonProps={setForwardBtnProps}
              onRestartCb={() => {
                setTransactionSent(false)
                setCurrentStep(0)
              }}
            />
          </Steps>
        </div>
      </CardContent>
    </Card>
  )
}

export default ComputeSection
