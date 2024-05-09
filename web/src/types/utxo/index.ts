import { BigNumberish } from 'ethers'


export type CustomUtxo = BaseUtxo & { transactionHash: string }

export interface BaseKeypair {
    privkey: string
    pubkey: BigNumberish
    encryptionKey: string
  
    toString: () => string
    address: () => string
    encrypt: (bytes: Buffer) => string
    decrypt: (data: string) => Buffer
    sign: (commitment: BigNumberish, merklePath: BigNumberish) => BigNumberish
}
  

export interface UtxoOptions {
    amount?: BigNumberish | number | string
    blinding?: BigNumberish
    index?: number
    keypair?: BaseKeypair
  }

export interface BaseUtxo {
    keypair: BaseKeypair
    amount: BigNumberish
    blinding: BigNumberish
    index: number
    commitment?: BigNumberish
    nullifier?: BigNumberish

    getNullifier: () => BigNumberish
    getCommitment: () => BigNumberish
    encrypt: () => string
    getSignature: () => BigNumberish
}

export abstract class KeypairStatic {
// @ts-expect-error
    static fromString(str: string): BaseKeypair
}