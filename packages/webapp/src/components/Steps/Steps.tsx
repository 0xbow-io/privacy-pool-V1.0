import React from "react"
import type {
  ForwardButtonProps,
  BackButtonProps
} from "@/views/PoolView/sections/ComputeSection/steps/types.ts"

type StepsProps = {
  children: React.ReactNode[]
  currentStep: number
  onBack: () => void
  onContinue: () => void
  backButtonProps?: BackButtonProps
  forwardButtonProps?: ForwardButtonProps
}

const Steps: React.FC<StepsProps> = ({
  children,
  currentStep,
  onBack,
  onContinue,
  backButtonProps = {},
  forwardButtonProps = {}
}) => {
  const isForwardDisabled =
    currentStep === children.length - 1 || forwardButtonProps.disabled

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
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
          {forwardButtonProps.text || "Continue"}
        </button>
      </div>
    </div>
  )
}

export default Steps
