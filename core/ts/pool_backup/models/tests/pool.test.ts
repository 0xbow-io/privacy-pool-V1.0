import hre from 'hardhat';

import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { PrivacyPool, Pool, ChainConf, PrivacyPoolCircuit } from '@core/pool/models';
import { PoolMetadata, Intent } from '@core/pool/types';
import { privacyKey, Commitment, ICommitment } from '@core/account/models';

describe('Privacy Pool V1 Contract', function () {
  async function getPool(): Promise<Pool> {
    const [owner, itAccount] = await Promise.resolve(hre.viem.getWalletClients());
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

    const pool = new PrivacyPool({
      meta: {
        id: 'it',
        address: privacyPool.address,
      } as PoolMetadata,
      pubCL: publicClient,
      wallets: [owner, itAccount],
      contracts: {
        pool: privacyPool,
        verifier: verifier,
      },
    } as ChainConf) as Pool;

    return pool;
  }

  it('Checking Local Pool Deployment', async () => {
    const poolInstance = await loadFixture(getPool);
    expect(poolInstance.id).toBe('it');
    expect(poolInstance.address).toBe(poolInstance.chain.contracts?.pool.address);
    expect(await Promise.resolve(poolInstance.valueUnitRepresentative)).toBe(
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    );
  });

  it('Execute: [0,0] Ins & [100, 0] Outs with 1 Key, 0 fee', async () => {
    const poolInstance = await loadFixture(getPool);
    const pK = new privacyKey();
    const itCircuit = new PrivacyPoolCircuit(poolInstance);

    itCircuit.intent = {
      inputs: [
        new Commitment(pK, { amount: 0n }, 0n, {
          sign: true,
          encrypt: true,
          encryptionNonce: 1n,
        }) as ICommitment,
        new Commitment(pK, { amount: 0n }, 0n, {
          sign: true,
          encrypt: true,
          encryptionNonce: 2n,
        }) as ICommitment,
      ],
      outputs: [
        new Commitment(pK, { amount: 100n }, 0n, { sign: false }) as ICommitment,
        new Commitment(pK, { amount: 0n }, 0n, { sign: false }) as ICommitment,
      ],
      account: pK.publicAddress,
      feeCollector: pK.publicAddress,
      feeVal: 0n,
    } as Intent;

    // generate proof for intent
    const proof = await itCircuit.proof;
    expect(proof).toBeDefined();
    console.log('proof generated');

    // verify proof
    const res = await itCircuit.verify(proof!);
    expect(res).toBe(true);
    console.log('proof verified');
  });
});

/*
it('Verifying Proof On-Chain', async () => {
expect(proof).toBeDefined();
const res = await Promise.resolve(
  poolInstance.VerifyProofOnChain(itInputs.KnownValidProof),
);
expect(res).toBe(true);
console.log('proof verified on-chain');
});
*/

// try-verify on-chain
