import type { PrivacyPoolState } from "@privacy-pool-v1/contracts/ts"
import type { Commitment } from "@privacy-pool-v1/domainobjs/ts"
import type { WorkerResponse } from "@/workers/eventListener.ts"
import type { Hex } from "viem"
import type { StdPackedGroth16ProofT } from "@privacy-pool-v1/zero-knowledge"

export type AppStateSlice = {
  isSyncing: boolean
  isGeneratingProof: boolean
  isExecutingRequest: boolean

  tabs: Set<string>
  currentTab: string
  onTabChange: (tab: string) => void

  _settingsDrawer: boolean // open 1 closed 0
  settingsDrawer: (open: boolean) => void
}

export type PoolsSlice = {
  currPoolID: string
  pools: Map<string, PrivacyPoolState>
  commitments: Map<string, Commitment[][]>

  setTargetPool: (poolID: string) => void
  startSync: () => void
  updatePoolSync: (poolID: string, resp: WorkerResponse) => void
  downloadMembershipProof: (slot: number) => void
}

export type RequestSlice = {
  src: Hex
  sink: Hex
  feeCollectorID: string
  feeCollector: Hex
  fee: bigint
  existing: [Commitment, Commitment]

  newValues: [bigint, bigint]
  // expected vrs actual
  sumNewValues: bigint
  new: [Commitment, Commitment] | undefined
  keyIdx: [number, number, number, number]
  pkScalars: [bigint, bigint, bigint, bigint]
  nonces: [bigint, bigint, bigint, bigint]
  // External Input & Output
  // External Input > 0 => Commitment
  // External Output > 0 => Release
  // It  is possible to have both external input and output
  externIO: [bigint, bigint]

  reqStatus: string
  reqTxHash: Hex

  // Methods
  updateSrc: (address: Hex) => void
  updateSink: (address: Hex) => void

  resetRequestState: () => void
  getStatus: () => string
  getTotalNew: () => bigint
  getTotalExisting: () => bigint
  selectExisting: (keyIdx: number, commitIdx: number, slot: number) => void
  insertNew: (keyIdx: number, value: bigint, slot: number) => void
  createNewCommitments: () => void
  setExternIO: (io: [bigint, bigint]) => void
  applyFee: (fee: bigint, feeCollectorAddr: Hex, feeCollectorID: string) => void
  executeRequest: () => void
}

export type KeysSlice = {
  signerKey: Hex
  privKeys: Hex[]

  importKeys: (data: string) => void
  addKey: () => void
  hasKeys: () => boolean
  setSigner: (key: Hex) => void
  exportKeys: (fileName?: string) => void
}

export type GlobalStore = {
  proof: {
    verified: boolean
    packedProof: StdPackedGroth16ProofT<bigint>
  } | null

  computeProof: () => void
}

export type CompleteStore = RequestSlice &
  PoolsSlice &
  KeysSlice &
  GlobalStore &
  AppStateSlice

export enum requestStatus {
  Pending,
  Success,
  Error
}