import { downloadJSON } from "@/utils/files"
import {
  DEFAULT_CHAIN,
  getDefaultPoolIDForChainID,
  ChainNameIDToChain,
  PrivacyPools
} from "@privacy-pool-v1/contracts/ts/privacy-pool/constants"
import type { Commitment } from "@privacy-pool-v1/domainobjs/ts"
import {
  DummyCommitment,
  PrivacyKey,
  RecoverCommitments
} from "@privacy-pool-v1/domainobjs/ts"
import {
  createWalletClient,
  hexToBigInt,
  http,
  numberToHex,
  publicActions
} from "viem"

import type { Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { create } from "zustand"

import { loadWorkerDynamically } from "@/workers/WorkerLazyLoader.ts"
import type { WorkerResponse } from "@/workers/eventListener.ts"
import { COMPUTE_PROOF_CMD, SYNC_POOL_STATE } from "@/workers/eventListener.ts"
import type { PrivacyPoolState } from "@privacy-pool-v1/contracts/ts/privacy-pool"
import {
  GetOnChainPrivacyPoolByPoolID,
  NewPrivacyPoolSate
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { CreateNewCommitment } from "@privacy-pool-v1/domainobjs/ts"
import {
  ComputeExternIO,
  GetNewSum,
  GetOutputVals,
  type StdPackedGroth16ProofT
} from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import { generatePrivateKey } from "viem/accounts"
import * as zustand from "zustand"
import { M_PLUS_1 } from "next/font/google"

export interface RequestArgs {
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
}

export interface GlobalStore {
  isSyncing: boolean
  isGeneratingProof: boolean
  isExecutingRequest: boolean

  privKeys: Hex[]
  currPoolID: string
  pools: Map<string, PrivacyPoolState>

  commitments: Map<string, Commitment[][]>
  signerKey: Hex
  request: RequestArgs
  proof: {
    verified: boolean
    packedProof: StdPackedGroth16ProofT<bigint>
  } | null
  // The status of the onchain request
  // "": no request
  // "failed simulation": request failed during simulation
  // "failed": request failed onchain
  // "success": request success
  reqStatus: string
  reqTxHash: Hex

  tabs: Set<string>
  currentTab: string
  onTabChange: (tab: string) => void

  _settingsDrawer: boolean // open 1 closed 0
  settingsDrawer: (open: boolean) => void

  importKeys: (data: string) => void
  addKey: () => void
  hasKeys: () => boolean

  setSigner: (key: Hex) => void
  exportKeys: (fileName?: string) => void
  setTargetPool: (poolID: string) => void
  sync: (poolID: string) => void
  updateSrc: (address: Hex) => void
  updateSink: (address: Hex) => void
  selectExisting: (keyIdx: number, commitIdx: number, slot: number) => void
  downloadMembershipProof: (slot: number) => void
  insertNew: (keyIdx: number, value: bigint, slot: number) => void
  createNewCommitments: () => void
  setExternIO: (io: [bigint, bigint]) => void
  applyFee: (fee: bigint, feeCollectorAddr: Hex, feeCollectorID: string) => void
  computeProof: () => void
  executeRequest: () => void
}

/*** Global Store ***/
export const useGlobalStore = create<GlobalStore>((set, get) => ({
  isSyncing: false,
  isGeneratingProof: false,
  isExecutingRequest: false,
  tabs: new Set<string>(["account", "compute", "asp", "records", "settings"]),
  currentTab: "account",

  _settingsDrawer: false,
  settingsDrawer: (open: boolean) =>
    set((state) => ({ ...state, _settingsDrawer: open })),

  privKeys: [],
  commitments: new Map<string, Commitment[][]>(),
  currPoolID: getDefaultPoolIDForChainID(DEFAULT_CHAIN.id),
  pools: new Map<string, PrivacyPoolState>(),
  signerKey: numberToHex(0),
  request: {
    src: numberToHex(0),
    sink: numberToHex(0),
    feeCollectorID: "",
    feeCollector: numberToHex(0),
    fee: 0n,
    newValues: [0n, 0n] as [bigint, bigint],
    sumNewValues: 0n,
    new: undefined,
    existing: [DummyCommitment(0n), DummyCommitment(0n)] as [
      Commitment,
      Commitment
    ],
    keyIdx: [0, 0, 0, 0] as [number, number, number, number],
    pkScalars: [0n, 0n, 0n, 0n] as [bigint, bigint, bigint, bigint],
    nonces: [0n, 0n, 0n, 0n] as [bigint, bigint, bigint, bigint],
    externIO: [0n, 0n] as [bigint, bigint]
  },
  proof: null,
  reqStatus: "pending",
  reqTxHash: numberToHex(0),

  onTabChange: (tab: string) =>
    set((state) => ({
      ...state,
      currentTab: state.tabs.has(tab) ? tab : "account"
    })),

  importKeys: (data: string) => importKeys(set, data),
  createNewCommitments: () => createNewCommitments(set),
  addKey: () => addKey(set),
  hasKeys: (): boolean => get().privKeys.length > 0,
  setSigner: (key: Hex) =>
    set((state) => {
      return { ...state, signerKey: key }
    }),
  exportKeys: (fileName = "privacy_pool_keys.json") =>
    downloadJSON(JSON.stringify({ keys: get().privKeys }), fileName),
  setTargetPool: (poolID: string) => setTargetPool(set, poolID),
  sync: (poolID: string) => sync(set, poolID),
  updateSrc: (address: Hex) => updateSrc(set, address),
  updateSink: (address: Hex) => updateSink(set, address),
  selectExisting: (keyIdx: number, commitIdx: number, slot: number) =>
    selectExisting(set, keyIdx, commitIdx, slot),
  downloadMembershipProof: (slot: number) => {
    let poolId = get().currPoolID
    let commitment = get().request.existing[slot]
    let state = get().pools.get(poolId)
    downloadJSON(
      JSON.stringify({
        membership: commitment.membershipProof(state!.stateTree)
      }),
      `membership_proof_${commitment.commitmentRoot}_${poolId}.json`
    )
  },
  insertNew: (keyIdx: number, value: bigint, slot: number) =>
    insertNew(set, keyIdx, value, slot),
  setExternIO: (io: [bigint, bigint]) => setExternIO(set, io),
  applyFee: (feeAmt: bigint, feeCollectorAddr: Hex, feeCollectorID: string) =>
    applyFee(set, feeAmt, feeCollectorAddr, feeCollectorID),
  computeProof: () => computeProof(get, set),
  executeRequest: () => executeRequest(get, set)
}))

/*** UTILITIES ***/
const addKey = (set: zustand.StoreApi<GlobalStore>["setState"]): Hex => {
  const newKey = generatePrivateKey()
  set((state) => {
    const keys = [...state.privKeys, newKey]
    downloadJSON(JSON.stringify({ keys: keys }), "privacy_pool_keys.json")
    return { ...state, privKeys: keys }
  })

  return newKey
}
// TODO Depreciate this
const selectKey = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  key: Hex
) => {}

const importKeys = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  data: string
) =>
  set((state) => {
    return { ...state, privKeys: JSON.parse(data).keys.map((k: Hex) => k) }
  })

