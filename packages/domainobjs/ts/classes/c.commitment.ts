import type {
  ICommitment,
  MembershipProofJSON,
  TCommitment
} from "@privacy-pool-v1/domainobjs"
import {
  ConstCommitment,
  DeriveEdDSAPubKey,
  DeriveSharedSecret,
  FnCommitment,
  FnPrivacyPool
} from "@privacy-pool-v1/domainobjs"
import type { Point } from "@zk-kit/baby-jubjub"
import { LeanIMT } from "@zk-kit/lean-imt"
import type { CipherText } from "@zk-kit/poseidon-cipher"
import { poseidonDecrypt } from "@zk-kit/poseidon-cipher"
import { hashLeftRight } from "maci-crypto"
import type { Hex } from "viem"
import { hexToBigInt, numberToHex } from "viem"

export const CreateNewCommitment = (args: {
  _pK: Hex
  _nonce: bigint
  _scope: bigint
  _value: bigint
}): Commitment => CCommitment.CommitmentC.new(args)()

export const DummyCommitment = (withValue = 0n): Commitment =>
  new CCommitment.CommitmentC({
    pkScalar: 0n,
    nonce: 0n,
    value: withValue,
    secret: [0n, 0n]
  })

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

export const RecoverFromJSON = (
  json: TCommitment.CommitmentJSON,
  len = 4
): Commitment => CCommitment.CommitmentC.recoverFromJSON(json, len)

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
      const Pk: Point<bigint> = DeriveEdDSAPubKey(this._private.pkScalar)
      // recover encryption key
      const Ek: Point<bigint> = DeriveSharedSecret(
        this._private.pkScalar,
        this._public.saltPk
      )

      nullSubTree.insertMany([
        Pk[0],
        Pk[1],
        this._private.secret[0],
        this._private.secret[1],
        this._public.saltPk[0],
        this._public.saltPk[1],
        Ek[0],
        Ek[1]
      ])

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

    membershipProof = (mt: LeanIMT): MembershipProofJSON => {
      let inclusion = {
        stateRoot: {
          raw: mt.root.toString(),
          hex: numberToHex(mt.root)
        },
        leafIndex: "0",
        index: "0",
        stateDepth: mt.depth.toString(),
        siblings: ["0"]
      }

      try {
        if (!this.isVoid()) {
          this.setIndex(mt)
          const proof = FnPrivacyPool.merkleProofFn({
            mt: mt
          })(this.index)
          inclusion = {
            stateRoot: {
              raw: mt.root.toString(),
              hex: numberToHex(mt.root)
            },
            leafIndex: this.index.toString(),
            index: proof.index.toString(),
            stateDepth: mt.depth.toString(),
            siblings: proof.siblings.map((v) => v.toString())
          }
        }
      } catch (e) {
        throw new Error(`failed to generate membership proof: ${e}`)
      }

      return {
        public: {
          scope: {
            raw: this._public.scope.toString(),
            hex: numberToHex(this._public.scope)
          },
          cipher: this._public.cipher.map((v) => v.toString()),
          saltPk: this._public.saltPk.map((v) => v.toString()),
          hash: {
            raw: this.hash().toString(),
            hex: numberToHex(this.hash())
          }
        },
        private: {
          inclusion: inclusion,
          pkScalar: {
            hex: numberToHex(this._private.pkScalar),
            raw: this._private.pkScalar.toString()
          },
          nonce: this._private.nonce.toString(),
          root: {
            raw: this.commitmentRoot.toString(),
            hex: numberToHex(this.commitmentRoot)
          },
          null: {
            raw: this.nullRoot.toString(),
            hex: numberToHex(this.nullRoot)
          }
        }
      } as MembershipProofJSON
    }

    toJSON = (): TCommitment.CommitmentJSON => {
      return {
        public: {
          scope: this._public.scope.toString(),
          cipher: this._public.cipher.map((v) => v.toString()),
          saltPk: this._public.saltPk.map((v) => v.toString())
        },
        hash: this.hash().toString(),
        cRoot: numberToHex(this.commitmentRoot),
        nullRoot: numberToHex(this.nullRoot),
        pkScalar: numberToHex(this._private.pkScalar),
        nonce: this._private.nonce.toString()
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

    static recoverFromJSON = (json: TCommitment.CommitmentJSON, len = 4) => {
      return CCommitment.CommitmentC.recover(
        {
          _pKScalar: hexToBigInt(json.pkScalar),
          _cipher: json.public.cipher.map((e) => BigInt(e)),
          _saltPk: [
            BigInt(json.public.saltPk[0]),
            BigInt(json.public.saltPk[1])
          ] as Point<bigint>,
          _nonce: BigInt(json.nonce),
          _len: len
        },
        {
          _hash: BigInt(json.hash)
        }
      )()
    }
  }
}
