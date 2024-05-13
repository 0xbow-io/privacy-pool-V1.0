import { getContract, Address, AbiEvent } from 'viem'
import * as PrivacyPool from './artifacts/PrivacyPool.json';


export type Commitment = {
    commitment: string
    index: bigint
    encryptedOutput: string
}

export const NewCommitmentEvent : AbiEvent = {
    name: 'NewCommitment',
    type: 'event',
    inputs: [
        { name: 'commitment', type: 'bytes32' },
        { name: 'index', type: 'uint256' },
        { name: 'encryptedOutput', type: 'bytes' },
    ],
}
export type Nullifer = {
    nullifier: bigint
}

export const NewNullifierEvent : AbiEvent = {
    name: 'NewNullifier',
    type: 'event',
    inputs: [
        { name: 'nullifier', type: 'bytes32' },
    ],
}


export type TxRecord = {
    nullifier: bigint
}

export const NewTxRecordEvent : AbiEvent = {
    name: 'NewTxRecord',
    type: 'event',
    inputs: [
        { name: 'inputNullifier1', type: 'bytes32' },
        { name: 'inputNullifier2', type: 'bytes32' },
        { name: 'outputCommitment1', type: 'bytes32' },
        { name: 'outputCommitment2', type: 'bytes32' },
        { name: 'publicAmount', type: 'uint256' },
        { name: 'index', type: 'uint32' },
    ],
}


