import { createStore } from "zustand/vanilla"
import { downloadJSON } from "@/utils/files"
import { type Chain, sepolia, gnosis } from "viem/chains"
import { formatUnits, type Hex } from "viem"
import { numberToHex } from "viem"
import type {
  Commitment,
  ICommitment,
  PrivacyKeyJSON
} from "@privacy-pool-v1/domainobjs/ts"
import {
  PrivacyKey,
  createNewCommitment,
  CCommitment
} from "@privacy-pool-v1/domainobjs/ts"
import {
  getDefaultPool,
  ExistingPrivacyPools,
  ChainNameToChain,
  DEFAULT_CHAIN
} from "@privacy-pool-v1/contracts/ts/privacy-pool/constants"
import type {
  FEMeta,
  PrivacyPoolMeta
} from "@privacy-pool-v1/contracts/ts/privacy-pool/types"

import BigNumber from "bignumber.js"

export type AccountState = {
  keys: PrivacyKey[]
  selectedKey: PrivacyKey | undefined
  availChains: Chain[]
  ExistingPrivacyPools: Map<Chain, PrivacyPoolMeta[]>

  currChain: Chain
  currPool: PrivacyPoolMeta

  availCommits: Commitment[]
  keyCommitRoots: { [privateKey: Hex]: Hex[] }

  // relevant input values / objects
  inCommits: Commitment[]
  selectedCommitmentIndexes: [number | undefined, number | undefined]
  inTotalValue: number

  outValues: number[]
  outSplits: number[]
  outTotalValue: number

  outPrivacyKeys: PrivacyKey[]
  publicValue: number

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
  updateInCommit: (index: number, value: string, commitIndex: number) => void
  refreshInTotalValue: () => void
  getInTotalValueFormatted: () => number
  updatePublicValue: (value: number) => void
  updateSelectedKey: (pK: Hex) => void
  updateKeyCommitRoots: (keyToCommitJSONs: {
    [privateKey: Hex]: ReturnType<ICommitment.CommitmentI["toJSON"]>[]
  }) => void

  updateOutputValue: (index: number, value: number) => void
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
  ExistingPrivacyPools: ExistingPrivacyPools,

  currChain: sepolia,
  currPool: getDefaultPool(),
  availCommits: [],
  inCommits: [],
  selectedCommitmentIndexes: [undefined, undefined],

  publicValue: 0,
  inTotalValue: 0,

  outValues: [0.0, 0.0],
  outSplits: [100, 0],
  outPrivacyKeys: [],
  outTotalValue: 0,

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
              _pK: key.asJSON.privateKey,
              _value: 0n,
              _scope: poolScope,
              _nonce: 0n
            }),
            createNewCommitment({
              _pK: key.asJSON.privateKey,
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
      const pools = get().ExistingPrivacyPools.get(chain)
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
      const key = get().keys.find((k) => k.asJSON.privateKey === pK)
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
            (commit) => BigInt(commit.cRoot).toString(16) as Hex
          )
        }
      }
      const allCommits = Object.values(keyToCommitJSONs)
        .flat()
        .map((commitJSON) => {
          return CCommitment.CommitmentC.recoverFromJSON(commitJSON)
        })

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
      return newInCommits[index]
    },
    getInCommitRoot: (index: number): string => {
      const rootHex = numberToHex(get().getInCommit(index).commitmentRoot)
      return `${rootHex.substring(0, 14)}....${rootHex.substring(54)}`
    },
    updateInCommit: (inputIndex, value, commitIndex) => {
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
      const _total_input: number = get().inCommits.reduce((acc, val) => {
        // only accumulate the value of the commit if it's still available
        const commit = get().availCommits.find((c) => c.isEqual(val))
        if (commit !== undefined) {
          return acc + Number(commit.asTuple()[0])
        }
        return acc
      }, 0)

      set((state) => ({
        inTotalValue: _total_input
      }))
    },

    getInTotalValueFormatted: (): number => {
      const unitRep = get().getCurrentPool().fieldElement
      return Number(
        formatUnits(BigInt(get().inTotalValue), Number(unitRep.precision))
      )
    },

    updatePublicValue: (value: number): void => {
      // calculate the total output value based on the public value
      // & input value
      const _expected_output = new BigNumber(
        get().getInTotalValueFormatted() + value
      )

      const firstOutputVal = new BigNumber(
        (get().outSplits[0] / 100) * _expected_output.toNumber()
      )

      // rebalance the outValues based on the _total_output value & the split values
      set((state) => ({
        extraAmountIsValid: _expected_output.toNumber() >= 0,
        extraAmountReason:
          _expected_output.toNumber() < 0
            ? "total output value is negative"
            : "",
        publicValue: value,
        outTotalValue: _expected_output.toNumber(),
        outValues: [
          firstOutputVal.toNumber(),
          _expected_output.minus(firstOutputVal).toNumber()
        ],
        // reset prev validation messages for outputs
        outputAmountIsValid: [true, true],
        outputAmountReasons: ["", ""]
      }))
    },

    updateOutputValue: (index: number, value: number): void => {
      // get current values
      const curr_outValues = get().outValues
      // update the value at the specified index
      curr_outValues[index] = value

      const curr_outSplits = get().outSplits
      let _total_output = curr_outValues.reduce((acc, val) => acc + val, 0)
      const _expected_output =
        get().getInTotalValueFormatted() + get().publicValue

      // total output is negative alert user
      // immediately
      if (_total_output < 0) {
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
          const z = _expected_output - value
          curr_outValues[index === 0 ? 1 : 0] = Math.abs(z)
        }
        _total_output = curr_outValues.reduce((acc, val) => acc + val, 0)

        // otherwise
        // calculate the new output splits
        const new_outPutSplits = curr_outSplits.map((val, i) => {
          return Math.round((curr_outValues[i] / _total_output) * 100)
        })
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

      const _expected_output =
        get().getInTotalValueFormatted() + get().publicValue
      const curr_outValues = get().outValues
      const _total_output = curr_outValues.reduce((acc, val) => acc + val, 0)

      if (_total_output === 0) {
        return { ok: false, reason: "total output amount is 0" }
      }

      if (_total_output !== _expected_output) {
        return {
          ok: false,
          reason: "total output values does not match expected"
        }
      }
      return { ok: true, reason: "" }
    }
  }))
