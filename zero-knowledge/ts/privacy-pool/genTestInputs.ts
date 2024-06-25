import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import {
  CreateCommitment,
  CreatePrivacyKey
} from "@privacy-pool-v1/core-ts/account"

import { LeanIMT } from "@zk-kit/lean-imt"
import { poseidon2 } from "poseidon-lite/poseidon2"

//import { hashLeftRight } from "maci-crypto"

// function will generate 2 input amounts & 2 output amounts
export const generateTestAmounts = (
  numOfElements: number,
  minValue: bigint,
  maxValue: bigint
): bigint[][] => {
  if (numOfElements < 0) {
    throw new Error("numOfElements must be a non-negative number")
  }

  if (minValue < 0 || maxValue < 0) {
    throw new Error("values must be a non-negative number")
  }

  if (minValue >= maxValue) {
    throw new Error("minValue must be less than maxValue")
  }

  const range = maxValue - minValue + 1n // Calculate the range of possible values

  return Array.from({ length: numOfElements }, () => {
    return [
      BigInt(Math.floor(Math.random() * Number(range))) + minValue,
      BigInt(Math.floor(Math.random() * Number(range))) + minValue,
      BigInt(Math.floor(Math.random() * Number(range))) + minValue,
      BigInt(Math.floor(Math.random() * Number(range))) + minValue
    ]
  })
}

export const genTestCircuitInputsFn = (numberOfTests: number) => {
  const mt = new LeanIMT((a, b) => poseidon2([a, b]))

  // generate random set of keys
  const keys = Array.from({ length: numberOfTests }, () => CreatePrivacyKey())
  return generateTestAmounts(numberOfTests, 0n, 500n).map((values) => {
    // create input commitments
    // with randomly selected keys
    const input_commitments = [0, 1].map((i) => {
      const commitment = CreateCommitment(
        keys[Math.floor(Math.random() * keys.length)],
        {
          value: values[i]
        }
      )
      // only inert into the tree if it's not a dummy commitment
      if (!commitment.isDummy) {
        // insert it into the tree so we can generate merkle proofs
        mt.insert(commitment.hash)
        commitment.index = BigInt(mt.size - 1)
      }
      return commitment
    })

    // create output commitments
    // with randomly selected keys
    const output_comitments = [
      CreateCommitment(keys[Math.floor(Math.random() * keys.length)], {
        value: values[2]
      }),
      CreateCommitment(keys[Math.floor(Math.random() * keys.length)], {
        value: values[3]
      })
    ]

    return {
      io: FnPrivacyPool.GetInputsFn(
        mt,
        32,
        input_commitments,
        output_comitments,
        100n // doesn't matter for now
      ),
      commitments: {
        inCommitments: input_commitments,
        outCommitments: output_comitments
      }
    }
  })
}
