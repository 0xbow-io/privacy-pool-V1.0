import type { Groth16Proof } from 'snarkjs';

export function groth16Calldata(proof: Groth16Proof) {
  const pA = valuesToPaddedUint256s([proof.pi_a[0], proof.pi_a[1]]);
  // note that pB are reversed, the indexing is [1] and [0] instead of [0] and [1].
  const pB0 = valuesToPaddedUint256s([proof.pi_b[0][1], proof.pi_b[0][0]]);
  const pB1 = valuesToPaddedUint256s([proof.pi_b[1][1], proof.pi_b[1][0]]);
  const pC = valuesToPaddedUint256s([proof.pi_c[0], proof.pi_c[1]]);
}

function valuesToPaddedUint256s(values: string[]) {
  return values.map((hexStr) => {
    const ans = '0x' + BigInt(hexStr).toString(16).padStart(64, '0');
    if (ans.length !== 66) throw new Error('uint256 overflow: ' + hexStr);
    return ans;
  });
}
