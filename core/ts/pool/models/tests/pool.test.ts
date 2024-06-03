import hre from 'hardhat';

import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { PrivacyPool, Pool, ChainConf, PoolCircuit, PrivacyPoolCircuit } from '@core/pool/models';
import { PoolMetadata, Intent } from '@core/pool/types';
import * as testInputs from './data/pool.inputs';
import { Circomkit } from 'circomkit';
import { groth16Calldata } from '@core/pool/utils';
import { privacyKey, Commitment, ICommitment } from '@core/account/models';

import { CIRCUIT_NAME, PROTOCOL, circuitConf, circomkitConf } from './conf';

describe('Privacy Pool V1 Contract', function () {
  let poolInstance: Pool;
  let circomkit: Circomkit;
  let testCircuit: PoolCircuit;

  async function setup() {
    const [owner, testAccount] = await Promise.resolve(hre.viem.getWalletClients());
    const publicClient = await Promise.resolve(hre.viem.getPublicClient());

    // Contracts are deployed using the first signer/account by default
    const verifier = await hre.viem.deployContract('Groth16Verifier', []);
    const poseidonT3 = await hre.viem.deployContract('PoseidonT3', []);
    const privacyPool = await hre.viem.deployContract('PrivacyPool', [
      verifier.address,
      poseidonT3.address,
      BigInt(2) ** BigInt(248),
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      32,
    ]);
    poolInstance = new PrivacyPool({
      meta: {
        id: 'test',
        address: privacyPool.address,
      } as PoolMetadata,
      pubCL: publicClient,
      wallets: [owner, testAccount],
      contracts: {
        pool: privacyPool,
        verifier: verifier,
      },
    } as ChainConf) as Pool;
    testCircuit = new PrivacyPoolCircuit(poolInstance);
  }

  beforeEach(async () => {
    circomkit = new Circomkit(circomkitConf);
    circomkit.instantiate(CIRCUIT_NAME, circuitConf);

    await loadFixture(setup);
  });

  it('Checking Local Pool Deployment', async () => {
    expect(poolInstance.id).toBe('test');
    expect(poolInstance.address).toBe(poolInstance.chain.contracts?.pool.address);
    const res = await Promise.resolve(poolInstance.valueUnitRepresentative);
    expect(res).toBe('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
  });

  it('Testing Verifier with known valid proof', async () => {
    const res = await Promise.resolve(poolInstance.VerifyProofOnChain(testInputs.KnownValidProof));
    expect(res).toBe(true);

    // modify proof to make it invalid
    const invalidProof = testInputs.KnownValidProof;
    invalidProof.pi_a[0] = invalidProof.pi_a[1];
    const res2 = await Promise.resolve(poolInstance.VerifyProofOnChain(invalidProof));
    expect(res2).toBe(false);
  });

  test('[0,0] Ins & [100, 0] Outs with 1 Key, 0 fee', async () => {
    const proofTester = await circomkit.ProofTester(CIRCUIT_NAME, PROTOCOL);
    const pK = new privacyKey();
    // Set Intent
    testCircuit.Intent = {
      inputs: [
        new Commitment(pK, { amount: 0n }, 0n, { sign: true }) as ICommitment,
        new Commitment(pK, { amount: 0n }, 0n, { sign: true }) as ICommitment,
      ],
      outputs: [
        new Commitment(pK, { amount: 100n }, 0n, { sign: false }) as ICommitment,
        new Commitment(pK, { amount: 0n }, 0n, { sign: false }) as ICommitment,
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
