import fs from "fs"
import path from "path"

import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import {
  CreateCommitment,
  CreatePrivacyKey
} from "@privacy-pool-v1/core-ts/account"

import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight, stringifyBigInts } from "maci-crypto"

// function will generate 2 input amounts & 2 output amounts
function generateTestAmounts(
  numOfElements: number,
  minValue: bigint,
  maxValue: bigint
): bigint[][] {
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

function exportToJSON(data: any, filePath: string): void {
  try {
    const jsonData = JSON.stringify(data, null, 2) // Convert the object to JSON with pretty formatting
    fs.writeFileSync(filePath, jsonData) // Write the JSON data to the file
    console.log(`Data exported successfully to ${filePath}`)
  } catch (err) {
    console.error("Error exporting data:", err)
  }
}

export function generateCircuitInputsFn(
  howMuch: number,
  outputDir?: string,
  filePrefix: string = "testcase_"
) {
  let mt = new LeanIMT(hashLeftRight)
  let keys = Array.from({ length: 10 }, () => CreatePrivacyKey())
  let i = 0
  generateTestAmounts(howMuch, 0n, 500n).forEach((values) => {
    const filename = filePrefix + `${i++}.json`
    const filePath = path.join(outputDir || "", filename)
    console.log(`Generating test inputs for ${filePath}`)
    // create input commitments
    // with randomly selected keys
    const input_commitments = Array.from({ length: 2 }, () => {
      const commitment = CreateCommitment(
        keys[Math.floor(Math.random() * keys.length)],
        {
          amount: values[i]
        },
        0n
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
        amount: values[2]
      }),
      CreateCommitment(keys[Math.floor(Math.random() * keys.length)], {
        amount: values[3]
      })
    ]

    const circuitInputs = FnPrivacyPool.GetInputsFn(
      mt,
      input_commitments,
      output_comitments,
      100n // doesn't matter for now
    )

    const inputs = stringifyBigInts(circuitInputs)
    // need to convert circuitInput values as string

    // export it as a json file
    exportToJSON(
      {
        inputs: inputs,
        expectedValues: {
          inCommitments: input_commitments.map((c) =>
            stringifyBigInts(c.asStringValues())
          ),
          outCommitments: output_comitments.map((c) =>
            stringifyBigInts(c.asStringValues())
          ),
          computedMerkleRoot: mt.root.toString()
        },
        ouptuts: [mt.root.toString()]
      },
      filePath
    )
  })
}
