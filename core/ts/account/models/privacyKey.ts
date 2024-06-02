import { Hex, PrivateKeyAccount, hexToBigInt } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Keypair, PrivKey } from 'maci-domainobjs';

import {
  EcdhSharedKey,
  Ciphertext,
  poseidonEncrypt,
  poseidonDecrypt,
  genEcdhSharedKey,
  sign,
  Signature,
  Plaintext,
} from 'maci-crypto';

interface Keys {
  account: PrivateKeyAccount; // account address

  privateKey: Hex; // ecdsa private key
  keypair: Keypair | null; // eddsa keypair (from maci-domainobjs)
  eK: EcdhSharedKey; // ECDH shared key
}

export interface KeyActions {
  PubKey(): bigint[];
  PublicAddress(): Hex;
  PubKeyHash(): bigint;
  signMsg(msg: bigint): Signature;
  encrypt(secret: bigint[], nonce: bigint): Ciphertext;
  decrypt(cipher: Ciphertext, nonce: bigint, secretLen: number): Plaintext | void;
}

export type PrivacyKey = Keys & KeyActions;

class privacyKey implements PrivacyKey {
  privateKey: Hex = '0x' as Hex;
  account: PrivateKeyAccount = {} as PrivateKeyAccount; // account address
  keypair: Keypair | null = null; // eddsa keypair (from maci-domainobjs)
  eK: EcdhSharedKey = [0n, 0n]; // ECDH shared key

  constructor(privateKey?: Hex) {
    if (privateKey) {
      this.privateKey = privateKey;
    } else {
      this.privateKey = generatePrivateKey();
    }

    try {
      this.account = privateKeyToAccount(this.privateKey);
      let pK = new PrivKey(hexToBigInt(this.privateKey));
      this.keypair = new Keypair(pK);
      this.eK = genEcdhSharedKey(this.keypair.privKey.rawPrivKey, this.keypair.pubKey.rawPubKey);
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error creating privacy key', { cause: error });
        throw new Error('Error creating privacy key', { cause: error });
      }
    }
  }

  PubKey(): bigint[] {
    if (!this.keypair) {
      throw new Error('No keypair found');
    }
    return this.keypair.pubKey.rawPubKey;
  }

  PubKeyHash(): bigint {
    if (!this.keypair) {
      throw new Error('No keypair found');
    }
    return this.keypair.pubKey.hash();
  }

  PublicAddress(): Hex {
    return this.account.address;
  }

  encrypt(secret: bigint[], nonce: bigint): Ciphertext {
    return poseidonEncrypt(secret, this.eK, nonce);
  }

  decrypt(cipher: Ciphertext, nonce: bigint, secretLen: number): Plaintext | void {
    try {
      return poseidonDecrypt(cipher, this.eK, nonce, secretLen);
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error decrypting', { cause: error });
        throw new Error('Error decrypting', { cause: error });
      }
    }
  }

  signMsg(msg: bigint): Signature {
    if (!this.keypair) {
      throw new Error('No keypair found');
    }
    try {
      return sign(this.keypair.privKey.rawPrivKey.toString(), msg);
    } catch (error) {
      console.log('Error signing message', { cause: error });
      throw new Error('Error signing message', { cause: error });
    }
  }
}

export { privacyKey };
