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
        assertEq(hash, 18937175923520281763335632801636284365647507147689795808174989680533635809126);
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
                feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
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
                0x11cb0fc9174301a206cf63edf847ef69cbabc219d746654a7fe6eaf8db8b1097,
                0x1886c8e7ec393f7c76246df703702ba037a1c0562337a53a1f978cbc6490a254
            ],
            [
                [
                    0x177d81b7e81b123ab893e5f828e434ab4186563362a7af20ba828bfdec6a1006,
                    0x2416a9a734ebb256cd9230d9dcc65ec30754f4ed98cdf2f8ae32ca879f5e94b6
                ],
                [
                    0x2db43ba12cfb837d1bd4ecfbbb5d161ee0ff232dc55418ddfa9f2676dd244fbd,
                    0x06f2fce89e061cae713e310b93b6ee1c4fec9db07b901e4389e0b2ceadf5d9dd
                ]
            ],
            [
                0x018e8ef290ec1d4dbd6f769f1244bef8aaff30a554d9829771e8b1e46a50c7f8,
                0x1d8a716031deb1eb454ace60c0b179e10a99fe39a5f626f1f5c2b1a1084acbc2
            ],
            [
                0x0000000000000000000000000000000000000000000000000000000000000000,
                0x0000000000000000000000000000000000000000000000000000000000000064,
                0x0c138d79d2a0c9f1eb742d55eae4a3351dcae0a65eccbf3748c73ad56de9ab93,
                0x0000000000000000000000000000000000000000000000000000000000000000,
                0x2ec3c8133f3995beb87fdc48b6fab6e408f1d585bee0fc3f26f1f7c8cbcf7927,
                0x01b11a70c8c702dac8ed0d11c3d6624bb8c82235706debca0f56e94136b8fb2f,
                0x2bd6837b0a0d6406faf91e3e24b5256b052d4edfad688ca95cca68ddf4eb13ec,
                0x079779fda6dc418971ffcc593295f1d6210528c02cee5ddb1ff365588d758980
            ]
        );

        console.log("latestRoot: ", pool.latestRoot());

        pool.process{value: 200}(
            IPrivacyPool.signal({
                units: 200,
                fee: 0,
                account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
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
                0x196237b2053f86ee51e14e2bed607cdacdb348c05760ac416b1051cc18e7c1ae,
                0x04e918cb383be46ac5e52fd7284f5a072628f02e388798274d323abe4f12cf64
            ],
            [
                [
                    0x1d0c0de89c31545c42144736ade9f29f4878a89197fbe9dd87ac765551b556b9,
                    0x206c1e83bdff5f69f3bb578f90421efe38b8df67ec8520fb92a8099a9282eb47
                ],
                [
                    0x00972db45a3902a117922589f4c501615e4396e51681f97e263c6944a2850a51,
                    0x18989a231b678d9da6b2a6db0c74a0f92107154dd0b9cf865fd88d81e3c1b99f
                ]
            ],
            [
                0x026952d4d35220f60203379db5f1287a06ba4b1ad24457c913b0d3cdc44db437,
                0x0fe685ceff7edb7a1b8cbae88142977866f330c47aeba2ca8abb27d34aecca35
            ],
            [
                0x1aaaa8666a8dafc0f5626487e91c812e3e3d827331f9d43564bb0dd40e2615c1,
                0x00000000000000000000000000000000000000000000000000000000000000c8,
                0x2a1fa261994753876355df8a85147bb56a148ba300462add27079fa63ae7bd2b,
                0x0000000000000000000000000000000000000000000000000000000000000001,
                0x180f48df2490c9a381d63e60adf7ec54fed4fe6c092dba7d5904ac08e3c56ae2,
                0x0e889d1eedc9a5286a4a5d8f810aba00252279646e07d848ac04faf0198ee06f,
                0x084e94cb460a35f4559023feb49db118520444962e6664c86293a0cb1e325d3c,
                0x093b5058db4e02b3246bad75f71014847738f991d2ceb709ffd6572639bc1ff4
            ]
        );

        console.log("latestRoot: ", pool.latestRoot());

        pool.process(
            IPrivacyPool.signal({
                units: -250,
                fee: 50,
                account: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                feeCollector: 0xA9959D135F54F91b2f889be628E038cbc014Ec62
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
                0x19f54c6a1d1b07ab260594cd3b8f99229b9b4c9825f98b05f1e0a69f7901c916,
                0x065e7e702cee94d864334a9e73efb01eb5a519af7598b0d6bbd4deb3234d9ee6
            ],
            [
                [
                    0x1f6b6248aa76a05c02d5ba6bf4d812a7ad814bf2f2d18343af9c5152885d1a7f,
                    0x15557c6abb2bea2d1349ad8b20f7b250215c84c81f46260769ff51a3ae82656f
                ],
                [
                    0x1d2590777a7f091b6f72df6b2c11391520335f3e98ec6729c4f96ea8d02f4932,
                    0x08c12b20402e027ac6ee7d65731b788c0a058059fec76521b31ad81490950fcd
                ]
            ],
            [
                0x1e8af99e87f2d6705a55b84d5f7356886f4c1dfca8dd48aac0388da536a3d376,
                0x0fca9fc08771fcd0fa52a55de89b787745af5b645e572eeafa03c8a2047ac2ae
            ],
            [
                0x290b0958f172b8bb23df75bef923fb505d2bfc0d09738be2d5bfbebae3820c34,
                0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593effffed5,
                0x252cca98d44669f2fa40a57ed1b60a324ae274b246244bdd77d0f2b1bd657941,
                0x0000000000000000000000000000000000000000000000000000000000000002,
                0x16cc22c0da1baf6c5053559903f578c070dc638d20b96e2ee6bbac772035eafb,
                0x11b18ae8cff3f846387a6b9d27f22868be724937de074cd5eafb4e463524f604,
                0x227be0fb9ff6664647d480e7efaec8b9c5c67e9466d057de6d2728edc7c9528c,
                0x2fb5171efce5bbd4a95fad451dac9caafdfd84bd2b0b5a2e72e0be6373654274
            ]
        );

        console.log("latestRoot: ", pool.latestRoot());

        uint256 AccBalance = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE).balance;
        console.log("AccBalance: ", AccBalance);

        assert(AccBalance == 250);

        uint256 feeCollector = address(0xA9959D135F54F91b2f889be628E038cbc014Ec62).balance;
        console.log("feeCollector: ", feeCollector);

        assert(feeCollector == 50);

        uint256 ContractBalance = address(pool).balance;
        console.log("ContractBalance: ", ContractBalance);

        assert(ContractBalance == 0);

        vm.stopPrank();
    }
}
