import { Address, PublicClient, WalletClient } from 'viem';
import { Ciphertext } from 'maci-crypto';

export namespace TPrivacyPool {
  export type PoolMetadataT = {
    id: string;
    address: Address;
  };

  export type ChainConfT = {
    meta: PoolMetadataT;
    pubCL?: PublicClient;
    wallets?: WalletClient[];
    contracts?: {
      pool: any;
      verifier: any;
    };
  };

  export type NullifierEventT = {
    nullifier: bigint;
  };
  export type CommitmentEventT = {
    hash: bigint;
    cipher: Ciphertext;
    index: bigint;
  };

  export type TxRecordEventT = {
    inputNullifiers: bigint[];
    outputCommitments: CommitmentEventT[];
    publicVal: bigint;
    index: bigint;
  };
  export type SignalT = {
    pool: Address;
    account: Address;
    feeCollector: Address;
    feeVal: bigint;
    extVal?: bigint;
  };

  export type SupplementT<C, P> = {
    ciphers: C;
    associationProofURI: P;
  };

  export type ChainProof<T = bigint> = [T[], T[][], T[], T[]];
}
