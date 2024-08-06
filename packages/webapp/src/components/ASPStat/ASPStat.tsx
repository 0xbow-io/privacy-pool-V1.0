import React from "react"

interface ASPStatProps {
  header: string
  value?: string | number
}

export const ASPStat = ({ header, value }: ASPStatProps) => {
  return (
    <div className="w-full flex flex-row space-y-2 justify-between items-baseline">
      <h2 className="text-md font-bold mr-2">{header}</h2>
      <p className="text-sm flex break-all">{value}</p>
    </div>
  )
}

export default ASPStat
