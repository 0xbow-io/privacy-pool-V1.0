import { TPrivacyPool } from '@core/circuit/types';
import { CPrivacyPool } from '@core/pool/classes';
import { MerkleProofT } from '@core/pool/types';

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
