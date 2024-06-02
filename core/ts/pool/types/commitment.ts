import { Ciphertext } from 'maci-crypto';

export type CommitmentEvent = {
  hash: bigint;
  cipher: Ciphertext;
  index: bigint;
};

export type TxRecordEvent = {
  inputNullifiers: bigint[];
  outputCommitments: CommitmentEvent[];
  publicVal: bigint;
  index: bigint;
};

export type NullifierEvent = {
  nullifier: bigint;
};
