import React, { memo } from "react"
import { StatusFieldContainer } from "@/components/StatusField/styled.ts"
import { useBoundStore } from "@/stores"

type StatusFieldProps = {}

export const StatusField: React.FC<StatusFieldProps> = () => {
  const { status } = useBoundStore(({ getStatus }) => ({
    status: getStatus()
  }))

  return (
    <StatusFieldContainer statusIsValid={status === "valid"}>
      Status: {status}
    </StatusFieldContainer>
  )
}
