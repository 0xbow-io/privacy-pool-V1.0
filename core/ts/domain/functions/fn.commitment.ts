import { genRandomSalt } from "maci-crypto"
import { poseidon4 } from "poseidon-lite"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import type { Hex } from "viem"
import type { Point } from "@zk-kit/baby-jubjub"
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub"
import { generatePrivateKey } from "viem/accounts"

import { poseidonDecrypt, poseidonEncrypt } from "@zk-kit/poseidon-cipher"
import type { CipherText } from "@zk-kit/poseidon-cipher"
import type { TCommitment } from "@privacy-pool-v1/core-ts/domain"

export const DerivePrivacyKeys =
  (_pK: Hex = generatePrivateKey(), withSalt = true) =>
  (
    PrivateKey = deriveSecretScalar(_pK),
    PublicKey = mulPointEscalar(Base8, PrivateKey),
    Secret = mulPointEscalar(PublicKey, PrivateKey),
    Salt = withSalt ? genRandomSalt() : 0n,
    SaltPk = withSalt ? mulPointEscalar(Base8, Salt) : [0n, 0n],
    Ek = withSalt ? mulPointEscalar(PublicKey, Salt) : [0n, 0n]
  ) => {
    return {
      pkHex: _pK,
      pKScalar: PrivateKey,
      Pk: PublicKey,
      SaltPk: SaltPk,
      eK: Ek,
      secret: Secret
    }
  }

export namespace FnCommitment {
  export const hashFn = (tuple: TCommitment.TupleT) => poseidon4(tuple)

  /*
    bindFn is a simple privacy-preserving tehcnique that binds a numeric value to a domain (scope)
    and a owner (keypair) by hashing the value with the scope and an ecdh secret derived from the keypair.
    The tuple of (value, sscope & secret) is encrytped with a nonce and an encryption key
    derived from the keypair publickey and a salt (random BabyJubJub value that can serve as a private key)
    Both the hash and the ciphertext can be later committed to Privacy Pool.
    A public key derived from the salt can be used later along with then nonce, to decrypt
    the ciphertext and recover the value (using the recoverFn)
  */
  export const bindFn =
    (args: { _pK?: Hex; _nonce: bigint; _scope: bigint; _value: bigint }) =>
    (
      PrivateKey = args._pK
        ? deriveSecretScalar(args._pK)
        : deriveSecretScalar(generatePrivateKey()), // Derive secret scalar from Private Key
      PublicKey = mulPointEscalar(Base8, PrivateKey), // Derive Public Key
      Secret = mulPointEscalar(PublicKey, PrivateKey), // ECDH secret from pK & Public Key
      Salt = genRandomSalt(), // Generate a random BabyJubJub value
      SaltPk = mulPointEscalar(Base8, Salt), // Derive public key from Salt
      Ek = mulPointEscalar(PublicKey, Salt), // Derive encryption key from ECDH secret & public key
      Tuple = [
        args._value,
        args._scope,
        Secret[0],
        Secret[1]
      ] as TCommitment.TupleT, // binding of value to domain (scope) & owernship
      Hash = hashFn(Tuple), // Hash the tuple
      Ciphertext = poseidonEncrypt(Tuple, Ek, args._nonce) // Encrypt the tuple
    ): {
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
    } => {
      // Verify computation of encryption key:
      // Recovery of ECDH shared secret using private key and the public key of the Salt.
      const _eK = mulPointEscalar(SaltPk, PrivateKey)
      if (Ek[0] !== _eK[0] || Ek[1] !== _eK[1]) {
        throw new Error(
          `Invalid encryption key generated, got ${Ek} expected: ${_eK}`
        )
      }
      return {
        private: {
          pkScalar: PrivateKey,
          nonce: args._nonce,
          value: args._value,
          secret: Secret
        },
        public: {
          scope: args._scope,
          cipher: Ciphertext,
          saltPk: SaltPk
        },
        challenges: {
          hash: Hash,
          tuple: Tuple,
          eK: Ek
        }
      }
    }

  /*
    recoverFn recovers the commitment tuple (value, scope & secret) from a ciphertext
    with the nonce, private key and salt public key.
    */
  export const recoverFn =
    (
      args: {
        _pKScalar: bigint
        _cipher: CipherText<bigint>
        _saltPk: Point<bigint>
        _nonce: bigint
        _len: number
      },
      challenge: {
        _hash?: bigint
        _tuple?: bigint[]
        _secret?: Point<bigint>
      } = {}
    ) =>
    (
      Ek = mulPointEscalar(args._saltPk, args._pKScalar), // Derive encryption key from salt pubkey & private key (as scalar point)
      Tuple = poseidonDecrypt(args._cipher, Ek, args._nonce, args._len), // ECDH secret from pK & Public Key
      Hash = poseidon4(Tuple)
    ): {
      Hash: bigint
      EncryptionKey: Point<bigint>
      Tuple: TCommitment.TupleT
    } => {
      // verify with challenges if present
      if (challenge._hash && Hash !== challenge._hash) {
        throw new Error(
          `Invalid hash, got ${Hash} expected: ${challenge._hash}`
        )
      }
      if (challenge._tuple) {
        for (let i = 0; i < challenge._tuple.length; i++) {
          if (Tuple[i] !== challenge._tuple[i]) {
            throw new Error(
              `Invalid tuple, got ${Tuple} expected: ${challenge._tuple}`
            )
          }
        }
      }
      if (challenge._secret) {
        if (
          Tuple[2] !== challenge._secret[0] ||
          Tuple[3] !== challenge._secret[1]
        ) {
          throw new Error(
            `Invalid secret, got ${Tuple[2]}:${Tuple[3]} expected: ${challenge._secret[0]}:${challenge._secret[1]}`
          )
        }
      }
      return {
        Hash: Hash,
        EncryptionKey: Ek,
        Tuple: [Tuple[0], Tuple[1], Tuple[2], Tuple[3]]
      }
    }
}
