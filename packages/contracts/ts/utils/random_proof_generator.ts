import { CreateNewCommitment } from "@privacy-pool-v1/domainobjs"
import type { Commitment } from "@privacy-pool-v1/domainobjs"
import { generatePrivateKey } from "viem/accounts"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"

function splitBigIntRandomly(value: bigint): [bigint, bigint] {
  if (value <= 0n) {
    throw new Error("Input must be a positive BigInt")
  }

  const numBytes = Math.ceil(value.toString(16).length / 2)
  const randomValues = new Uint8Array(numBytes)
  window.crypto.getRandomValues(randomValues)
  let hexString =
    "0x" +
    Array.from(randomValues)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  const randomBigInt = BigInt(hexString) % (value + 1n)

  const part1 = randomBigInt
  const part2 = value - part1

  return [part1, part2]
}

export const randInputGenerator = (args: {
  scope: bigint
  context: bigint
  externalIO: [bigint, bigint]
  actualTreeDepth: bigint
  existingStateRoot: bigint
}) => {
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
  const keys = [0, 1, 2, 3].map(() => generatePrivateKey())
  const commits: Commitment[] = [0, 1, 2, 3].map((i) => {
    const c = CreateNewCommitment({
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
