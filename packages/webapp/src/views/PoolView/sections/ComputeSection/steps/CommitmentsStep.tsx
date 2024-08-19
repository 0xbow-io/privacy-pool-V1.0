import { cn } from "@/lib/utils.ts"
import { InputCommitments } from "@/views/PoolView/sections/TransactionsSection/InputCommitments.tsx"
import { OutputCommitments } from "@/views/PoolView/sections/TransactionsSection/OutputCommitments.tsx"
import React, { useEffect } from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import type { CommonProps } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"

export const CommitmentsStep = ({ setPrimaryButtonProps }: CommonProps) => {
  const {
    extraAmountIsValid,
    publicValue,
    updatePublicValue,
    isInputValid,
    isOutputValid,
    extraAmountReason
  } = useKeyStore((state) => state)

  const inputsAreValid =
    extraAmountIsValid && isInputValid().ok && isOutputValid().ok
  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({ disabled: !inputsAreValid, text: "next" })
  }, [inputsAreValid, setPrimaryButtonProps])

  return (
    <div className="flex flex-col gap-y-4 laptop:flex-row laptop:items-start laptop:gap-4">
      <div className="flex-auto">
        <InputCommitments className="" />
      </div>
      <div className="flex-auto flex flex-col gap-y-2 tablet:pt-6">
        <label
          htmlFor="extra-amount"
          className={cn(
            "block mb-2 text-sm font-semibold text-blackmail ",
            extraAmountIsValid ? "text-blackmail" : "text-rust-effect"
          )}
        >
          Extra Amount:
        </label>
        <input
          id="extra-amount"
          type="number"
          placeholder={publicValue.toString()}
          onChange={(e) => updatePublicValue(Number(e.target.value))}
          className={cn(
            "px-4 py-3 text-sm font-semibold text-blackmail ",
            extraAmountIsValid ? "text-blackmail" : "text-rust-effect"
          )}
        />
        <h2 className="mt-2 text-sm font-semibold text-rust-effect">
          {extraAmountReason}
        </h2>
      </div>
      <div className="flex-auto">
        {<OutputCommitments className="border-2" />}
      </div>
    </div>
  )
}
