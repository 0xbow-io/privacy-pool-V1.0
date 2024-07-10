import type {
  Address,
  PublicClient,
  Chain,
  WalletClient,
  Client,
  Hex,
  PublicActions,
  WalletActions,
  PrivateKeyAccount,
  Account
} from "viem"
import type {
  TPrivacyPool,
  TGroth16Verifier
} from "@privacy-pool-v1/core-ts/pool"
import {
  ComputeScopeFn,
  FnGroth16Verifier,
  ProcessFn
} from "@privacy-pool-v1/core-ts/pool"
import type { Commitment } from "@privacy-pool-v1/core-ts/account"
import type {
  ICircuit,
  MerkleProofT,
  Groth16_VKeyJSONT,
  CircomArtifactT,
  CircomOutputT,
  StdPackedGroth16ProofT,
  SnarkJSOutputT,
  CircomArtifactsT
} from "@privacy-pool-v1/zero-knowledge"

import {
  NewPrivacyPoolCircuit,
  FnPrivacyPool,
  genTestData
} from "@privacy-pool-v1/zero-knowledge"

import { LeanIMT } from "@zk-kit/lean-imt"
import { poseidon2 } from "poseidon-lite/poseidon2"
import type { IState } from "@privacy-pool-v1/core-ts/pool"

export namespace CPool {
  export class stateC implements IState.StateI {
    MAX_MERKLE_DEPTH = 32
    merkleTree = new LeanIMT((a, b) => poseidon2([a, b]))
    nullifiers = new Set<bigint>()
    zkCircuit?: ICircuit.circuitI

    constructor(zkArtifacts?: CircomArtifactsT) {
      this.zkCircuit = zkArtifacts
        ? NewPrivacyPoolCircuit(zkArtifacts)
        : undefined
    }

    static newState = (zkArtifacts?: CircomArtifactsT): IState.StateI =>
      new stateC(zkArtifacts)

    insertNullifier = (nullifier: bigint): boolean => {
      if (this.nullifiers.has(nullifier)) {
        return false
      }
      this.nullifiers.add(nullifier)
      return true
    }

    genProofFor = (index: bigint): MerkleProofT => {
      return FnPrivacyPool.merkleProofFn({
        mt: this.merkleTree
      })(index)
    }
  }

  // pool class extends the stae class
  // therefore it has access to the merkle tree
  // and nullifier set
  export class poolC extends stateC {
    _computeScope?: (
      contract: Address,
      args: TPrivacyPool._computeScopeFn_argsT
    ) => Promise<TPrivacyPool._computeScopeFn_outputT>

    _process?: <WalletClient extends PublicActions & WalletActions & Client>(
      acc: WalletClient
    ) => (
      contract: Address,
      args: [
        TPrivacyPool._rT,
        TPrivacyPool._sT,
        TPrivacyPool._pAT,
        TPrivacyPool._pBT,
        TPrivacyPool._pCT,
        TPrivacyPool._pubSignalsT
      ],
      value: bigint,
      simOnly: boolean
    ) => Promise<boolean | Hex>

    _onChainVerifier?: (
      contract: Address,
      args: TGroth16Verifier.verifyProofFn_in_T
    ) => Promise<boolean>

    constructor(
      public specs: {
        poolAddress: Address
        verifierAddress: Address
        chain?: Chain
        conn?: PublicClient
        zkArtifacts?: CircomArtifactsT
      }
    ) {
      super(specs.zkArtifacts)
      // tie the computeScope function to the pool object
      this._computeScope = ComputeScopeFn(specs.chain, specs.conn)
      this._onChainVerifier = FnGroth16Verifier.verifyProofFn(
        specs.chain,
        specs.conn
      )
    }

    scope = async (_r: TPrivacyPool._rT): Promise<bigint> =>
      this._computeScope
        ? this._computeScope(this.specs.poolAddress, _r)
        : ComputeScopeFn(this.specs.chain, this.specs.conn)(
            this.specs.poolAddress,
            _r
          )

    process = async (
      account: PublicActions & WalletActions & Client,
      args: {
        inputs: Commitment[]
        outputs: Commitment[]
      },
      _r: TPrivacyPool._rT,
      associationProofURI: "",
      simOnly = false
    ) =>
      this.zkCircuit
        ? await this.zkCircuit
            .prove({
              mt: this.merkleTree,
              maxDepth: this.MAX_MERKLE_DEPTH,
              inputs: args.inputs,
              outputs: args.outputs,
              scope: await this.scope(_r)
            })(
              //callback fn to verify output on-chain
              async ({
                out
              }): Promise<{
                ok: boolean
                out: PackedGroth16ProofT<bigint>
              }> => {
                const packed = FnPrivacyPool.parseOutputFn("pack")(
                  out as SnarkJSOutputT
                ) as PackedGroth16ProofT<bigint>
                return {
                  ok: await (this._onChainVerifier
                    ? this._onChainVerifier(this.specs.verifierAddress, packed)
                    : false),
                  out: packed
                }
              }
            )
            .then(async (res) => {
              // cast res
              const _res = res as {
                ok: boolean
                out: PackedGroth16ProofT<bigint>
              }
              // prepare ciphers
              const ciphers = args.outputs.map(
                (o) => o.cipherText as [bigint, bigint, bigint, bigint]
              )

              return ProcessFn(account)(
                this.specs.poolAddress,
                [
                  _r,
                  {
                    ciphertexts: [
                      [
                        ciphers[0][0],
                        ciphers[0][1],
                        ciphers[0][2],
                        ciphers[0][3]
                      ],
                      [
                        ciphers[1][0],
                        ciphers[1][2],
                        ciphers[1][3],
                        ciphers[1][3]
                      ]
                    ],
                    associationProofURI: associationProofURI
                  },
                  ..._res.out
                ],
                _r.units,
                simOnly
              )
            })
            .catch((e) => {
              console.error(e)
            })
        : false
  }
}
