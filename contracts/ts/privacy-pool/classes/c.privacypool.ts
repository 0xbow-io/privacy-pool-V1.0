import type {
  IState,
  PrivacyPoolMeta,
  TGroth16Verifier,
  TPrivacyPool
} from "@privacy-pool-v1/contracts"
import {
  ContextFn,
  D_ExternIO_StartIdx,
  FnGroth16Verifier,
  ProcessFn,
  ScopeFn,
  GetStateSizeFn,
  FetchRootsFn,
  UnpackCiphersWithinRangeFn,
  FetchCheckpointAtRootFn
} from "@privacy-pool-v1/contracts"
import type { Commitment, InclusionProofT } from "@privacy-pool-v1/domainobjs"
import {
  MerkleTreeInclusionProof,
  RecoverCommitment,
  ConstCommitment
} from "@privacy-pool-v1/domainobjs"
import type {
  CircomArtifactsT,
  ICircuit,
  SnarkJSOutputT,
  StdPackedGroth16ProofT
} from "@privacy-pool-v1/zero-knowledge"
import {
  FnPrivacyPool,
  NewPrivacyPoolCircuit
} from "@privacy-pool-v1/zero-knowledge"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import type {
  Address,
  Client,
  Hex,
  PublicActions,
  PublicClient,
  WalletActions,
  WalletClient
} from "viem"
import { createPublicClient, http, formatUnits } from "viem"
import { deriveSecretScalar } from "@zk-kit/eddsa-poseidon"
import type { Point } from "maci-crypto"
import type { CipherText } from "@zk-kit/poseidon-cipher"

export const GetOnChainPrivacyPool = (
  meta: PrivacyPoolMeta,
  conn?: PublicClient,
  zkArtifacts?: CircomArtifactsT
): CPool.poolC => new CPool.poolC(meta, conn, zkArtifacts)

export type OnChainPrivacyPool = CPool.poolC

export namespace CPool {
  export class stateC implements IState.StateI {
    MAX_MERKLE_DEPTH = 32
    merkleTree = new LeanIMT(hashLeftRight)
    cipherStore: bigint[][] = []
    rootSet: Set<bigint> = new Set()
    zkCircuit?: ICircuit.circuitI

    constructor(zkArtifacts?: CircomArtifactsT) {
      this.zkCircuit = zkArtifacts
        ? NewPrivacyPoolCircuit(zkArtifacts)
        : undefined
    }

    static newState = (zkArtifacts?: CircomArtifactsT): IState.StateI =>
      new stateC(zkArtifacts)

    StorePackedCipher = (
      cipher: [
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint
      ]
    ): number => {
      // pack the cipher text and salt public key, and commitment hash
      this.cipherStore.push(cipher)
      return this.cipherStore.length - 1
    }

    PackCipher = (
      CipherText: [bigint, bigint, bigint, bigint, bigint, bigint, bigint], // 7 elements
      SaltPubKey: [bigint, bigint], // 2 elements
      CommitmentHash: bigint
    ): [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint
    ] => {
      return [
        CipherText[0],
        CipherText[1],
        CipherText[2],
        CipherText[3],
        CipherText[4],
        CipherText[5],
        CipherText[6],
        SaltPubKey[0],
        SaltPubKey[1],
        CommitmentHash
      ]
    }

    StateSize = (): bigint => BigInt(this.merkleTree.size)

    /**
     * @dev UpdateRootSet: insert a set of roots into the rootSet
     * @param roots: a set of roots to be inserted into the rootSet
     * @returns the new root of the merkle tree
     */
    UpdateRootSet = (roots: bigint[]): bigint => {
      for (const root of roots) {
        // check if root exists in the rootSet
        // if not, add it
        // if yes, throw an error
        if (this.rootSet.has(root)) {
          throw new Error("Root already exists in the rootSet")
        }
        this.rootSet.add(root)
      }
      // update the merkle tree
      this.merkleTree.insertMany(roots)
      return this.merkleTree.root
    }

    genMerkleProofFor = (index: bigint): InclusionProofT => {
      return MerkleTreeInclusionProof(
        this.merkleTree,
        this.MAX_MERKLE_DEPTH
      )(index)
    }
  }

