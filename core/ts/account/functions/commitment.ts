import { type TCommitment, type TPrivacyKey } from '@privacy-pool-v1/core-ts/account/types';
import { PubKey } from 'maci-domainobjs';
import { type Signature } from 'maci-crypto';
import { hash2, hash3, hash4 , genRandomBabyJubValue} from 'maci-crypto';
import {type Ciphertext} from 'maci-crypto';

export namespace FnCommitment {
  export function HashFn(secrets: TCommitment.SecretsT, pubKey: PubKey): bigint {
    return hash4([
      secrets.amount ?? 0n,
      pubKey.rawPubKey[0],
      pubKey.rawPubKey[1],
      secrets.blinding ?? 0n,
    ]);
  }

  export function SignatureFn(signer: TPrivacyKey.SignerT, hash: bigint, index: bigint): Signature {
    return signer(hash2([hash, index]));
  }

  export function NullifierFn(sig: Signature, hash: bigint, index: bigint) {
    return hash3([hash, index, sig.S as bigint]);
  }

  export function EncryptFn(
    encryptor: TPrivacyKey.EncryptorT,
    secrets: TCommitment.SecretsT,
    nonce: bigint,
  ): Ciphertext {
    return encryptor([secrets.amount || 0n, secrets.blinding || 0n], nonce);
  }

  export function BlinderFn(): bigint {
    return genRandomBabyJubValue()
  }
}
