import type { Address, PublicClient, WalletClient, TestClient } from "viem"
import type {
  ExtractAbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiEvent
} from "abitype"
import type { IPrivacyPool_Contract } from "@privacy-pool-v1/global"

export type providerT = PublicClient | TestClient | WalletClient
export type providersT = providerT[]

export type poolMetadataT = {
  id: string
  address: Address
}

export type ChainProof<T = bigint> = [T[], T[][], T[], T[]]

// Types bounded to Privacy Pool Contract
export namespace TPrivacyPool {
  // To-DO: Autogenerate this from the contract ABI
  export type _computeScopeFn_T = ExtractAbiFunction<
    IPrivacyPool_Contract["abi"],
    "_computeScope"
  >
  export type _computeScopeFn_in_T = AbiParametersToPrimitiveTypes<
    _computeScopeFn_T["inputs"]
  >

  export type _computeScopeFn_argsT = _computeScopeFn_in_T[0]

  export type _computeScopeFn_out_T = AbiParametersToPrimitiveTypes<
    _computeScopeFn_T["outputs"]
  >

  export type _computeScopeFn_outputT = _computeScopeFn_out_T[0]

  // For Process Fn:
  export type processFn_T = ExtractAbiFunction<
    IPrivacyPool_Contract["abi"],
    "process"
  >
  export type procesFn_in_T = AbiParametersToPrimitiveTypes<
    processFn_T["inputs"]
  >
  export type procesFn_out_T = AbiParametersToPrimitiveTypes<
    processFn_T["outputs"]
  >
  export type record_event_T = ExtractAbiEvent<
    IPrivacyPool_Contract["abi"],
    "Record"
  >

  export type _rT = procesFn_in_T[0]
  export type _sT = procesFn_in_T[1]
  export type _pAT = procesFn_in_T[2]
  export type _pBT = procesFn_in_T[3]
  export type _pCT = procesFn_in_T[4]
  export type _pubSignalsT = procesFn_in_T[5]
}
