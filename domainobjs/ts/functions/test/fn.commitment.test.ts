import { expect, test, describe, beforeEach } from "bun:test"
import { FnCommitment } from "@privacy-pool-v1/domainobjs"
import type { Hex } from "viem"
import { generatePrivateKey } from "viem/accounts"
import type { Point } from "@zk-kit/baby-jubjub"
import type { CipherText } from "@zk-kit/poseidon-cipher"
import { ConstCommitment } from "@privacy-pool-v1/domainobjs"
import type { TCommitment } from "@privacy-pool-v1/domainobjs"

import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"

function randomBigint(minValue: bigint, maxValue: bigint): bigint {
  const range = maxValue - minValue + 1n // Calculate the range of possible values
  return BigInt(Math.floor(Math.random() * Number(range))) + minValue
}

describe("Testing blindFn Function", () => {
  const _pK: Hex = generatePrivateKey()
  const blindfn_results: {
    challenges: {
      hash: bigint
      tuple: TCommitment.TupleT
      eK: Point<bigint>
    }
    private: {
      pkScalar: bigint
      nonce: bigint
      value: bigint
      secret: Point<bigint>
    }
    public: {
      scope: bigint
      cipher: CipherText<bigint>
      saltPk: Point<bigint>
    }
  }[] = []
  beforeEach(() => {
    for (let i = 0; i < 100; i++) {
      blindfn_results.push(
        FnCommitment.bindFn({
          _pK: _pK,
          _scope: randomBigint(0n, 1000n),
          _value: randomBigint(0n, 1000n),
          _nonce: randomBigint(0n, 1000n)
        })()
      )
    }
  })
  // verify the results
  test("Verifying blindFn with recoverFn", () => {
    for (let i = 0; i < blindfn_results.length - 1; i++) {
      const _res = blindfn_results[i]
      const _pk = deriveSecretScalar(_pK)
      const _Pk = mulPointEscalar(Base8, _pk)
      const _secretK = mulPointEscalar(_Pk, _pk)
      const _eK = mulPointEscalar(_res.public.saltPk, _pk)

      // deterministic private key
      expect(_res.private.pkScalar).toStrictEqual(_pk)
      // deterministic secret scalar
      expect(_res.private.secret).toStrictEqual(_secretK)
      // deterministic encryption key
      expect(_res.challenges.eK).toStrictEqual(_eK)

      // Test for uniqueness
      for (let j = i + 1; j < blindfn_results.length; j++) {
        // salt public key
        expect(_res.public.saltPk).not.toStrictEqual(
          blindfn_results[j].public.saltPk
        )
        // encryption
        expect(_res.challenges.eK).not.toStrictEqual(
          blindfn_results[j].challenges.eK
        )
        // ciphertext
        expect(_res.public.cipher).not.toStrictEqual(
          blindfn_results[j].public.cipher
        )
      }

      // Test recoverFn
      const { Hash, Tuple } = FnCommitment.recoverFn(
        {
          _pKScalar: _res.private.pkScalar,
          _cipher: _res.public.cipher,
          _saltPk: _res.public.saltPk,
          _nonce: _res.private.nonce,
          _len: ConstCommitment.STD_TUPLE_SIZE
        },
        {
          _hash: _res.challenges.hash,
          _tuple: _res.challenges.tuple,
          _secret: _res.private.secret
        }
      )()

      // Test for Hash
      expect(Hash).toStrictEqual(_res.challenges.hash)
      // Test for Tuple
      expect(Tuple).toStrictEqual(_res.challenges.tuple)
    }
  })
})
