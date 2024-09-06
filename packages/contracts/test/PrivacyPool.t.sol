// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "forge-std/StdJson.sol";

import "../src/verifier/groth16_verifier.sol";
import "../src/interfaces/IPrivacyPool.sol";
import "../src/interfaces/IVerifier.sol";
import "../src/PrivacyPool.sol";
import "../src/Constants.sol";

contract PrivacyPoolTester is Test, PrivacyPool {
    constructor(
        address _primitiveHandler,
        address _verifier
    ) PrivacyPool(_primitiveHandler, _verifier) {}

    modifier AggregatedFieldSumCheck(bool expectChange) {
        uint256 _sum = AggregatedFieldSum();
        _;
        if (expectChange) {
            assertFalse(
                _sum == AggregatedFieldSum(),
                "AggregatedFieldSum has not changed when it should have"
            );
        } else {
            assertTrue(
                _sum == AggregatedFieldSum(),
                "AggregatedFieldSum has changed when it shouldn't have"
            );
        }
    }

    function Test_Process(
        Request calldata _r,
        IPrivacyPool.GROTH16Proof calldata _proof,
        bytes memory expectedErrorMsg
    ) public payable AggregatedFieldSumCheck(expectedErrorMsg.length == 0) {
        // if expecting an error Msg, then assert it
        if (expectedErrorMsg.length > 0) {
            vm.expectRevert(expectedErrorMsg);
        }
        Process(_r, _proof);
    }

    function Test_VerifyExternalInput(
        Request calldata _r,
        IPrivacyPool.GROTH16Proof calldata _proof,
        bytes memory expectedErrorMsg
    ) public payable AggregatedFieldSumCheck(expectedErrorMsg.length > 0) {
        // if expecting an error Msg, then assert it
        if (expectedErrorMsg.length > 0) {
            vm.expectRevert(expectedErrorMsg);
        }
        VerifyExternalInput(_r, _proof);
    }

    function Test_VerifyExternalOutput(
        Request calldata _r,
        IPrivacyPool.GROTH16Proof calldata _proof,
        bytes memory expectedErrorMsg
    ) public payable {
        // if expecting an error Msg, then assert it
        if (expectedErrorMsg.length > 0) {
            vm.expectRevert(expectedErrorMsg);
        }
        VerifyExternalOutput(_r, _proof);
    }

    function Test_StateIsUpdatedModifier(
        Request calldata _r,
        IPrivacyPool.GROTH16Proof calldata _proof
    ) public StateIsUpdated(_r, _proof) {
        console.log("modifier triggered after function body");
    }

    function Test_FeeIsReleasedModifier(
        Request calldata _r,
        IPrivacyPool.GROTH16Proof calldata _proof
    ) public FeeIsReleased(_r, _proof) {
        console.log("modifier triggered after function body");
    }
}

/**
 * @title TestPrivacyPool
 * @dev TestPrivacyPool is a contract to test the PrivacyPool contract
 * using FFI for proof generation
 * Verifier is not mocked here, it is used as is to verify the proofs
 * Simple tests are done on the modifiers IsValidRequest & IsNative
 * as that's thoroughly tested in the Verifier.t.t.sol
 */
