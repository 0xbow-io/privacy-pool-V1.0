import { createStore } from "zustand/vanilla"
import { downloadJSON } from "@/utils/files"
import { type Chain, sepolia, gnosis } from "viem/chains"
import { formatUnits } from "viem"
import type { Commitment } from "@privacy-pool-v1/domainobjs/ts"
import { PrivacyKey, createNewCommitment } from "@privacy-pool-v1/domainobjs/ts"

import type { SimpleFEMeta, PrivacyPoolMeta } from "@/network/pools"
import {
  PrivacyPools,
  SupportSimpleFieldElements,
  ChainNameToChain
} from "@/network/pools"

export type AccountState = {
  keys: PrivacyKey[]
  availChains: Chain[]
  avilPools: Map<Chain, PrivacyPoolMeta[]>
  supportedSimpleFieldElements: Map<Chain, SimpleFEMeta[]>

  currChain: Chain
  currPool: PrivacyPoolMeta
  currUnitRepresentative: SimpleFEMeta

  // circuit: PrivacyPoolCircuit

  avilCommits: Commitment[]

  // relevant input values / objects
  inCommits: string[] // hash of the commitments chosen as input
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

  // TEMP Implementation
  verifierKey: any
}

export interface AccountActions {
  generate: () => PrivacyKey
  notEmpty: () => boolean
  importFromJSON: (data: string) => void
  exportToJSON: (download: boolean) => string
  updateTargetPoolChain: (value: string) => void
  getCurrentPool: () => PrivacyPoolMeta

  getAvailableInputOptions: (index: number) => string[]
  updateInCommit: (index: number, value: string) => void
  refreshInTotalValue: () => void
  getInTotalValueFormatted: () => number
  updatePublicValue: (value: number) => void

  updateOutputValue: (index: number, value: number) => void
  updateOutputPrivacyKey: (index: number, pubKeyHash: string) => void
  getOutputPubKeyHash: (index: number) => string

  isInputValid: () => { ok: boolean; reason: string }
  isOutputValid: () => { ok: boolean; reason: string }
}

export type KeyStore = AccountState & AccountActions

