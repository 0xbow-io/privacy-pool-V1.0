import { Signature, hash2, Ciphertext } from 'maci-crypto';
import { VirtualCommitment, IVirtualCommitment } from './virtualCommitment';
import { KeyActions } from '@core/account/models';
import { ComputeNullifier } from '@core/account/utils';

export interface ICommitment {
  hash: bigint;
  pubKey: bigint[];

  index: bigint;
  Signature(): Signature;
  nullifier?: bigint;
  cipher?: Ciphertext;
  secrets: { amount: bigint; blinding?: bigint };

  exhausted: boolean;
  dummy: boolean;

  pubKeyHash: bigint;
  SameAs(commitment: ICommitment | IVirtualCommitment): boolean;
  SameKey(key: KeyActions): boolean;
  SignWithKey(key: KeyActions, index: bigint): Signature;
  ComputeNullifier(key: KeyActions, index: bigint): { sig: Signature; nullifier: bigint };
  Encrypt(key: KeyActions, nonce: bigint): Ciphertext;
  ToJSON(): string;
}

class Commitment extends VirtualCommitment implements ICommitment {
  signature?: Signature;
  nullifier?: bigint;
  exhausted: boolean = false;
  index: bigint = 0n;
  constructor(
    key: KeyActions,
    secrets: { amount: bigint; blinding?: bigint } = { amount: 0n },
    leafIndex?: bigint,
    options: { sign?: boolean; encrypt?: boolean; encryptionNonce?: bigint } = {},
  ) {
    super(key.pubKey, secrets);
    if (options?.sign) {
      if (leafIndex === undefined) {
        console.log('Index must be provided to sign commitment');
        throw new Error('Index must be provided to sign commitment');
      }
      this.ComputeNullifier(key, leafIndex);
    }
    if (options?.encrypt && options?.encryptionNonce) {
      this.Encrypt(key, options.encryptionNonce);
    }
  }

  Signature(): Signature {
    return this.signature ?? { R8: [0n, 0n], S: 0n };
  }

  SignWithKey(key: KeyActions, index: bigint): Signature {
    // First match that the key's publickey is the same as the commitment's
    if (!this.SameKey(key)) {
      throw new Error('Key does not match commitment');
    }
    this.index = index;
    // then sign the commitment
    this.signature = key.signMsg(hash2([this.hash, index]));
    return this.signature;
  }

  ComputeNullifier(key: KeyActions, index: bigint): { sig: Signature; nullifier: bigint } {
    try {
      this.SignWithKey(key, index);
    } catch (error) {
      console.log('Error signing commitment', { cause: error });
      throw new Error('Error signing commitment', { cause: error });
    }
    this.nullifier = ComputeNullifier(this.signature!, this.hash, this.index);
    return { sig: this.signature!, nullifier: this.nullifier };
  }

  ToJSON(): string {
    return JSON.stringify({
      pubkey: this.pubKeyHash.toString(16),
      hash: this.hash.toString(16),
      index: this.index.toString(),
      nullifier: this.nullifier?.toString(16) || '',
      exhausted: this.exhausted,
      dummy: this.dummy,
    });
  }
}

export { Commitment };
