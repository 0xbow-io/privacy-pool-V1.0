pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Create2.sol";
import "../src/PrivacyPool.sol";
import "../src/Groth16Verifier.sol";
import "../src/TreeHasher.sol";
import "../src/interfaces/IPrivacyPool.sol";

contract TestPrivacyPool is Test {
    address poolAddress = vm.computeCreateAddress(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, 1);

    IPrivacyPool internal pool;
    Groth16Verifier internal verifier;
    TreeHasher internal hasher;
    Create2 internal create2;

    function setUp() public {
        verifier = new Groth16Verifier();
        hasher = new TreeHasher();
        create2 = new Create2();
    }

    function testDeterministicDeploy() public {
        vm.deal(address(0x1), 100 ether);
        vm.startPrank(address(0x1));
        bytes32 salt = "12345";
        bytes memory creationCode = abi.encodePacked(
            type(PrivacyPool).creationCode,
            abi.encode(
                address(verifier), address(hasher), uint256(2 ** 248), 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
            )
        );

        address computedAddress = create2.computeAddress(salt, keccak256(creationCode));
        address deployedAddress = create2.deploy(salt, creationCode);
        vm.stopPrank();

        assertEq(computedAddress, deployedAddress);

        pool = IPrivacyPool(deployedAddress);
    }

    function testProcess() public {}
}
