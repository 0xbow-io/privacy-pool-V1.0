import React, { useEffect, useState } from "react"
import { ASPStat } from "@/components/ASPStat/ASPStat.tsx"
import type {
  ASP,
  CommonProps
} from "@/views/PoolView/sections/ComputeSection/steps/types.ts"
import Select from "@/components/Select/Select.tsx"
import { formatEther } from "viem"
import { useGlobalStore } from "@/stores/global-store.ts"

type ASPSelectionStepProps = {
  ASPOptions: ASP[]
  selectedASP: ASP
  onASPSelect: (ASP: ASP) => void
} & CommonProps

export const ASPSelectionStep: React.FC<ASPSelectionStepProps> = ({
  ASPOptions,
  selectedASP,
  onASPSelect,
  setPrimaryButtonProps
}) => {
  const { isSyncing } = useGlobalStore((state) => state)

  useEffect(() => {
    if (setPrimaryButtonProps) {
      setPrimaryButtonProps({
        disabled: isSyncing,
        text: isSyncing ? "Syncing..." : "Next"
      })
    }
  }, [setPrimaryButtonProps, isSyncing])

  const handleSelectChange = (value: string) => {
    const selectedASP = ASPOptions.find(({ id }) => id === value)
    if (selectedASP) {
      onASPSelect(selectedASP)
    }
  }

  return (
    <div className="flex flex-col items-start w-full h-full">
      <div className="w-full text-left">
        <h1 className="text-2xl font-bold">
          Select an Association Set Provider (ASP)
        </h1>
        <p className="text-sm">This is a smaller description text.</p>
      </div>
      <div className="w-full flex justify-start mt-4">
        <Select value={selectedASP?.name || ""} onChange={handleSelectChange}>
          <option value="">Select an ASP</option>
          {ASPOptions.map(({ id, name }, index) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      <div
        className={"flex flex-col justify-start w-full mt-4"}
        style={{ visibility: selectedASP ? "visible" : "hidden" }}
      >
        <ASPStat header="Fee:" value={formatEther(selectedASP?.fee || 0n)} />
        <ASPStat
          header="Fee collector address:"
          value={selectedASP?.feeCollector}
        />
      </div>
    </div>
  )
}
