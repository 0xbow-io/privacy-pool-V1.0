import React, { useEffect, useState } from "react"
import type { CommonProps } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import Select from "@/components/Select/Select.tsx"
import { useGlobalStore } from "@/stores/global-store"
import { numberToHex, type Hex } from "viem"

export const SignerSelectionStep = ({ setPrimaryButtonProps }: CommonProps) => {
  const { setSigner, signerKey, privKeys } = useGlobalStore((state) => state)
  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({
        disabled: signerKey == numberToHex(0),
        text: "Continue"
      })
  }, [setPrimaryButtonProps, signerKey])

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full text-left">
        <h1 className="text-2xl font-bold">Select the Signing Key</h1>
        <p className="text-sm">
          The chosen Key will be used to sign onchain transactions. Ensure that
          there is enough gas for the key.
        </p>
      </div>
      <div className="w-full flex justify-center mt-4">
        <Select value={signerKey} onChange={(value) => setSigner(value as Hex)}>
          <option value="">Select Signer</option>
          {privKeys.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}

export default SignerSelectionStep
