import React, { useState } from "react"
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
  type ForwardButtonProps
} from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card.tsx"

import { ComputeSectionSteps } from "@/views/PoolView/sections/ComputeSection/types.ts"
import { StepsIndicator } from "@/components/Steps/StepsIndicator.tsx"
import { StepsHelperAccordion } from "@/views/PoolView/sections/ComputeSection/steps/StepsHelperAccordion.tsx"
import { useBoundStore } from "@/stores"

const ComputeSection = () => {
  const [currentStep, setCurrentStep] = useState(
    ComputeSectionSteps.Commitments
  )
  const [forwardBtnProps, setForwardBtnProps] = useState<ForwardButtonProps>({
    disabled: false,
    text: "Continue"
  })
  const [backButtonProps, setBackButtonProps] = useState<BackButtonProps>({
    disabled: false,
    text: "Back"
  })
  const { executeRequest, applyFee } = useBoundStore(
    ({ executeRequest, applyFee }) => ({
      executeRequest,
      applyFee
    })
  )

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
    if (currentStep == ComputeSectionSteps.TransactionProcessing) {
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
            <StepsIndicator
              onChangeStep={(index) => setCurrentStep(index)}
              steps={[
                "Select Commitments",
                "ASP Selection",
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
            backButtonProps={backButtonProps}
            forwardButtonProps={forwardBtnProps}
            showStepsIndicator={false}
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
            <ConfirmationStep setPrimaryButtonProps={setForwardBtnProps} />
            <TransactionProcessingStep
              onRestartCb={() =>
                setCurrentStep(ComputeSectionSteps.Commitments)
              }
              setPrimaryButtonProps={setForwardBtnProps}
            />
          </Steps>
        </div>
      </CardContent>
    </Card>
  )
}

export default ComputeSection
