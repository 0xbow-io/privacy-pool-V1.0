// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/verifier/Verifier.sol";
import "../src/verifier/groth16_verifier.sol";

import {IVerifier} from "../src/interfaces/IVerifier.sol";
import {IPrivacyPool} from "../src/interfaces/IPrivacyPool.sol";

contract VerifierTester is Test, Verifier {
    constructor(address _verifier) Verifier(_verifier) {}

    function _Context(IPrivacyPool.Request calldata _r) public view returns (uint256) {
        return Context(_r);
    }

    function _Scope() public view returns (uint256) {
        return Scope();
    }

    function Test_IsValidProofModifier(IPrivacyPool.Request calldata _r, IPrivacyPool.GROTH16Proof calldata _proof)
        public
        view
        IsValidProof(_r, _proof)
    {
        console.log("IsValidProof modifier passed");
    }

    function Test_IsValidRequestModifier(IPrivacyPool.Request calldata _r, IPrivacyPool.GROTH16Proof calldata _proof)
        public
        view
        IsValidRequest(_r, _proof)
    {
        console.log("IsValidRequest modifier passed");
    }
}

contract TestVerifier is Test {
    Groth16Verifier internal verifier;
    VerifierTester internal verifierTester;

    function setUp() public {
        verifier = new Groth16Verifier();
        verifierTester = new VerifierTester(address(verifier));
    }

    struct TestProofData {
        address src;
        address sink;
        address feeCollector;
        uint256 fee;
        uint256 scope;
        uint256 stateDepth;
        uint256 context;
        uint256[2] IO;
        uint256 existingStateRoot;
        uint256[4] newNullRoot;
        uint256[4] newCommitmentRoot;
        uint256[4] newCommitmentHash;
        bool verifierShouldPass;
        bytes expectedErrorMsg;
    }

    function GenTestRequestProof(TestProofData memory td)
        public
        pure
        returns (IPrivacyPool.Request memory request, IPrivacyPool.GROTH16Proof memory proof)
    {
        request = IPrivacyPool.Request({src: td.src, sink: td.sink, feeCollector: td.feeCollector, fee: td.fee});
        proof = IPrivacyPool.GROTH16Proof({
            _pA: [uint256(0), uint256(0)],
            _pB: [[uint256(0), uint256(0)], [uint256(0), uint256(0)]],
            _pC: [uint256(0), uint256(0)],
            _pubSignals: [
                td.newNullRoot[0],
                td.newNullRoot[1],
                td.newNullRoot[2],
                td.newNullRoot[3],
                td.newCommitmentRoot[0],
                td.newCommitmentRoot[1],
                td.newCommitmentRoot[2],
                td.newCommitmentRoot[3],
                td.newCommitmentHash[0],
                td.newCommitmentHash[1],
                td.newCommitmentHash[2],
                td.newCommitmentHash[3],
                td.scope,
                td.stateDepth,
                td.context,
                td.IO[0],
                td.IO[1],
                td.existingStateRoot,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ]
        });
    }

    function MockVerifier(IPrivacyPool.GROTH16Proof memory proof, bool _expectedOut) public {
        // mock call to verifier contract
        // to make testing of process function easily
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(verifier.verifyProof.selector, proof._pA, proof._pB, proof._pC, proof._pubSignals),
            abi.encode(_expectedOut)
        );
    }

    /**
     * @dev Test the IsValidRequest modifier
     * Will try to trigger the modifier on 3 different conditions:
     * - Fee > Sum of Inputs & Output (IO)
     * - FeeCollector is zero address if Fee > 0
     * run: forge test --match-test test_IsValidRequestModifier -vvvvv
     */
    function test_IsValidRequestModifier() public {
        TestProofData[3] memory td = [
            //  Fee > Sum of Inputs & Output (IO)
            TestProofData({
                src: address(this),
                sink: address(this),
                feeCollector: address(this),
                fee: 300, // fee (300) > Sum of IO (110)
                scope: 1,
                stateDepth: 2,
                context: 3,
                IO: [uint256(60), uint256(50)],
                existingStateRoot: 6,
                newNullRoot: [
                    7693650792535944309452694493764107138652740190734382403591779890211701663605,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    uint256(0),
                    uint256(0)
                ],
                newCommitmentRoot: [
                    uint256(0),
                    uint256(0),
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493
                ],
                newCommitmentHash: [
                    uint256(0),
                    uint256(0),
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946
                ],
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.FeeTooHigh.selector, 300, 110),
                verifierShouldPass: true
            }),
            // FeeCollector is zero address if Fee > 0
            TestProofData({
                src: address(0x1),
                sink: address(0x2),
                feeCollector: address(0),
                fee: 10,
                scope: 1,
                stateDepth: 2,
                context: 3,
                IO: [uint256(20), uint256(0)],
                existingStateRoot: 6,
                newNullRoot: [
                    7693650792535944309452694493764107138652740190734382403591779890211701663605,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    uint256(0),
                    uint256(0)
                ],
                newCommitmentRoot: [
                    uint256(0),
                    uint256(0),
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493
                ],
                newCommitmentHash: [
                    uint256(0),
                    uint256(0),
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946
                ],
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.FeeCollectorIsZero.selector),
                verifierShouldPass: true
            }),
            // Modifier should not revert here
            TestProofData({
                src: address(0x1),
                sink: address(0x2),
                feeCollector: address(this),
                fee: 10,
                scope: 1,
                stateDepth: 2,
                context: 3,
                IO: [uint256(20), uint256(0)],
                existingStateRoot: 6,
                newNullRoot: [
                    7693650792535944309452694493764107138652740190734382403591779890211701663605,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    uint256(0),
                    uint256(0)
                ],
                newCommitmentRoot: [
                    uint256(0),
                    uint256(0),
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493
                ],
                newCommitmentHash: [
                    uint256(0),
                    uint256(0),
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946
                ],
                expectedErrorMsg: "",
                verifierShouldPass: true
            })
        ];
        for (uint256 i = 0; i < td.length; i++) {
            (IPrivacyPool.Request memory request, IPrivacyPool.GROTH16Proof memory proof) = GenTestRequestProof(td[i]);
            // if expecting an error Msg, then assert it
            if (td[i].expectedErrorMsg.length > 0) {
                vm.expectRevert(td[i].expectedErrorMsg);
            }
            verifierTester.Test_IsValidRequestModifier(request, proof);
        }
    }

    /**
     * @dev Test the IsValidProof modifier
     * Will try to trigger the modifier on 6 different conditions:
     * - scope mismatch
     * - context mismatch
     * - false depth & state root
     * - invalid proof
     * - invalid output
     *
     * run: forge test --match-test test_IsValidProofModifier -vvvvv
     */
    function test_IsValidProofModifier() public {
        TestProofData[6] memory td = [
            //  scope mismatch
            TestProofData({
                src: address(this),
                sink: address(this),
                feeCollector: address(this),
                fee: 0,
                scope: 1, // <--- scope mismatch
                stateDepth: 2,
                context: 3,
                IO: [uint256(60), uint256(50)],
                existingStateRoot: 6,
                newNullRoot: [
                    7693650792535944309452694493764107138652740190734382403591779890211701663605,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    uint256(0),
                    uint256(0)
                ],
                newCommitmentRoot: [
                    uint256(0),
                    uint256(0),
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493
                ],
                newCommitmentHash: [
                    uint256(0),
                    uint256(0),
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946
                ],
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.InvalidScope.selector, 1, verifierTester._Scope()),
                verifierShouldPass: true
            }),
            //  context mismatch
            TestProofData({
                src: address(this),
                sink: address(this),
                feeCollector: address(this),
                fee: 0,
                scope: verifierTester._Scope(), // <--- scope match
                stateDepth: 2,
                context: 3, // <--- context mismatch
                IO: [uint256(60), uint256(50)],
                existingStateRoot: 6,
                newNullRoot: [
                    7693650792535944309452694493764107138652740190734382403591779890211701663605,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    uint256(0),
                    uint256(0)
                ],
                newCommitmentRoot: [
                    uint256(0),
                    uint256(0),
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493
                ],
                newCommitmentHash: [
                    uint256(0),
                    uint256(0),
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946
                ],
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.InvalidContext.selector, 3),
                verifierShouldPass: true
            }),
            //  Invalid State Root Detph
            TestProofData({
                src: address(this),
                sink: address(this),
                feeCollector: address(this),
                fee: 0,
                scope: verifierTester._Scope(), // <--- scope match
                stateDepth: 2, // <--- invalid state depth
                context: verifierTester._Context(
                    IPrivacyPool.Request({src: address(this), sink: address(this), feeCollector: address(this), fee: 0})
                ), // <--- context match
                IO: [uint256(60), uint256(50)],
                existingStateRoot: 6, // <--- invalid state root
                newNullRoot: [
                    7693650792535944309452694493764107138652740190734382403591779890211701663605,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    uint256(0),
                    uint256(0)
                ],
                newCommitmentRoot: [
                    uint256(0),
                    uint256(0),
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493
                ],
                newCommitmentHash: [
                    uint256(0),
                    uint256(0),
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946
                ],
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.InvalidStateTreeDepth.selector, 6, 2, 0),
                verifierShouldPass: true
            }),
            //  Invalid Proof
            TestProofData({
                src: address(this),
                sink: address(this),
                feeCollector: address(this),
                fee: 0,
                scope: verifierTester._Scope(), // <--- scope match
                stateDepth: 0, // <--- valid state depth
                context: verifierTester._Context(
                    IPrivacyPool.Request({src: address(this), sink: address(this), feeCollector: address(this), fee: 0})
                ), // <--- context match
                IO: [uint256(60), uint256(50)],
                existingStateRoot: 0, // valid state root
                newNullRoot: [
                    7693650792535944309452694493764107138652740190734382403591779890211701663605,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    uint256(0),
                    uint256(0)
                ],
                newCommitmentRoot: [
                    uint256(0),
                    uint256(0),
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493
                ],
                newCommitmentHash: [
                    uint256(0),
                    uint256(0),
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946
                ],
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.ProofVerificationFailed.selector),
                verifierShouldPass: false // have mock verifier return false when verifying proof
            }),
            //  Invalid Outputs
            TestProofData({
                src: address(this),
                sink: address(this),
                feeCollector: address(this),
                fee: 0,
                scope: verifierTester._Scope(), // <--- scope match
                stateDepth: 0, // <--- valid state depth
                context: verifierTester._Context(
                    IPrivacyPool.Request({src: address(this), sink: address(this), feeCollector: address(this), fee: 0})
                ), // <--- context match
                IO: [uint256(60), uint256(50)],
                existingStateRoot: 0, // valid state root
                newNullRoot: [
                    7693650792535944309452694493764107138652740190734382403591779890211701663605,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    /// any values before D_MAX_ALLOWED_EXISTING should > 0
                    /// any values after D_MAX_ALLOWED_EXISTING should be 0
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254
                ],
                newCommitmentRoot: [
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493,
                    /// any values before D_MAX_ALLOWED_EXISTING should 0
                    /// any values after D_MAX_ALLOWED_EXISTING should be > 0
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493
                ],
                newCommitmentHash: [
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946,
                    /// any values before D_MAX_ALLOWED_EXISTING should 0
                    /// any values after D_MAX_ALLOWED_EXISTING should be > 0
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946
                ],
                expectedErrorMsg: abi.encodeWithSelector(IVerifier.InvalidProofOutput.selector),
                verifierShouldPass: true // mock verifier returns true after proof verification
            }),
            //  Modifier shouldn't revert here
            TestProofData({
                src: address(this),
                sink: address(this),
                feeCollector: address(this),
                fee: 0,
                scope: verifierTester._Scope(), // <--- scope match
                stateDepth: 0, // <--- valid state depth
                context: verifierTester._Context(
                    IPrivacyPool.Request({src: address(this), sink: address(this), feeCollector: address(this), fee: 0})
                ), // <--- context match
                IO: [uint256(60), uint256(50)],
                existingStateRoot: 0, // valid state root
                newNullRoot: [
                    7693650792535944309452694493764107138652740190734382403591779890211701663605,
                    8332886049255157997897576635845085046397756573432925624911262188442327935254,
                    /// any values before D_MAX_ALLOWED_EXISTING should > 0
                    /// any values after D_MAX_ALLOWED_EXISTING should be 0
                    0,
                    0
                ],
                newCommitmentRoot: [
                    0,
                    0,
                    /// any values before D_MAX_ALLOWED_EXISTING should 0
                    /// any values after D_MAX_ALLOWED_EXISTING should be > 0
                    9496793602174919810723858882124603036908389592504512643637323741931405449085,
                    6202671744449709621192808765624479254966757513761261484453295308653908329493
                ],
                newCommitmentHash: [
                    0,
                    0,
                    /// any values before D_MAX_ALLOWED_EXISTING should 0
                    /// any values after D_MAX_ALLOWED_EXISTING should be > 0
                    16864955148287088946842576079859418432787836674015622617999139748100038136405,
                    14889106458831651818035422305116181532836402325375434055584405801347344902946
                ],
                expectedErrorMsg: "",
                verifierShouldPass: true // mock verifier returns true after proof verification
            })
        ];
        for (uint256 i = 0; i < td.length; i++) {
            (IPrivacyPool.Request memory request, IPrivacyPool.GROTH16Proof memory proof) = GenTestRequestProof(td[i]);
            // if expecting an error Msg, then assert it
            if (td[i].expectedErrorMsg.length > 0) {
                vm.expectRevert(td[i].expectedErrorMsg);
            }
            MockVerifier(proof, td[i].verifierShouldPass);
            verifierTester.Test_IsValidProofModifier(request, proof);
        }
    }
}
