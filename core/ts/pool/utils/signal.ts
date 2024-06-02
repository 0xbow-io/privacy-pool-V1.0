import { keccak256, Hex, fromHex, encodeAbiParameters } from 'viem';

function caclSignalHash(
  poolAddr: Hex,
  units: bigint,
  fee: bigint,
  account: Hex,
  feeCollector: Hex,
): bigint {
  const encodedData = encodeAbiParameters(
    [
      { name: 'poolAddr', type: 'address' },
      { name: 'units', type: 'int256' },
      { name: 'fee', type: 'uint256' },
      { name: 'account', type: 'address' },
      { name: 'feeCollector', type: 'address' },
    ],
    [poolAddr, units, fee, account, feeCollector],
  );
  return fromHex(keccak256(encodedData), 'bigint');
}

export { caclSignalHash };
