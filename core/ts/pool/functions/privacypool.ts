import { TPrivacyPool } from '@privacy-pool-v1/core-ts/zk-circuit/types';
import { CPrivacyPool } from '@privacy-pool-v1/core-ts/pool/classes';
import { MerkleProofT } from '@privacy-pool-v1/core-ts/zk-circuit/types';

import { keccak256, Address, fromHex, encodeAbiParameters } from 'viem';

export namespace FnPrivacyPool {


  export function CalcExtValFn(publicVal: bigint, feeVal: bigint): bigint {
    return publicVal + feeVal;
  }

  function HashSignalFn(signal: {
    pool: Address;
    account: Address;
    feeCollector: Address;
    feeVal: bigint;
    extVal: bigint;
  }): bigint {
    const encodedData = encodeAbiParameters(
      [
        { name: 'poolAddr', type: 'address' },
        { name: 'units', type: 'int256' },
        { name: 'fee', type: 'uint256' },
        { name: 'account', type: 'address' },
        { name: 'feeCollector', type: 'address' },
      ],
      [signal.pool, signal.extVal || 0n, signal.feeVal, signal.account, signal.feeCollector],
    );
    return fromHex(keccak256(encodedData), 'bigint');
  }
}
