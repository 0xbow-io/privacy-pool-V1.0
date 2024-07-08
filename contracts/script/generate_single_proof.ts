// build to js with bun:
// bun build --entrypoints ./generate_single_proof.ts --outfile generate_single_proof.js --target node
// then run as: ts-node ./generate_single_proof.js 123 456 10000 789 13 101112

import fs from "node:fs"
import path from "node:path"
import type { circomArtifactPaths } from "@privacy-pool-v1/global"
import { PrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { FnPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import { cleanThreads } from "@privacy-pool-v1/global/utils/utils"
import type { Hex } from "viem"
import { generatePrivateKey } from "viem/accounts"
import { NewCommitment } from "@privacy-pool-v1/core-ts/domain"
import type { Commitment } from "@privacy-pool-v1/core-ts/domain"
import crypto from "node:crypto"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import type { StdPackedGroth16ProofT } from "@privacy-pool-v1/core-ts/zk-circuit"
import { encodeAbiParameters, parseAbiParameters } from "viem"

// Define the struct as ABI parameters
const groth16ProofParams = [
  {
    name: "proof",
    type: "tuple",
    components: [
      { name: "_pA", type: "uint256[2]" },
      { name: "_pB", type: "uint256[2][2]" },
      { name: "_pC", type: "uint256[2]" },
      { name: "_pubSignals", type: "uint256[36]" }
    ]
  }
]

const paths: circomArtifactPaths = PrivacyPool.circomArtifacts(false)
const prover = FnPrivacyPool.ProveFn(paths.WASM_PATH, paths.ZKEY_PATH)
const verifier = FnPrivacyPool.VerifyFn(
  fs.readFileSync(paths.VKEY_PATH, "utf-8")
)

/**
 * Generate a single proof from 2 void existing commitments
 * to generate 2 new commitments of random values
 * with the constraints & params passed down through args:
 * * scope: bigint
 * * context: bigint
 * * externalIO: [bigint, bigint]
 * * actualTreeDepth
 * * existingStateRoot
 * Print out the proof to stdout if successful
 *
 * This script is meant to be invoked by a Forge Test Case
 * through ffi
 *
 * Note: Working with circuit params ==> (32, 7 , 4, 2, 2)
 */

type ArgsJson = {
  scope: bigint
  context: bigint
  externalIO: [bigint, bigint]
  actualTreeDepth: bigint
  existingStateRoot: bigint
}

function parseArgs(): ArgsJson {
  // Skip the first two elements (node executable and script name)
  const args = process.argv.slice(2)

  if (args.length !== 6) {
    throw new Error("Invalid number of arguments. Expected 6 arguments.")
  }
  return {
    scope: BigInt(args[0]),
    context: BigInt(args[1]),
    externalIO: [BigInt(args[2]), BigInt(args[3])],
    actualTreeDepth: BigInt(args[4]),
    existingStateRoot: BigInt(args[5])
  }
}

function splitBigIntRandomly(value: bigint): [bigint, bigint] {
  if (value <= 0n) {
    throw new Error("Input must be a positive BigInt")
  }

  // Generate a random BigInt between 0 and value (inclusive)
  const randomBytes = crypto.randomBytes(value.toString(16).length)
  const randomBigInt = BigInt(`0x${randomBytes.toString("hex")}`) % (value + 1n)

  const part1 = randomBigInt
  const part2 = value - part1

  return [part1, part2]
}

const randInputGenerator = (args = parseArgs()) => {
  //console.log("Parsing arguments:", args)

  // since we are computing new commitments from void commitments
  // external output can't be > external input
  if (args.externalIO[0] <= args.externalIO[1]) {
    throw new Error("External output must be greater than external input")
  }
  const values = [
    0n,
    0n,
    ...splitBigIntRandomly(args.externalIO[0] - args.externalIO[1])
  ]
  //console.log("Generated values:", values)

  const keys = [0, 1, 2, 3].map(() => generatePrivateKey())
  const commits: Commitment[] = [0, 1, 2, 3].map((i) => {
    const c = NewCommitment({
      _pK: keys[i],
      _nonce: BigInt(i),
      _scope: args.scope,
      _value: values[i]
    })
    return c
  })
  return {
    scope: args.scope,
    actualTreeDepth: args.actualTreeDepth,
    context: args.context,
    externIO: args.externalIO,
    existingStateRoot: args.existingStateRoot,
    newSaltPublicKey: commits.slice(2, 4).map((c) => c.public().saltPk),
    newCiphertext: commits
      .slice(2, 4)
      .map((c) => c.public().cipher.map((x) => x as bigint)),
    privateKey: keys.map((k) => deriveSecretScalar(k)),
    nonce: [0n, 1n, 2n, 3n],
    exSaltPublicKey: commits.slice(0, 2).map((c) => c.public().saltPk),
    exCiphertext: commits
      .slice(0, 2)
      .map((c) => c.public().cipher.map((x) => x as bigint)),
    exIndex: [0n, 0n],
    exSiblings: [new Array<bigint>(32).fill(0n), new Array<bigint>(32).fill(0n)]
  }
}

const out = await prover(randInputGenerator())
  .catch((error) => {
    throw new Error(`Prover failed: ${error.message}`)
  })
  .then(async (res) => {
    const ok = await verifier(res)
      .catch((error) => {
        throw new Error(`Verifier failed: ${error.message}`)
      })
      .then(async (res) => {
        await cleanThreads()
        return res
      })

    if (!ok) {
      throw new Error("Proof Verification failed")
    }
    return res
  })

const packed = FnPrivacyPool.parseOutputFn("pack")(
  out
) as StdPackedGroth16ProofT

const groth16Proof = {
  _pA: packed[0],
  _pB: packed[1],
  _pC: packed[2],
  _pubSignals: packed[3]
}

// Encode the struct
const encodedProof = encodeAbiParameters(groth16ProofParams, [groth16Proof])

process.stdout.write(encodedProof)