contract TestPrivacyPool is Test {
    PrivacyPoolTester internal poolTester;
    Groth16Verifier internal verifier;

    function setUp() public {
        verifier = new Groth16Verifier();
        poolTester = new PrivacyPoolTester(
            D_BASE_FIELD_INTERPRETER,
            address(verifier)
        );
    }

    struct FFIArgs {
        uint256 scope;
        uint256 context;
        uint256 IO0;
        uint256 IO1;
        uint256 actualTreeDepth;
        uint256 existingStateRoot;
    }

    function FFI_ComputeSingleProof(
        FFIArgs memory args
    ) public returns (IPrivacyPool.GROTH16Proof memory _proof) {
        // Run ffi and read back the generated proof
        string[] memory runJsInputs = new string[](8);
        runJsInputs[0] = "ts-node";
        runJsInputs[1] = "./script/generate_single_proof.js";
        runJsInputs[2] = vm.toString(args.scope); // Scope
        runJsInputs[3] = vm.toString(args.context); // context
        runJsInputs[4] = vm.toString(args.IO0); // IO[0]
        runJsInputs[5] = vm.toString(args.IO1); // IO[1]
        runJsInputs[6] = vm.toString(args.actualTreeDepth); // actualTreeDepth
        runJsInputs[7] = vm.toString(args.existingStateRoot); // existingStateRoot

        bytes memory jsResult = vm.ffi(runJsInputs);
        _proof = abi.decode(jsResult, (IPrivacyPool.GROTH16Proof));
    }

    /**
     * @dev Test Process function over multiple rounds
     * No negative outcomes are expected
     * note: due to limitations on the script, only proofs
     * for commitments can be made, not releases
     * run: forge test --ffi --match-test test_ProcessMultipleRounds --gas-report
     */
    function test_ProcessMultipleRounds() public {
        vm.deal(address(0x1), 1000000 ether);
        vm.startPrank(address(0x1));

        // Generate a base request
        IPrivacyPool.Request memory _r = IPrivacyPool.Request(
            address(0x1), // src
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), // sink
            address(0xA9959D135F54F91b2f889be628E038cbc014Ec62), // feeCollector
            10 // fee
        );

        for (uint8 i; i < 2; i++) {
            (uint256 root, uint256 depth) = poolTester.GetLastCheckpoint();
            // invoke script with ffi to generate proof
            // and Execute Process
            //
            uint256 _srcBefore = _r.src.balance;
            uint256 _sinkBefore = _r.sink.balance;
            uint256 _feeCollectorBefore = _r.feeCollector.balance;

            IPrivacyPool.GROTH16Proof memory _proof = FFI_ComputeSingleProof(
                FFIArgs({
                    scope: poolTester.Scope(),
                    context: poolTester.Context(_r),
                    IO0: 100,
                    IO1: 0,
                    actualTreeDepth: depth,
                    existingStateRoot: root
                })
            );

            poolTester.Test_Process{value: 100}(_r, _proof, "");
            uint256 _srcAfter = _r.src.balance;
            uint256 _sinkAfter = _r.sink.balance;
            uint256 _feeCollectorAfter = _r.feeCollector.balance;

            console.log("srcBefore: %d, srcAfter: %d", _srcBefore, _srcAfter);
            console.log(
                "sinkBefore: %d, sinkAfter: %d",
                _sinkBefore,
                _sinkAfter
            );
            console.log(
                "feeCollectorBefore: %d, feeCollectorAfter: %d",
                _feeCollectorBefore,
                _feeCollectorAfter
            );
            assertTrue(
                _srcBefore - _srcAfter ==
                    _proof._pubSignals[D_ExternIO_StartIdx],
                "Source balance has not been updated correctly"
            );
            assertTrue(
                _sinkAfter - _sinkBefore ==
                    _proof._pubSignals[D_ExternIO_StartIdx + 1],
                "Sink balance has not been updated correctly"
            );
            assertTrue(
                _feeCollectorAfter - _feeCollectorBefore == _r.fee,
                "FeeCollector balance has not been updated correctly"
            );
        }
    }

    /**
     * @dev Test VerifyExternalInput function
     * Which verifies whether the input value
     * sepecified in the externalIO[0] public input signal (in the proof)
     * has been committed to the pool's state
     *
     * Will be testing these scenarios:
     * (1) Value commited to the pool != externalIO[0]
     * (2) Value commited to the pool == externalIO[0]
     * (3) Value commited to the pool == 0
     * (3) Src is not the caller
     * (4) Sink is zero address
     *
     * note: Limiting to only operating over a simple field for now
     * run: forge test --ffi --match-test test_VerifyExternalInput
     */
    function test_VerifyExternalInput() public {
        vm.deal(address(0x1), 1000000 ether);
        vm.startPrank(address(0x1));

        /**
         * (1) Value commited to the pool != externalIO[0]
         */
        // Generate request
        IPrivacyPool.Request memory _r = IPrivacyPool.Request(
            address(0x1), // src
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), // sink
            address(0xA9959D135F54F91b2f889be628E038cbc014Ec62), // feeCollector
            0 // fee
        );
        // Generate proof
        // IO[0] set to 10000
        FFIArgs memory args = FFIArgs(
            poolTester.Scope(),
            poolTester.Context(_r),
            10000,
            0,
            0,
            0
        );
        IPrivacyPool.GROTH16Proof memory _proof = FFI_ComputeSingleProof(args);
        poolTester.Test_VerifyExternalInput{value: 1}(
            _r,
            _proof,
            abi.encodeWithSelector(
                IPrivacyPool.MissingExternalInput.selector,
                1,
                10000,
                address(0x1),
                address(0x1)
            )
        );

        /**
         * Value commited to the pool == externalIO[0]
         */
        // Generate reqeust
        _r = IPrivacyPool.Request(
            address(0x1), // src
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), // sink
            address(0xA9959D135F54F91b2f889be628E038cbc014Ec62), // feeCollector
            0 // fee
        );
        // Generate proof
        // IO[0] set to 10000
        args = FFIArgs(
            poolTester.Scope(),
            poolTester.Context(_r),
            10000,
            0,
            0,
            0
        );
        _proof = FFI_ComputeSingleProof(args);
        // Test
        poolTester.Test_VerifyExternalInput{value: 10000}(_r, _proof, "");

        /**
         * Value commited to the pool == 0
         */
        // Generate reqeust
        _r = IPrivacyPool.Request(
            address(0x1), // src
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), // sink
            address(0xA9959D135F54F91b2f889be628E038cbc014Ec62), // feeCollector
            0 // fee
        );
        // Generate proof
        // IO[0] set to 10000
        args = FFIArgs(
            poolTester.Scope(),
            poolTester.Context(_r),
            10000,
            0,
            0,
            0
        );
        _proof = FFI_ComputeSingleProof(args);
        poolTester.Test_VerifyExternalInput{value: 0}(
            _r,
            _proof,
            abi.encodeWithSelector(
                IPrivacyPool.MissingExternalInput.selector,
                0,
                10000,
                address(0x1),
                address(0x1)
            )
        );
    }

    /**
     * @dev Test VerifyExternalOutput function
     * Which releases a field-element of value specified in externalIO[1]
     * public input signal (in the proof) to a sink address
     *
     * Will be testing these scenarios:
     * (1) AggregatedFieldSum < Output value
     * (2) AggregatedFieldSum == Output value
     * (3) AggregatedFieldSum > Output value
     *
     * note: Limiting to only operating over a simple field for now
     * run: forge test --ffi --match-test test_VerifyExternalOutput
     */
    function test_VerifyExternalOutput() public {
        vm.deal(address(0x1), 1000000 ether);
        vm.startPrank(address(0x1));

        /**
         * (1) AggregatedFieldSum < Output value
         */
        // Generate reqeust
        IPrivacyPool.Request memory _r = IPrivacyPool.Request(
            address(0x1), // src
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), // sink
            address(0xA9959D135F54F91b2f889be628E038cbc014Ec62), // feeCollector
            0 // fee
        );
        // Generate proof
        // IO[0] set to 10000
        FFIArgs memory args = FFIArgs(
            poolTester.Scope(),
            poolTester.Context(_r),
            10000,
            0,
            0,
            0
        );
        IPrivacyPool.GROTH16Proof memory _proof = FFI_ComputeSingleProof(args);
        _proof._pubSignals[D_ExternIO_StartIdx] = 0;
        _proof._pubSignals[D_ExternIO_StartIdx + 1] = 10000;
        poolTester.Test_VerifyExternalOutput(
            _r,
            _proof,
            abi.encodeWithSelector(
                IPrivacyPool.OutputWillOverdraw.selector,
                0,
                10000
            )
        );

        /**
         * AggregatedFieldSum == Output value
         */
        vm.deal(address(poolTester), 10 ether);
        // Generate reqeust
        _r = IPrivacyPool.Request(
            address(0x1), // src
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), // sink
            address(0xA9959D135F54F91b2f889be628E038cbc014Ec62), // feeCollector
            0 // fee
        );
        // Generate proof
        // IO[0] set to 10
        args = FFIArgs(poolTester.Scope(), poolTester.Context(_r), 10, 0, 0, 0);
        _proof = FFI_ComputeSingleProof(args);
        _proof._pubSignals[D_ExternIO_StartIdx] = 0;
        _proof._pubSignals[D_ExternIO_StartIdx + 1] = 10;
        poolTester.Test_VerifyExternalOutput(_r, _proof, "");
        /**
         * AggregatedFieldSum > Output value
         */
        vm.deal(address(poolTester), 100 ether);
        // Generate reqeust
        _r = IPrivacyPool.Request(
            address(0x1), // src
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), // sink
            address(0xA9959D135F54F91b2f889be628E038cbc014Ec62), // feeCollector
            0 // fee
        );
        // Generate proof
        // IO[0] set to 10000
        args = FFIArgs(poolTester.Scope(), poolTester.Context(_r), 10, 0, 0, 0);
        _proof = FFI_ComputeSingleProof(args);
        _proof._pubSignals[D_ExternIO_StartIdx] = 0;
        _proof._pubSignals[D_ExternIO_StartIdx + 1] = 10;
        poolTester.Test_VerifyExternalOutput(_r, _proof, "");
    }

    /**
     * @dev Test Process function when
     * the request has been tampered with
     * and the proof's context value been adjusted to prevent
     * triggering the invalid context error
     * note: Tampering is done after proof is generated
     * Request tampering would have set off InvalidContext error
     * But this can be avoided by tampering the proof's context value.
     * Ideally this still should lead to proof invalidation
     * run: forge test --ffi --match-test test_RequestTampering
     *
     * For refernce:
     *  address src; // Source address for the external data input
     *  address sink; // Sink address for the external data ouptut
     *  address feeCollector; // address at which fee is collected
     *  uint256 fee; // Fee amount
     *
     */
    function test_RequestTampering() public {
        vm.deal(address(0x1), 1000000 ether);
        vm.deal(address(poolTester), 1000000 ether);

        vm.startPrank(address(0x1));

        // create base proof & request
        IPrivacyPool.Request memory _r = IPrivacyPool.Request(
            address(0x1), // src
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), // sink
            address(0xA9959D135F54F91b2f889be628E038cbc014Ec62), // feeCollector
            100 // fee
        );
        FFIArgs memory args = FFIArgs(
            poolTester.Scope(),
            poolTester.Context(_r),
            10000,
            0,
            0,
            0
        );
        IPrivacyPool.GROTH16Proof memory _proof = FFI_ComputeSingleProof(args);

        // modify src address
        // duplicate _r to avoid modifying the original
        IPrivacyPool.Request memory _tampered_r = IPrivacyPool.Request({
            src: address(0x2),
            sink: _r.sink,
            feeCollector: _r.feeCollector,
            fee: _r.fee
        });
        /// update the proof context value
        _proof._pubSignals[D_Context_StartIdx] = poolTester.Context(
            _tampered_r
        );
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_tampered_r, _proof, "");

        // modify sink address
        _tampered_r = IPrivacyPool.Request({
            src: _r.src,
            sink: address(0x2),
            feeCollector: _r.feeCollector,
            fee: _r.fee
        });
        /// update the proof context value
        _proof._pubSignals[D_Context_StartIdx] = poolTester.Context(
            _tampered_r
        );
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_tampered_r, _proof, "");

        /// modify feeCollector addres
        _tampered_r = IPrivacyPool.Request({
            src: _r.src,
            sink: _r.sink,
            feeCollector: address(0x2),
            fee: _r.fee
        });
        /// update the proof context value
        _proof._pubSignals[D_Context_StartIdx] = poolTester.Context(
            _tampered_r
        );
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_tampered_r, _proof, "");

        /// modify fee amount
        _tampered_r = IPrivacyPool.Request({
            src: _r.src,
            sink: _r.sink,
            feeCollector: _r.feeCollector,
            fee: 200
        });
        /// update the proof context value
        _proof._pubSignals[D_Context_StartIdx] = poolTester.Context(
            _tampered_r
        );
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_tampered_r, _proof, "");
    }

    /**
     * @dev Test Process function when the proof
     * has been tampered with.
     * note: Tampering is done after proof is generated
     * Request tampering would have set off InvalidContext error
     * But can be bypassed by tampering the proof's context value
     * ideally this still should lead to proof invalidation
     * run: forge test --ffi --match-test test_ProofTampering
     *
     *  //*** Public Input signals to the circuit ***
     *  "scope" --> to be matched with pool's scope
     *  "actualTreeDepth" --> to be verified with pool's state
     *  "context" --> to be computed and verified against
     *  "externIO" --> specifies the amount required to be comitted or sinked
     *  "existingStateRoot" --> to be verified against pool's state
     *  "newSaltPublicKey" --> to be stored into pool's state
     *  "newCiphertext" --> to be stored into the pool's state
     *
     *  //*** Public Outputs of the circuit ***
     *  "newNullRoot", --> to be verified and stored into the pool's state
     *  "newCommitmentRoot", --> to be verified and stored into the pool's state
     *  "newCommitmentHash" --> to be verified and stored into the pool's state
     *
     *
     */
    function test_ProofTampering() public {
        vm.deal(address(0x1), 1000000 ether);
        vm.deal(address(poolTester), 1000000 ether);

        vm.startPrank(address(0x1));

        // create base proof & request
        IPrivacyPool.Request memory _r = IPrivacyPool.Request(
            address(0x1), // src
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), // sink
            address(0xA9959D135F54F91b2f889be628E038cbc014Ec62), // feeCollector
            100 // fee
        );
        FFIArgs memory args = FFIArgs(
            poolTester.Scope(),
            poolTester.Context(_r),
            10000,
            0,
            0,
            0
        );
        IPrivacyPool.GROTH16Proof memory _proof = FFI_ComputeSingleProof(args);

        // Tampering proof scope value
        uint256 _original_value = _proof._pubSignals[D_Scope_StartIdx]; // cache original value
        _proof._pubSignals[D_Scope_StartIdx] = 1; // change scope value
        vm.expectRevert(
            abi.encodeWithSelector(
                IVerifier.InvalidScope.selector,
                1,
                _original_value
            )
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_Scope_StartIdx] = _original_value;

        // Tampering actualDepth value
        _original_value = _proof._pubSignals[D_ActualTreeDepth_StartIdx]; // cache original value
        _proof._pubSignals[D_ActualTreeDepth_StartIdx] = 1;
        vm.expectRevert(
            abi.encodeWithSelector(
                IVerifier.InvalidStateTreeDepth.selector,
                0,
                1,
                0
            )
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_ActualTreeDepth_StartIdx] = _original_value;

        // Tampering context value
        _original_value = _proof._pubSignals[D_Context_StartIdx]; // cache original value
        _proof._pubSignals[D_Context_StartIdx] = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.InvalidContext.selector, 1)
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_Context_StartIdx] = _original_value;

        // Tampering IO values
        // IO[0] tampered but remains > fee (otherwise you'll trigger a feeToHigh)
        _original_value = _proof._pubSignals[D_ExternIO_StartIdx]; // cache original value
        _proof._pubSignals[D_ExternIO_StartIdx] = 101;
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_ExternIO_StartIdx] = _original_value;

        // IO[1] tampered but remains > fee (otherwise you'll trigger a feeToHigh)
        _original_value = _proof._pubSignals[D_ExternIO_StartIdx + 1]; // cache original value
        _proof._pubSignals[D_ExternIO_StartIdx + 1] = 101;
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_ExternIO_StartIdx + 1] = _original_value;

        // Tampering existingStateRoot
        _original_value = _proof._pubSignals[D_ExistingStateRoot_StartIdx]; // cache original value
        _proof._pubSignals[D_ExistingStateRoot_StartIdx] = 1;
        vm.expectRevert(
            abi.encodeWithSelector(
                IVerifier.InvalidStateTreeDepth.selector,
                1,
                0,
                0
            )
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_ExistingStateRoot_StartIdx] = _original_value;

        // Tampering With the SaltPublicKey
        _original_value = _proof._pubSignals[D_NewSaltPublicKey_StartIdx]; // cache original value
        _proof._pubSignals[D_NewSaltPublicKey_StartIdx] = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_NewSaltPublicKey_StartIdx] = _original_value;

        // Tampering With the CipherText
        _original_value = _proof._pubSignals[D_NewCiphertext_StartIdx]; // cache original value
        _proof._pubSignals[D_NewCiphertext_StartIdx] = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_NewCiphertext_StartIdx] = _original_value;

        // Tampering With the NewNullRoot
        _original_value = _proof._pubSignals[D_NewNullRoot_StartIdx]; // cache original value
        _proof._pubSignals[D_NewNullRoot_StartIdx] = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_NewNullRoot_StartIdx] = _original_value;

        // Tampering With the NewCommitmentRoot
        _original_value = _proof._pubSignals[D_NewCommitmentRoot_StartIdx]; // cache original value
        _proof._pubSignals[D_NewCommitmentRoot_StartIdx] = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_NewCommitmentRoot_StartIdx] = _original_value;

        // Tampering With the newCommitmentHash
        _original_value = _proof._pubSignals[D_NewCommitmentHash_StartIdx]; // cache original value
        _proof._pubSignals[D_NewCommitmentHash_StartIdx] = 1;
        vm.expectRevert(
            abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector)
        );
        poolTester.Test_Process(_r, _proof, "");
        // restore original value
        _proof._pubSignals[D_NewCommitmentHash_StartIdx] = _original_value;
    }
}