  export class poolC extends stateC {
    _scope?: (contract: Address) => Promise<TPrivacyPool.ScopeFn_out_T>
    _stateSize?: (
      contract: Address
    ) => Promise<TPrivacyPool.GetStateSizeFn_out_T>
    _roots?: (
      contract: Address,
      args: TPrivacyPool.FetchRootsFn_in_T
    ) => Promise<TPrivacyPool.FetchRootsFn_out_T>

    _checkpoint?: (
      contract: Address,
      root: bigint
    ) => Promise<[boolean, bigint]>

    scopeval?: bigint
    _context?: (
      contract: Address,
      _r: TPrivacyPool.RequestT
    ) => Promise<TPrivacyPool.ContextFn_out_T>

    _process?: (
      acc: WalletClient
    ) => (
      contract: Address,
      Request: TPrivacyPool.RequestT,
      Proof: TPrivacyPool.ProofT,
      value: bigint,
      simOnly: boolean
    ) => Promise<boolean | Hex>

    _onChainGroth16Verifier?: (
      contract: Address,
      args: TGroth16Verifier.verifyProofFn_in_T
    ) => Promise<boolean>

    _ciphers?: (
      contract: Address,
      range: [bigint, bigint] //[from, to]
    ) => Promise<
      readonly [
        TPrivacyPool.CipherTexts_T,
        TPrivacyPool.SaltPublicKeys_T,
        TPrivacyPool.CommitmentHashes_T
      ]
    >

    constructor(
      public meta: PrivacyPoolMeta,
      public conn?: PublicClient,
      public zkArtifacts?: CircomArtifactsT
    ) {
      super(zkArtifacts)
      // set con to the std public client if it is not set
      this.conn =
        this.conn ??
        createPublicClient({
          chain: this.meta.chain,
          transport: http()
        })

      // bindings to the contract functions
      this._scope = ScopeFn(meta.chain, this.conn)
      this._context = ContextFn(meta.chain, this.conn)
      this._stateSize = GetStateSizeFn(meta.chain, this.conn)
      this._roots = FetchRootsFn(meta.chain, this.conn)
      this._checkpoint = FetchCheckpointAtRootFn(meta.chain, this.conn)
      this._ciphers = UnpackCiphersWithinRangeFn(meta.chain, this.conn)

      // binding to on-chain verifier
      this._onChainGroth16Verifier = FnGroth16Verifier.verifyProofFn(
        meta.chain,
        this.conn
      )
    }
    /**
     * @dev sync: sync the state of the privacy pool with the on-chain state
     * @returns true if the sync is successful, false otherwise
     * Gets the latest on-chain state Size and compare it with the current state size
     * Collect the new roots from the on-chain state and update the merkle tree on size difference
     */
    sync = async (): Promise<boolean> => {
      const chainStateSize = this._stateSize
        ? await this._stateSize(this.meta.address)
        : await GetStateSizeFn(this.meta.chain)(this.meta.address)

      if (chainStateSize < this.StateSize()) {
        throw new Error(
          "On-chain state size is less than the current state size"
        )
      }

      //TODO Make this batched to avoid hitting block gas limit
      const sizeDiff = chainStateSize - this.StateSize()
      if (sizeDiff > 0n) {
        const ToFrom: [bigint, bigint] = [this.StateSize(), chainStateSize - 1n]
        const roots = (
          this._roots
            ? await this._roots(this.meta.address, ToFrom)
            : await FetchRootsFn(this.meta.chain, this.conn)(
                this.meta.address,
                ToFrom
              )
        ) as bigint[]
        const _newRoot = this.UpdateRootSet(roots)
        // check that there is a checkpoint exisiting for the new root
        const _checkpoint = this._checkpoint
          ? await this._checkpoint(this.meta.address, _newRoot)
          : await FetchCheckpointAtRootFn(this.meta.chain, this.conn)(
              this.meta.address,
              _newRoot
            )
        return _checkpoint[0]
      }
      return false
    }
    /**
     * @dev process: iterates through ciphertexts and recover commitments
        from ciphers that can be decrypted with the provided key
     * @param Request: the set of keys to be used for decryption
     */
    recoverCommitments = async (
      keys: {
        pkScalar: bigint
        nonce: bigint
      }[],
      ignoreVoids = true,
      ignoreNullified = true
    ): Promise<
      {
        pkScalar: bigint
        nonce: bigint
        commitment: Commitment
      }[]
    > => {
      const ciphers = this._ciphers
        ? await this._ciphers(this.meta.address, [
            0n,
            this.StateSize() / 4n + 1n
          ])
        : await UnpackCiphersWithinRangeFn(this.meta.chain, this.conn)(
            this.meta.address,
            [0n, this.StateSize() / 4n + 1n]
          )
      const commitments: {
        pkScalar: bigint
        nonce: bigint
        commitment: Commitment
      }[] = []
      for (let i = 0; i < ciphers[0].length; i++) {
        const cipher = ciphers[0][i]
        const salt = ciphers[1][i]
        const commitmentHash = ciphers[2][i]
        for (let j = 0; j < keys.length; j++) {
          const _commitment = RecoverCommitment(
            {
              _pKScalar: keys[j].pkScalar,
              _nonce: keys[j].nonce,
              _len: ConstCommitment.STD_TUPLE_SIZE,
              _saltPk: salt as Point<bigint>,
              _cipher: cipher.map((x) => BigInt(x)) as CipherText<bigint>
            },
            {
              _hash: commitmentHash
            }
          )
          if (_commitment) {
            if (_commitment.isVoid() && ignoreVoids) {
              continue
            }

            if (ignoreNullified) {
              // check if nullroot of the commitment
              // exists in the rootset
              // if so then continue
              if (this.rootSet.has(_commitment.nullRoot)) {
                continue
              }
            }

            // set the index to the leaf index in the merkle tree
            // otherwise proof generation will fail later on
            _commitment.setIndex(this.merkleTree)

            commitments.push({
              pkScalar: keys[j].pkScalar,
              nonce: keys[j].nonce,
              commitment: _commitment
            })
          }
        }
      }
      return commitments
    }