const setTargetPool = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  poolID: string
) =>
  set((state) => {
    console.log("setTargetPool", poolID)
    if (PrivacyPools.has(poolID) && state.currPoolID != poolID) {
      return { ...state, currPoolID: poolID }
    }
    return { ...state }
  })

const sync = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  poolID: string,
  worker = loadWorkerDynamically()
) => {
  if (!worker) {
    throw new Error("Error: unable to load worker")
  }

  const meta = PrivacyPools.get(poolID)

  worker.postMessage({
    cmd: SYNC_POOL_STATE,
    poolID: poolID
  })

  set((state) => {
    return { ...state, isSyncing: true }
  })

  worker.onmessage = (event) => {
    const resp = event.data as WorkerResponse
    if (resp.error) {
      console.log(`caught error ${resp.error}`)
    }

    set((state) => {
      let privKeys = state.privKeys
      let pools = state.pools
      let commitments = state.commitments
      const poolState = NewPrivacyPoolSate()

      let poolCommitments: Commitment[][] = privKeys.map((key) => [])
      if (
        resp.cmd === SYNC_POOL_STATE &&
        resp.ciphers !== undefined &&
        resp.roots !== undefined
      ) {
        const { root, size, depth } = poolState.import(resp.roots)
        console.log(`there are ${resp.ciphers.length} ciphers to decrypt,
            state root of ${root}
            size of ${size} and depth of ${depth}`)

        poolCommitments = RecoverCommitments(
          privKeys.map((key) => PrivacyKey.from(key, 0n)),
          resp.ciphers!
        )
      }

      commitments.set(
        poolID,
        poolCommitments.map((x) => x.filter((c) => !poolState.has(c.nullRoot)))
      )

      pools.set(poolID, poolState)

      return {
        ...state,
        pools: pools,
        commitments: commitments,
        isSyncing: false
      }
    })

    worker.terminate()
  }
}

