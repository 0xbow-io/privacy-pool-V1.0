import React, { useEffect, useState, useRef } from "react"
import Steps from "@/components/Steps/Steps.tsx"
import {
  ASPSelectionStep,
  CommitmentsStep,
  ConfirmationStep,
  SignerSelectionStep,
  TransactionProcessingStep
} from "./steps"
import {
  type ASP,
  type BackButtonProps,
  type ForwardButtonProps,
  TransactionStatus
} from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import { useGlobalStore } from "@/stores/global-store.ts"
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

import { PrivacyKey } from "@privacy-pool-v1/domainobjs/ts"
import { numberToHex, hexToBigInt } from "viem"

const ComputeSection = () => {
  const [currentStep, setCurrentStep] = useState(
    ComputeSectionSteps.ASPSelection
  )
  const [forwardBtnProps, setForwardBtnProps] = useState<ForwardButtonProps>({
    disabled: false,
    text: "Continue"
  })
  const [backButtonProps, setbackButtonProps] = useState<BackButtonProps>({
    disabled: false,
    text: "Back"
  })
  const {
    privKeys,
    signerKey,
    setSigner,
    request,
    sync,
    applyFee,
    currPoolID,
    computeProof,
    executeRequest
  } = useGlobalStore((state) => state)

  useEffect(() => {
    if (currentStep == 0) {
      sync(currPoolID)
    }
    if (currentStep == 3) {
      computeProof()
    }
  }, [currentStep, sync, computeProof, request, currPoolID])

  const privacyKeys = privKeys.map((key) => PrivacyKey.from(key, 0n))
  const publicKeys = privacyKeys.map((key) => key.publicAddr)

  const [selectedASP, setSelectedASP] = useState<ASP>({
    name: "",
    id: "",
    fee: 0n,
    feeCollector: "0x00"
  })

  const handleBack = () => {
    setCurrentStep((prevStep) => (prevStep - 1 < 0 ? 0 : prevStep - 1))
  }

  const handleContinue = () => {
    // User is on the ConfirmationStep
    // and has clicked the "Confirm & Execute" button
    if (currentStep == 3) {
      // execute the request
      executeRequest()
    }
    setCurrentStep((prevStep) => prevStep + 1)
  }

  return (
    <Card className={"w-full"}>
      <CardHeader>
        <CardTitle>Compute Commitments</CardTitle>
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
                    <div className="flex-auto font-bold text-base">
                      <p>
                        Consider Privacy Pool as a self-custody vault where
                        confidential valuables are securely stored within{" "}
                        <span className="text-toxic-orange">commitments</span>.{" "}
                        <br />
                        <br />
                        With a Privacy Key you can access your{" "}
                        <span className="text-toxic-orange">
                          commitments
                        </span>{" "}
                        and retrieve your valuables without revealing its
                        contents nor its origins to anyone. <br />
                        <br />
                        The Vault does not know the contents or origins of the
                        valuables. Your commitments are secure as long as your
                        Privacy Keys are kept secret.
                        <br />
                        <br />
                        Private transfer of value ownerships or secret sharing
                        between multiple keys is possible with the use of{" "}
                        <span className="text-toxic-orange">
                          zero-knowledge proof
                        </span>
                        .
                        <br />
                        <br />
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
            backButtonProps={backButtonProps}
            forwardButtonProps={forwardBtnProps}
          >
            <CommitmentsStep setPrimaryButtonProps={setForwardBtnProps} />
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
              onASPSelect={(ASP) => {
                setSelectedASP(ASP)
                applyFee(ASP.fee, ASP.feeCollector, ASP.id)
              }}
            />
            <SignerSelectionStep setPrimaryButtonProps={setForwardBtnProps} />
            <ConfirmationStep setPrimaryButtonProps={setForwardBtnProps} />
            <TransactionProcessingStep
              setPrimaryButtonProps={setForwardBtnProps}
            />
          </Steps>
        </div>
      </CardContent>
    </Card>
  )
}

export default ComputeSection
