import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Hex, hexToBigInt } from 'viem';
import { Keypair, PrivKey, PubKey } from 'maci-domainobjs';
import { hashLeftRight } from 'maci-crypto';

import { TPrivacyKey } from '@core/account/types';
import {
  genEcdhSharedKey,
  Signature,
  sign,
  EcdhSharedKey,
  Ciphertext,
  poseidonEncrypt,
  poseidonDecrypt,
  Plaintext,
} from 'maci-crypto';

export namespace FnPrivacyKey {
  export function HashhPubKeyFn(pubKey: PubKey): bigint {
    return hashLeftRight(pubKey.rawPubKey[0], pubKey.rawPubKey[1]);
  }
  export function GenPrivacyKeyFn(privateKey?: Hex): TPrivacyKey.KeyT {
    const _privateKey = privateKey ? privateKey : generatePrivateKey();
    const _privacyKey: TPrivacyKey.KeyT = {
      privateKey: _privateKey,
      account: privateKeyToAccount(_privateKey),
      keypair: new Keypair(new PrivKey(hexToBigInt(_privateKey))),
    };

    _privacyKey.eK = genEcdhSharedKey(
      _privacyKey.keypair.privKey.rawPrivKey,
      _privacyKey.keypair.pubKey.rawPubKey,
    );

    return _privacyKey;
  }
  export function SignMsgFn(msg: bigint, pK: string): Signature {
    if (pK == '') {
      throw new Error('empty key given');
    }
    try {
      return sign(pK, msg);
    } catch (error) {
      console.log('Error signing message', { cause: error });
      throw new Error('Error signing message', { cause: error });
    }
  }

  export function EncryptFn(secret: Plaintext, nonce: bigint, eK: EcdhSharedKey): Ciphertext {
    return poseidonEncrypt(secret, eK, nonce);
  }

  export function DecryptFn(
    cipher: Ciphertext,
    nonce: bigint,
    secretLen: number,
    eK: EcdhSharedKey,
  ): Plaintext {
    try {
      return poseidonDecrypt(cipher, eK, nonce, secretLen);
    } catch (error) {
      throw new Error('Error decrypting', { cause: error });
    }
  }
}
