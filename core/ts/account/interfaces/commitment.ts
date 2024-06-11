import { PubKey } from 'maci-domainobjs';
import { Signature, Ciphertext } from 'maci-crypto';
import { TCommitment } from '@core/account/types';

export namespace ICommitment {
  export interface CommitmentI<
    HashT = bigint,
    PkT = PubKey,
    NullifierT = bigint,
    SigT = Signature,
    CipherT = Ciphertext,
  > {
    hash: HashT;
    pubKey: PkT;
    toJSONStr(): string;
    index: bigint;
    nonce: bigint;
    isDummy: boolean;
    isExhausted: boolean;
    signature: SigT;
    nullifier: NullifierT;
    cipherText: CipherT;
    secret_len: number;
    raw: TCommitment.RawT;
  }
}
