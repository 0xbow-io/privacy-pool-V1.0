import type { Address, PublicClient, WalletClient, TestClient } from "viem"
import type {
  ExtractAbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiEvent
} from "abitype"
import type { IPrivacyPool_Contract } from "@privacy-pool-v1/contracts"
import type { Chain } from "viem/chains"

export type providerT = PublicClient | TestClient | WalletClient
export type providersT = providerT[]

export type PrivacyPoolMeta = {
  chain: Chain // network chain
  address: Address // contract address
  verifier: Address
  genesis: bigint // when pool was deployed
  id: string // reference id
  scope: bigint // scope value from the Scope() function
  unitRepresentative: string // what representation of value is used
  minmaxCommitValue: bigint[] // minimum value to commit
}

export type ChainProof<T = bigint> = [T[], T[][], T[], T[]]
// Types bounded to Privacy Pool Contract
export namespace TPrivacyPool {
  // To-DO: Autogenerate this from the contract ABI

  // Bindings to the Scope() function in the contract
  export type ScopeFn_T = ExtractAbiFunction<
    IPrivacyPool_Contract["abi"],
    "Scope"
  >
  export type ScopeFn_out_T = AbiParametersToPrimitiveTypes<
    ScopeFn_T["outputs"]
  >[0]

  // Bindings to the Context() function in the contract
  export type ContextFn_T = ExtractAbiFunction<
    IPrivacyPool_Contract["abi"],
    "Context"
  >
  export type ContextFn_in_T = AbiParametersToPrimitiveTypes<
    ContextFn_T["inputs"]
  >
  // {src, sink, feeCollector, fee}
  export type ContextFn_argsT = ContextFn_in_T[0]
  export type ContextFn_out_T = AbiParametersToPrimitiveTypes<
    ContextFn_T["outputs"]
  >[0]

  // Bindings to the Process() function in the contract
  export type ProcessFn_T = ExtractAbiFunction<
    IPrivacyPool_Contract["abi"],
    "Process"
  >
  // _r --> request
  // _proof --> pracked groth16 proof
  export type ProcessFn_in_T = AbiParametersToPrimitiveTypes<
    ProcessFn_T["inputs"]
  >
  export type RequestT = ProcessFn_in_T[0]
  export type ProofT = ProcessFn_in_T[1]

  export type procesFn_out_T = AbiParametersToPrimitiveTypes<
    ProcessFn_T["outputs"]
  >
  // [_r, stateRoot, datasetSize, dataSetSize]
  export type Record_event_T = ExtractAbiEvent<
    IPrivacyPool_Contract["abi"],
    "Record"
  >
}
