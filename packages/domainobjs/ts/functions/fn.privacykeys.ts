import { Base8, mulPointEscalar, type Point, r } from "@zk-kit/baby-jubjub"
import { leBufferToBigInt, scalar } from "@zk-kit/utils"
import { randomBytes } from "crypto"
import { poseidon2 } from "poseidon-lite"
import type { Hex } from "viem"
import { hexToBigInt } from "viem"
import { generatePrivateKey } from "viem/accounts"

/**
 * From Maci/packages/crypto/ts/babyjubjub.ts
 * Returns a BabyJub-compatible random value. We create it by first generating
 * a random value (initially 256 bits large) modulo the snark field size as
 * described in EIP197. This results in a key size of roughly 253 bits and no
 * more than 254 bits. To prevent modulo bias, we then use this efficient
 * algorithm:
 * http://cvsweb.openbsd.org/cgi-bin/cvsweb/~checkout~/src/lib/libc/crypt/arc4random_uniform.c
 * @returns A BabyJub-compatible random value.
 */
export const getRandomHex = (): Hex => `0x${randomBytes(32).toString("hex")}`

/***
 * Format a Hex Value to a
 * Scalar for BabyJubJub EdDSA
 ***/
export const HexToBabyJubJubScalar = (hexVal: Hex = getRandomHex()): bigint => {
  // Prevent modulo bias
  // const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
  // const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
  const min = BigInt(
    "6350874878119819312338956282401532410528162663560392320966563075034087161851"
  )

  const r = BigInt(
    "21888242871839275222246405745257275088548364400416034343698204186575808495617"
  )

  const suborder = BigInt(
    "2736030358979909402780800718157159386076813972158567259200215660948447373041"
  )

  let hexValBig = hexToBigInt(hexVal)

  do {
    if (hexValBig >= min) {
      hexValBig = hexValBig % r
    }
  } while (hexValBig >= r)

  const hash = pruneBuffer(
    Buffer.from(bigInt2Buffer(poseidon2([hexValBig, 0n])))
  ).subarray(0, 32)
  return scalar.shiftRight(leBufferToBigInt(hash), BigInt(3)) % suborder
}

/*
 * Convert a BigInt to a Buffer
 */
const bigInt2Buffer = (i: BigInt): Buffer => {
  return Buffer.from(i.toString(16), "hex")
}

export function bits(n: bigint): number[] {
  const binary = n.toString(2)
  const bits = binary.split("").map((b) => Number(b))
  return bits
}

export function pruneBuffer(buff: Buffer): Buffer {
  buff[0] &= 0xf8
  buff[31] &= 0x7f
  buff[31] |= 0x40

  return buff
}

export const GenerateScalarPrivKey = (
  _pK: Hex = generatePrivateKey()
): bigint => HexToBabyJubJubScalar(_pK)

export const DeriveEdDSAPubKey = (pkScalar: bigint): Point<bigint> =>
  mulPointEscalar(Base8, pkScalar)

export const DeriveSharedSecret = (
  pkScalar: bigint,
  pubKey: Point<bigint>
): Point<bigint> => mulPointEscalar(pubKey, pkScalar)

export const DerivePrivacyKeys =
  (_pK: Hex = generatePrivateKey(), withSalt = true) =>
  (
    PrivKScalar = GenerateScalarPrivKey(_pK),
    PublicKey = DeriveEdDSAPubKey(PrivKScalar),
    Secret = DeriveSharedSecret(PrivKScalar, PublicKey),
    Salt = HexToBabyJubJubScalar(),
    SaltPk = DeriveEdDSAPubKey(Salt),
    Ek = DeriveSharedSecret(Salt, PublicKey)
  ) => {
    return {
      PrivKeyHex: _pK,
      ScalarPrivKey: PrivKScalar,
      PubKey: PublicKey,
      SaltPubKey: SaltPk,
      EcKey: Ek,
      Secret: Secret
    }
  }
