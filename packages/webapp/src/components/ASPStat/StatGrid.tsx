import React from "react"
import ASPStat from "@/components/ASPStat/ASPStat.tsx"
import type { Stat } from "@/views/PoolView/sections/ComputeSection/steps/types.ts"

type StatGridProps = {
  stats: Stat[]
}

export const StatGrid = ({ stats }: StatGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {stats.map((stat, index) => (
        <ASPStat key={index} header={stat.header} value={stat.value} />
      ))}
    </div>
  )
}

export default StatGrid
