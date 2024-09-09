import { formatUnits, type Hex } from "viem"

export const shortForm = (str: Hex): string => {
  return `${str.substring(0, 14)}....${str.substring(54)}`
}

export const formatValue = (val: bigint, precision?: bigint): string => {
  return formatUnits(val, Number(precision || '2'))
}

export const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};
