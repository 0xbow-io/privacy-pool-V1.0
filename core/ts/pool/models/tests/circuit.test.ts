import { privacyKey, Commitment, ICommitment } from '@core/account/models';

import { MAX_DEPTH } from '@core/pool/constants';
import { Circomkit, CircomkitConfig, CircuitConfig } from 'circomkit';
import { PrivacyPoolCircuit, PoolCircuit, PrivacyPool, ChainConf, Pool } from '@core/pool/models';
import { Intent } from '@core/pool/types';

const CIRCUIT_NAME = 'PrivacyPool';
const PROTOCOL = 'groth16';

const circuitConf: CircuitConfig = {
  file: CIRCUIT_NAME,
  template: CIRCUIT_NAME,
  dir: 'main',
  pubs: ['publicVal', 'signalHash', 'merkleProofLength', 'inputNullifier', 'outCommitment'],
  params: [MAX_DEPTH, 2, 2],
};

const circomkitConf: CircomkitConfig = {
  protocol: 'groth16',
  prime: 'bn128',
  version: '2.1.9',
  verbose: true,
  logLevel: 'debug',
  circuits: './circuits.json',
  dirPtau: './ptau',
  dirCircuits: './circuits',
  dirInputs: '',
  dirBuild: './build',
  circomPath: './node_modules/circom',
  groth16numContributions: 2,
  groth16askForEntropy: false,
  optimization: 0,
  inspect: false,
  include: [''],
  cWitness: false,
  prettyCalldata: false,
};

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

  test('[dummy,dummy] Ins & [dummy, non-dummy] Outs with 1 Key', async () => {
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

  test('[dummy,dummy] Ins & [non-dummy, non-dummy] Outs with 1 Key', async () => {
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
        new Commitment(pK, { amount: 100n }, 0n, { sign: false }) as ICommitment, // dummy
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
});
