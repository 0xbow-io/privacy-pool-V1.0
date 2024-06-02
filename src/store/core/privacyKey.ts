import { createStore } from 'zustand';

import { PrivacyKey } from '@core/account/models';
import { Hex, hexToBigInt } from 'viem';
import { Keypair } from 'maci-domainobjs';
import { EcdhSharedKey, Signature } from 'maci-crypto';

interface KeyState {
  keys: PrivacyKey[];
  generate: () => Keypair;
  import: (privateKey: Hex) => Keypair;
  pkFromPk(PkHash: bigint): bigint;
  ekFromPk(PkHash: bigint): EcdhSharedKey;
  signMsg(PkHash: bigint, msg: bigint): Signature | undefined;
  /*
    TO-DO:
      Get Private Key from Pk
      ExportToJSON and ImportToJSON
  */
}

interface TxRecordState {}

export type Account = KeyState & TxRecordState;

export const createAccount = createStore<Account>((set, get) => ({
  keys: [] as PrivacyKey[],
  generate: (): Keypair => {
    let keys = Generate();
    set((state) => ({
      keys: [...state.keys, keys],
    }));
    return keys.keypair;
  },
  import: (privateKey: Hex): Keypair => {
    let keys = FromPrivateKey(privateKey);
    set((state) => ({
      keys: [...state.keys, keys],
    }));

    return keys.keypair;
  },
  pkFromPk(PkHash: bigint): bigint {
    const key = get().keys.find((k) => k.pubKeyHash === PkHash);
    if (key) {
      return hexToBigInt(key.pk);
    }
    return BigInt(0);
  },
  ekFromPk(PkHash: bigint): EcdhSharedKey {
    const key = get().keys.find((k) => k.pubKeyHash === PkHash);
    if (key) {
      return key.eK;
    }
    return [0n, 0n] as EcdhSharedKey;
  },
  signMsg(PkHash: bigint, msg: bigint): Signature | undefined {
    const key = get().keys.find((k) => k.pubKeyHash === PkHash);
    if (key !== undefined) {
      return SignMsg(key.keypair.privKey.rawPrivKey.toString(), msg);
    }
    return undefined;
  },
}));
