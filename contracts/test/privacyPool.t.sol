pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Create2.sol";
import "../src/PrivacyPool.sol";
import "../src/Groth16Verifier.sol";
import "../src/TreeHasher.sol";
import "../src/interfaces/IPrivacyPool.sol";

contract TestPrivacyPool is Test {
    IPrivacyPool internal pool;
    Groth16Verifier internal verifier;
    TreeHasher internal hasher;
    Create2 internal create2;

    function setUp() public {
        verifier = new Groth16Verifier();
        hasher = new TreeHasher();
        create2 = new Create2();

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
        console.log("deployedAddress: ", deployedAddress);
        console.log("valueUnitRepresentative: ", pool.valueUnitRepresentative());
        console.log("currentDepth: ", pool.currentDepth());
        console.log("latestRoot: ", pool.latestRoot());
        console.log("size: ", pool.size());
    }

    function testCalcSignalHash() public {
        uint256 hash = pool.calcSignalHash(
            100, 0, 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
        );
        assertEq(hash, 3065252958325793851206743978421963665353331658506504487234789517251804995496);
    }

    function testCalcPublicVal() public {
        uint256 publicVal = pool.calcPublicVal(-250, 50);
        assertEq(publicVal, 21888242871839275222246405745257275088548364400416034343698204186575808495317);
    }

    function testProcess() public {
        vm.deal(address(0x1), 1000000 ether);
        vm.startPrank(address(0x1));

        // Fresh Tree, 2 zero Input, 1 zero Output, 1 non-zero Output
        pool.process{value: 100}(
            IPrivacyPool.signal({
                units: 100,
                fee: 0,
                account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                feeCollector: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
            }),
            IPrivacyPool.supplement({
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
            }),
            [
                0x2189d34bfec0352fd4d3eefea2e188f2e1002b0707bbe470ec7bd64ffd43d8fd,
                0x01f2b76f0c284fa62c108c1cc589a3bec7c1c3968762ec93569fd3a5501307f6
            ],
            [
                [
                    0x01ef747e7486cbdf3b6146aabde246bb199c0cb457e58e602d7ac7398f892841,
                    0x0981105394f339d06106c7e513f93aa2c83c0b88543453784896de59dff20789
                ],
                [
                    0x2bd6820194a827ccae7c66d89c4cb037cdc5ba0a68d4c650d48fbf6b3a187759,
                    0x0c119efeadbf653bf15e8d7366a4c5610330196170b1af52be1da2e11a5090b5
                ]
            ],
            [
                0x054ae98a351201af92adab0f9147e38b7391bbc91ef7d78c8854d38d2cc4db33,
                0x05ce4e3498a2ab023be6884db4f533cf67030c83cc57723350f81d5eb9b40787
            ],
            [
                0x0000000000000000000000000000000000000000000000000000000000000000,
                0x0000000000000000000000000000000000000000000000000000000000000064,
                0x06c6df2743ac57aa19e025af0d2cfa88d633b9c2c3fee29657167b3175a91fa8,
                0x0000000000000000000000000000000000000000000000000000000000000000,
                0x0a619193dfabb8b59b17d0b4b989bb240112a270a11d7bd3b6912688f1df0f27,
                0x0feda7ebe8af61ce39d59c7ae0d44cbf01c1bbb1ce5bc39af8ba34736e4525d3,
                0x1e5a35660e0a109538d192c76145e202067f2477ff5ae22769c0068b762de9d7,
                0x2659cab8f147b54b98e32f17c48ba156de7085a341fc0dea6c6b475199b30d95
            ]
        );

        console.log("latestRoot: ", pool.latestRoot());

        pool.process{value: 200}(
            IPrivacyPool.signal({
                units: 200,
                fee: 0,
                account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                feeCollector: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
            }),
            IPrivacyPool.supplement({
                ciphertexts: [
                    [
                        9228064930188822699964540424001984067607556540390209272840245694915806878756,
                        6890129479135902374838110776107411674516471835923215973192869526242869775686,
                        3462718207616180355246120130527744094367885615321131034087649048382502301340,
                        13131650030008218146544827300043684013615967844740940294097965868461231911637
                    ],
                    [
                        11549330060325127860021207148469549495284128169849350740792214974175008723105,
                        16292388193260826995535660789093300345792985696734514982968656588422341755974,
                        15123695301333838834204737045590643350364109456840854030276580336696453767056,
                        10448475564968726195394786309252981777325818534705143147544876563855192367409
                    ]
                ],
                associationProofURI: "ipfs://"
            }),
            [
                0x09574c64ae529158969f364beee9e7cc759694480926c041369b9a7edd783598,
                0x28acbc005dc14fdcc914a6f17edce1c564a731b87964aef97ceba893bcf0b18a
            ],
            [
                [
                    0x2d9aa3dd1bf8951ee0abd84428f4ae7fe665f37a32c92239d4c340bab5d6920a,
                    0x1743433749e8b504b144e9bf48eefdc2677897a872ecf01e172049c7fc789ed9
                ],
                [
                    0x1c466188a2e9a6ac7c80a29144c65e86e4085e454c6235a312cdbad042c94d1f,
                    0x229bedc7513311c0f467b53fbb4291c5707ebb47cd0695e9bf07630618d66e8f
                ]
            ],
            [
                0x2cbd8ed8f8bd9446248cc2beeed4b896377f220c6e3f473fe479f4349477681c,
                0x12e3621ee8964be87ed63663fc835f1bfe8bba137ebab815f58a8068d075260b
            ],
            [
                0x25cad47ebd8f64fba5d37e7b139efa0fa0893e6ac28721f22c0be5fa1d6a1434,
                0x00000000000000000000000000000000000000000000000000000000000000c8,
                0x0cd1e40b5ce1edb1611bc7d637f0504c63efb06c6181ef5a22bbe83db9d31691,
                0x0000000000000000000000000000000000000000000000000000000000000001,
                0x2ac5ce11e00651a6b6d36679f06854e952c18d048f96094eb765425e2c219df4,
                0x202bc9232a7391749ee73fdee6029fb7bbc6ed4eddc750438e5537e8e4d7ddf4,
                0x183fcc1020ad3ae6b90493a8b133d7e7d8a77dfe57fef110d4a7fda2cc80349d,
                0x22adcefdfe08d7c832d8f32530d62d2fcb345db41b716aa525bf4f69c9433375
            ]
        );

        console.log("latestRoot: ", pool.latestRoot());

        pool.process(
            IPrivacyPool.signal({
                units: -250,
                fee: 50,
                account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                feeCollector: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
            }),
            IPrivacyPool.supplement({
                ciphertexts: [
                    [
                        4948253572082958349945287122336803355125230125652040150002380093966242282468,
                        4080804497337809083723856216771324275364056241979525998212376427238726785772,
                        15228619776601744614382028978950577645606538022742336779825399318319486388933,
                        17632846203487115857202326722569413163731087078376345707947863950467653928615
                    ],
                    [
                        11549330060325127860021207148469549495284128169849350740792214974175008723105,
                        16292388193260826995535660789093300345792985696734514982968656588422341756050,
                        15123695301333838834204737045590643350364109456840854030276580336696453767056,
                        21886674422972653358240045269728118599403096700381025834898077615188694671670
                    ]
                ],
                associationProofURI: "ipfs://"
            }),
            [
                0x06d5e9f1b146163f7ec1a82e0b3372d00d3c9e2cc4096e6e99e160ab7c357ad7,
                0x1e640fcb6c8530c953f41af0dfbe6bc6176abfb90877144ef05f2be3f4d6cb9b
            ],
            [
                [
                    0x2dd534d230291a10648fc704f168c6cf6f7ec1d4473f21d96a1895aa8645593d,
                    0x0f198ab5559f925169ab3e68768738b34498d1990fbdd139f84f7429a1724053
                ],
                [
                    0x2e415c8308f211f7412330e0744fe97bc0d1547b745054dd4133f1f7bfc25570,
                    0x065e9299c4589584117fce73273cdd82c904cb687f99feddaf10e99a874d9380
                ]
            ],
            [
                0x0eeee7b523eb6d5c85ccd862b369569893cfe6d9637589237be834552c4c8730,
                0x22d3271b6b6ce4bfd8440adf9b6185fa1015b00243ce4bfee2fc3879685f3905
            ],
            [
                0x0197e3c7725c943f8d400ef0dacb5f35428ce98a6bd967407e1798322610457c,
                0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593effffed5,
                0x21e68db8288c0d5dc0bfbe6a55cc7ff5205b7ccc382818d4a24375570bc28299,
                0x0000000000000000000000000000000000000000000000000000000000000002,
                0x0c17499e05659d349ed3e5088ae677ef0ec2b3165f28d1933399e6394bccc330,
                0x279b6210fed420b1a904d05798ebf075ff7f7445449d1bb1b76c4f1fb3efdf82,
                0x1668111bc76ce68ef18f5eda870cfa4445a0389a6cfa5cfc050b8c734d1a357f,
                0x2273b8716cb91c53d3f35e611b84c84d022603161fc1925baeee8f62873e9d63
            ]
        );

        console.log("latestRoot: ", pool.latestRoot());

        uint256 balance = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE).balance;
        assert(balance == 300);

        vm.stopPrank();
    }
}
