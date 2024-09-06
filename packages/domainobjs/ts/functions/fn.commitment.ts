import { genRandomSalt } from "maci-crypto"
import { poseidon4 } from "poseidon-lite"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import type { Hex } from "viem"
import type { Point } from "@zk-kit/baby-jubjub"
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub"

import { poseidonDecrypt, poseidonEncrypt } from "@zk-kit/poseidon-cipher"
import type { CipherText } from "@zk-kit/poseidon-cipher"
import {
  DerivePrivacyKeys,
  DeriveSharedSecret,
  type TCommitment
} from "@privacy-pool-v1/domainobjs"
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
      keys = DerivePrivacyKeys(args._pK)(),
      Tuple = [
        args._value,
        args._scope,
        keys.Secret[0],
        keys.Secret[1]
      ] as TCommitment.TupleT, // binding of value to domain (scope) & owernship
      Hash = hashFn(Tuple), // Hash the tuple
      Ciphertext = poseidonEncrypt(Tuple, keys.EcKey, args._nonce) // Encrypt the tuple
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
      const _eK = DeriveSharedSecret(keys.ScalarPrivKey, keys.SaltPubKey)
      if (keys.EcKey[0] !== _eK[0] || keys.EcKey[1] !== _eK[1]) {
        throw new Error(
          `Invalid encryption key generated, got ${keys.EcKey} expected: ${_eK}`
        )
      }
      return {
        private: {
          pkScalar: keys.ScalarPrivKey,
          nonce: args._nonce,
          value: args._value,
          secret: keys.Secret
        },
        public: {
          scope: args._scope,
          cipher: Ciphertext,
          saltPk: keys.SaltPubKey
        },
        challenges: {
          hash: Hash,
          tuple: Tuple,
          eK: keys.EcKey
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
      Ek = DeriveSharedSecret(args._pKScalar, args._saltPk), // ECDH secret from pK & Public Key
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
