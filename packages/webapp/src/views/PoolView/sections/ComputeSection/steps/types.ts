export type CommonProps = {
  setPrimaryButtonProps?: (props: ForwardButtonProps) => void
  setbackButtonProps?: (props: BackButtonProps) => void
}

export type ForwardButtonProps = {
  disabled?: boolean
  text: string
  [key: string]: any
}

export type BackButtonProps = {
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
export type StatValType = string | string[] | number | number[] | Stat

export type Stat = {
  header: string
  value?: Map<string, StatValType>
}

export enum TransactionStatus {
  pending,
  success,
  failure
}
