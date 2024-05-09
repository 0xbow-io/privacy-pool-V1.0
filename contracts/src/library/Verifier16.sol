// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library Pairing {
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    /*
     * @return The negation of p, i.e. p.plus(p.negate()) should be zero
     */
    function negate(G1Point memory p) internal pure returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        if (p.X == 0 && p.Y == 0) {
            return G1Point(0, 0);
        } else {
            return G1Point(p.X, PRIME_Q - (p.Y % PRIME_Q));
        }
    }

    /*
     * @return r the sum of two points of G1
     */
    function plus(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint256[4] memory input = [p1.X, p1.Y, p2.X, p2.Y];
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success
            case 0 { invalid() }
        }

        require(success, "pairing-add-failed");
    }

    /*
     * @return r the product of a point on G1 and a scalar, i.e.
     *         p == p.scalarMul(1) and p.plus(p) == p.scalarMul(2) for all
     *         points p.
     */
    function scalarMul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
        uint256[3] memory input = [p.X, p.Y, s];
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success
            case 0 { invalid() }
        }

        require(success, "pairing-mul-failed");
    }

    /* @return The result of computing the pairing check
     *         e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
     *         For example,
     *         pairing([P1(), P1().negate()], [P2(), P2()]) should return true.
     */
    function pairing(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
    ) internal view returns (bool) {
        uint256[24] memory input = [
            a1.X,
            a1.Y,
            a2.X[0],
            a2.X[1],
            a2.Y[0],
            a2.Y[1],
            b1.X,
            b1.Y,
            b2.X[0],
            b2.X[1],
            b2.Y[0],
            b2.Y[1],
            c1.X,
            c1.Y,
            c2.X[0],
            c2.X[1],
            c2.Y[0],
            c2.Y[1],
            d1.X,
            d1.Y,
            d2.X[0],
            d2.X[1],
            d2.Y[0],
            d2.Y[1]
        ];
        uint256[1] memory out;
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, input, mul(24, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success
            case 0 { invalid() }
        }

        require(success, "pairing-opcode-failed");
        return out[0] != 0;
    }
}

