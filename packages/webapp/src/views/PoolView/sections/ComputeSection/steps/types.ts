export type CommonProps = {
  setPrimaryButtonProps?: (props: ForwardButtonProps) => void
}

export type ForwardButtonProps = {
  disabled?: boolean
  text: string
  [key: string]: any
}

export type ASP = {
  name: string
  id: string
  fee: bigint
  feeCollector: `0x${string}`
}

export type Stat = {
  header: string
  value: string | number
}

export enum TransactionStatus {
  pending,
  success,
  failure
}