export const defaultInitState: AccountState = {
  keys: [],
  verifierKey: null,
  // circuit: NewPrivacyPoolCircuit('',''),

  availChains: [sepolia, gnosis],
  avilPools: PrivacyPools,
  supportedSimpleFieldElements: SupportSimpleFieldElements,

  currChain: sepolia,
  currPool: PrivacyPools.get(sepolia)![0],
  currUnitRepresentative: SupportSimpleFieldElements.get(sepolia)![0],

  avilCommits: [],
  inCommits: ["", ""],

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
      if (get().outPrivacyKeys.length == 0) {
        set((state) => ({
          outPrivacyKeys: [key, key]
        }))
      }

      const currentPool = get().currPool
      const poolScope = currentPool.scope

      // create dummy commitments if there is nothing available
      if (get().avilCommits.length == 0) {
        set((state) => ({
          avilCommits: [
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

      const _new_keys = jsonObj.keys.map(
        (k: any) => new PrivacyKey(k.privateKey)
      )

      // set default output keys
      set((state) => ({
        keys: _new_keys,
        outPrivacyKeys: [_new_keys[0], _new_keys[0]],
        avilCommits: [
          createNewCommitment({
            _pK: _new_keys[0].asHex,
            _value: 0n,
            _scope: 0n,
            _nonce: 0n
          }),
          createNewCommitment({
            _pK: _new_keys[0].asHex,
            _value: 0n,
            _scope: 0n,
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
        throw new Error("Invalid chain name: " + chainName)
      }

      const chain = ChainNameToChain.get(chainName)!

      // find pool by id
      const pool = get()
        .avilPools.get(chain)!
        .find((p) => p.id === poolID)
      if (pool === undefined) {
        throw new Error("Invalid pool id")
      }

      set((state) => ({
        currChain: chain,
        currPool: pool,
        currUnitRepresentative: SupportSimpleFieldElements.get(chain)![0]
      }))
    },
    getCurrentPool: (): PrivacyPoolMeta => {
      return get().currPool
    },
    updateInCommit: (index: number, value: string) => {
      // verify that these commit are still available
      const commit = get().avilCommits.find(
        (c) => c.hash().toString(16) === value
      )
      if (commit === undefined) {
        throw new Error("commit not available: " + value)
      }

      // then update the inCommits
      const curr_inCommits = get().inCommits
      curr_inCommits[index] = value

      // set the new inCommits
      set((state) => ({
        inCommits: curr_inCommits
      }))

      // update the total input value
      get().refreshInTotalValue()
    },
    // goes through availCommits that has hashes not in the inCommits
    getAvailableInputOptions: (index: number) => {
      const _input_taken = get().inCommits[index == 0 ? 1 : 0]
      const avail = get().avilCommits.filter(
        (c) => c.hash().toString(16) !== _input_taken
      )
      return avail.map((c) => c.hash().toString(16))
    },
    refreshInTotalValue: () => {
      const _total_input: number = get().inCommits.reduce((acc, val) => {
        const commit = get().avilCommits.find(
          (c) => c.hash().toString(16) === val
        ) // only add the value if the commit is available
        if (commit !== undefined) {
          acc += Number(commit.asTuple()[0])
        }
        return acc
      }, 0)

      set((state) => ({
        inTotalValue: _total_input
      }))
    },

    getInTotalValueFormatted: (): number => {
      const unitRep = get().currUnitRepresentative
      return Number(
        formatUnits(BigInt(get().inTotalValue), Number(unitRep.decimals))
      )
    },

    updatePublicValue: (value: number): void => {
      // calculate the total output value based on the public value
      // & input value
      const _expected_output = get().getInTotalValueFormatted() + value

      // rebalance the outValues based on the _total_output value & the split values
      const new_outValues = get().outSplits.map((val, i) => {
        return Math.round((val / 100) * _expected_output)
      })

      // reset prev validation messages for outputs
      let curr_outputAmountReasons = ["", ""]
      let curr_outputAmountIsValid = [true, true]

      set((state) => ({
        extraAmountIsValid: _expected_output >= 0,
        extraAmountReason:
          _expected_output < 0 ? "total output value is negative" : "",
        publicValue: value,
        outTotalValue: _expected_output,
        outValues: new_outValues,
        outputAmountIsValid: curr_outputAmountIsValid,
        outputAmountReasons: curr_outputAmountReasons
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

      // reset prev validation messages
      let curr_outputAmountReasons = ["", ""]
      let curr_outputAmountIsValid = [true, true]

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
        if (_total_output != _expected_output) {
          // if less
          // rebalance the output values so that the total output = expected_out
          const z = _expected_output - value
          curr_outValues[index == 0 ? 1 : 0] = Math.abs(z)
        }
        _total_output = curr_outValues.reduce((acc, val) => acc + val, 0)

        // otherwise
        // calculate the new output splits
        const new_outPutSplits = curr_outSplits.map((val, i) => {
          return Math.round((curr_outValues[i] / _total_output) * 100)
        })
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
            outputAmountIsValid: curr_outputAmountIsValid,
            outputAmountReasons: curr_outputAmountReasons
          }))
        }
      }
    },
    updateOutputPrivacyKey: (index: number, pubKeySerialized: string): void => {
      // iterate through keys and find the one with matching pubKeyHash
      const key = get().keys.find(
        (pk) => pk.keypair.pubKey.serialize() === pubKeySerialized
      )
      if (key === undefined) {
        throw new Error("No key found with: " + pubKeySerialized)
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
      return pK.keypair.pubKey.serialize()
    },
    isInputValid: (): { ok: boolean; reason: string } => {
      // check that all input commitments are set
      // and are available
      let _all_inputs_valid = [true, true]
      get().inCommits.forEach((hash, i) => {
        if (hash === "") {
          _all_inputs_valid[i] = false
        }
        // check if it is available
        const commit = get().avilCommits.find(
          (c) => c.hash().toString(16) === hash
        )
        if (commit === undefined) {
          _all_inputs_valid[i] = false
        }
      })
      if (!_all_inputs_valid[0] || !_all_inputs_valid[1]) {
        return {
          ok: false,
          reason: "input commitments must be set and available"
        }
      }
      return { ok: true, reason: "" }
    },
    isOutputValid: (): { ok: boolean; reason: string } => {
      let _all_keys_exists = [true, true]
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

      if (_total_output == 0) {
        return { ok: false, reason: "total output amount is 0" }
      }

      if (_total_output != _expected_output) {
        return {
          ok: false,
          reason: "total output values does not match expected"
        }
      }

      return { ok: true, reason: "" }
    }
  }))
