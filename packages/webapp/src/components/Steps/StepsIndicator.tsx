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
}

export const StepsIndicator = ({ steps, currentStep }: StepsIndicatorProps) => {
  return (
    <StepsIndContainer>
      {steps.map((step, index) => (
        <Fragment key={index}>
          <Step isActive={index <= currentStep}>
            <StepCircle isActive={index <= currentStep}>
              {index + 1}
            </StepCircle>
            <StepLabel isActive={index <= currentStep}>{step}</StepLabel>
          </Step>
          {index < steps.length - 1 && <Line isActive={index < currentStep} />}
        </Fragment>
      ))}
    </StepsIndContainer>
  )
}
