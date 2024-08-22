import React, { useEffect, useState } from "react"
import type { CommonProps } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import Select from "@/components/Select/Select.tsx"

type SourceWalletStepProps = {
  walletOptions: string[]
  selectedWallet: string
  onWalletSelect: (wallet: string) => void
}

export const SourceWalletStep = ({
 selectedWallet,
  walletOptions,
  onWalletSelect,
  setPrimaryButtonProps
}: SourceWalletStepProps & CommonProps) => {

  const handleSelectChange = (value: string) => {
    onWalletSelect(value)
  }

  useEffect(() => {
    setPrimaryButtonProps &&
      setPrimaryButtonProps({ disabled: !selectedWallet })
  }, [setPrimaryButtonProps, selectedWallet])

  // const selectedWallet = walletOptions.find((value) => value === selectedOption);

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full text-left">
        <h1 className="text-2xl font-bold">Select a Wallet</h1>
        <p className="text-sm">This is a smaller description text.</p>
      </div>
      <div className="w-full flex justify-center mt-4">
        <Select
          value={selectedWallet}
          onChange={handleSelectChange}
        >
          <option value="">Select a Wallet</option>
          {walletOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}

export default SourceWalletStep
