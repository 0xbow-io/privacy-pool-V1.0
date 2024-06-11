import { Hex, Address } from 'viem';
import { PubKey } from 'maci-domainobjs';
import { Ciphertext, Signature, Plaintext } from 'maci-crypto';
import { IPrivacyKey } from '@core/account/interfaces';
import { TPrivacyKey } from '@core/account/types';
import { FnPrivacyKey } from '@core/account/functions';

// Useful aliases
export type PrivacyKey = IPrivacyKey.KeyI;
export function CreatePrivacyKey(privateKey?: Hex): IPrivacyKey.KeyI {
  return CPrivacyKey.PrivacyKeyC.create(privateKey);
}

export namespace CPrivacyKey {
  export class PrivacyKeyC implements IPrivacyKey.KeyI {
    readonly signer: TPrivacyKey.SignerT = this.sign.bind(this);
    readonly encryptor: TPrivacyKey.EncryptorT = this.encrypt.bind(this);
    readonly decryptor: TPrivacyKey.DecryptorT = this.decrypt.bind(this);

    private constructor(private _key: TPrivacyKey.KeyT) {}

    static create(privateKey?: Hex): IPrivacyKey.KeyI {
      return new PrivacyKeyC(FnPrivacyKey.GenPrivacyKeyFn(privateKey));
    }

    get pubKey(): PubKey {
      if (this._key === undefined || this._key!.keypair == undefined) {
        throw new Error('No keypair found');
      }
      return this._key.keypair.pubKey;
    }

    get pubKeyHash(): bigint {
      if (this._key === undefined || this._key!.keypair == undefined) {
        throw new Error('No keypair found');
      }
      return FnPrivacyKey.HashhPubKeyFn(this._key.keypair.pubKey);
    }

    get publicAddress(): Address {
      if (this._key === undefined) {
        throw new Error('No keypair found');
      }
      return this._key.account.address;
    }

    private sign(msg: bigint): Signature {
      if (this._key === undefined || this._key!.keypair === undefined) {
        throw new Error('No keypair found');
      }
      return FnPrivacyKey.SignMsgFn(msg, this._key.keypair.privKey.rawPrivKey.toString());
    }
    private encrypt(secret: Plaintext, nonce: bigint): Ciphertext {
      if (this._key === undefined || this._key!.eK === undefined) {
        throw new Error('kehpair or eK not found');
      }
      return FnPrivacyKey.EncryptFn(secret, nonce, this._key.eK);
    }
    private decrypt(cipher: Ciphertext, nonce: bigint, secretLen: number): Plaintext {
      try {
        const plaintext = FnPrivacyKey.DecryptFn(cipher, nonce, secretLen, this._key!.eK!);
        return plaintext;
      } catch (e) {
        console.log('Error decrypting message', e);
        throw new Error('Error decrypting message');
      }
    }
  }
}
