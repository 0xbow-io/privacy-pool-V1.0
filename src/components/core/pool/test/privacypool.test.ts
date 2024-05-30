import hre from "hardhat"; 
import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress, parseGwei } from "viem";
import { hexToBigInt, Hex } from 'viem';
import { GetCommitment, GetNullifier, CTX, NewCTX, caclSignalHash, account,txRecord } from '@core/account';
import { ProofInputs} from '@core/pool';
import { calculateProof, verifyProof } from '../artifacts/snarkJsInteropHelper';
import { FIELD_SIZE } from '@/store/variables';
import { LeanIMT } from '@zk-kit/lean-imt';

import { hashLeftRight, hash2, stringifyBigInts } from 'maci-crypto';

import loglevel from 'loglevel';

import verifier_key from '../artifacts/groth16_vkey.json';

import {
    WitnessTester,
    CircuitSignals,
    Circomkit,
    CircomkitConfig,
    CircuitConfig,
} from 'circomkit';


const maxDepth = 32;

const privacyPoolConfig: CircuitConfig = {
    file: 'privacyPool',
    template: 'PrivacyPool',
    dir: 'main',
    pubs: ['publicVal', 'signalHash', 'merkleProofLength', 'inputNullifier', 'outCommitment'],
    params: [maxDepth, 2, 2],
};

const circomkitConf = {
    protocol: 'groth16',
    prime: 'bn128',
    version: '2.1.9',
    verbose: true,
    prettyCalldata: true,
    logLevel: 'debug',
};

const circomkit = new Circomkit(circomkitConf as CircomkitConfig);
const snarkJsLog = loglevel.getLogger('snarkjs');
snarkJsLog.setLevel('debug');


