// snarkJsInteropHelper.js
import * as snarkjs from 'snarkjs';

export async function prove(input, wasmPath, zkeyPath) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
  return { proof, publicSignals };
}

export async function verify(vkeyPath, publicSignals, proof) {
  const ok = await snarkjs.groth16.verify(vkeyPath, publicSignals, proof);
  return ok;
}
