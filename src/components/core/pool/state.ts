import { Chain } from 'viem/chains';
import { Address, PublicClient, AbiFunction, fromHex } from 'viem';
import { ChainProviders } from '@utils/provider';
import { Commitment, NewCommitmentEvent, NewNullifierEvent, NewTxRecordEvent } from '@core/pool';
import { LeanIMT } from '@zk-kit/lean-imt';
import { hashLeftRight } from 'maci-crypto';

export const privacyPoolABI = [
  {
    name: 'latestRoot',
    type: 'function',
    inputs: [],
    stateMutability: 'view',
    outputs: [{ name: 'root', type: 'uint256' }],
  },
  {
    name: 'currentDepth',
    type: 'function',
    inputs: [],
    stateMutability: 'view',
    outputs: [{ name: 'deopth', type: 'uint256' }],
  },
  {
    name: 'size',
    type: 'function',
    inputs: [],
    stateMutability: 'view',
    outputs: [{ name: 'size', type: 'uint256' }],
  },
];

export interface StateManager {
  CurrentOnChainRoot(): bigint;
}

export class stateManager implements StateManager {
  publicClient: PublicClient;
  pool: Address;

  onchainSize: bigint;
  onchainDepth: bigint;
  onchainRoot: bigint;
  genesis: bigint; // the deployment block

  public latestBlock: bigint;
  public commitments: Map<string, Commitment>;

  public commitmentTree: LeanIMT;

  public constructor(chain: Chain, pool: Address, genesis: bigint) {
    this.publicClient = ChainProviders.get(chain) as PublicClient;
    this.pool = pool;
    this.onchainRoot = 0n;
    this.onchainSize = 0n;
    this.onchainDepth = 0n;
    this.latestBlock = 0n;
    this.commitments = new Map<string, Commitment>();
    this.commitmentTree = new LeanIMT(hashLeftRight);
    this.genesis = genesis;
  }

  public CurrentOnChainRoot(): bigint {
    return this.onchainRoot;
  }
  public CurrentOnChainSize(): bigint {
    return this.onchainSize;
  }
  public CurrentOnChainDepth(): bigint {
    return this.onchainDepth;
  }

  /*
  public async GetCommitmentTree() {
    let commitmentArr: Commitment[] = [];
    this.commitments.forEach((value: Commitment, key: string) => {
      commitmentArr.push(value);
    });

    const leaves = commitmentArr.sort((a, b) => Number(a.index - b.index)).map((e) => e.commitment);
    return new MerkleTree(numbers.TX_RECORDS_MERKLE_TREE_HEIGHT, leaves, {
      hashFunction: poseidonHash2Wrapper,
      zeroElement: ZERO_LEAF.toString(),
    });
  }
   */

  async syncCurrentOnChainRoot() {
    await this.publicClient
      .readContract({
        address: this.pool,
        abi: privacyPoolABI,
        functionName: 'latestRoot',
      })
      .then((root) => {
        this.onchainRoot = fromHex(root as Address, 'bigint');
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  async syncCurrentSize() {
    await this.publicClient
      .readContract({
        address: this.pool,
        abi: privacyPoolABI,
        functionName: 'size',
      })
      .then((root) => {
        this.onchainRoot = fromHex(root as Address, 'bigint');
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  async syncCurrentDepth() {
    await this.publicClient
      .readContract({
        address: this.pool,
        abi: privacyPoolABI,
        functionName: 'currentDepth',
      })
      .then((root) => {
        this.onchainRoot = fromHex(root as Address, 'bigint');
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  async fetchCommitments(
    fromBlock: bigint,
    toBlock: bigint,
    callback: (chain: Chain, contract: Address, commitment: Commitment) => void,
  ) {
    await this.publicClient
      .getLogs({
        address: this.pool,
        fromBlock: fromBlock,
        toBlock: toBlock,
        event: NewCommitmentEvent,
      })
      .then((logs) => {
        logs.forEach(async (log) => {
          if (typeof log.args === 'undefined') {
            return new Error('incorrect data');
          }
          const commitment = log.args as Commitment;
          this.commitments.set(commitment.commitment.toString(), commitment);
          if (toBlock > this.latestBlock) {
            this.latestBlock = toBlock;
          }
          //callback(commitment)
        });
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  async batchFetchCommitments(
    fromBlock: bigint,
    numberOfBlocks: number,
    batchSize: number,
    callback: (chain: Chain, contract: Address, commitment: Commitment) => void,
  ) {
    let batch = 0;
    const allPromise = Promise.all(
      Array.from({ length: Math.ceil(numberOfBlocks / batchSize) }, (_, i) => {
        let start = fromBlock + BigInt(batchSize) * BigInt(batch);
        batch++;
        return this.fetchCommitments(start, start + BigInt(batchSize), callback);
      }),
    );

    await allPromise;
  }

  public async SyncFrom(
    fromBlock: bigint,
    batchSize: number = 10000,
    callback: (chain: Chain, contract: Address, commitment: Commitment) => void,
  ) {
    let allPromise = Promise.all([
      this.syncCurrentOnChainRoot(),
      this.publicClient
        .getBlockNumber()
        .then((block) => {
          return this.batchFetchCommitments(
            fromBlock,
            Number(block - fromBlock),
            batchSize,
            callback,
          );
        })
        .catch((error) => {
          throw new Error(error);
        }),
    ]);
    await allPromise;
  }
}
