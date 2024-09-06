import React from "react"
import type { StatValType } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"

interface ASPStatProps {
  header: string
  value?: StatValType
}

export const ASPStat = ({ header, value }: ASPStatProps) => {
  return (
    <div className="w-full flex flex-row space-y-2 justify-between items-baseline">
      <h2 className="text-md font-bold mr-2">{header}</h2>
      <p
        className={`text-sm flex break-all ${typeof value === "boolean" && (value ? "text-green-400" : "text-red-400")}`}
      >
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
      </p>
    </div>
  )
}

export default ASPStat
