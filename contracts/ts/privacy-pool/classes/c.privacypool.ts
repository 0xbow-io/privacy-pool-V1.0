import type {
  PrivacyPoolMeta,
  TGroth16Verifier,
  TPrivacyPool
} from "@privacy-pool-v1/contracts"
import {
  ContextFn,
  FnGroth16Verifier,
  ProcessFn,
  ScopeFn
} from "@privacy-pool-v1/contracts"
import type { Commitment, InclusionProofT } from "@privacy-pool-v1/domainobjs"
import type {
  CircomArtifactsT,
  ICircuit,
  SnarkJSOutputT,
  StdPackedGroth16ProofT
} from "@privacy-pool-v1/zero-knowledge"
import type {
  Address,
  Client,
  Hex,
  PublicActions,
  WalletActions,
  WalletClient,
  PublicClient
} from "viem"

import { D_ExternIO_StartIdx } from "@privacy-pool-v1/contracts"

import { createPublicClient, http } from "viem"

import { MerkleTreeInclusionProof } from "@privacy-pool-v1/domainobjs"
import { FnPrivacyPool } from "@privacy-pool-v1/zero-knowledge"

import { NewPrivacyPoolCircuit } from "@privacy-pool-v1/zero-knowledge"

import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"

import type { IState } from "@privacy-pool-v1/contracts"

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

    StoreCipher = (
      CipherText: [bigint, bigint, bigint, bigint, bigint, bigint, bigint], // 7 elements
      SaltPubKey: [bigint, bigint], // 2 elements
      CommitmentHash: bigint
    ): number => {
      // pack the cipher text and salt public key, and commitment hash
      this.cipherStore.push([
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
      ])
      return this.cipherStore.length - 1
    }

    /**
     * @dev InsertInToRootSet: insert a set of roots into the rootSet
     * @param roots: a set of roots to be inserted into the rootSet
     * @returns the new root of the merkle tree
     */
    InsertInToRootSet = (roots: bigint[]): bigint => {
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
      this._onChainGroth16Verifier = FnGroth16Verifier.verifyProofFn(
        meta.chain,
        this.conn
      )
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
                ok: boolean
                out: StdPackedGroth16ProofT<bigint>
              }> => {
                // pack the proof for on-chain verification
                const packed = FnPrivacyPool.parseOutputFn("pack")(
                  out as SnarkJSOutputT
                ) as StdPackedGroth16ProofT<bigint>
                return {
                  // verify the proof on-chain
                  ok: await (this._onChainGroth16Verifier
                    ? this._onChainGroth16Verifier(this.meta.verifier, packed)
                    : false),
                  out: packed
                }
              }
            )
            .then(async (res) => {
              // cast res
              const _res = res as {
                ok: boolean
                out: StdPackedGroth16ProofT<bigint>
              }
              if (_res.ok) {
                // if the proof is valid, proceed with the transaction
                console.log("request: ", _r)
                console.log("proof: ", _res.out)
                return ProcessFn(account)(
                  this.meta.address,
                  _r,
                  {
                    _pA: _res.out[0],
                    _pB: _res.out[1],
                    _pC: _res.out[2],
                    _pubSignals: _res.out[3]
                  },
                  _res.out[3][D_ExternIO_StartIdx], //exctract io[0] from _res.out[3]
                  simOnly
                )
              }
            })
            .catch((e) => {
              console.error(e)
            })
        : false
  }
}
