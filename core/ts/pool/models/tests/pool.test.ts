import hre from 'hardhat';

import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { PrivacyPool, Pool, ChainConf } from '@core/pool/models';
import { PoolMetadata } from '@core/pool/types';
import * as testInputs from './data/pool.inputs';

describe('Privacy Pool V1 Contract', function () {
  let poolInstance: Pool;

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
  }

  beforeEach(async () => {
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
    invalidProof._pA[0] = invalidProof._pA[1];
    const res2 = await Promise.resolve(poolInstance.VerifyProofOnChain(invalidProof));
    expect(res2).toBe(false);
  });
});
