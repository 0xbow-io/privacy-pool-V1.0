// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "forge-std/StdJson.sol";

import "../src/verifier/groth16_verifier.sol";
import "../src/interfaces/IPrivacyPool.sol";
import "../src/PrivacyPool.sol";
import "../src/Constants.sol";

contract PrivacyPoolTester is Test, PrivacyPool {
    constructor(address _primitiveHandler, address _verifier) PrivacyPool(_primitiveHandler, _verifier) {}

    modifier AggregatedFieldSumCheck(bool expectChange) {
        uint256 _sum = address(this).balance;
        _;
        if (expectChange) {
            assertFalse(_sum == address(this).balance);
        } else {
            assertTrue(_sum == address(this).balance);
        }
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

    function Test_StateIsUpdatedModifier(Request calldata _r, IPrivacyPool.GROTH16Proof calldata _proof)
        public
        StateIsUpdated(_r, _proof)
    {
        console.log("modifier triggered after function body");
    }

    function Test_FeeIsReleasedModifier(Request calldata _r, IPrivacyPool.GROTH16Proof calldata _proof)
        public
        FeeIsReleased(_r, _proof)
    {
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
        poolTester = new PrivacyPoolTester(D_BASE_FIELD_INTERPRETER, address(verifier));
    }

    struct FFIArgs {
        uint256 scope;
        uint256 context;
        uint256 IO0;
        uint256 IO1;
        uint256 actualTreeDepth;
        uint256 existingStateRoot;
    }

    function FFI_ComputeSingleProof(FFIArgs memory args) public returns (IPrivacyPool.GROTH16Proof memory _proof) {
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
     * note: Limiting to only simple field for now
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
        FFIArgs memory args = FFIArgs(poolTester.Scope(), poolTester.Context(_r), 10000, 0, 0, 0);
        IPrivacyPool.GROTH16Proof memory _proof = FFI_ComputeSingleProof(args);
        poolTester.Test_VerifyExternalInput{value: 1}(
            _r,
            _proof,
            abi.encodeWithSelector(IPrivacyPool.MissingExternalInput.selector, 1, 10000, address(0x1), address(0x1))
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
        args = FFIArgs(poolTester.Scope(), poolTester.Context(_r), 10000, 0, 0, 0);
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
        args = FFIArgs(poolTester.Scope(), poolTester.Context(_r), 10000, 0, 0, 0);
        _proof = FFI_ComputeSingleProof(args);
        poolTester.Test_VerifyExternalInput{value: 0}(
            _r,
            _proof,
            abi.encodeWithSelector(IPrivacyPool.MissingExternalInput.selector, 0, 10000, address(0x1), address(0x1))
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
     * note: Limiting to only simple field for now
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
        FFIArgs memory args = FFIArgs(poolTester.Scope(), poolTester.Context(_r), 10000, 0, 0, 0);
        IPrivacyPool.GROTH16Proof memory _proof = FFI_ComputeSingleProof(args);
        _proof._pubSignals[D_ExternIO_StartIdx] = 0;
        _proof._pubSignals[D_ExternIO_StartIdx + 1] = 10000;
        poolTester.Test_VerifyExternalOutput(
            _r, _proof, abi.encodeWithSelector(IPrivacyPool.OutputWillOverdraw.selector, 0, 10000)
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
}
