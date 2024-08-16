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

export type FEMeta = {
  name: string
  type: number // 0 for simple, 1 for complex
  ticker: string
  address: Address
  precision: bigint
  iconURI: string
}

export type PrivacyPoolMeta = {
  chain: Chain // network chain
  address: Address // contract address
  verifier: Address
  genesis: bigint // when pool was deployed
  id: string // reference id
  scope: bigint // scope value from the Scope() function
  fieldElement: FEMeta
  minmaxCommit: bigint[]
}

export type ChainProof<T = bigint> = [T[], T[][], T[], T[]]
// Types bounded to Privacy Pool Contract
export namespace TPrivacyPool {
  // TODO: Autogenerate this from the contract ABI

  //Bindings to the GetStateSize() function in the contract
  export type GetStateSizeFn_T = ExtractAbiFunction<
    IPrivacyPool_Contract["abi"],
    "GetStateSize"
  >
  export type GetStateSizeFn_out_T = AbiParametersToPrimitiveTypes<
    GetStateSizeFn_T["outputs"]
  >[0]

  //Bindings to the FetchRoots() function in the contract
  export type FetchRootsFn_T = ExtractAbiFunction<
    IPrivacyPool_Contract["abi"],
    "FetchRoots"
  >

  export type FetchRootsFn_in_T = AbiParametersToPrimitiveTypes<
    FetchRootsFn_T["inputs"]
  >

  export type FetchRootsFn_out_T = AbiParametersToPrimitiveTypes<
    FetchRootsFn_T["outputs"]
  >[0]

  // Bindings to the UnpackCiphersWithinRange() function in the contract
  export type UnpackCiphersWithinRangeFn_T = ExtractAbiFunction<
    IPrivacyPool_Contract["abi"],
    "UnpackCiphersWithinRange"
  >

  export type UnpackCiphersWithinRangeFn_in_T = AbiParametersToPrimitiveTypes<
    UnpackCiphersWithinRangeFn_T["inputs"]
  >

  export type UnpackCiphersWithinRangeFn_out_T = AbiParametersToPrimitiveTypes<
    UnpackCiphersWithinRangeFn_T["outputs"]
  >

  export type CipherTexts_T = UnpackCiphersWithinRangeFn_out_T[0]
  export type SaltPublicKeys_T = UnpackCiphersWithinRangeFn_out_T[1]
  export type CommitmentHashes_T = UnpackCiphersWithinRangeFn_out_T[2]

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