    scope = async (): Promise<bigint> =>
      this.scopeval // return the cached value if it exists
        ? this.scopeval // otherwise, compute the value and cache it
        : (this._scope
            ? this._scope(this.meta.address)
            : ScopeFn(this.meta.chain)(this.meta.address)
          )
            .then((v) => {
              this.scopeval = v
              return v
            })
            .catch((e) => {
              throw new Error(`Error in computing scope: ${e}`)
            })

    context = async (_r: TPrivacyPool.RequestT): Promise<bigint> =>
      this._context
        ? this._context(this.meta.address, _r)
        : ContextFn(this.meta.chain, this.conn)(this.meta.address, _r)

    process = async (
      account: PublicActions & WalletActions & Client,
      _r: TPrivacyPool.RequestT,
      pkScalars: bigint[],
      nonces: bigint[],
      existingCommitment: Commitment[],
      newCommitment: Commitment[],
      simOnly = false
    ) =>
      this.zkCircuit
        ? await this.zkCircuit
            .prove({
              scope: await this.scope(), // calculate scope on the fly if value is not cached
              context: await this.context(_r), // query contract to get context value based on _r
              mt: this.merkleTree,
              maxDepth: this.MAX_MERKLE_DEPTH,
              pkScalars: pkScalars,
              nonces: nonces,
              existing: existingCommitment,
              new: newCommitment
            })(
              //callback fn to verify output on-chain
              async ({
                out
              }): Promise<{
                verified: boolean
                packedProof: StdPackedGroth16ProofT<bigint>
              }> => {
                // pack the proof for on-chain verification
                const packed = FnPrivacyPool.parseOutputFn("pack")(
                  out as SnarkJSOutputT
                ) as StdPackedGroth16ProofT<bigint>
                // verify the proof on-chain
                // if the verifier is not set, return false
                // this is useful for testing the zkCircuit without the need for a verifier
                return {
                  verified: await (this._onChainGroth16Verifier
                    ? this._onChainGroth16Verifier(this.meta.verifier, packed)
                    : false),
                  packedProof: packed
                }
              }
            )
            .then(async (out) => {
              // typecast
              const _out = out as {
                verified: boolean
                packedProof: StdPackedGroth16ProofT<bigint>
              }

              if (_out.verified) {
                // if the proof is valid, proceed with the transaction
                return ProcessFn(account)(
                  this.meta.address,
                  [
                    _r,
                    {
                      _pA: _out.packedProof[0],
                      _pB: _out.packedProof[1],
                      _pC: _out.packedProof[2],
                      _pubSignals: _out.packedProof[3]
                    }
                  ],
                  _out.packedProof[3][D_ExternIO_StartIdx] as bigint,
                  simOnly
                )
              }
            })
            .catch((e) => {
              throw new Error(`Error in processing request: ${e}`)
            })
        : false
  }
}
