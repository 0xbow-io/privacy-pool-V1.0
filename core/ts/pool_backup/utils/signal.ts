import { keccak256, fromHex, encodeAbiParameters } from 'viem';
import { Signal } from '@core/pool/types';

function hashSignal(signal: Signal): bigint {
  const encodedData = encodeAbiParameters(
    [
      { name: 'poolAddr', type: 'address' },
      { name: 'units', type: 'int256' },
      { name: 'fee', type: 'uint256' },
      { name: 'account', type: 'address' },
      { name: 'feeCollector', type: 'address' },
    ],
    [signal.pool, signal.extVal, signal.feeVal, signal.account, signal.feeCollector],
  );
  return fromHex(keccak256(encodedData), 'bigint');
}

export { hashSignal };