const updateSrc = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  address: Hex
) =>
  set((state) => {
    let _r = state.request
    _r.src = address
    return { ...state, request: _r }
  })

const updateSink = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  address: Hex
) => {
  if (address === "0xgeneratekey") {
    const newKey = addKey(set)
    address = PrivacyKey.from(newKey, 0n).publicAddr
  }

  set((state) => {
    let privKeys = state.privKeys
    let _r = state.request
    _r.sink = address
    return { ...state, request: _r }
  })
}

const selectExisting = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  keyIdx: number,
  commitIdx: number,
  slot: number
) =>
  set((state) => {
    let _r = state.request
    const meta = PrivacyPools.get(state.currPoolID)

    // check if poolID is valid
    let poolCommitments = state.commitments.get(state.currPoolID)
    if (poolCommitments === undefined) {
      throw new Error("Error: emtpy set of pool commitments")
    }
    /// Generate void commitment as std
    let targetCommitment: Commitment

    if (commitIdx >= 0) {
      // otherwise select the commitment at the given index
      targetCommitment = poolCommitments[keyIdx][commitIdx]
    } else {
      targetCommitment = CreateNewCommitment({
        _pK: state.privKeys[keyIdx],
        // auto set nonce to 0n for now
        _nonce: 0n,
        _scope: meta!.scope,
        _value: 0n
      })
      poolCommitments[keyIdx].push(targetCommitment)
    }

    _r.existing[slot] = targetCommitment
    _r.pkScalars[slot] = hexToBigInt(targetCommitment.toJSON().pkScalar)
    _r.nonces[slot] = 0n
    _r.keyIdx[slot] = keyIdx

    const { expected, actual } = GetNewSum(
      {
        new: _r.newValues.map((v) => DummyCommitment(v)),
        existing: _r.existing
      },
      _r.externIO
    )

    console.log(`expected sum: ${expected}, actual sum: ${actual}`)

    _r.sumNewValues = actual

    return { ...state, request: _r }
  })
const insertNew = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  keyIdx: number,
  value: bigint,
  slot: number
) =>
  set((state) => {
    const pool = PrivacyPools.get(state.currPoolID)
    if (pool === undefined) {
      throw new Error("Error: invalid pool")
    }
    if (keyIdx > state.privKeys.length) {
      throw new Error("Error: invalid key index")
    }
    const key = new PrivacyKey(state.privKeys[keyIdx])
    let _r = state.request

    _r.newValues[slot] = value
    _r.pkScalars[slot + 2] = key.pKScalar
    _r.keyIdx[slot + 2] = keyIdx
    _r.nonces[slot + 2] = 0n

    // update sum
    const { expected, actual } = GetNewSum(
      {
        new: _r.newValues.map((v) => DummyCommitment(v)),
        existing: _r.existing
      },
      _r.externIO
    )
    console.log(`expected sum: ${expected}, actual sum: ${actual}`)
    _r.sumNewValues = actual

    return { ...state, request: _r }
  })

const setExternIO = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  io: [bigint, bigint]
) =>
  set((state) => {
    let _r = state.request
    _r.externIO = io

    const { expected, actual } = GetNewSum(
      {
        new: _r.newValues.map((v) => DummyCommitment(v)),
        existing: _r.existing
      },
      _r.externIO
    )

    console.log(`expected sum: ${expected}, actual sum: ${actual}`)

    _r.sumNewValues = actual

    return { ...state, request: _r }
  })

const createNewCommitments = (set: zustand.StoreApi<GlobalStore>["setState"]) =>
  set((state) => {
    const pool = PrivacyPools.get(state.currPoolID)

    let request = state.request
    request.new = request.newValues.map((val, i) =>
      CreateNewCommitment({
        _pK: state.privKeys[request.keyIdx[i + 2]],
        // auto set nonce to 0n for now
        _nonce: 0n,
        _scope: pool ? pool.scope : 0n,
        _value: val
      })
    ) as [Commitment, Commitment]
    return { ...state, request: request }
  })

