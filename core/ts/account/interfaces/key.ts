import { PubKey } from 'maci-domainobjs';

import { type Ciphertext, type Signature, type Plaintext } from 'maci-crypto';
import { type Address } from 'viem';
import { type TPrivacyKey } from '@privacy-pool-v1/core-ts/account/types';

export namespace IPrivacyKey {
  export interface KeyI<
    PkT = PubKey,
    SigT = Signature,
    MsgT = bigint,
    CipherT = Ciphertext,
    SecretT = Plaintext,
  > {
    pubKey: PkT;
    publicAddress: Address;
    pubKeyHash: bigint;
    signer: TPrivacyKey.SignerT<MsgT, SigT>;
    encryptor: TPrivacyKey.EncryptorT<SecretT, CipherT>;
    decryptor: TPrivacyKey.DecryptorT<CipherT, SecretT>;
    asJSON: any;
  }
}
