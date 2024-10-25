import type {
  IState,
  PoolMeta,
  TGroth16Verifier,
  TPrivacyPool
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import {
  ContextFn,
  PrivacyPools,
  D_ExternIO_StartIdx,
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN,
  FetchCheckpointAtRootFn,
  FetchRootsFn,
  FnGroth16Verifier,
  GetStateSizeFn,
  ProcessFn,
  ScopeFn,
  UnpackCiphersWithinRangeFn
} from "@privacy-pool-v1/contracts/ts/privacy-pool"
import type { Commitment, PrivacyKeys } from "@privacy-pool-v1/domainobjs"
import { recoverCommitments } from "@privacy-pool-v1/domainobjs"
import type {
  CircomArtifactsT,
  SnarkJSOutputT,
  StdPackedGroth16ProofT,
  PrivacyPoolCircuitInput
} from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import {
  FnPrivacyPool,
  NewPrivacyPoolCircuit
} from "@privacy-pool-v1/zero-knowledge/ts/privacy-pool"
import { LeanIMT } from "@zk-kit/lean-imt"
import { hashLeftRight } from "maci-crypto"
import type {
  Chain,
  Address,
  Client,
  Hex,
  PublicActions,
  PublicClient,
  WalletActions,
  WalletClient
} from "viem"
import {
  extractChain,
  createPublicClient,
  http,
  numberToHex,
  hexToBigInt
} from "viem"

export type OnChainPrivacyPool = CPool.poolC
export type PrivacyPoolState = CPool.stateC

export const NewPrivacyPoolState = (): PrivacyPoolState => new CPool.stateC()

// returns all the privacy pool isntances
export const GetOnchainPrivacyPools = (): OnChainPrivacyPool[] =>
  Array.from(PrivacyPools.keys()).map((poolID) =>
    GetOnChainPrivacyPoolByPoolID(poolID)
  )

export const GetOnChainPrivacyPoolByPoolID = (poolID: string): CPool.poolC => {
  const meta = PrivacyPools.get(poolID)
  if (meta === undefined) {
    throw new Error("Pool not found")
  }
  return new CPool.poolC(meta)
}

export const GetOnChainPrivacyPool = (meta: PoolMeta): CPool.poolC =>
  new CPool.poolC(meta)

export namespace CPool {
  export class stateC implements IState.StateI {
    MAX_MERKLE_DEPTH = 32
    _size = 0
    _root = 0n
    _depth = 0

    constructor(public _rootSet: Set<bigint> = new Set<bigint>()) {
      this.syncStateTree()
    }

    static newState = (rootSet?: Set<bigint>): IState.StateI =>
      new stateC(rootSet)

    get size(): bigint {
      return BigInt(this._size)
    }

    get root(): bigint {
      return this._root
    }

    get stateTree(): LeanIMT<bigint> {
      return new LeanIMT<bigint>(hashLeftRight, Array.from(this._rootSet))
    }

    indexOf = (root: bigint): number => this.stateTree.indexOf(root)
    has = (root: bigint): boolean => this._rootSet.has(root)

    syncStateTree = (): bigint => {
      let stateTree = this.stateTree
      this._root = stateTree.root
      this._size = stateTree.size
      this._depth = stateTree.depth
      return this._root
    }

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
        if (this._rootSet.has(root)) {
          throw new Error("Root already exists in the rootSet")
        }
        this._rootSet.add(root)
      }

      return this.syncStateTree()
    }

    /***
     * @dev export: export the current state tree
     * @note Seems like there is a bug with LeanIMT issue where exporting the whole tree to JSON
     *       and then importing it, causes leaves to not be the original bigint value...
     *       So, we instead we are exporting the rootset instead as an array of Hex strings
     ***/
    export = (): string =>
      JSON.stringify({
        rootset: Array.from(this._rootSet).map((x) => numberToHex(x))
      })

    import = (data: string): { root: bigint; size: number; depth: number } => {
      this._rootSet = new Set(
        JSON.parse(data).rootset.map((x: Hex) => hexToBigInt(x))
      )
      this.syncStateTree()
      return { root: this._root, size: this._size, depth: this._depth }
    }

    BuildCircuitInputs = (
      scope: bigint,
      context: TPrivacyPool.ContextFn_out_T,
      pkScalars: bigint[],
      nonces: bigint[],
      existingCommitment: Commitment[],
      newCommitment: Commitment[],
      externIO?: [bigint, bigint]
    ) => {
      return FnPrivacyPool.getCircuitInFn(
        {
          scope: scope,
          context: context,
          mt: this.stateTree,
          maxDepth: this.MAX_MERKLE_DEPTH,
          pkScalars: pkScalars,
          nonces: nonces,
          existing: existingCommitment,
          new: newCommitment
        },
        externIO
      )().inputs
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
      range: [bigint, bigint]
    ) => Promise<
      readonly [
        TPrivacyPool.CipherTexts_T,
        TPrivacyPool.SaltPublicKeys_T,
        TPrivacyPool.CommitmentHashes_T
      ]
    >
    _conn?: PublicClient

    constructor(public meta: PoolMeta) {
      super()
      // bindings to the contract functions
      this._scope = ScopeFn(this.chain, this.conn)
      this._context = ContextFn(this.chain, this.conn)
      this._stateSize = GetStateSizeFn(this.chain, this.conn)
      this._roots = FetchRootsFn(this.chain, this.conn)
      this._checkpoint = FetchCheckpointAtRootFn(this.chain, this.conn)
      this._ciphers = UnpackCiphersWithinRangeFn(this.chain, this.conn)

      // binding to on-chain verifier
      this._onChainGroth16Verifier = FnGroth16Verifier.verifyProofFn(
        this.chain,
        this.conn
      )
    }

    get chain(): Chain {
      return (
        SUPPORTED_CHAINS.find((chain) => chain.id === this.meta.chainID) ??
        DEFAULT_CHAIN
      )
    }

    get conn(): PublicClient {
      if (!this._conn) {
        this._conn = createPublicClient({
          chain: this.chain,
          transport: http() // TODO: support for custom transport
        })
      }
      return this._conn
    }

    set conn(conn: PublicClient) {
      this._conn = conn
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
        : await GetStateSizeFn(this.chain)(this.meta.address)

      if (chainStateSize < this.size) {
        throw new Error(
          "On-chain state size is less than the current state size"
        )
      }

      //TODO Make this batched to avoid hitting block gas limit
      const sizeDiff = chainStateSize - this.size
      // prevents spamming the contract with requests
      if (sizeDiff > 0n) {
        const ToFrom: [bigint, bigint] = [this.size, chainStateSize - 1n]
        const roots = (
          this._roots
            ? await this._roots(this.meta.address, ToFrom)
            : await FetchRootsFn(this.chain, this.conn)(
              this.meta.address,
              ToFrom
            )
        ) as bigint[]
        const _newRoot = this.UpdateRootSet(roots)
        // check that there is a checkpoint exisiting for the new root
        const _checkpoint = this._checkpoint
          ? await this._checkpoint(this.meta.address, _newRoot)
          : await FetchCheckpointAtRootFn(this.chain, this.conn)(
            this.meta.address,
            _newRoot
          )
        return _checkpoint[0]
      }
      return true
    }

    getCiphers = async (
      range?: [bigint, bigint]
    ): Promise<
      | {
      rawSaltPk: [bigint, bigint]
      rawCipherText: [
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint
      ]
      commitmentHash: bigint
      cipherStoreIndex: bigint
    }[]
      | void
    > => {
      if (range === undefined) {
        range = [0n, this.size / 2n - 1n]
      }
      if (range[0] === 0n && range[1] === -1n) {
        return
      }

      const res = this._ciphers
        ? await this._ciphers(this.meta.address, range)
        : await UnpackCiphersWithinRangeFn(this.chain, this.conn)(
          this.meta.address,
          range
        )
      if (res) {
        // Note:
        // ciphers[0] => actual ciphertexts
        // ciphers[1] => salt public keys
        // ciphers[2] => commitment hashes
        return res[0].map((cipher, i) => {
          return {
            rawSaltPk: [res[1][i][0], res[1][i][1]],
            rawCipherText: [
              cipher[0],
              cipher[1],
              cipher[2],
              cipher[3],
              cipher[4],
              cipher[5],
              cipher[6]
            ],
            commitmentHash: res[2][i],
            cipherStoreIndex: range[0] + BigInt(i)
          }
        })
      }
    }

    /**
     * @dev decryptCiphers: iterates through ciphertexts and try to decrypt them
     based on the provided keys. The decrypted secrets are stored in the key state.
     * @param Request: the set of keys to be used for decryption
     */
    decryptCiphers = async (
      keys: PrivacyKeys,
      from = 0n,
      to = this.size / 2n - 1n
    ) => {
      const decryptionPromises: Promise<void>[] = []
      await this.getCiphers([from, to]).then(async (ciphers) => {
        if (!ciphers) {
          return
        }
        console.log(`there are ${ciphers.length} ciphers to decrypt`)
        await recoverCommitments(keys, ciphers, this)
      })
    }

    scope = async (): Promise<bigint> =>
      this.scopeval // return the cached value if it exists
        ? this.scopeval // otherwise, compute the value and cache it
        : (this._scope
            ? this._scope(this.meta.address)
            : ScopeFn(this.chain)(this.meta.address)
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
        : ContextFn(this.chain, this.conn)(this.meta.address, _r)

    verify = async (
      proof?: SnarkJSOutputT,
      // pack the proof for on-chain verification
      packed = FnPrivacyPool.parseOutputFn("pack")(
        proof as SnarkJSOutputT
      ) as StdPackedGroth16ProofT<bigint>
    ): Promise<{
      verified: boolean
      packedProof: StdPackedGroth16ProofT<bigint>
    }> =>
      // if proof is provided, verify it
      proof
        ? {
          verified: this._onChainGroth16Verifier
            ? await this._onChainGroth16Verifier(this.meta.verifier, packed)
            : await FnGroth16Verifier.verifyProofFn(this.chain, this.conn)(
              this.meta.verifier,
              packed
            ),
          packedProof: packed
        }
        : // otherwise, reject the promise
        Promise.reject("No proof provided")

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

    computeProof = async (
      circuitIn: PrivacyPoolCircuitInput,
      zkArtifacts: CircomArtifactsT,
      prover = NewPrivacyPoolCircuit(zkArtifacts).prove()
    ): Promise<{
      verified: boolean
      packedProof: StdPackedGroth16ProofT<bigint>
    }> =>
      await prover(
        circuitIn,
        async ({ out }) => await this.verify(out as SnarkJSOutputT)
      )
        .then(
          (res) =>
            res as {
              verified: boolean
              packedProof: StdPackedGroth16ProofT<bigint>
            }
        )
        .catch((e) => {
          throw new Error(`Error in building proof: ${e}`)
        })

    process = async (
      account: PublicActions & WalletActions & Client,
      _r: TPrivacyPool.RequestT,
      pkScalars: bigint[],
      nonces: bigint[],
      existingCommitment: Commitment[],
      newCommitment: Commitment[],
      zkArtifacts: CircomArtifactsT,
      simOnly = true
    ): Promise<boolean | Hex> =>
      await this.computeProof(
        this.BuildCircuitInputs(
          await this.scope(),
          await this.context(_r),
          pkScalars,
          nonces,
          existingCommitment,
          newCommitment
        ),
        zkArtifacts
      )
        .then(async (res) => {
          if (res.verified) {
            return await this.processOnChain(
              account,
              _r,
              res.packedProof,
              simOnly
            )
          } else {
            return false
          }
        })
        .catch((e) => {
          throw new Error(`Error in processing: ${e}`)
        })
  }
}
