import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import type { Hex } from "viem"
import type { Commitment } from "@privacy-pool-v1/core-ts/domain"
import { NewCommitment } from "@privacy-pool-v1/core-ts/domain"
import { generatePrivateKey } from "viem/accounts"
import type { TPrivacyPool } from "@privacy-pool-v1/core-ts/zk-circuit"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"

/*
import type { PrivacyKey } from "@privacy-pool-v1/core-ts/account"
import {
  CreateCommitment,
  CreatePrivacyKey
} from "@privacy-pool-v1/core-ts/account"
*/

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
    mt?: LeanIMT
  ) =>
  (
    minValue = 0n,
    maxValue = 500n,
    _keys = keys
      ? keys
      : Array.from({ length: numberOfTests }, () => generatePrivateKey()),
    _mt = mt ? mt : new LeanIMT(hashLeftRight)
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
        return {
          scope: scope,
          context: 100n,
          mt: _mt,
          maxDepth: 32,
          pkScalars: pkScalars,
          nonces: nonces.map((n) => BigInt(n)),
          // create input commitments
          // with randomly selected keys
          existing: [0, 1].map((i) => {
            const c = NewCommitment({
              _pK: _keys[nonces[i]],
              _nonce: BigInt(nonces[i]),
              _scope: scope,
              _value: values[i]
            })
            // only insert into the tree if it's not a dummy commitment
            if (!c.isDummy) {
              // insert it into the tree so we can generate merkle proofs
              _mt.insert(c.hash())
              // verify insertion
              if (!_mt.has(c.commitmentRoot)) {
                throw new Error("failed to insert commitment into tree")
              }
              c.index = BigInt(_mt.indexOf(c.commitmentRoot))
            }
            return c
          }),
          new: [2, 3].map((i) => {
            const c = NewCommitment({
              _pK: _keys[nonces[i]],
              _nonce: BigInt(nonces[i]),
              _scope: scope,
              _value: values[i]
            })
            // only insert into the tree if it's not a dummy commitment
            if (!c.isDummy) {
              // insert it into the tree so we can generate merkle proofs later on
              _mt.insert(c.hash())
              c.index = BigInt(_mt.size - 1)
            }
            return c
          })
        } as TPrivacyPool.GetCircuitInArgsT
      }
    )
  }
