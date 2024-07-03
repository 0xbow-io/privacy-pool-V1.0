import type { ICommitment, TCommitment } from "@privacy-pool-v1/core-ts/domain"
import { FnCommitment } from "@privacy-pool-v1/core-ts/domain"
import type { CipherText } from "@zk-kit/poseidon-cipher"
import type { Hex } from "viem"
import type { Point } from "@zk-kit/baby-jubjub"
import { poseidonDecrypt } from "@zk-kit/poseidon-cipher"
import { ConstCommitment } from "@privacy-pool-v1/core-ts/domain"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub"

export const NewCommitment = (args: {
  _pK: Hex
  _nonce: bigint
  _scope: bigint
  _value: bigint
}) => CCommitment.CommitmentC.new(args)()

export const RecoverCommitment = (
  args: {
    _pKScalar: bigint
    _cipher: CipherText<bigint>
    _saltPk: Point<bigint>
    _nonce: bigint
    _len: number
  },
  // optional challenge to verify the recovered commitment
  challenge: {
    _hash?: bigint
    _tuple?: bigint[]
    _secet?: Point<bigint>
  }
): Commitment => CCommitment.CommitmentC.recover(args, challenge)()

export type Commitment = ICommitment.CommitmentI
export namespace CCommitment {
  // Represent a commitment as a class type
  // which implements:
  // asTuple: represent the internals of a commitment as a an array
  // hash: computes the poseidon hash of the commitment tuple
  export class CommitmentC implements Commitment {
    _index = 0n
    commitmentRoot = 0n
    nullRoot = 0n
    constructor(
      publicKey: Point<bigint>,
      encryptionKey: Point<bigint>,
      private _private: {
        value: bigint
        secret: Point<bigint>
      } = {
        value: 0n,
        secret: [0n, 0n]
      },
      public _public: {
        scope: bigint
        cipher: CipherText<bigint>
        saltPk: Point<bigint>
      } = {
        // Domain reference
        scope: 0n,
        // encrypted private
        cipher: [0n, 0n],
        // used to recover encryption key to decrypt _cipher
        saltPk: [0n, 0n]
      }
    ) {
      /*
        // compute commitment root
        // we will use 3 levels which holds 8 leaves
        // this fits all ciphertext elements + commitmentHash
        var computedRoot = CheckRoot(3)([
            ciphertext[0], ciphertext[1],
            ciphertext[2], ciphertext[3],
            ciphertext[4], ciphertext[5],
            ciphertext[6], commimentHash
        ]);
        commitmentRoot <== computedRoot;
      */
      const commitmentSubTree = new LeanIMT(hashLeftRight)
      for (let i = 0; i < this._public.cipher.length; i++) {
        commitmentSubTree.insert(this._public.cipher[i])
      }
      commitmentSubTree.insert(this.hash())
      this.commitmentRoot = commitmentSubTree.root

      /*
      // null root is the computed root of all keys
      // that was used to encrpt / decrypt the ciphertext
      // this acts somewhat liek a nullifier to the commitmentRoot
      // unlike the commitmentRoot, which can be verified externally to the circuit
      // as all elements are public, the nullRoot contains only private elements aside
      // from the saltPublicKey.
      // A false nullRoot would invalidate the computedTrueRoots
      // membership proof (different cipherText hash or commitment hash)
      var computedNullRoot = CheckRoot(3)([
          publicKey[0], publicKey[1],
          secretKey[0], secretKey[1],
          saltPublicKey[0], saltPublicKey[1],
          encryptionKey[0], encryptionKey[1]
       ]);
    */
      const nullSubTree = new LeanIMT(hashLeftRight)
      nullSubTree.insert(publicKey[0])
      nullSubTree.insert(publicKey[1])

      nullSubTree.insert(this._private.secret[0])
      nullSubTree.insert(this._private.secret[1])
      nullSubTree.insert(this._public.saltPk[0])
      nullSubTree.insert(this._public.saltPk[1])

      nullSubTree.insert(encryptionKey[0])
      nullSubTree.insert(encryptionKey[1])
      this.nullRoot = nullSubTree.root
    }

