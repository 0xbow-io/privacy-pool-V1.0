import type { PrivacyKeyJSON } from "@privacy-pool-v1/domainobjs/ts"
import type { FEMeta } from "@privacy-pool-v1/contracts/ts"

export type CommonProps = {
  setPrimaryButtonProps?: (props: ForwardButtonProps) => void
  setBackButtonProps?: (props: BackButtonProps) => void
  privacyKeys?: PrivacyKeyJSON[]
  fe?: FEMeta | undefined
}

export type ForwardButtonProps = {
  disabled?: boolean
  text?: string
  [key: string]: any
  onClick?: () => void
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
export type StatValType = string | string[] | number | number[] | boolean

export type Stat = {
  header: string
  value?: StatValType
}

export enum TransactionStatus {
  pending,
  success,
  failure
}
