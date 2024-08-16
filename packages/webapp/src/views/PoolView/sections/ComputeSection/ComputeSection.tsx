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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion.tsx"
import { loadWorkerDynamically } from "@/workers/WorkerLazyLoader.ts"
import type { PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"
import { numberToHex, hexToBigInt } from "viem"

const ComputeSection = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [forwardBtnProps, setForwardBtnProps] = useState<ForwardButtonProps>({
    disabled: false,
    text: "next"
  })
  const {
    keys,
    inCommits,
    outValues,
    keyCommitRoots,
    availCommits,
    updateKeyCommitRoots,
    updateSelectedKey,
    outPrivacyKeys,
    currPool
  } = useKeyStore((state) => state)
  const publicKeys = keys.map((key) => key.publicAddr)
  const [selectedKey, setSelectedKey] = useState<PrivacyKey | undefined>(
    undefined
  )
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

  useEffect(() => {
    loadWorkerDynamically().then(setWorker)

    // Cleanup function to terminate the worker when the component unmounts
    return () => {
      if (worker) {
        worker.terminate()
      }
    }
  }, [worker])

  useEffect(() => {
    if (worker) {
      worker.onmessage = (event) => {
        const { action, payload } = event.data
        if (action === "makeCommitRes") {
          console.log("Message from worker:", payload)
          setTransactionStatus(TransactionStatus.success)
        } else if (action === "makeCommitErr") {
          console.error("Worker error:", payload)
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
        pool: currPool.id,
        privateKeys: keys.map((key) => key.pKey)
      })
    }
  }, [worker, keys, currPool, updateKeyCommitRoots])

  useEffect(() => {
    // start processing when user gets to the last step
    if (currentStep === 4) {
      if (!worker) {
        console.log("worker is not initialized")
        return
      }
      console.log("privateKey before", selectedKey?.asJSON.privateKey)
      setTransactionStatus(TransactionStatus.pending)
      // argument matches should ocntain the params for as privacyPpool.process()
      worker?.postMessage({
        action: "makeCommit",
        poolID: currPool.id,
        accountKey: selectedKey?.asJSON.privateKey,
        _r: {
          src: "", // will fill this out later in the worker
          sink: "", // TODO: handle this for releases
          fee: selectedASP.fee,
          feeCollector: selectedASP.feeCollector
        },
        pKs: [
          outPrivacyKeys[0].pKey, // [0] is the first output key hex
          outPrivacyKeys[1].pKey // [1] is the second output key hex
        ],
        nonces: [0n, 0n, 0n, 0n],
        existingCommitmentRoots: inCommits,
        newCommitmentValues: outValues
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
    worker
  ])

  useEffect(() => {
    if (selectedKey) {
      updateSelectedKey(selectedKey.asJSON.privateKey)
    }
  }, [selectedKey, updateSelectedKey])

  const handleBack = () => {
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 0))
  }

  const handleContinue = () => {
    setCurrentStep((prevStep) => prevStep + 1)
  }

  return (
    <Card className={"w-full"}>
      <CardHeader>
        <CardTitle>Compute Commitments & Releases</CardTitle>
        <CardDescription>
          <div className="flex-auto">
            <Accordion type="single" collapsible>
              <AccordionItem
                key="how_it_works"
                value="how_it_works"
                className=" "
              >
                <AccordionTrigger className="mt-4 border border-blackmail px-2  hover:bg-toxic-orange">
                  <h2 className="text-blackmail "> How does it work? </h2>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-row relative p-6">
                    <div className="flex-auto">
                      <p>
                        Privacy Pool utilises a 2 Inputs to 2 Outputs
                        transaction scheme where you are computing two{" "}
                        <span className="text-toxic-orange">
                          {" "}
                          new commitments{" "}
                        </span>{" "}
                        from two commitments that you own. A commitment is an
                        encrypted value represented by an entry (commitment
                        hash) in the Pool&apos;s Merkle Tree.{" "}
                        <span className="text-toxic-orange">
                          {" "}
                          Void input commitment{" "}
                        </span>{" "}
                        has 0 value and is used as a placeholder for when you
                        don&apos;t want to use an existing commitment. <br />
                        <br />
                        Total sum of the output commitment values need to match
                        the sum of the input commitment values + public value.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
                  fee: 100n,
                  feeCollector: "0x533ac3edff3b5a75fb257ea3d8c6e7e2c53d0b6d"
                }
              ]}
              onASPSelect={(ASP) => setSelectedASP(ASP)}
            />
            <SourceWalletStep
              selectedWallet={selectedKey?.publicAddr || ""}
              setPrimaryButtonProps={setForwardBtnProps}
              walletOptions={publicKeys}
              onWalletSelect={(wallet) =>
                setSelectedKey(keys.find((key) => key.publicAddr === wallet))
              }
            />
            <CommitmentsStep setPrimaryButtonProps={setForwardBtnProps} />
            <ConfirmationStep
              selectedASP={selectedASP}
              inputWallet={selectedKey?.publicAddr || ""}
            />
            <TransactionProcessingStep
              status={transactionStatus}
              errorDetails={""}
              outcome={{ a: 1 }}
            />
          </Steps>
        </div>
      </CardContent>
    </Card>
  )
}

export default ComputeSection
