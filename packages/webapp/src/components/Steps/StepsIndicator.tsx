import {
  Line,
  Step,
  StepCircle,
  StepLabel,
  StepsIndContainer
} from "@/components/Steps/styled.ts"
import React, { Fragment } from "react"
interface StepsIndicatorProps {
  steps: string[]
  currentStep: number
  onChangeStep: (stepIdx: number) => void
}

export const StepsIndicator = ({
  steps,
  currentStep,
  onChangeStep
}: StepsIndicatorProps) => {
  return (
    <StepsIndContainer>
      {steps.map((step, index) => (
        <Fragment key={index}>
          <Step
            onClick={() => index <= currentStep && onChangeStep(index)}
            isActive={index <= currentStep}
          >
            <StepCircle isActive={index <= currentStep}>{index + 1}</StepCircle>
            <StepLabel isActive={index <= currentStep}>{step}</StepLabel>
          </Step>
          {index < steps.length - 1 && <Line isActive={index < currentStep} />}
        </Fragment>
      ))}
    </StepsIndContainer>
  )
}
