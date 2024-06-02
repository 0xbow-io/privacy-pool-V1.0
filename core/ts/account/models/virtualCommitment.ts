import { HashCommitment, PubKeyHash, randomBlinder } from '../utils';
import { KeyActions, ICommitment } from '@core/account/models';
import { Ciphertext } from 'maci-crypto';

export interface IVirtualCommitment {
  hash: bigint;
  pubKey: bigint[];
  secrets: { amount: bigint; blinding?: bigint };
}

/*
  A Virtual Commitment is one that has not yet been committed to the Pool.
  Thus it lacks the index value which is provided by the Pool when the commitment is added as a leaf.
  The Index value is later used to compute the nullifier (via signature) when the commitment is intended to be exhausted

  Sometimes a commitment is needed to be created as a filler in the 2 in 2 Out scheme when onlu  d1 in has a non-zero amount.
  This commitment is called a dummy commitment and is used to hide the fact that the transaction only has 1 input.

*/
class VirtualCommitment implements IVirtualCommitment {
  cipher?: Ciphertext;

  constructor(
    private readonly _pubKey: bigint[],
    private readonly _secrets: { amount: bigint; blinding?: bigint } = { amount: 0n },
    public dummy: boolean = false,
    public hash: bigint = 0n,
  ) {
    if (this._secrets.blinding === undefined || this._secrets.blinding === 0n) {
      this._secrets.blinding = randomBlinder();
    }
    this.hash = HashCommitment(
      { amount: this._secrets.amount, blinding: this._secrets.blinding },
      this._pubKey,
    );
    this.dummy = this._secrets.amount === 0n;
  }

  SameAs(commitment: ICommitment | IVirtualCommitment): boolean {
    return this.hash === commitment.hash;
  }

  get pubKey(): bigint[] {
    return this._pubKey;
  }

  get secrets(): { amount: bigint; blinding?: bigint } {
    return { amount: this._secrets.amount, blinding: this._secrets.blinding };
  }

  // get hash of the public key associated with the commitment
  PubKeyHash(): bigint {
    return PubKeyHash(this.pubKey);
  }

  SameKey(key: KeyActions): boolean {
    return key.PubKeyHash() === this.PubKeyHash();
  }

  Encrypt(key: KeyActions, nonce: bigint): Ciphertext {
    // First match that the key's publickey is the same as the commitment's
    if (!this.SameKey(key)) {
      throw new Error('Key does not match commitment');
    }
    try {
      this.cipher = key.encrypt(
        Object.values(this.secrets).filter((value): value is bigint => value !== undefined),
        nonce,
      );
      return this.cipher;
    } catch (error) {
      console.log('Error encrypting', { cause: error });
      throw new Error('Error encrypting', { cause: error });
    }
  }
}

export { VirtualCommitment };
