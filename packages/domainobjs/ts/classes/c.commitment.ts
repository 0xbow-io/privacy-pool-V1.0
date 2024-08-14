import type { ICommitment, TCommitment } from "@privacy-pool-v1/domainobjs"
import { ConstCommitment, FnCommitment } from "@privacy-pool-v1/domainobjs"
import type { Point } from "@zk-kit/baby-jubjub"
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub"
import { LeanIMT } from "@zk-kit/lean-imt"
import type { CipherText } from "@zk-kit/poseidon-cipher"
import { poseidonDecrypt } from "@zk-kit/poseidon-cipher"
import { hashLeftRight } from "maci-crypto"
import type { Hex } from "viem"

export const createNewCommitment = (args: {
  _pK: Hex
  _nonce: bigint
  _scope: bigint
  _value: bigint
}): Commitment => CCommitment.CommitmentC.new(args)()

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
    _secret?: Point<bigint>
  }
): Commitment => CCommitment.CommitmentC.recover(args, challenge)()

export type Commitment = ICommitment.CommitmentI
export namespace CCommitment {
  // Represent a commitment as a class type
  // which implements:
  // asTuple: represent the internals of a commitment as a an array
  // hash: computes the poseidon hash of the commitment tuple
  export class CommitmentC implements Commitment {
    _index = BigInt(0)
    _commitmentRoot = BigInt(0)
    _nullRoot = BigInt(0)
    constructor(
      private _private: {
        pkScalar: bigint
        nonce: bigint
        value: bigint
        secret: Point<bigint>
      } = {
        pkScalar: BigInt(0),
        nonce: BigInt(0),
        value: BigInt(0),
        secret: [BigInt(0), BigInt(0)]
      },
      public _public: {
        scope: bigint
        cipher: CipherText<bigint>
        saltPk: Point<bigint>
      } = {
        // Domain reference
        scope: BigInt(0),
        // encrypted private
        cipher: [BigInt(0), BigInt(0)],
        // used to recover encryption key to decrypt _cipher
        saltPk: [BigInt(0), BigInt(0)]
      }
    ) {
      this.computeCRoot()
      this.computeNRoot()
    }

    computeCRoot(): bigint {
      const commitmentSubTree = new LeanIMT(hashLeftRight)
      for (let i = 0; i < this._public.cipher.length; i++) {
        commitmentSubTree.insert(this._public.cipher[i])
      }
      commitmentSubTree.insert(this.hash())
      this._commitmentRoot = commitmentSubTree.root
      return this.commitmentRoot
    }

    get commitmentRoot(): bigint {
      return this._commitmentRoot
    }

    computeNRoot(): bigint {
      const nullSubTree = new LeanIMT(hashLeftRight)
      // generate public key of pkScalar
      const Pk: Point<bigint> = mulPointEscalar(Base8, this._private.pkScalar)
      // recover encryption key
      const Ek: Point<bigint> = mulPointEscalar(
        this._public.saltPk,
        this._private.pkScalar
      )

      nullSubTree.insert(Pk[0])
      nullSubTree.insert(Pk[1])
      nullSubTree.insert(this._private.secret[0])
      nullSubTree.insert(this._private.secret[1])
      nullSubTree.insert(this._public.saltPk[0])
      nullSubTree.insert(this._public.saltPk[1])
      nullSubTree.insert(Ek[0])
      nullSubTree.insert(Ek[1])
      this._nullRoot = nullSubTree.root

      return this._nullRoot
    }

    get nullRoot(): bigint {
      return this._nullRoot
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

    setIndex(mt: LeanIMT) {
      const index = mt.indexOf(this.commitmentRoot)
      if (index === -1) {
        throw new Error("commitment not found in commitment tree")
      }
      this._index = BigInt(index)
    }
    get index() {
      return this._index
    }

    isVoid = () => this._private.value === BigInt(0)

    root = () => {
      return {
        hash: this.hash(),
        nullRoot: this.nullRoot,
        commitmentRoot: this.commitmentRoot
      }
    }

    toJSON = () => {
      return {
        public: {
          scope: this._public.scope.toString(),
          cipher: this._public.cipher.map((v) => v.toString()),
          saltPk: this._public.saltPk.map((v) => v.toString())
        },
        private: {
          nonce: this._private.nonce.toString(),
          value: this._private.value.toString(),
          secret: this._private.secret.map((v) => v.toString()),
          pkScalar: this._private.pkScalar.toString()
        },
        hash: this.hash().toString(),
        cRoot: this.commitmentRoot.toString(),
        nullRoot: this.nullRoot.toString()
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
        // same scope
        this._public.scope === c.public().scope &&
        (!sameSalt ||
          this._public.cipher.every((v, i) => v === c.public().cipher[i])) &&
        (!sameSalt ||
          this._public.saltPk.every((v, i) => v === c.public().saltPk[i])) &&
        this.nullRoot === c.nullRoot &&
        this.commitmentRoot === c.commitmentRoot
      )
    }

    static new =
      (args: { _pK: Hex; _nonce: bigint; _scope: bigint; _value: bigint }) =>
      (
        binds = FnCommitment.bindFn(args)(), // bin the value with scope & key
        c = new CommitmentC(binds.private, binds.public) // wrap binding with commitment class
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
          binds.challenges.eK,
          binds.private.nonce,
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
        return c
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
          _secret?: Point<bigint>
        }
      ) =>
      (
        recovered = FnCommitment.recoverFn(args, challenge)() // recover private values from cipher
      ) =>
        new CommitmentC(
          {
            pkScalar: args._pKScalar,
            nonce: args._nonce,
            value: recovered.Tuple[0],
            secret: [recovered.Tuple[2], recovered.Tuple[3]]
          },
          {
            scope: recovered.Tuple[1],
            cipher: args._cipher,
            saltPk: args._saltPk
          }
        ) // wrap binding with commitment class

    // TODO: Write Unit Test for this
    static recoverFromJSON = (json: any, challenge: any) => {
      const args = {
        _pKScalar: BigInt(json.private.pkScalar),
        _cipher: json.public.cipher.map(BigInt),
        _saltPk: json.public.saltPk.map(BigInt),
        _nonce: BigInt(json.private.nonce),
        _len: json.private.secret.length // todo: write this as a const
      }
      return CCommitment.CommitmentC.recover(args, challenge)()
    }
  }
}
