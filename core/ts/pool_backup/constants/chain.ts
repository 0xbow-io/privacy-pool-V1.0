import { AbiEvent } from 'viem';

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

export const NewCommitmentEvent: AbiEvent = {
  name: 'NewCommitment',
  type: 'event',
  inputs: [
    { name: 'commitment', type: 'bytes32' },
    { name: 'index', type: 'uint256' },
    { name: 'encryptedOutput', type: 'bytes' },
  ],
};

export const NewNullifierEvent: AbiEvent = {
  name: 'NewNullifier',
  type: 'event',
  inputs: [{ name: 'nullifier', type: 'bytes32' }],
};

export type TxRecord = {
  nullifier: bigint;
};

export const NewTxRecordEvent: AbiEvent = {
  name: 'NewTxRecord',
  type: 'event',
  inputs: [
    { name: 'inputNullifier1', type: 'uint256' },
    { name: 'inputNullifier2', type: 'uint256' },
    { name: 'outputCommitment1', type: 'uint256' },
    { name: 'outputCommitment2', type: 'uint256' },
    { name: 'publicAmount', type: 'uint256' },
    { name: 'index', type: 'uint256' },
  ],
};
