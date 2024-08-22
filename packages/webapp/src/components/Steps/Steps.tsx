import React from "react"
import type { ForwardButtonProps } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import { StepsIndicator } from "@/components/Steps/StepsIndicator.tsx"

type StepsPropsBase = {
  children: React.ReactNode[]
  currentStep: number
  onBack: () => void
  onContinue: () => void
  backButtonProps?: { disabled?: boolean }
  forwardButtonProps?: ForwardButtonProps
  showStepsIndicator?: boolean
}

type StepsPropsWithIndicator = StepsPropsBase & {
  showStepsIndicator: true
  stepNames: string[]
}

type StepsPropsWithoutIndicator = StepsPropsBase & {
  showStepsIndicator?: false
  stepNames?: never
}

type StepsProps = StepsPropsWithIndicator | StepsPropsWithoutIndicator

const Steps: React.FC<StepsProps> = ({
  children,
  currentStep,
  onBack,
  onContinue,
  stepNames,
  backButtonProps = {},
  forwardButtonProps = {},
  showStepsIndicator
}) => {
  const isForwardDisabled =
    currentStep === children.length - 1 || forwardButtonProps?.disabled

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {showStepsIndicator && (
        <StepsIndicator steps={stepNames} currentStep={currentStep} />
      )}
      <div className="w-full">{children[currentStep]}</div>
      <div className="flex justify-between w-full mt-4">
        <button
          className="bg-gray-300 text-black px-4 py-2 rounded"
          onClick={onBack}
          disabled={currentStep === 0 || backButtonProps.disabled}
          {...backButtonProps}
        >
          Back
        </button>
        <button
          className={`bg-blue-500 text-white px-4 py-2 rounded ${isForwardDisabled ? "bg-gray-400 text-gray-700" : "bg-blue-500 text-white"}`}
          onClick={() => onContinue()}
          disabled={
            currentStep === children.length - 1 || forwardButtonProps.disabled
          }
          {...forwardButtonProps}
        >
          {forwardButtonProps?.text || "Continue"}
        </button>
      </div>
    </div>
  )
}

export default Steps
