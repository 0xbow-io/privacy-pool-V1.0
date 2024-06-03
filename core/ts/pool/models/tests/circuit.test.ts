import { privacyKey, Commitment, ICommitment } from '@core/account/models';
import { Circomkit } from 'circomkit';
import { PrivacyPoolCircuit, PoolCircuit, PrivacyPool, ChainConf, Pool } from '@core/pool/models';
import { Intent } from '@core/pool/types';
import { groth16Calldata } from '@core/pool/utils';
import { CIRCUIT_NAME, PROTOCOL, circuitConf, circomkitConf } from './conf';

// allocate timeout
jest.setTimeout(100 * 1000);
describe('Generate Proofs', () => {
  let circomkit: Circomkit;
  let testCircuit: PoolCircuit;
  beforeAll(async () => {
    try {
      /* preapre the proof tester  from circomkit */
      circomkit = new Circomkit(circomkitConf);
      circomkit.instantiate(CIRCUIT_NAME, circuitConf);

      /* prepare the test pool object */
      const testPool = new PrivacyPool({
        meta: {
          id: 'test',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        },
      } as ChainConf) as Pool;
      // create a circuit object from the pool
      testCircuit = new PrivacyPoolCircuit(testPool);
    } catch (e) {
      console.log(e);
      throw new Error('Failed to setup circuit', { cause: e });
    }
  });

  test('[0,0] Ins & [100, 0] Outs with 1 Key, 0 fee', async () => {
    const proofTester = await circomkit.ProofTester(CIRCUIT_NAME, PROTOCOL);

    const pK = new privacyKey();
    // Set Intent
    testCircuit.Intent = {
      inputs: [
        new Commitment(pK, { amount: 0n }, 0n, { sign: true }) as ICommitment, // dummy
        new Commitment(pK, { amount: 0n }, 0n, { sign: true }) as ICommitment, // dummy
      ],
      outputs: [
        new Commitment(pK, { amount: 100n }, 0n, { sign: false }) as ICommitment, // non-dummy
        new Commitment(pK, { amount: 0n }, 0n, { sign: false }) as ICommitment, // dummy
      ],
      account: pK.publicAddress,
      feeCollector: pK.publicAddress,
      feeVal: 0n,
    } as Intent;
    // get circuit inputs for intent
    const { circuitInput } = testCircuit.BuildInputs();

    try {
      const { proof, publicSignals } = await Promise.resolve(
        proofTester.prove({
          publicVal: circuitInput.publicVal,
          signalHash: circuitInput.signalHash,
          merkleProofLength: circuitInput.merkleProofLength,
          inputNullifier: circuitInput.inputNullifier,
          inUnits: circuitInput.inUnits,
          inPk: circuitInput.inPk,
          inBlinding: circuitInput.inBlinding,
          inSigR8: circuitInput.inSigR8,
          inSigS: circuitInput.inSigS,
          inLeafIndices: circuitInput.inLeafIndices,
          merkleProofSiblings: circuitInput.merkleProofSiblings,
          outCommitment: circuitInput.outCommitment,
          outUnits: circuitInput.outUnits,
          outPk: circuitInput.outPk,
          outBlinding: circuitInput.outBlinding,
        }),
      );
      await Promise.resolve(proofTester.expectPass(proof, publicSignals));
      const ok = await Promise.resolve(proofTester.verify(proof, publicSignals));
      expect(ok).toBe(true);
    } catch (e) {
      console.log(e);
      throw new Error('failed to prove & verify', { cause: e });
    }
  });

  test('[0,0] Ins & [100, 100] Outs with 1 Key, 0 fee', async () => {
    const proofTester = await circomkit.ProofTester(CIRCUIT_NAME, PROTOCOL);

    const pK = new privacyKey();
    // Set Intent
    testCircuit.Intent = {
      inputs: [
        new Commitment(pK, { amount: 0n }, 0n, { sign: true }) as ICommitment, // dummy
        new Commitment(pK, { amount: 0n }, 0n, { sign: true }) as ICommitment, // dummy
      ],
      outputs: [
        new Commitment(pK, { amount: 100n }, 0n, { sign: false }) as ICommitment, // non-dummy
        new Commitment(pK, { amount: 100n }, 0n, { sign: false }) as ICommitment, //  non-dummy
      ],
      account: pK.publicAddress,
      feeCollector: pK.publicAddress,
      feeVal: 0n,
    } as Intent;
    // get circuit inputs for intent
    const { circuitInput } = testCircuit.BuildInputs();

    try {
      const { proof, publicSignals } = await Promise.resolve(
        proofTester.prove({
          publicVal: circuitInput.publicVal,
          signalHash: circuitInput.signalHash,
          merkleProofLength: circuitInput.merkleProofLength,
          inputNullifier: circuitInput.inputNullifier,
          inUnits: circuitInput.inUnits,
          inPk: circuitInput.inPk,
          inBlinding: circuitInput.inBlinding,
          inSigR8: circuitInput.inSigR8,
          inSigS: circuitInput.inSigS,
          inLeafIndices: circuitInput.inLeafIndices,
          merkleProofSiblings: circuitInput.merkleProofSiblings,
          outCommitment: circuitInput.outCommitment,
          outUnits: circuitInput.outUnits,
          outPk: circuitInput.outPk,
          outBlinding: circuitInput.outBlinding,
        }),
      );
      await Promise.resolve(proofTester.expectPass(proof, publicSignals));
      const ok = await Promise.resolve(proofTester.verify(proof, publicSignals));
      const calldata = groth16Calldata(proof, false);
      console.log(calldata);
      console.log(publicSignals);
      expect(ok).toBe(true);
    } catch (e) {
      console.log(e);
      throw new Error('failed to prove & verify', { cause: e });
    }
  });
});