const applyFee = (
  set: zustand.StoreApi<GlobalStore>["setState"],
  feeAmt: bigint,
  feeCollectorAddr: Hex,
  feeCollectorID: string
) =>
  set((state) => {
    let _r = state.request
    _r.fee = feeAmt
    _r.feeCollector = feeCollectorAddr
    _r.feeCollectorID = feeCollectorID
    return { ...state, request: _r }
  })

const computeProof = (
  get: zustand.StoreApi<GlobalStore>["getState"],
  set: zustand.StoreApi<GlobalStore>["setState"],
  worker = loadWorkerDynamically()
) => {
  if (!worker) {
    throw new Error("Error: unable to load worker")
  }

  let request = get().request

  let poolID = get().currPoolID
  let poolState = get().pools.get(poolID)
  let meta = PrivacyPools.get(poolID)
  if (meta === undefined || poolState === undefined) {
    throw new Error(`Error: invalid poolID ${poolID}`)
  }

  let privKeys = get().privKeys

  request.new =
    request.new ??
    (request.newValues.map((val, i) =>
      CreateNewCommitment({
        _pK: privKeys[request.keyIdx[i + 2]],
        // auto set nonce to 0n for now
        _nonce: 0n,
        _scope: meta.scope,
        _value: val
      })
    ) as [Commitment, Commitment])

  /// @dev query contract directly to get the context value
  /// @todo implement the context function in TS to reduce RPC calls
  GetOnChainPrivacyPoolByPoolID(poolID)
    .context(request)
    .then((ctx) => {
      worker.postMessage({
        cmd: COMPUTE_PROOF_CMD,
        poolID: poolID,
        proofArgs: poolState.BuildCircuitInputs(
          meta.scope,
          ctx,
          request.pkScalars,
          request.nonces,
          request.existing,
          request.new!,
          request.externIO
        )
      })
    })
    .catch((err) => {
      throw new Error(`Error: unable to build circuit input: ${err}`)
    })

  set((state) => {
    return { ...state, isGeneratingProof: true }
  })

  worker.onmessage = (event) => {
    const resp = event.data as WorkerResponse
    if (resp.cmd === COMPUTE_PROOF_CMD && resp.proof !== undefined) {
      console.log(`received proof, verified: ${resp.proof.verified}`)
      set((state) => {
        return {
          ...state,
          isGeneratingProof: false,
          proof: resp.proof,
          request: request
        }
      })
    }
    if (resp.status == "failed") {
      console.log(`Received Error: ${resp.error}`)
      set((state) => {
        return {
          ...state,
          isGeneratingProof: false,
          request: request
        }
      })
    }
    worker.terminate()
  }
}

const executeRequest = (
  get: zustand.StoreApi<GlobalStore>["getState"],
  set: zustand.StoreApi<GlobalStore>["setState"]
) => {
  let request = get().request
  if (request.new === undefined) {
    throw new Error(`Error: new commitments are undefined`)
  }

  let signerKey = get().signerKey
  const acc = privateKeyToAccount(signerKey)

  let poolID = get().currPoolID
  let proof = get().proof
  if (proof === null) {
    throw new Error(`Error: proof is not generated`)
  }

  let meta = PrivacyPools.get(poolID)
  if (meta === undefined) {
    throw new Error(`Error: invalid poolID ${poolID}`)
  }

  // create a walletClient for the Key signer
  const wallet = createWalletClient({
    account: acc,
    chain: ChainNameIDToChain.get(meta.chainID),
    transport: http()
  }).extend(publicActions)

  set((state) => {
    return { ...state, isExecutingRequest: true }
  })

  // create pool instance & execute the request
  GetOnChainPrivacyPoolByPoolID(poolID)
    .processOnChain(wallet, request, proof.packedProof, false)
    .then((out) => {
      console.log(`Request processed: ${out}`)
      set((state) => {
        return {
          ...state,
          isExecutingRequest: false,
          reqStatus: out === false ? "failed simulation" : "pending",
          reqTxHash: out !== false ? (out as Hex) : numberToHex(0)
        }
      })
    })
    .catch((err) => {
      set((state) => {
        return {
          ...state,
          isExecutingRequest: false,
          reqStatus: `failed: ${err}`
        }
      })
    })
}
