import { type StateCreator } from "zustand"
import {
  type Commitment,
  CreateNewCommitment,
  DummyCommitment,
  PrivacyKey
} from "@privacy-pool-v1/domainobjs/ts"
import {
  createWalletClient,
  type Hex,
  hexToBigInt,
  http,
  numberToHex,
  publicActions
} from "viem"
import { GetNewSum } from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import {
  ChainNameIDToChain,
  GetOnChainPrivacyPoolByPoolID,
  PrivacyPools
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import { privateKeyToAccount } from "viem/accounts"
import {
  type CompleteStore,
  type IOCommitments,
  type RequestSlice,
  RequestType
} from "@/stores/types.ts"

const requestSliceDefaultValue = {
  src: numberToHex(0),
  sink: numberToHex(0),
  feeCollectorID: "",
  feeCollector: numberToHex(0),
  fee: 0n,
  newValues: [0n, 0n] as [bigint, bigint],
  sumNewValues: 0n,
  new: [undefined, undefined] as IOCommitments,
  existing: [undefined, undefined] as IOCommitments,
  keyIdx: [0, 0, 0, 0] as [number, number, number, number],
  pkScalars: [0n, 0n, 0n, 0n] as [bigint, bigint, bigint, bigint],
  nonces: [0n, 0n, 0n, 0n] as [bigint, bigint, bigint, bigint],
  externIO: [0n, 0n] as [bigint, bigint],
  reqType: RequestType.OneToOne,

  // The status of the onchain request
  // "": no request
  // "failed simulation": request failed during simulation
  // "failed": request failed onchain
  // "success": request success
  reqStatus: "pending",
  reqTxHash: numberToHex(0)
}

export const createRequestSlice: StateCreator<
  CompleteStore,
  [],
  [],
  RequestSlice
> = (set, get) => ({
  ...requestSliceDefaultValue,

  updateSrc: (address: Hex) => set((state) => ({ ...state, src: address })),
  updateSink: (address: Hex) => set((state) => ({ ...state, sink: address })),
  getStatus: () => {
    const state = get()
    const {
      existing,
      reqType,
      externIO,
      src,
      sink,
      newValues,
      new: newCommitments
    } = state
    const noInputCommits =
      reqType === RequestType.TwoToOne
        ? !existing[0] || !existing[1]
        : !existing[0]
    const noOutput =
      reqType === RequestType.OneToTwo
        ? !newCommitments[0] && !newCommitments[1] && !externIO[1]
        : !newCommitments[0] && !externIO[1]
    const isDuplicateCommitments =
      reqType === RequestType.TwoToOne &&
      existing[0]?.nullRoot === existing[1]?.nullRoot
    const isInvalidExternIO = externIO[0] < 0n || externIO[1] < 0n
    const isInvalidSrc = src === numberToHex(0) && externIO[0] !== 0n
    const isInvalidSink = sink === numberToHex(0) && externIO[1] !== 0n
    const isVoidCommits =
      reqType === RequestType.OneToTwo
        ? newCommitments[0]?.isVoid() && newCommitments[1]?.isVoid()
        : newCommitments[0]?.isVoid()

    if (noInputCommits) {
      return "existing commitments are not selected"
    }
    if (isDuplicateCommitments) {
      return "duplicate existing commitments"
    }
    if (isVoidCommits) {
      return reqType === RequestType.OneToTwo
        ? "only 1 of new commitments can be void"
        : "new commitment can't be void"
    }
    if (isInvalidExternIO || isInvalidSrc || isInvalidSink) {
      return "invalid external input / output"
    }

    const { expected, actual } = GetNewSum(
      {
        new:
          reqType === RequestType.TwoToOne
            ? [DummyCommitment(newValues[0])]
            : newValues.map((v) => DummyCommitment(v)),
        existing:
          reqType === RequestType.OneToTwo
            ? [existing[0] || DummyCommitment()]
            : existing.map((c) => c || DummyCommitment())
      },
      externIO
    )

    if (expected !== actual || expected < 0n || actual < 0n) {
      return "invalid values"
    }

    return "valid"
  },
  getTotalNew: () =>
    (get().reqType === RequestType.TwoToOne
      ? [get().newValues[0]]
      : get().newValues
    ).reduce((acc, val) => acc + val, 0n) + get().externIO[1],
  getTotalExisting: () => {
    const { existing = [undefined, undefined], externIO, reqType } = get()
    return (
      (reqType === RequestType.OneToTwo ? [existing[0]] : existing).reduce(
        (acc, val) => acc + (val ? val.asTuple()[0] : 0n),
        0n
      ) + externIO[0]
    )
  },
  selectExisting: (keyIdx: number, commitIdx: number, slot: number) => {
    const { commitments, currPoolID, existing, newValues, externIO, reqType } =
      get()
    const poolCommitments = commitments.get(currPoolID)
    if (poolCommitments === undefined) {
      throw new Error("Error: empty set of pool commitments")
    }
    const targetCommitment = poolCommitments[keyIdx][commitIdx]

    const updExisting = [...existing].filter((a) => !!a) as IOCommitments
    updExisting[slot] = targetCommitment

    const { expected, actual } = GetNewSum(
      {
        new:
          reqType === RequestType.TwoToOne
            ? [DummyCommitment(newValues[0])]
            : newValues.map((v) => DummyCommitment(v)),
        existing:
          reqType === RequestType.OneToTwo
            ? [updExisting[0] || DummyCommitment()]
            : updExisting
                .filter((c): c is Commitment => c !== undefined)
                .map((c) => c || DummyCommitment())
      },
      externIO
    )

    console.log(`expected sum: ${expected}, actual sum: ${actual}`)

    set((state) => {
      const updatedState = { ...state }
      updatedState.existing = updExisting
      updatedState.pkScalars[slot] = hexToBigInt(
        targetCommitment.toJSON().pkScalar
      )
      updatedState.nonces[slot] = 0n
      updatedState.keyIdx[slot] = keyIdx
      updatedState.sumNewValues = actual

      return updatedState
    })
  },
  insertNew: (keyIdx: number, value: bigint, slot: number) => {
    set((state) => {
      const pool = PrivacyPools.get(state.currPoolID)
      if (pool === undefined) {
        throw new Error("Error: invalid pool")
      }
      if (keyIdx > state.privKeys.length) {
        throw new Error("Error: invalid key index")
      }
      const key = new PrivacyKey(state.privKeys[keyIdx])

      const updatedState = { ...state }
      updatedState.newValues[slot] = value
      updatedState.pkScalars[slot + 2] = key.pKScalar
      updatedState.keyIdx[slot + 2] = keyIdx
      updatedState.nonces[slot + 2] = 0n

      const { expected, actual } = GetNewSum(
        {
          new:
            state.reqType === RequestType.TwoToOne
              ? [DummyCommitment(updatedState.newValues[0])]
              : updatedState.newValues.map((v) => DummyCommitment(v)),
          existing:
            state.reqType === RequestType.OneToTwo
              ? [updatedState.existing[0] || DummyCommitment()]
              : updatedState.existing.map((c) => c || DummyCommitment())
        },
        updatedState.externIO
      )
      console.log(`expected sum: ${expected}, actual sum: ${actual}`)
      updatedState.sumNewValues = actual

      return updatedState
    })
  },
  createNewCommitments: () => {
    set((state) => {
      const pool = PrivacyPools.get(state.currPoolID)
      return {
        ...state,
        new: (state.reqType === RequestType.TwoToOne
          ? [state.newValues[0]]
          : state.newValues
        ).map((val, i) =>
          CreateNewCommitment({
            _pK: state.privKeys[state.keyIdx[i + 2]],
            // auto set nonce to 0n for now
            _nonce: 0n,
            _scope: pool ? pool.scope : 0n,
            _value: val
          })
        ) as [Commitment, Commitment]
      }
    })
  },
  setExternIO: (io: [bigint, bigint]) => {
    set((state) => {
      const updatedState = { ...state }
      updatedState.externIO = io

      const { expected, actual } = GetNewSum(
        {
          new:
            state.reqType === RequestType.TwoToOne
              ? [DummyCommitment(updatedState.newValues[0])]
              : updatedState.newValues.map((v) => DummyCommitment(v)),
          existing:
            state.reqType === RequestType.OneToTwo
              ? [updatedState.existing[0] || DummyCommitment()]
              : updatedState.existing.map((c) => c || DummyCommitment())
        },
        updatedState.externIO
      )

      console.log(`expected sum: ${expected}, actual sum: ${actual}`)
      updatedState.sumNewValues = actual

      return updatedState
    })
  },
  applyFee: (fee: bigint, feeCollectorAddr: Hex, feeCollectorID: string) => {
    set((state) => ({
      ...state,
      fee: fee,
      feeCollectorID: feeCollectorID,
      feeCollector: feeCollectorAddr
    }))
  },
  changeRequestType: (type: RequestType) =>
    set((state) => ({ ...state, reqType: type })),
  resetRequestState: () => set(requestSliceDefaultValue),
  executeRequest: () => {
    const state = get()
    if (get().new === undefined) {
      throw new Error(`Error: new commitments are undefined`)
    }

    const signerKey = state.signerKey
    const signerPubAddr = new PrivacyKey(signerKey, 0n).publicAddr
    const acc = privateKeyToAccount(signerKey)

    const requestSlice = {
      src: state.src === numberToHex(0) ? signerPubAddr : state.src,
      sink: state.sink === numberToHex(0) ? signerPubAddr : state.sink,
      feeCollectorID: state.feeCollectorID,
      feeCollector: state.feeCollector,
      fee: state.fee,
      existing:
        state.reqType === RequestType.OneToTwo
          ? [state.existing[0]]
          : state.existing,
      newValues:
        state.reqType === RequestType.TwoToOne
          ? [state.newValues[0]]
          : state.newValues,
      sumNewValues: state.sumNewValues,
      new: state.new,
      keyIdx: state.keyIdx,
      pkScalars: state.pkScalars,
      nonces: state.nonces,
      externIO: state.externIO,
      reqStatus: state.reqStatus,
      reqTxHash: state.reqTxHash,
      updateSrc: state.updateSrc,
      updateSink: state.updateSink,
      getTotalNew: state.getTotalNew,
      getTotalExisting: state.getTotalExisting,
      selectExisting: state.selectExisting,
      insertNew: state.insertNew,
      createNewCommitments: state.createNewCommitments,
      setExternIO: state.setExternIO,
      applyFee: state.applyFee,
      executeRequest: state.executeRequest
    }

    const poolID = state.currPoolID
    const proof = state.proof
    if (proof === null) {
      throw new Error(`Error: proof is not generated`)
    }

    const meta = PrivacyPools.get(poolID)
    if (!meta) {
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
      .processOnChain(wallet, requestSlice, proof.packedProof, false)
      .then((out) => {
        set((state) => ({
          ...state,
          isExecutingRequest: false,
          reqStatus: out === false ? "failed simulation" : "success",
          reqTxHash: out !== false ? (out as Hex) : numberToHex(0)
        }))
      })
      .catch((err) => {
        set((state) => ({
          ...state,
          isExecutingRequest: false,
          reqStatus: `failed: ${err}`
        }))
      })
  }
})
