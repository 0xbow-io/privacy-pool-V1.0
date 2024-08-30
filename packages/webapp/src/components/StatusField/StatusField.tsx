import { StatusFieldContainer } from "@/components/StatusField/styled.ts"

type StatusFieldProps = {
  statusIsValid: boolean
  status: string
}

export const StatusField = ({statusIsValid, status}: StatusFieldProps) => {

  return (
    <StatusFieldContainer statusIsValid={statusIsValid}>
      Status: {status}
    </StatusFieldContainer>
  )
}