import { expect, test, describe, beforeEach } from "bun:test"
import type { Hex } from "viem"
import { generatePrivateKey } from "viem/accounts"
import {
  ConstCommitment,
  NewCommitment,
  RecoverCommitment,
  DerivePrivacyKeys
} from "@privacy-pool-v1/core-ts/domain"
import type { TCommitment } from "@privacy-pool-v1/core-ts/domain"
import { mulPointEscalar } from "@zk-kit/baby-jubjub"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"

function randomBigint(minValue: bigint, maxValue: bigint): bigint {
  const range = maxValue - minValue + 1n // Calculate the range of possible values
  return BigInt(Math.floor(Math.random() * Number(range))) + minValue
}

describe("Verifying Commitment Class", () => {
  const _testSize = 100
  const _pK: Hex = generatePrivateKey()
  const _secrets = []
  const commitments = [] as TCommitment.CommitmentsT //freshly generated commitments
  const recovered = [] as TCommitment.CommitmentsT //commitments recovered from encrypted new_commitments

  beforeEach(() => {
    for (let i = 0; i < _testSize; i++) {
      const _pK = generatePrivateKey()
      const nonce: bigint = randomBigint(0n, 1000n)
      const c = NewCommitment({
        _pK: _pK,
        _nonce: nonce,
        _scope: randomBigint(0n, 1000n),
        _value: randomBigint(0n, 1000n)
      })
      commitments.push(c)
      // recover the commitment from the encrypted commitment
      recovered.push(
        RecoverCommitment(
          {
            _pKScalar: deriveSecretScalar(_pK),
            _nonce: nonce,
            _len: ConstCommitment.STD_TUPLE_SIZE,
            _saltPk: c._public.saltPk,
            _cipher: c._public.cipher
          },
          {
            _hash: c.hash(),
            _tuple: c.asTuple()
          }
        )
      )
    }
  })
  test("Verifying Generated & Reccovered Commitments", () => {
    for (let i = 0; i < _testSize; i++) {
      console.log("commitment: ", commitments[i].toJSON())
      expect(commitments[i].isEqual(recovered[i])).toBe(true)
    }
  })
})