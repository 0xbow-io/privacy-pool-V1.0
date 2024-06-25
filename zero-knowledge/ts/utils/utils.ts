import type { WitnessTester } from "circomkit";

// @note thanks https://github.com/Rate-Limiting-Nullifier/circom-rln/blob/main/test/utils.ts
// for the code below (modified version)
/**
 * Get a signal from the circuit
 * @param circuit - the circuit object
 * @param witness - the witness
 * @param name - the name of the signal
 * @returns the signal value
 */
export const getSignal = async (tester: WitnessTester, witness: bigint[], name: string): Promise<bigint> => {
    const prefix = "main";
    // E.g. the full name of the signal "root" is "main.root"
    // You can look up the signal names using `circuit.getDecoratedOutput(witness))`
    const signalFullName = `${prefix}.${name}`;
  
    const out = await tester.readWitness(witness, [signalFullName]);
    return BigInt(out[signalFullName]);
  };