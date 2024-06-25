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

// Types binded to Privacy Pool Contract
export namespace TPrivacyPool {
  // To-DO: Autogenerate this from the contract ABI
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
  export type compueScopeFn_T = ExtractAbiFunction<
    IPrivacyPool_Contract["abi"],
    "computeScope"
  >
  export type compueScopeFn_in_T = AbiParametersToPrimitiveTypes<
    compueScopeFn_T["inputs"]
  >
  export type compueScopeFn_out_T = AbiParametersToPrimitiveTypes<
    compueScopeFn_T["outputs"]
  >
}
