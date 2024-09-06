import { formatUnits, type Hex } from "viem"

export const shortForm = (str: Hex): string => {
  return `${str.substring(0, 14)}....${str.substring(54)}`
}

export const formatValue = (val: bigint, precision?: bigint): string => {
  return formatUnits(val, Number(precision || '2'))
}
