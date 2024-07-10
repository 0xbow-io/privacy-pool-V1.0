import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import type { Hex } from "viem"
import type { Commitment } from "@privacy-pool-v1/core-ts/domain"
import { NewCommitment } from "@privacy-pool-v1/core-ts/domain"
import { generatePrivateKey } from "viem/accounts"
import type { TPrivacyPool } from "@privacy-pool-v1/zero-knowledge"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"

function randomBigint(minValue: bigint, maxValue: bigint): bigint {
  const range = maxValue - minValue + 1n // Calculate the range of possible values
  return BigInt(Math.floor(Math.random() * Number(range))) + minValue
}

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

export const genTestData =
  (
    scope = randomBigint(0n, 1000n),
    numberOfTests = 10,
    keys?: Hex[],
    stateTree?: LeanIMT
  ) =>
  (
    minValue = 0n,
    maxValue = 500n,
    _keys = keys
      ? keys
      : Array.from({ length: numberOfTests }, () => generatePrivateKey()),
    _stateTree = stateTree ? stateTree : new LeanIMT(hashLeftRight)
  ): TPrivacyPool.GetCircuitInArgsT[] => {
    // generate random set of keys
    return generateTestAmounts(numberOfTests, minValue, maxValue).map(
      (values) => {
        const nonces = values.map(() =>
          Math.floor(Math.random() * _keys.length)
        )
        const pkScalars = nonces.map((nonce) =>
          deriveSecretScalar(_keys[nonce])
        )
        const commits: Commitment[] = values.map((_, i) =>
          NewCommitment({
            _pK: _keys[nonces[i]],
            _scope: scope,
            _nonce: BigInt(nonces[i]),
            _value: values[i]
          })
        )

        // batch insert leaves into the stateTree
        const leaves = commits.flatMap((c) => [c.commitmentRoot, c.nullRoot])
        _stateTree.insertMany(leaves)
        // set the indexes of the commitments
        for (let i = 0; i < commits.length; i++) {
          commits[i].setIndex(_stateTree)
        }
        return {
          scope: scope,
          context: 100n,
          mt: _stateTree,
          maxDepth: 32,
          pkScalars: pkScalars,
          nonces: nonces.map((n) => BigInt(n)),
          existing: commits.slice(0, 2),
          new: commits.slice(2, 4)
        } as TPrivacyPool.GetCircuitInArgsT
      }
    )
  }
