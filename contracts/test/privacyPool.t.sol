// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/PrivacyPool.sol";
import "../src/Groth16Verifier.sol";
import "../src/TreeHasher.sol";
import "../src/interfaces/IPrivacyPool.sol";
import "@openzeppelin/contracts/utils/math/SignedMath.sol";

contract TestPrivacyPool is Test {
    Groth16Verifier internal verifier;
    TreeHasher internal hasher;
    IPrivacyPool internal pool;

    using SignedMath for int256; //W-08

    function setUp() public {
        verifier = new Groth16Verifier();
        hasher = new TreeHasher();
        pool = new PrivacyPool(
            address(verifier), address(hasher), 1000000 ether, 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, 32
        );
    }

    IPrivacyPool.supplement dummy_supplement = IPrivacyPool.supplement({
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
        IPrivacyPool.signal memory s,
        uint256 MerkleRoot,
        uint256[2] memory InputNullifiers,
        uint256[2] memory OutputCommitments,
        bool _expectedOut
    ) public {
        uint256 publicVal = pool.calcPublicVal(s.units, s.fee);
        uint256 signalHash = pool.calcSignalHash(s.units, s.fee, s.account, s.feeCollector);

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
                    publicVal,
                    signalHash,
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

    struct TestCase {
        IPrivacyPool.signal signal;
        uint256 MerkleRoot;
        uint256[2] InputNullifiers;
        uint256[2] OutputCommitments;
        bool verifierShallPass;
        bytes expectedErrorMsg;
    }

    function execProcessOnTestCase(TestCase memory tc) public {
        uint256 valueToSend = tc.signal.units > 0 ? uint256(tc.signal.units) : 0;

        // capture previous states
        uint256[5] memory prev_state_values = [
            pool.latestRoot(),
            pool.size(),
            address(pool).balance,
            address(tc.signal.account).balance,
            address(tc.signal.feeCollector).balance
        ];

        // if expecting an error Msg, then assert it
        if (tc.expectedErrorMsg.length > 0) {
            vm.expectRevert(tc.expectedErrorMsg);
        }
        pool.process{value: valueToSend}(
            tc.signal,
            dummy_supplement,
            dummy_pa,
            dummy_pb,
            dummy_pc,
            [
                tc.MerkleRoot,
                32,
                tc.InputNullifiers[0],
                tc.InputNullifiers[1],
                tc.OutputCommitments[0],
                tc.OutputCommitments[1]
            ]
        );

        // if no error Msg, then assert the states
        if (tc.expectedErrorMsg.length == 0) {
            // assert the states
            assertNotEq(pool.latestRoot(), prev_state_values[0]);
            assertEq(pool.size(), prev_state_values[1] + 2);
            assertEq(
                address(pool).balance,
                tc.signal.units > 0
                    ? prev_state_values[2] + (tc.signal.units.abs() - tc.signal.fee)
                    : prev_state_values[2] - (tc.signal.units.abs() + tc.signal.fee)
            );

            assertEq(
                address(tc.signal.account).balance,
                tc.signal.units < 0 ? prev_state_values[3] + tc.signal.units.abs() : prev_state_values[3]
            );

            assertEq(address(tc.signal.feeCollector).balance, prev_state_values[4] + tc.signal.fee);
        }
    }

    function testProcess() public {
        vm.deal(address(0x1), 1000000 ether);
        vm.startPrank(address(0x1));

        TestCase[11] memory tcs = [
            // Test Case 1 (Positive Test Case)
            // Std Commit of 50 units
            TestCase({
                signal: IPrivacyPool.signal({
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
                signal: IPrivacyPool.signal({
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
                    IPrivacyPool.NullifierIsKnown.selector, 0x2ec3c8133f3995beb87fdc48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927
                )
            }),
            // Test Case 3 (Negative Test Case)
            // Commit of 100 units
            // Unknown Root specified
            TestCase({
                signal: IPrivacyPool.signal({
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
                    IPrivacyPool.InvalidMerkleRoot.selector, 0x2ec3c8133f3995beb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927
                )
            }),
            // Test Case 4 (Negative Test Case)
            // Commit of 100 units
            // Fees of 100 units
            TestCase({
                signal: IPrivacyPool.signal({
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
                expectedErrorMsg: abi.encodeWithSelector(IPrivacyPool.InvalidFee.selector, 100, 100)
            }),
            // Test Case 5 (Negative Test Case)
            // Commit of 100 units
            // Fees of 200 units
            TestCase({
                signal: IPrivacyPool.signal({
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
                expectedErrorMsg: abi.encodeWithSelector(IPrivacyPool.InvalidFee.selector, 200, 100)
            }),
            // Test Case 6 (Negative Test Case)
            // Release of 50 units
            // Fees of 200 units
            TestCase({
                signal: IPrivacyPool.signal({
                    units: -50,
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
                expectedErrorMsg: abi.encodeWithSelector(IPrivacyPool.InvalidFee.selector, 200, 50)
            }),
            // Test Case 7 (Negative Test Case)
            // 0 units
            // Fees of 200 units
            TestCase({
                signal: IPrivacyPool.signal({
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
                expectedErrorMsg: abi.encodeWithSelector(IPrivacyPool.InvalidUnits.selector, 0, 1)
            }),
            // Test Case 8 (Negative Test Case)
            // Commit 100 units
            // Fees of 0 units
            // Verification Failed
            TestCase({
                signal: IPrivacyPool.signal({
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
                expectedErrorMsg: abi.encodeWithSelector(IPrivacyPool.ProofVerificationFailed.selector)
            }),
            // Test Case 9 (Positive Test Case)
            // Std Commit of 100 units
            // Fee of 50 units
            TestCase({
                signal: IPrivacyPool.signal({
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
                signal: IPrivacyPool.signal({
                    units: -50,
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
            }),
            // Test Case 11 (Negative Test Case)
            // Trying to release more than available
            TestCase({
                signal: IPrivacyPool.signal({
                    units: -500,
                    fee: 0,
                    account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                    feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
                }),
                MerkleRoot: 0, // if 0 --> will get latestRoot instead
                InputNullifiers: [
                    0x2ec3c8f33f3995bdb87fdd48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                    0x01b11a70d8c702def8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f
                ],
                OutputCommitments: [
                    0x2bdd8a7b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb132c,
                    0x0797749da6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758180
                ],
                verifierShallPass: true,
                expectedErrorMsg: abi.encodeWithSelector(IPrivacyPool.InvalidUnits.selector, 500, 40)
            })
        ];

        for (uint256 i = 0; i < tcs.length; i++) {
            tcs[i].MerkleRoot == 0 ? pool.latestRoot() : tcs[i].MerkleRoot;

            // Mock the verifier response so that we can test the process function easily
            MockVerifier(
                tcs[i].signal,
                tcs[i].MerkleRoot,
                tcs[i].InputNullifiers,
                tcs[i].OutputCommitments,
                tcs[i].verifierShallPass
            );
            execProcessOnTestCase(tcs[i]);
        }
        vm.stopPrank();
    }
}
