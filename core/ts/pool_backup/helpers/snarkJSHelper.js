// snarkJSHelper.js


export async function SnarkProve(input, wasmPath, zkeyPath) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
  return { proof, publicSignals };
}

export async function SnarkVerify(vkeyPath, publicSignals, proof) {
  const ok = await snarkjs.groth16.verify(vkeyPath, publicSignals, proof);
  return ok;
}
