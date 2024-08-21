import { createStore } from "zustand/vanilla"
import { downloadJSON } from "@/utils/files"
import { type Chain, gnosis, sepolia } from "viem/chains"
import { type Hex, numberToHex } from "viem"

import {
  type Commitment,
  createNewCommitment,
  type ICommitment,
  PrivacyKey,
  type PrivacyKeyJSON,
  RecoverFromJSON
} from "@privacy-pool-v1/domainobjs/ts"
import {
  ChainNameToChain,
  DEFAULT_CHAIN,
  ExistingPrivacyPools,
  getDefaultPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool/constants"
import type { PrivacyPoolMeta } from "@privacy-pool-v1/contracts/ts/privacy-pool/types"

import BigNumber from "bignumber.js"

export type AccountState = {
  keys: PrivacyKey[]
  selectedKey: PrivacyKey | undefined
  availChains: Chain[]
  existingPrivacyPools: Map<Chain, PrivacyPoolMeta[]>

  currChain: Chain
  currPool: PrivacyPoolMeta

  availCommits: Commitment[]
  keyCommitRoots: { [privateKey: Hex]: Hex[] }

  // relevant input values / objects
  inCommits: Commitment[]
  selectedCommitmentIndexes: [number | undefined, number | undefined]
  inTotalValue: BigNumber

  outValues: BigNumber[]
  outSplits: number[]
  outTotalValue: BigNumber

  outPrivacyKeys: PrivacyKey[]
  publicValue: BigNumber

  extraAmountIsValid: boolean
  extraAmountReason: string

  outputAmountIsValid: boolean[]
  outputAmountReasons: string[]
}

export interface AccountActions {
  generate: () => PrivacyKey
  notEmpty: () => boolean
  importFromJSON: (data: string) => void
  exportToJSON: (download: boolean) => string
  updateTargetPoolChain: (value: string) => void
  getCurrentPool: () => PrivacyPoolMeta

  getInCommitRoot: (index: number) => string
  getInCommit: (index: number) => Commitment
  updateInCommit: (index: number, value: string) => void
  refreshInTotalValue: () => void
  getInTotalValueFormatted: () => BigNumber
  updatePublicValue: (value: BigNumber) => void
  updateSelectedKey: (pK: Hex) => void
  updateKeyCommitRoots: (keyToCommitJSONs: {
    [privateKey: Hex]: ReturnType<ICommitment.CommitmentI["toJSON"]>[]
  }) => void

  updateOutputValue: (index: number, value: BigNumber) => void
  updateOutputPrivacyKey: (index: number, pubKeyHash: string) => void
  getOutputPubKeyHash: (index: number) => string

  isInputValid: () => { ok: boolean; reason: string }
  isOutputValid: () => { ok: boolean; reason: string }
}

export type KeyStore = AccountState & AccountActions

export const defaultInitState: AccountState = {
  keys: [],
  selectedKey: undefined,
  // circuit: NewPrivacyPoolCircuit('',''),
  keyCommitRoots: {},

  availChains: [sepolia, gnosis],
  existingPrivacyPools: ExistingPrivacyPools,

  currChain: sepolia,
  currPool: getDefaultPool(),
  availCommits: [],
  inCommits: [],
  selectedCommitmentIndexes: [undefined, undefined],

  publicValue: new BigNumber(0),
  inTotalValue: new BigNumber(0),

  outValues: [new BigNumber(0), new BigNumber(0)],
  outSplits: [100, 0],
  outPrivacyKeys: [],
  outTotalValue: new BigNumber(0),

  extraAmountIsValid: true,
  extraAmountReason: "",
  outputAmountIsValid: [false, false],
  outputAmountReasons: ["no encryption key set", "no encryption key set"]
}

export const createKeyStore = (initState: AccountState = defaultInitState) =>
  createStore<KeyStore>()((set, get) => ({
    ...initState,
    generate: (): PrivacyKey => {
      const key: PrivacyKey = PrivacyKey.generate(0n)
      set((state) => ({
        keys: [...state.keys, key]
      }))
      get().exportToJSON(true)

      // update the output keys if they are not set
      if (get().outPrivacyKeys.length === 0) {
        set((state) => ({
          outPrivacyKeys: [key, key]
        }))
      }

      const currentPool = get().currPool
      const poolScope = currentPool.scope

      // create void commitments if there is nothing available
      if (get().availCommits.length === 0) {
        set((state) => ({
          availCommits: [
            createNewCommitment({
              _pK: key.pKey,
              _value: 0n,
              _scope: poolScope,
              _nonce: 0n
            }),
            createNewCommitment({
              _pK: key.pKey,
              _value: 0n,
              _scope: poolScope,
              _nonce: 0n
            })
          ]
        }))
      }
      return key
    },
    notEmpty: (): boolean => {
      return get().keys.length > 0
    },
    importFromJSON: (data: string) => {
      const jsonObj = JSON.parse(data)
      if (jsonObj.keys === undefined) {
        throw new Error("Invalid JSON data")
      }

      const scope = get().currPool.scope

      const _new_keys = jsonObj.keys.map(
        (k: PrivacyKeyJSON) => new PrivacyKey(k.privateKey)
      )

      // set default output keys
      set((state) => ({
        keys: _new_keys,
        outPrivacyKeys: [_new_keys[0], _new_keys[1]],
        availCommits: [
          createNewCommitment({
            _pK: _new_keys[0].pKey,
            _value: 0n,
            _scope: scope,
            _nonce: 0n
          }),
          createNewCommitment({
            _pK: _new_keys[0].pKey,
            _value: 0n,
            _scope: scope,
            _nonce: 0n
          })
        ]
      }))
    },
    exportToJSON: (download: boolean): string => {
      const keys = Array.from(
        get().keys.map((key) => {
          return key.asJSON
        })
      )
      const keysJSON = JSON.stringify({ keys })
      if (download) {
        downloadJSON(keysJSON, "privacy_pool_keys.json")
      }
      return keysJSON
    },
    updateTargetPoolChain: (value: string) => {
      // value is chain name:pool id
      const chainName = value.split(":")[0]
      const poolID = value.split(":")[1]

      if (!ChainNameToChain.has(chainName)) {
        throw new Error(`Invalid chain name: ${chainName}`)
      }

      const chain = ChainNameToChain.get(chainName) || DEFAULT_CHAIN

      // find pool by chain
      const pools = get().existingPrivacyPools.get(chain)
      if (pools === undefined) {
        throw new Error("unsuppored chain")
      }

      // find pool by id
      const pool = pools.find((p) => p.id === poolID)
      if (pool === undefined) {
        throw new Error("Invalid pool id")
      }

      set((state) => ({
        currChain: chain,
        currPool: pool
      }))
    },
    updateSelectedKey: (pK) => {
      const key = get().keys.find((k) => k.pKey === pK)
      set((state) => ({
        selectedKey: key
      }))
    },
    // Commitment Roots are unique
    // whilst Hashes aren't.
    updateKeyCommitRoots: (keyToCommitJSONs) => {
      const commitRootMap: { [key: Hex]: Hex[] } = {}

      for (const key in keyToCommitJSONs) {
        if (keyToCommitJSONs.hasOwnProperty(key)) {
          commitRootMap[key as Hex] = keyToCommitJSONs[key as Hex].map(
            (commit) => numberToHex(BigInt(commit.cRoot))
          )
        }
      }
      // const keyToCommits: { [key: string]: Commitment[] } = {}
      const allCommits: Commitment[] = []

      for (const [key, commits] of Object.entries(keyToCommitJSONs)) {
        const commitments = commits.map((commit) => RecoverFromJSON(commit))
        // keyToCommits[key] = commitments
        allCommits.push(...commitments)
      }


      console.log('crm', commitRootMap)



      set((state) => ({
        keyCommitRoots: commitRootMap,
        availCommits: allCommits
      }))
    },
    getCurrentPool: (): PrivacyPoolMeta => {
      return get().currPool
    },
    getInCommit: (index: number): Commitment => {
      const newInCommits = get().inCommits
      console.log("getInCommit", newInCommits, index)
      return newInCommits[index]
    },
    getInCommitRoot: (index: number): string => {
      const rootHex = numberToHex(get().getInCommit(index)?.commitmentRoot || 0)
      return `${rootHex.substring(0, 14)}....${rootHex.substring(54)}`
    },
    updateInCommit: (inputIndex, value, commitIndex) => {
      console.log(
        inputIndex,
        value,
        commitIndex,
        get().availCommits.map((c) => numberToHex(c.commitmentRoot))
      )
      // verify that these commit are still available
      // match by commmitRoot
      const commit = get().availCommits.find(
        (c) => numberToHex(c.commitmentRoot) === value
      )

      if (commit === undefined) {
        throw new Error("Invalid commitment")
      }

      // then update the inCommits
      const newInCommits = get().inCommits
      newInCommits[inputIndex] = commit

      const newCommitIndexes = get().selectedCommitmentIndexes
      newCommitIndexes[inputIndex] = commitIndex

      // set the new inCommits
      set((state) => ({
        inCommits: newInCommits,
        selectedCommitmentIndexes: newCommitIndexes
      }))

      // update the total input value
      get().refreshInTotalValue()
    },
    refreshInTotalValue: () => {
      const _total_input: BigNumber = get().inCommits.reduce((acc, val) => {
        // only accumulate the value of the commit if it's still available
        const commit = get().availCommits.find((c) => c.isEqual(val))
        if (commit !== undefined) {
          return acc.plus(Number(commit.asTuple()[0]))
        }
        return acc
      }, new BigNumber(0))

      set((state) => ({
        inTotalValue: _total_input
      }))
    },

    getInTotalValueFormatted: () => {
      const unitRep = get().getCurrentPool().fieldElement
      return BigNumber(get().inTotalValue).decimalPlaces(
        Number(unitRep.precision)
      )
    },

    updatePublicValue: (value: BigNumber): void => {
      // calculate the total output value based on the public value
      // & input value
      const _expected_output = new BigNumber(
        get().getInTotalValueFormatted().plus(value)
      )

      const firstOutputVal = new BigNumber(
        get().outSplits[0] / 100
      ).multipliedBy(_expected_output)

      // rebalance the outValues based on the _total_output value & the split values
      const new_outValues = [
        firstOutputVal,
        _expected_output.minus(firstOutputVal)
      ]

      // reset prev validation messages for outputs
      let curr_outputAmountReasons = ["", ""]
      let curr_outputAmountIsValid = [true, true]

      set((state) => ({
        extraAmountIsValid: _expected_output.toNumber() >= 0,
        extraAmountReason:
          _expected_output.toNumber() < 0
            ? "total output value is negative"
            : "",
        publicValue: new BigNumber(value),
        outTotalValue: _expected_output,
        outValues: new_outValues,
        outputAmountIsValid: curr_outputAmountIsValid,
        outputAmountReasons: curr_outputAmountReasons
      }))
    },

    updateOutputValue: (index: number, value: BigNumber): void => {
      console.log('updateOutputValue', index, value.toString())
      // get current values
      const curr_outValues = get().outValues
      // update the value at the specified index
      curr_outValues[index] = value

      const curr_outSplits = get().outSplits
      let _total_output = BigNumber.sum(...curr_outValues)
      const _expected_output = get()
        .getInTotalValueFormatted()
        .plus(get().publicValue)

      // total output is negative alert user
      // immediately
      if (_total_output.lt(0)) {
        set((state) => ({
          outputAmountIsValid: [false, false],
          outputAmountReasons: [
            "total output value is negative",
            "total output value is negative"
          ]
        }))
      } else {
        // rebalance the output values based on the output
        if (_total_output !== _expected_output) {
          // if less
          // rebalance the output values so that the total output = expected_out
          const z = _expected_output.minus(value)
          curr_outValues[index == 0 ? 1 : 0] = z.abs()
        }
        _total_output = BigNumber.sum(...curr_outValues)

        // otherwise
        // calculate the new output splits
        const new_outPutSplits = curr_outSplits.map((val, i) =>
          new BigNumber(curr_outValues[i])
            .dividedBy(_total_output)
            .multipliedBy(100)
            .decimalPlaces(0)
            .toNumber()
        )
        if (new_outPutSplits[0] === 0 && new_outPutSplits[1] === 0) {
          new_outPutSplits[0] = 100
        }
        // despite trying to rebalance the output values
        // the total output is still more than expected
        // alert the user
        if (_total_output > _expected_output) {
          set((state) => ({
            outputAmountIsValid: [false, false],
            outputAmountReasons: [
              "total output is more than expected, adjust external amount or lower output amount",
              "total output is more than expected, adjust external amount or lower output amount"
            ]
          }))
        } else {
          set((state) => ({
            outValues: curr_outValues,
            outSplits: new_outPutSplits,
            outputAmountIsValid: [true, true],
            outputAmountReasons: ["", ""]
          }))
        }
      }
    },
    updateOutputPrivacyKey: (index: number, pubKeySerialized: string): void => {
      // iterate through keys and find the one with matching pubKeyHash
      const key = get().keys.find((pk) => pk.publicAddr === pubKeySerialized)
      if (key === undefined) {
        throw new Error("key not found")
      }
      const curr_outPrivacyKeys = get().outPrivacyKeys
      curr_outPrivacyKeys[index] = key
      set((state) => ({
        outPrivacyKeys: curr_outPrivacyKeys
      }))
    },
    getOutputPubKeyHash: (index: number): string => {
      const pK = get().outPrivacyKeys[index]
      if (pK === undefined) {
        return "0x"
      }
      return pK.publicAddr
    },
    isInputValid: (): { ok: boolean; reason: string } => {
      // check that all input commitments are set
      // and are available
      const _all_inputs_valid = [true, true]
      get().inCommits.forEach((inC, i) => {
        // check if it is available
        const commit = get().availCommits.find((c) => c.isEqual(inC))
        if (commit === undefined) {
          _all_inputs_valid[i] = false
        }
      })
      if (!_all_inputs_valid[0] || !_all_inputs_valid[1]) {
        return {
          ok: false,
          reason: "Input commitments must be set and available"
        }
      }
      return { ok: true, reason: "" }
    },
    isOutputValid: (): { ok: boolean; reason: string } => {
      const _all_keys_exists = [true, true]
      get().outPrivacyKeys.forEach((pK, i) => {
        if (pK === undefined) {
          _all_keys_exists[i] = false
        }
      })
      if (!_all_keys_exists[0] || !_all_keys_exists[1]) {
        return { ok: false, reason: "All output keys must be set" }
      }

      const _expected_output = get()
        .getInTotalValueFormatted()
        .plus(get().publicValue)
      const curr_outValues = get().outValues
      const _total_output = BigNumber.sum(...curr_outValues)

      if (_total_output.eq(0)) {
        return { ok: false, reason: "total output amount is 0" }
      }

      if (!_total_output.eq(_expected_output)) {
        return {
          ok: false,
          reason: "total output values does not match expected"
        }
      }
      return { ok: true, reason: "" }
    }
  }))
