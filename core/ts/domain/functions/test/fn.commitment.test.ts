import { expect, test, describe, beforeEach } from "bun:test"
import { FnCommitment } from "@privacy-pool-v1/core-ts/domain"
import type { Hex } from "viem"
import { generatePrivateKey } from "viem/accounts"
import type { Point } from "@zk-kit/baby-jubjub"
import type { CipherText } from "@zk-kit/poseidon-cipher"
import { ConstCommitment } from "@privacy-pool-v1/core-ts/domain"
import type {TCommitment} from "@privacy-pool-v1/core-ts/domain"
function randomBigint(minValue: bigint, maxValue: bigint): bigint {
  const range = maxValue - minValue + 1n // Calculate the range of possible values
  return BigInt(Math.floor(Math.random() * Number(range))) + minValue
}

describe("Testing blindFn Function", () => {
  // randomly generated pK
  // don't use in production
  const _pK: Hex =
    "0x3c99cb887698a50aae095b0f050244935d1b451355da78546871593f5cabf793"
  const blindfn_results: {
    secrets: {
      pKScalar: bigint
      Pk: Point<bigint>
      salt: bigint
      eK: Point<bigint>
      nonce: bigint
    }
    challenges: {
      hash: bigint
      tuple: TCommitment.TupleT
    }
    private: {
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
      // deterministic private key
      expect(_res.secrets.pKScalar).toStrictEqual(
        5675096008673131753980974358827186863864734867016328916049381498422164651108n
      )
      // deterministic public key
      expect(_res.secrets.Pk).toStrictEqual([
        18036533558583174155460206293144569592939622579331506059222207317138387772088n,
        16601775792515073711202079711901048790859056038139283086048472075533807741261n
      ])
      // deterministic secret scalar
      expect(_res.private.secret).toStrictEqual([
        17246685860642639846657996658010720481160707501213987984865648127585125912198n,
        9155150378193743607921338426796622072693468563284836698877337532677343336789n
      ])
      // Test for uniqueness
      for (let j = i + 1; j < blindfn_results.length; j++) {
        // salt
        expect(_res.secrets.salt).not.toStrictEqual(
          blindfn_results[j].secrets.salt
        )
        // encryption
        expect(_res.secrets.eK).not.toStrictEqual(blindfn_results[j].secrets.eK)
        // salt public key
        expect(_res.public.saltPk).not.toStrictEqual(
          blindfn_results[j].public.saltPk
        )
        // ciphertext
        expect(_res.public.cipher).not.toStrictEqual(
          blindfn_results[j].public.cipher
        )
      }

      // Test for recoverFn
      const { Hash, Tuple } = FnCommitment.recoverFn(
        {
          _pKScalar: _res.secrets.pKScalar,
          _cipher: _res.public.cipher,
          _saltPk: _res.public.saltPk,
          _nonce: _res.secrets.nonce,
          _len: ConstCommitment.STD_TUPLE_SIZE
        },
        {
          _hash: _res.challenges.hash,
          _tuple: _res.challenges.tuple,
          _secet: _res.private.secret
        }
      )()

      // Test for Hash
      expect(Hash).toStrictEqual(_res.challenges.hash)
      // Test for Tuple
      expect(Tuple).toStrictEqual(_res.challenges.tuple)
    }
  })
})
