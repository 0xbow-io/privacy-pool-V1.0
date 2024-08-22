import { cn } from "@/lib/utils.ts"
import { InputCommitments } from "@/views/PoolView/sections/TransactionsSection/InputCommitments.tsx"
import { OutputCommitments } from "@/views/PoolView/sections/TransactionsSection/OutputCommitments.tsx"
import React, { useEffect } from "react"
import { useKeyStore } from "@/providers/global-store-provider.tsx"
import type { CommonProps } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import BigNumber from "bignumber.js"
import { parseEther } from "viem"

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
    setPrimaryButtonProps({ disabled: !inputsAreValid })
  }, [inputsAreValid, setPrimaryButtonProps])

  return (
    <div className="grid grid-cols-1 gap-4 laptop:grid-cols-8">
      <div className="col-span-1 laptop:col-span-3">
        <InputCommitments className="" />
      </div>
      <div className="col-span-1 laptop:col-span-2">
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
          onChange={(e) =>
            updatePublicValue(
              new BigNumber(parseEther(e.target.value).toString())
            )
          }
          className={cn(
            "px-4 py-3 text-sm font-semibold text-blackmail w-full",
            extraAmountIsValid ? "text-blackmail" : "text-rust-effect"
          )}
        />
        <h2 className="mt-2 text-sm font-semibold text-rust-effect">
          {extraAmountReason}
        </h2>
      </div>
      <div className="col-span-1 laptop:col-span-3">
        <OutputCommitments className="border-2" />
      </div>
    </div>
  )
}