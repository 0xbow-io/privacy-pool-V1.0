import type {
  IState,
  PrivacyPoolMeta,
  TGroth16Verifier,
  TPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import {
  ContextFn,
  D_ExternIO_StartIdx,
  FetchCheckpointAtRootFn,
  FetchRootsFn,
  FnGroth16Verifier,
  GetStateSizeFn,
  ProcessFn,
  ScopeFn,
  UnpackCiphersWithinRangeFn
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import type { Commitment, PrivacyKeys } from "@privacy-pool-v1/domainobjs"
import type {
  CircomArtifactsT,
  SnarkJSOutputT,
  StdPackedGroth16ProofT
} from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import {
  FnPrivacyPool,
  NewPrivacyPoolCircuit
} from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
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
import { createPublicClient, http } from "viem"

export const getOnChainPrivacyPool = (
  meta: PrivacyPoolMeta,
  conn?: PublicClient
): CPool.poolC => new CPool.poolC(meta, conn)

export type OnChainPrivacyPool = CPool.poolC

export namespace CPool {
  export class stateC implements IState.StateI {
    MAX_MERKLE_DEPTH = 32
    merkleTree = new LeanIMT(hashLeftRight)
    rootSet: Set<bigint> = new Set()
    static newState = (): IState.StateI => new stateC()

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
      public conn?: PublicClient
    ) {
      super()
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
      // prevents spamming the contract with requests
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
      return true
    }
    /**
     * @dev decryptCiphers: iterates through ciphertexts and try to decrypt them
        based on the provided keys. The decrypted secrets are stored in the key state.
     * @param Request: the set of keys to be used for decryption
     */
    decryptCiphers = async (
      keys: PrivacyKeys,
      from = 0n,
      to = this.StateSize() / 2n - 1n
    ) => {
      const decryptionPromises: Promise<void>[] = []

      const ciphers = this._ciphers
        ? await this._ciphers(this.meta.address, [from, to])
        : await UnpackCiphersWithinRangeFn(this.meta.chain, this.conn)(
            this.meta.address,
            [from, to]
          )
      for (let i = 0; i < ciphers[0].length; i++) {
        const rawCipherText = [
          ciphers[0][i][0],
          ciphers[0][i][1],
          ciphers[0][i][2],
          ciphers[0][i][3],
          ciphers[0][i][4],
          ciphers[0][i][5],
          ciphers[0][i][6]
        ] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint]
        const rawSaltPk = [ciphers[1][i][0], ciphers[1][i][1]] as [
          bigint,
          bigint
        ]
        const commitmentHash = ciphers[2][i]
        for (let j = 0; j < keys.length; j++) {
          decryptionPromises.push(
            keys[j].decryptCipher(
              rawSaltPk,
              rawCipherText,
              commitmentHash,
              BigInt(i) + from
            )
          )
        }
        await Promise.all(decryptionPromises)
      }
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

    verify = async (
      proof: SnarkJSOutputT
    ): Promise<{
      verified: boolean
      packedProof: StdPackedGroth16ProofT<bigint>
    }> => {
      // pack the proof for on-chain verification
      const packed = FnPrivacyPool.parseOutputFn("pack")(
        proof as SnarkJSOutputT
      ) as StdPackedGroth16ProofT<bigint>

      return {
        verified: this._onChainGroth16Verifier
          ? await this._onChainGroth16Verifier(this.meta.verifier, packed)
          : await FnGroth16Verifier.verifyProofFn(this.meta.chain, this.conn)(
              this.meta.verifier,
              packed
            ),
        packedProof: packed
      }
    }

    processOnChain = async (
      account: PublicActions & WalletActions & Client,
      request: TPrivacyPool.RequestT,
      proof: StdPackedGroth16ProofT<bigint>,
      simOnly = true
    ): Promise<boolean | Hex> =>
      await ProcessFn(account)(
        this.meta.address,
        [
          request,
          {
            _pA: proof[0],
            _pB: proof[1],
            _pC: proof[2],
            _pubSignals: proof[3]
          }
        ],
        proof[3][D_ExternIO_StartIdx] as bigint,
        simOnly
      )

    process = async (
      account: PublicActions & WalletActions & Client,
      _r: TPrivacyPool.RequestT,
      pkScalars: bigint[],
      nonces: bigint[],
      existingCommitment: Commitment[],
      newCommitment: Commitment[],
      zkArtifacts: CircomArtifactsT,
      simOnly = true
    ): Promise<boolean | Hex> => {
      const out = (await NewPrivacyPoolCircuit(zkArtifacts)
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
          // callback fn to verify output on-chain
          async ({ out }) => {
            console.log('callback fn reached')
            return this.verify(out as SnarkJSOutputT)
          }
        )
        .catch((e) => {
          throw new Error(`Error in processing request: ${e}`)
        })) as {
        verified: boolean
        packedProof: StdPackedGroth16ProofT<bigint>
      }
      return out.verified
        ? await this.processOnChain(account, _r, out.packedProof, simOnly)
        : false
    }
  }
}