contract Verifier16 {
    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    using Pairing for *;

    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[22] IC;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            20491192805390485299153009773594534940189261866228447918068658471970481763042,
            9383485363053290200918347156157836566562967994039712273449902621266178545958
        );
        vk.beta2 = Pairing.G2Point(
            [
                4252822878758300859123897981450591353533073413197771768651442665752259397132,
                6375614351688725206403948262868962793625744043794305715222011528459656738731
            ],
            [
                21847035105528745403288232691147584728191162732299865338377159692350059136679,
                10505242626370262277552901082094356697409835680220590971873171140371331206856
            ]
        );
        vk.gamma2 = Pairing.G2Point(
            [
                11559732032986387107991004021392285783925812861821192530917403151452391805634,
                10857046999023057135944570762232829481370756359578518086990519993285655852781
            ],
            [
                4082367875863433681332203403145435568316851327593401208105741076214120093531,
                8495653923123431417604973247489272438418190587263600148770280649306958101930
            ]
        );
        vk.delta2 = Pairing.G2Point(
            [
                14490097679251466782729908221310338787052685235742702146790840110229251512910,
                18572769881017180108911446114938723104071438992686700335442326127157836228710
            ],
            [
                2551355731075780901873228263174084326781993047258513711965360126263187045214,
                2627191529930365787415519085019597542782238523522693962754639782053348524034
            ]
        );

        vk.IC[0] = Pairing.G1Point(
            8162824753046488689222844442336456542944980721212018996068677568539865847154,
            68336375415832493883025566755120742748798482990510659320020413671124263813
        );
        vk.IC[1] = Pairing.G1Point(
            13385354376895684738525372841721949351065825149323500998140479404598066177552,
            774000488261771704340470900939335588684487496344699019509475341379762029129
        );
        vk.IC[2] = Pairing.G1Point(
            6164665196748670741899752062374578501377210204524027951283497047174090107246,
            13351529164519819412353131530547733947982703129545003025403400316358274656788
        );
        vk.IC[3] = Pairing.G1Point(
            15104742904837652460462265915842022412444824796122190774339764905721700482560,
            4107383152149384422330091248298605663526641070546552713882465516327776703261
        );
        vk.IC[4] = Pairing.G1Point(
            18366901277020281062829142947726999221803528473888834382987301539056310388198,
            5333349927417288435079823170102412329053596039481494904019610845464451916013
        );
        vk.IC[5] = Pairing.G1Point(
            15144019168293260882890204437917061432607201193531878199588855851411671836990,
            9199962718805558689877339890748747456497983224902748783054063600302475187118
        );
        vk.IC[6] = Pairing.G1Point(
            12932412046190985001634799103668548554685531827299748994405196266069688995300,
            10707385832654340158097753876565803153424529579519847381719896096017984142855
        );
        vk.IC[7] = Pairing.G1Point(
            7873463149513870989676412812284917368468126532794981416350934761606567524843,
            10551626841273973297626743592761621143570000591808384598686077407904408493715
        );
        vk.IC[8] = Pairing.G1Point(
            16330309240770105190370301439547519340044479001915708112706983827982163460017,
            12081131625507604998280182669749391795983458657489782545040195538750651946124
        );
        vk.IC[9] = Pairing.G1Point(
            1486069644570530506797727349494718423674091557177309298286438544614346204559,
            19068542263969674830554434464897443431780973146631164161756955717308558112924
        );
        vk.IC[10] = Pairing.G1Point(
            18165196001774567964616955584189507656261513190472427896752550419384758966691,
            16796159367373466383825910380025416607566654235545375266211560712581123339182
        );
        vk.IC[11] = Pairing.G1Point(
            7702244265546664511114530563029335410706475541806258844500613119403482556550,
            8421490039868200700842742081280486017442501955214960965178629429859318139466
        );
        vk.IC[12] = Pairing.G1Point(
            21533168749956447567623820727022320889977785105217674533707964479939315421389,
            20990757469514606009942298510177311718926745465913790027983501547681486503793
        );
        vk.IC[13] = Pairing.G1Point(
            14086537948094970993757429932532766944637282946671958494213116659196031122003,
            7264628236066322634169129816756173866315886403389425586068884061261732012319
        );
        vk.IC[14] = Pairing.G1Point(
            4596643281792400208072100409066534448711054609025119398815662174178561603755,
            10470243072747854661455300802696788117003123410312327094696261791090027263451
        );
        vk.IC[15] = Pairing.G1Point(
            1377457640377164129625399203068204257242429546217779872826440508864115374445,
            17678473175209576079964179439632589902291156513769306617595279474099092742971
        );
        vk.IC[16] = Pairing.G1Point(
            6524534722990878809215629883913646854554254420034788282335076727082972137974,
            20710359632189449218857600301746089446929900309110260854400516032120292032109
        );
        vk.IC[17] = Pairing.G1Point(
            8775618449680312097927332900108214617465666059880169962714983692502761839447,
            7832901087032835041518349666739617867806873187999646585625950272745991884535
        );
        vk.IC[18] = Pairing.G1Point(
            15272125225443524116484621460793891471637998802569450292108324586772911739775,
            15100218088723873288253570050996356865732591286236923198056149054699499607708
        );
        vk.IC[19] = Pairing.G1Point(
            18549198365667742038316075418544371637005118777317512467423437225872443719168,
            646571828569074486074328737548468391333720883444913718205087199318933546895
        );
        vk.IC[20] = Pairing.G1Point(
            4941632999276623391926232158297217976910386854420196125268268665091751838450,
            4038152037297440755623963808450739736226866983969064111856714841509447530597
        );
        vk.IC[21] = Pairing.G1Point(
            16631203264272073726426971210200610614410225339638984617007677050270042928155,
            14160608480694819975906557237853520366530021350289053491755603175103499124127
        );
    }

    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(bytes memory proof, uint256[21] memory input) public view returns (bool) {
        uint256[8] memory p = abi.decode(proof, (uint256[8]));
        for (uint8 i = 0; i < p.length; i++) {
            // Make sure that each element in the proof is less than the prime q
            require(p[i] < PRIME_Q, "verifier-proof-element-gte-prime-q");
        }
        Pairing.G1Point memory proofA = Pairing.G1Point(p[0], p[1]);
        Pairing.G2Point memory proofB = Pairing.G2Point([p[2], p[3]], [p[4], p[5]]);
        Pairing.G1Point memory proofC = Pairing.G1Point(p[6], p[7]);

        VerifyingKey memory vk = verifyingKey();
        // Compute the linear combination vkX
        Pairing.G1Point memory vkX = vk.IC[0];
        for (uint256 i = 0; i < input.length; i++) {
            // Make sure that every input is less than the snark scalar field
            require(input[i] < SNARK_SCALAR_FIELD, "verifier-input-gte-snark-scalar-field");
            vkX = Pairing.plus(vkX, Pairing.scalarMul(vk.IC[i + 1], input[i]));
        }

        return Pairing.pairing(Pairing.negate(proofA), proofB, vk.alfa1, vk.beta2, vkX, vk.gamma2, proofC, vk.delta2);
    }
}
