/*
    Run Tests with: bun jest .--findRelatedTests src/components/core/pool/test/privacypool.test.ts  --forceExit
*/

import hre from 'hardhat';
//import { expect, test, beforeAll, afterAll, describe, beforeEach } from 'bun:test';

import { time, loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { hexToBigInt, Hex, getAddress, parseEther } from 'viem';
import {
  GetCommitment,
  GetNullifier,
  CTX,
  NewCTX,
  caclSignalHash,
  account,
  txRecord,
} from '@core/account';
import { ProofInputs } from '@core/pool';
import { calculateProof, verifyProof } from '../artifacts/snarkJsInteropHelper';
import { FIELD_SIZE } from '@/store/variables';
import { LeanIMT } from '@zk-kit/lean-imt';
import { Keypair, PrivKey, PubKey } from 'maci-domainobjs';

import { hashLeftRight, hash2, stringifyBigInts } from 'maci-crypto';

import loglevel from 'loglevel';
const maxDepth = 32;

const snarkJsLog = loglevel.getLogger('snarkjs');
snarkJsLog.setLevel('debug');

import verifier_key from '../artifacts/groth16_vkey.json';

// Deploy the Groth 16 Verifier Contract
// This should have been compiled by the compile_xx.sh script
// Deploy the Tree Hasher contract
// Deploy the Privacy Pool contract with 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
async function deployContracts() {
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

  return {
    owner,
    testAccount,
    publicClient,
    verifier,
    poseidonT3,
    privacyPool,
  };
}

beforeAll((done) => {
  done();
});

afterAll((done) => {
  done();
});

describe('Privacy Pool V1', function () {
  let verifier: any;
  let poseidonT3: any;
  let privacyPool: any;
  let owner: any;
  let testAccount: any;
  let publicClient: any;

  let accounts: account[];
  let commitmentTree: LeanIMT;

  beforeEach(async () => {
    // regenerate 3 account
    accounts = Array.from({ length: 3 }, () => new account());
    accounts.forEach((account) => {
      account.genKeyPair(false);
    });
    // reset tree
    commitmentTree = new LeanIMT(hashLeftRight);

    const res = await Promise.resolve(loadFixture(deployContracts));
    verifier = res.verifier;
    poseidonT3 = res.poseidonT3;
    privacyPool = res.privacyPool;
    owner = res.owner;
    testAccount = res.testAccount;
    publicClient = res.publicClient;
  });

  async function ComputeProof(proofInputs: ProofInputs) {
    try {
      const res = await Promise.resolve(
        calculateProof(
          {
            publicVal: proofInputs.publicVal,
            signalHash: proofInputs.signalHash,
            merkleProofLength: proofInputs.merkleProofLength,
            inputNullifier: proofInputs.inputNullifier,
            inUnits: proofInputs.inUnits,
            inPk: proofInputs.inPk,
            inBlinding: proofInputs.inBlinding,
            inSigR8: proofInputs.inSigR8,
            inSigS: proofInputs.inSigS,
            inLeafIndices: proofInputs.inLeafIndices,
            merkleProofSiblings: proofInputs.merkleProofSiblings,
            outCommitment: proofInputs.outCommitment,
            outUnits: proofInputs.outUnits,
            outPk: proofInputs.outPk,
            outBlinding: proofInputs.outBlinding,
          },
          './build/privacyPool/privacyPool_js/privacyPool.wasm',
          './build/privacyPool/groth16_pkey.zkey',
        ),
      );
      return res;
    } catch (e) {
      throw e;
    }
  }

  test('Verifier should verify this proof', (done) => {
    expect(verifier).not.toBeNull();
    // Proof is fetched from the contract test file "privacyPool.t.sol"
    // Since this proof is proven to be correct on the contract test, it should then pass here as well.
    expect(
      verifier.read.verifyProof([
        // _pA
        [
          hexToBigInt('0x11cb0fc9174301a206cf63edf847ef69cbabc219d746654a7fe6eaf8db8b1097' as Hex),
          hexToBigInt('0x1886c8e7ec393f7c76246df703702ba037a1c0562337a53a1f978cbc6490a254' as Hex),
        ],
        // _pB
        [
          [
            hexToBigInt(
              '0x177d81b7e81b123ab893e5f828e434ab4186563362a7af20ba828bfdec6a1006' as Hex,
            ),
            hexToBigInt(
              '0x2416a9a734ebb256cd9230d9dcc65ec30754f4ed98cdf2f8ae32ca879f5e94b6' as Hex,
            ),
          ],
          [
            hexToBigInt(
              '0x2db43ba12cfb837d1bd4ecfbbb5d161ee0ff232dc55418ddfa9f2676dd244fbd' as Hex,
            ),
            hexToBigInt(
              '0x06f2fce89e061cae713e310b93b6ee1c4fec9db07b901e4389e0b2ceadf5d9dd' as Hex,
            ),
          ],
        ],
        //_pC
        [
          hexToBigInt('0x018e8ef290ec1d4dbd6f769f1244bef8aaff30a554d9829771e8b1e46a50c7f8' as Hex),
          hexToBigInt('0x1d8a716031deb1eb454ace60c0b179e10a99fe39a5f626f1f5c2b1a1084acbc2' as Hex),
        ],
        // _pubSignals
        [
          hexToBigInt('0x0000000000000000000000000000000000000000000000000000000000000000' as Hex),
          hexToBigInt('0x0000000000000000000000000000000000000000000000000000000000000064' as Hex),
          hexToBigInt('0x0c138d79d2a0c9f1eb742d55eae4a3351dcae0a65eccbf3748c73ad56de9ab93' as Hex),
          hexToBigInt('0x0000000000000000000000000000000000000000000000000000000000000000' as Hex),
          hexToBigInt('0x2ec3c8133f3995beb87fdc48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927' as Hex),
          hexToBigInt('0x01b11a70c8c702dac8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f' as Hex),
          hexToBigInt('0x2bd6837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec' as Hex),
          hexToBigInt('0x079779fda6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980' as Hex),
        ],
      ]),
    ).resolves.toBe(true);
    done();
  }, 500000);

  test('Test Proof Generations with Virtual Inputs', async () => {
    // Fee Collector (i.e. ASP)
    const feeCollector = '0xb96BdDD5b2a794deA4Cb4020D8574A3a5c98250C';
    const feeVal = BigInt(1) * BigInt(10 ** 18); // 1 ETH;

    // iterate through account and create a tx record with proofs for each
    // total Ouptuts are different for each txRecord

    for (let i = 0; i < accounts.length - 1; i++) {
      let pubkeys: PubKey[] = Array.from(accounts[i].keypairs, ([v, k]) => k.keypair.pubKey);

      // Expected total output value
      const totalOutput = BigInt(i + 1 * 20) * BigInt(10 ** 18);

      // Expected outputs
      // We want 1 output to be 100 and the other to be 0
      // This should mean that we would need to commit 100 units to the pool
      // or total 120 including the fee.
      let desiredOutputs = [
        NewCTX(pubkeys[Math.floor(Math.random() * pubkeys.length)], totalOutput, BigInt(0)),
        NewCTX(pubkeys[Math.floor(Math.random() * pubkeys.length)], BigInt(0), BigInt(0)), // Virtual Output
      ];

      let virtualInputs = [
        NewCTX(pubkeys[Math.floor(Math.random() * pubkeys.length)], BigInt(0), BigInt(0)),
        NewCTX(pubkeys[Math.floor(Math.random() * pubkeys.length)], BigInt(0), BigInt(0)),
      ];

      // Create Tx Record from inputs & desired outputs
      const r = new txRecord(
        // Virtual Commitments
        // Which are Commitments of 0 amount and doesn't exist on-chain
        virtualInputs,
        desiredOutputs,
        [accounts[i].signCTX(virtualInputs[0]), accounts[i].signCTX(virtualInputs[1])],
        [accounts[i].encryptCTX(desiredOutputs[0]), accounts[i].encryptCTX(desiredOutputs[1])],
      );

      expect(r.publicVal).toBe(totalOutput);

      let inputs = r.GenProofInputs(
        privacyPool.address,
        testAccount.account.address,
        feeCollector,
        commitmentTree,
        feeVal,
        maxDepth,
      );

      try {
        await Promise.resolve(ComputeProof(inputs.proofInputs))
          .then((result) => {
            expect(result.publicSignals[0]).toBe(inputs.expectedMerkleRoot.toString());
            console.log(
              'Proof Generation Successful ',
              result.publicSignals,
              ' Proof: ',
              result.proof,
            );
          })
          .catch((err) => {
            console.log('Proof Generation Failed ', err);
            throw err;
          });
      } catch (err) {
        console.log('Proof Generation Failed ', err);
      }
    }
  }, 500000);
});
