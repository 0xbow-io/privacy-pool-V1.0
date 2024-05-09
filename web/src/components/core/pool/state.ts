
import { Chain } from 'viem/chains';
import { Address, PublicClient, AbiFunction, fromHex } from 'viem'
import {ChainProviders} from '@utils/provider'
import {sepolia} from 'viem/chains';


import { BG_ZERO, ZERO_LEAF,  numbers } from '@/store/variables'
import {Element, MerkleTree} from 'fixed-merkle-tree'
import {poseidonHash, poseidonHash2, getBitArray, toFixedHex} from '@/utils/hash'


import {Commitment, NewCommitmentEvent, NewNullifierEvent, NewTxRecordEvent} from '@core/pool'
import {Account} from '@core/account'

export const privacyPoolABI =  [
        {
            name: 'getLastRoot',
            type: 'function',
            inputs: [],
            stateMutability: 'view',
            outputs: [
                { name: 'root', type: 'bytes32' },
            ]
        },
        {
            name: 'currentRootIndex',
            type: 'function',
            inputs: [],
            stateMutability: 'view',
            outputs: [
                { name: 'index', type: 'uint32' },
            ]
        }
    ]


export interface StateManager {
    CurrentOnChainIndex() : bigint
    CurrentOnChainRoot() : bigint
    GetCommitmentTree() : Promise<MerkleTree>
    SyncFrom(fromBlock: bigint, batchSize: number, callback: (commitment: Commitment) => void) : Promise<void>
}

const poseidonHash2Wrapper = (left: Element, right: Element) => toFixedHex(poseidonHash2(left.toString(), right.toString()))

export class stateManager implements StateManager {
    publicClient: PublicClient
    pool: Address

    onchainIndex: bigint
    onchainRoot: bigint

    public latestBlock: bigint
    public commitments: Map<string, Commitment>
    

    public constructor(chain: Chain, pool: Address) {
        this.publicClient = ChainProviders.get(chain) as PublicClient
        this.pool = pool
        this.onchainRoot = 0n
        this.onchainIndex = 0n
        this.latestBlock = 0n
        this.commitments = new Map<string, Commitment>()
    }

    public CurrentOnChainIndex(): bigint {
        return this.onchainIndex
    }

    public CurrentOnChainRoot(): bigint {
        return this.onchainRoot
    }

    public async GetCommitmentTree() { 
        let commitmentArr : Commitment[] = []
        this.commitments.forEach((value: Commitment, key: string) => {
            commitmentArr.push(value)
        })

        const leaves = commitmentArr.sort((a, b) => Number(a.index - b.index)).map((e) => e.commitment)
        return new MerkleTree(numbers.TX_RECORDS_MERKLE_TREE_HEIGHT, leaves, { hashFunction: poseidonHash2Wrapper, zeroElement: ZERO_LEAF.toString()})    
    }

    async syncCurrentOnChainIndex() {   
        await this.publicClient.readContract({
            address: this.pool,
            abi: privacyPoolABI,
            functionName: 'currentRootIndex',
        }).then((idx) => {
            this.onchainIndex = fromHex(idx as Address, 'bigint')
        }).catch((error) => {
            return new Error(error)
        })
    }

    async synCurrentOnChainRoot() { 
        await this.publicClient.readContract({
            address: this.pool,
            abi: privacyPoolABI,
            functionName: 'getLastRoot',
        }).then((root) => {
            this.onchainRoot = fromHex(root as Address, 'bigint')
        }).catch((error) => {
            throw new Error(error)
        })
    }

    async fetchCommitments(fromBlock: bigint, toBlock: bigint, callback: (chain: Chain, contract: Address, commitment: Commitment)  => void) { 
        await this.publicClient.getLogs({
            address: this.pool,
            fromBlock: fromBlock,
            toBlock: toBlock,
            event: NewCommitmentEvent
        }).then((logs) => { logs.forEach(async (log) => {
                    if (typeof log.args === "undefined") {
                        return new Error("incorrect data");
                    }
                    const commitment = log.args as Commitment
                    this.commitments.set(commitment.commitment.toString(), commitment)
                    if (toBlock > this.latestBlock) {
                        this.latestBlock = toBlock
                    }
                    callback(commitment)
                }
            )}
        ).catch((error) => {
            throw new Error(error)
        })
    }

    async batchFetchCommitments(fromBlock: bigint, numberOfBlocks: number, batchSize: number, callback: (chain: Chain, contract: Address, commitment: Commitment)  => void) { 
        let batch = 0
        const allPromise = Promise.all(
                Array.from({length: Math.ceil(numberOfBlocks / batchSize)}, (_, i) => { 
                    let start = fromBlock + BigInt(batchSize) * BigInt(batch)
                    batch++
                    return this.fetchCommitments(start, start + BigInt(batchSize), callback)
            })
        )

        await allPromise
    }

    public async SyncFrom(fromBlock: bigint, batchSize: number = 10000, callback: (chain: Chain, contract: Address, commitment: Commitment) => void){
        let allPromise = Promise.all([ 
                this.syncCurrentOnChainIndex(),  
                this.synCurrentOnChainRoot(),
                this.publicClient.getBlockNumber().then((block) => {
                    return this.batchFetchCommitments(fromBlock, Number(block - fromBlock), batchSize, callback)
                }).catch((error) => {
                    throw new Error(error)
                })
        ])
        await allPromise
    }
}   



