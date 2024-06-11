import { Address } from 'viem';
import { TPrivacyKey } from '@core/account/types';
import { PubKey } from 'maci-domainobjs';
import { Ciphertext, Signature, Plaintext } from 'maci-crypto';

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
  }
}
