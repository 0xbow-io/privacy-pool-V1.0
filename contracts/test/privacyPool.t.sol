// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {IGroth16Verifier} from "../src/interfaces/IGroth16Verifier.sol";
import {IVerifier} from "../src/interfaces/IVerifier.sol";

import "../src/PrivacyPool.sol";
import "../src/verifier/groth16_verifier.sol";
import "../src/interfaces/IPrivacyPool.sol";
import "../src/interfaces/IProcessor.sol";

contract TestPrivacyPool is Test {
    Groth16Verifier internal verifier;
    IPrivacyPool internal pool;

    IPrivacyPool.Supplement dummy_supplement = IPrivacyPool.Supplement({
        ciphertexts: [
            [
                11549330060325127860021207148469549495284128169849350740792214974175008723205,
                16292388193260826995535660789093300345792985696734514982968656588422341755993,
                15123695301333838834204737045590643350364109456840854030276580336696453767056,
                7622618831135432345142082606951050052804739120504432540269219927854618709190
            ],
            [
                11549330060325127860021207148469549495284128169849350740792214974175008723105,
                16292388193260826995535660789093300345792985696734514982968656588422341756023,
                15123695301333838834204737045590643350364109456840854030276580336696453767056,
                4027335091046436867786961550789830172715739758512379857487580280084713712883
            ]
        ],
        associationProofURI: "ipfs://"
    });

    uint256[2] dummy_pa = [
        0x11cb0fc9174301a206cf63edf847ef69cbabc219d746654a7fe6eaf8db8b1097,
        0x1886c8e7ec393f7c76246df703702ba037a1c0562337a53a1f978cbc6490a254
    ];
    uint256[2][2] dummy_pb = [
        [
            0x177d81b7e81b123ab893e5f828e434ab4186563362a7af20ba828bfdec6a1006,
            0x2416a9a734ebb256cd9230d9dcc65ec30754f4ed98cdf2f8ae32ca879f5e94b6
        ],
        [
            0x2db43ba12cfb837d1bd4ecfbbb5d161ee0ff232dc55418ddfa9f2676dd244fbd,
            0x06f2fce89e061cae713e310b93b6ee1c4fec9db07b901e4389e0b2ceadf5d9dd
        ]
    ];
    uint256[2] dummy_pc = [
        0x018e8ef290ec1d4dbd6f769f1244bef8aaff30a554d9829771e8b1e46a50c7f8,
        0x1d8a716031deb1eb454ace60c0b179e10a99fe39a5f626f1f5c2b1a1084acbc2
    ];

    function MockVerifier(
        bool isCommitFlag,
        uint256 MerkleRoot,
        uint256 publicVal,
        uint256 scope,
        uint256[2] memory InputNullifiers,
        uint256[2] memory OutputCommitments,
        bool _expectedOut
    ) public {
        // mock call to verifier contract
        // to make testing of process function easily
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                verifier.verifyProof.selector,
                dummy_pa,
                dummy_pb,
                dummy_pc,
                [
                    MerkleRoot,
                    isCommitFlag ? 1 : 0,
                    publicVal,
                    scope,
                    32,
                    InputNullifiers[0],
                    InputNullifiers[1],
                    OutputCommitments[0],
                    OutputCommitments[1]
                ]
            ),
            abi.encode(_expectedOut)
        );
    }

    function setUp() public {
        verifier = new Groth16Verifier();
        pool = new PrivacyPool(1000000 ether, 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, address(verifier));
    }

    function execProcessOnTestCase(TestCase memory tc, uint256 MerkleRoot, uint256 publicVal, uint256 scope) public {
        uint256 valueToSend = tc._r.isCommitFlag ? tc._r.units : 0;

        // Mock the verifier response so that we can test the process function
        // without needing to generate a proof
        MockVerifier(
            tc._r.isCommitFlag,
            tc.MerkleRoot == 0 ? MerkleRoot : tc.MerkleRoot,
            publicVal,
            scope,
            tc.InputNullifiers,
            tc.OutputCommitments,
            tc.verifierShallPass
        );

        // if expecting an error Msg, then assert it
        if (tc.expectedErrorMsg.length > 0) {
            vm.expectRevert(tc.expectedErrorMsg);
        }
        pool.process{value: valueToSend}(
            tc._r,
            dummy_supplement,
            dummy_pa,
            dummy_pb,
            dummy_pc,
            [
                tc.MerkleRoot == 0 ? MerkleRoot : tc.MerkleRoot,
                tc._r.isCommitFlag ? 1 : 0,
                publicVal,
                scope,
                32,
                tc.InputNullifiers[0],
                tc.InputNullifiers[1],
                tc.OutputCommitments[0],
                tc.OutputCommitments[1]
            ]
        );
    }

    struct TestCase {
        IPrivacyPool.Request _r;
        uint256 MerkleRoot;
        uint256[2] InputNullifiers;
        uint256[2] OutputCommitments;
        bool verifierShallPass;
        bytes expectedErrorMsg;
    }

    function testProcess() public {
        vm.deal(address(0x1), 1000000 ether);
        vm.startPrank(address(0x1));

        TestCase[10] memory tcs = [
            // Test Case 1 (Positive Test Case)
            // Std Commit of 50 units
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: true,
                    units: 50,
                    fee: 0,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8133f3995beb87fdc48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70c8c702dac8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bd6837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x079779fda6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: true,
                expectedErrorMsg: ""
            }),
            // Test Case 2 (Negative Test Case)
            // Commit made on the same nullifiers
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: true,
                    units: 50,
                    fee: 0,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8133f3995beb87fdc48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70c8c702dac8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bd6837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x079779fda6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: true,
                expectedErrorMsg: abi.encodeWithSelector(
                    IVerifier.NullifierIsKnown.selector, 0x2ec3c8133f3995beb87fdc48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927
                )
            }),
            // Test Case 3 (Negative Test Case)
            // Commit of 100 units
            // Unknown Root specified
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: true,
                    units: 100,
                    fee: 0,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70c8c702daf8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bdd837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x0797799da6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: true,
                expectedErrorMsg: abi.encodeWithSelector(
                    IVerifier.InvalidMerkleRoot.selector, 0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927
                )
            }),
            // Test Case 4 (Negative Test Case)
            // Commit of 100 units
            // Fees of 100 units
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: true,
                    units: 100,
                    fee: 100,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70c8c702daf8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bdd837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x0797799da6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: true,
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.FeeTooHigh.selector, 100, 100)
            }),
            // Test Case 5 (Negative Test Case)
            // Commit of 100 units
            // Fees of 200 units
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: true,
                    units: 100,
                    fee: 200,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70c8c702daf8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bdd837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x0797799da6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: true,
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.FeeTooHigh.selector, 200, 100)
            }),
            // Test Case 6 (Negative Test Case)
            // Release of 50 units
            // Fees of 200 units
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: false,
                    units: 50,
                    fee: 200,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70c8c702daf8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bdd837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x0797799da6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: true,
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.FeeTooHigh.selector, 200, 50)
            }),
            // Test Case 7 (Negative Test Case)
            // 0 units
            // Fees of 200 units
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: true,
                    units: 0,
                    fee: 200,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70c8c702daf8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bdd837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x0797799da6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: true,
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.UnitsZero.selector)
            }),
            // Test Case 8 (Negative Test Case)
            // Commit 100 units
            // Fees of 0 units
            // Verification Failed
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: true,
                    units: 100,
                    fee: 0,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70c8c702daf8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bdd837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x0797799da6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: false,
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
            }),
            // Test Case 9 (Positive Test Case)
            // Std Commit of 100 units
            // Fee of 50 units
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: true,
                    units: 100,
                    fee: 50,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70c8c702daf8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bdd837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x0797799da6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: true,
                expectedErrorMsg: ""
            }),
            // Test Case 10 (Positive Test Case)
            // Std Release of 50 units
            // Fee of 10 units
            TestCase({
                _r: IPrivacyPool.Request({
                    isCommitFlag: false,
                    units: 50,
                    fee: 10,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8f33f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70d8c702daf8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bdd8a7b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                    0x0797749da6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
                ],
                verifierShallPass: true,
                expectedErrorMsg: ""
            })
        ];

        for (uint256 i = 0; i < tcs.length; i++) {
            uint256 publicVal = tcs[i]._r.fee > tcs[i]._r.units
                ? 0
                : tcs[i]._r.isCommitFlag ? tcs[i]._r.units - tcs[i]._r.fee : tcs[i]._r.units + tcs[i]._r.fee;

            uint256 scope = pool.computeScope(tcs[i]._r);

            // capture previous states
            uint256[5] memory prev_state_values = [
                pool.root(),
                pool.size(),
                address(pool).balance,
                address(tcs[i]._r.account).balance,
                address(tcs[i]._r.feeCollector).balance
            ];

            execProcessOnTestCase(tcs[i], prev_state_values[0], publicVal, scope);

            // if no error Msg, then assert the states
            if (tcs[i].expectedErrorMsg.length == 0) {
                // assert the states
                assertNotEq(pool.root(), prev_state_values[0]);
                assertEq(pool.size(), prev_state_values[1] + 2);
                assertEq(
                    address(pool).balance,
                    tcs[i]._r.isCommitFlag ? prev_state_values[2] + publicVal : prev_state_values[2] - publicVal
                );

                assertEq(
                    address(tcs[i]._r.account).balance,
                    tcs[i]._r.isCommitFlag ? prev_state_values[3] : prev_state_values[3] + tcs[i]._r.units
                );

                assertEq(address(tcs[i]._r.feeCollector).balance, prev_state_values[4] + tcs[i]._r.fee);
            }
        }
        vm.stopPrank();
    }
}