describe("Privacy Pool V1", function () {
    // Deploy the Groth 16 Verifier Contract 
    // This should have been compiled by the compile_xx.sh script
    // Deploy the Tree Hasher contract
    // Deploy the Privacy Pool contract with 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
    async function deployContracts() {
        const [owner, testAccount] = await Promise.resolve(hre.viem.getWalletClients());
        const publicClient = await Promise.resolve(hre.viem.getPublicClient());

        // Contracts are deployed using the first signer/account by default
        const verifier = await hre.viem.deployContract("Groth16Verifier", []);
        const poseidonT3 = await hre.viem.deployContract("PoseidonT3", []);
        const privacyPool = await hre.viem.deployContract("PrivacyPool", 
            [
                verifier.address,
                poseidonT3.address,
                BigInt(2) ** BigInt(248),
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            ]
        );

        return {
            owner,
            testAccount,
            publicClient,
            verifier,
            poseidonT3,
            privacyPool
          };
    }

    test("Verifier should verify this proof", done => {
        Promise.resolve(loadFixture(deployContracts)).then(({verifier}) => {
            // Proof is fetched from the contract test file "privacyPool.t.sol"
            // Since this proof is proven to be correct on the contract test, it should then pass here as well.
            expect(verifier.read.verifyProof(
                [
                    // _pA
                    [
                        hexToBigInt("0x11cb0fc9174301a206cf63edf847ef69cbabc219d746654a7fe6eaf8db8b1097" as Hex),
                        hexToBigInt("0x1886c8e7ec393f7c76246df703702ba037a1c0562337a53a1f978cbc6490a254" as Hex),
                    ],
                    // _pB
                    [
                        [
                            hexToBigInt("0x177d81b7e81b123ab893e5f828e434ab4186563362a7af20ba828bfdec6a1006" as Hex),
                            hexToBigInt("0x2416a9a734ebb256cd9230d9dcc65ec30754f4ed98cdf2f8ae32ca879f5e94b6"  as Hex),
                        ],
                        [
                            hexToBigInt("0x2db43ba12cfb837d1bd4ecfbbb5d161ee0ff232dc55418ddfa9f2676dd244fbd"  as Hex),
                            hexToBigInt("0x06f2fce89e061cae713e310b93b6ee1c4fec9db07b901e4389e0b2ceadf5d9dd"  as Hex),

                        ]
                    ], 
                    //_pC
                    [
                        hexToBigInt("0x018e8ef290ec1d4dbd6f769f1244bef8aaff30a554d9829771e8b1e46a50c7f8"  as Hex),
                        hexToBigInt("0x1d8a716031deb1eb454ace60c0b179e10a99fe39a5f626f1f5c2b1a1084acbc2"  as Hex),

                    ],
                    // _pubSignals
                    [
                        hexToBigInt("0x0000000000000000000000000000000000000000000000000000000000000000"  as Hex),
                        hexToBigInt("0x0000000000000000000000000000000000000000000000000000000000000064"  as Hex),
                        hexToBigInt("0x0c138d79d2a0c9f1eb742d55eae4a3351dcae0a65eccbf3748c73ad56de9ab93"  as Hex),
                        hexToBigInt("0x0000000000000000000000000000000000000000000000000000000000000000"  as Hex),
                        hexToBigInt("0x2ec3c8133f3995beb87fdc48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927"  as Hex),
                        hexToBigInt("0x01b11a70c8c702dac8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f" as Hex),
                        hexToBigInt("0x2bd6837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec"  as Hex),
                        hexToBigInt("0x079779fda6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980"  as Hex),
                    ]
                ]
            )).resolves.toBe(true)
            done();
        });
        
    },500000);

    test("2 Virtual Inputs to 1 Virtual Output & 1 Real Output from empty Tree ", done =>  {

        async function GenerateProof(r: txRecord, feeCollector: Hex, feeVal: bigint, tree: LeanIMT) {
            const { privacyPool: pool, publicClient: cl, testAccount: testAcc } = await Promise.resolve(loadFixture(deployContracts));
           let inputs =  r.GenProofInputs(
                pool.address,
                testAcc.account.address,
                feeCollector,
                tree , 
                feeVal,
                maxDepth
            )

            // extVal is the unit amount that needs to be contributed to the pool
            // with feeVal included
            expect(inputs.extVal).toBe(120n)
            expect(inputs.expectedMerkleRoot).toBe(0n)
 
            const { proof, publicSignals } = await calculateProof(
                {
                    publicVal: inputs.proofInputs.publicVal,
                    signalHash: inputs.proofInputs.signalHash,
                    merkleProofLength: inputs.proofInputs.merkleProofLength,
                    inputNullifier: inputs.proofInputs.inputNullifier,
                    inUnits: inputs.proofInputs.inUnits,
                    inPk: inputs.proofInputs.inPk,
                    inBlinding: inputs.proofInputs.inBlinding,
                    inSigR8: inputs.proofInputs.inSigR8,
                    inSigS: inputs.proofInputs.inSigS,
                    inLeafIndices: inputs.proofInputs.inLeafIndices,
                    merkleProofIndices: inputs.proofInputs.merkleProofIndices,
                    merkleProofSiblings: inputs.proofInputs.merkleProofSiblings,
                    outCommitment: inputs.proofInputs.outCommitment,
                    outUnits: inputs.proofInputs.outUnits,
                    outPk: inputs.proofInputs.outPk,
                    outBlinding: inputs.proofInputs.outBlinding,
                },
                './build/privacyPool/privacyPool_js/privacyPool.wasm',  './build/privacyPool/groth16_pkey.zkey')
            
            expect(publicSignals[0]).toBe(inputs.expectedMerkleRoot.toString(10))
            return { proof, publicSignals };    
        }

       

        // New Pool, no commits, fresh state
        // Virtual Inputs / Ouptuts are commitments that have 0 value
        // We need them to satisfy the 2 in / 2 out Scheme that PP uses.
        // ASP as fee Collector
        // 1. compute new commitments
        // 2. generate proof
        // 3. execute commitment with proof with testAccount
        // generate new account & keys for testAccount to use
        const acc = new account();
        const keypair = acc.genKeyPair();
        const privKey = keypair.privKey.rawPrivKey;
        const pubKey = keypair.pubKey.rawPubKey;
        const tree = new LeanIMT(hashLeftRight);


        // Fee Collector (i.e. ASP)
        const feeCollector = "0xb96BdDD5b2a794deA4Cb4020D8574A3a5c98250C"
        const feeVal = BigInt(20); 

         // Expected outputs 
         // We want 1 output to be 100 and the other to be 0
         // This should mean that we would need to commit 100 units to the pool 
         // or total 120 including the fee.
         let desiredOutputs = [                    
            NewCTX(keypair.pubKey, BigInt(100), BigInt(0)), 
            NewCTX(keypair.pubKey, BigInt(0), BigInt(0)), // Virtual Output
        ]

        let virtualInputs = [
            NewCTX(keypair.pubKey, BigInt(0), BigInt(0)), 
            NewCTX(keypair.pubKey, BigInt(0), BigInt(0)),
        ]

        // Create Tx Record from inputs & desired outputs
        let r = new txRecord(
            // Virtual Commitments
            // Which are Commitments of 0 amount and doesn't exist on-chain
            virtualInputs,
            desiredOutputs,
            [
                acc.signCTX(virtualInputs[0]), 
                acc.signCTX(virtualInputs[1])
            ],
            [
                acc.encryptCTX(desiredOutputs[0]),
                acc.encryptCTX(desiredOutputs[1])
            ],
        );

        expect(r.inputCTXs.length).toBe(2)
        expect(r.outputCTXs.length).toBe(2)
        expect(r.publicVal).toBe(100n)

        Promise.resolve(GenerateProof(r,feeCollector, feeVal, tree)).then( ( {proof, publicSignals} ) => {
                console.log('Computed proof: ', proof, " publicSignals ", publicSignals);  
                // verify proof 
                try {
                    Promise.resolve(verifyProof(
                        verifier_key,
                        publicSignals, 
                        proof
                    )).then((res) => {
                        expect(res).toBe(true)
                    });
                } catch (error) {
                    done(error);
                }
                // 
                try {   
                    // execute commitment
                    Promise.resolve().then((res) => {
                    });
                } catch (error) {
                    done(error);
                }
            }
        );
    },500000);
});     