    // Binding of value to domain (scope) & owernship
    // represented as a tuple
    //  used circuit input
    asTuple = (): TCommitment.TupleT => [
      this._private.value,
      this._public.scope,
      this._private.secret[0] as bigint,
      this._private.secret[1] as bigint
    ]
    hash = (): bigint => FnCommitment.hashFn(this.asTuple())

    public = () => this._public

    set index(i: bigint) {
      this._index = i
    }
    get index() {
      return this._index
    }

    isDummy = () => this._private.value === 0n

    toJSON = () => {
      return {
        public: {
          scope: this._public.scope.toString(),
          cipher: this._public.cipher.map((v) => v.toString()),
          saltPk: this._public.saltPk.map((v) => v.toString())
        },
        private: {
          value: this._private.value.toString(),
          secret: this._private.secret.map((v) => v.toString())
        }
      }
    }

    // perform deep comparison
    // mostly used for unit testing
    // note, when recovering a commitment from a ciphertext
    // the original salt is lost
    // therefore a new salt had to be created
    // thus the new ciphertext & salt won't match
    isEqual = (c: ICommitment.CommitmentI, sameSalt = true): boolean => {
      const _tuple = c.asTuple()
      return (
        this.asTuple().every((v, i) => v === _tuple[i]) &&
        (!sameSalt ||
          this._public.cipher.every((v, i) => v === c.public().cipher[i])) &&
        (!sameSalt ||
          this._public.saltPk.every((v, i) => v === c.public().saltPk[i]))
      )
    }

    static new =
      (args: { _pK: Hex; _nonce: bigint; _scope: bigint; _value: bigint }) =>
      (
        binds = FnCommitment.bindFn(args)(), // bin the value with scope & key
        c = new CommitmentC(
          binds.secrets.Pk,
          binds.secrets.eK,
          binds.private,
          binds.public
        ) // wrap binding with commitment class
      ) => {
        // challenge the commitment
        // {correct computation of hash}
        if (FnCommitment.hashFn(c.asTuple()) !== binds.challenges.hash) {
          throw new Error("Incorrect hash was computed")
        }

        // {expected computation of tuple}
        // {ability to decrypt the ciphertext}
        const _tuple = c.asTuple()
        const decrypted = poseidonDecrypt(
          c._public.cipher,
          binds.secrets.eK,
          binds.secrets.nonce,
          ConstCommitment.STD_TUPLE_SIZE
        )
        for (let i = 0; i < ConstCommitment.STD_TUPLE_SIZE; i++) {
          if (
            _tuple[i] !== binds.challenges.tuple[i] ||
            decrypted[i] !== _tuple[i]
          ) {
            throw new Error("Incorrect tuple was computed")
          }
        }
        return {
          commitment: c,
          secrets: binds.secrets
        }
      }

    static recover =
      (
        args: {
          _pKScalar: bigint
          _cipher: CipherText<bigint>
          _saltPk: Point<bigint>
          _nonce: bigint
          _len: number
        },
        // optional challenge to verify the recovered commitment
        challenge: {
          _hash?: bigint
          _tuple?: bigint[]
          _secet?: Point<bigint>
        }
      ) =>
      (
        recovered = FnCommitment.recoverFn(args, challenge)() // recover private values from cipher
      ) =>
        new CommitmentC(
          mulPointEscalar(Base8, args._pKScalar),
          recovered.EncryptionKey,
          {
            value: recovered.Tuple[0],
            secret: [recovered.Tuple[2], recovered.Tuple[3]]
          },
          {
            scope: recovered.Tuple[1],
            cipher: args._cipher,
            saltPk: args._saltPk
          }
        ) // wrap binding with commitment class
  }
}
