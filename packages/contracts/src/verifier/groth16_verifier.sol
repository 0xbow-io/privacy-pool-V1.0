// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 10410751938891657734917241895643360365645791985653999572340371251135429366937;
    uint256 constant deltax2 = 20792442465854577594226987629067599003212353313262754484864225994559144106849;
    uint256 constant deltay1 = 3824594609943780316200416084774927874262537594513884921613043752483681197155;
    uint256 constant deltay2 = 21724101842909141788031634318095642981540563547388580281964883194714032585677;

    
    uint256 constant IC0x = 5574572724388159123387974628968311758262424634444045591211126094707689136653;
    uint256 constant IC0y = 13315499362411990760801003526361060022047105962641468283344670062496043013584;
    
    uint256 constant IC1x = 15974887201229528330939063981894219307065678688105407002555587695979029349964;
    uint256 constant IC1y = 13591202102620689470700699230877024129181134220700842942219055957147947719230;
    
    uint256 constant IC2x = 11094648345570338993486707863549225222381318137748058482560486398066264064635;
    uint256 constant IC2y = 4046790892960653021694101000668182281350500134748090200359047213855179938659;
    
    uint256 constant IC3x = 6147372895034137189680159430449960951952648984922807678643060350129283274812;
    uint256 constant IC3y = 12721837400173939785526664227690466904332420213245698651127247202596037249356;
    
    uint256 constant IC4x = 7643222740073146003884705239332711880523174495744315522602181881328677255946;
    uint256 constant IC4y = 11825809670805623428396269429332692103550802394280789352208952389412220749730;
    
    uint256 constant IC5x = 10152492136961839115580751898969953927775823449015980306806475212178303733710;
    uint256 constant IC5y = 15379490401285322289433787826558097639616496405949264446462542821184151955852;
    
    uint256 constant IC6x = 10638129583281327077118780378429852541168694542321620144500192716606245667914;
    uint256 constant IC6y = 8987452672933616845885417168693567086502981013510212940155950431748486374843;
    
    uint256 constant IC7x = 16221857033068412687234045400076705024106837058568388460142967539501412075327;
    uint256 constant IC7y = 6341703718147114050264765993089923669186067922955152080035165561389981348672;
    
    uint256 constant IC8x = 9406640367678342380178227634126106645959242820591721104030051225820265651137;
    uint256 constant IC8y = 6306229622666775678311462805592588741666525303566688819335671739186741519821;
    
    uint256 constant IC9x = 4514203995730735710371539171758919944641143306992314017847172148500742689200;
    uint256 constant IC9y = 4952589742756018228373391121222984612835799394324999853024649675004654060294;
    
    uint256 constant IC10x = 3698526216610685691449816528857230811918836007239507246737423184936937181711;
    uint256 constant IC10y = 6564948119157812016967069822311678485509727079826642995178867423685646862600;
    
    uint256 constant IC11x = 950539346074658025481589779864939574107061777565415353735912821995711016593;
    uint256 constant IC11y = 2087411256372602578884817557188385053366594017580375493770655662511862776972;
    
    uint256 constant IC12x = 18232248427235270183774275472952942767219858082742374004521976848313788384813;
    uint256 constant IC12y = 2928375476764251392993579049405494136953567249935229413821374714126527786418;
    
    uint256 constant IC13x = 9420119811951190430435878206413488340922605137462043903846067854132156728343;
    uint256 constant IC13y = 12080633050520926463506845651907381498693032344973398108648895224947379454531;
    
    uint256 constant IC14x = 3226305502100395566146160340228912538647428271029825472690746227516087171885;
    uint256 constant IC14y = 2709221507240569044130693039957964249794054545941275369400878732579333840144;
    
    uint256 constant IC15x = 7630969021378959190363913879479599939534071931634944671801724747159545392659;
    uint256 constant IC15y = 10335574728487076901919754083451129863677691660001883948207078321188228110586;
    
    uint256 constant IC16x = 20504460334564103182836492037910872574592742098512342576593941190331433515049;
    uint256 constant IC16y = 7231911918741732920766898442999597879474632712020973529911926155659505686192;
    
    uint256 constant IC17x = 20082770973795721138562319962607195300062524178418062263543250342243165796108;
    uint256 constant IC17y = 12299974886594249105937449667707007867187916412061268254385427547420093336178;
    
    uint256 constant IC18x = 300041403469928214887490615086501465435217397987481434576197472558312402195;
    uint256 constant IC18y = 19419440780092403550369499247552791700581656157140664739749324944143342494087;
    
    uint256 constant IC19x = 21792258696039341790514816640256387731526955055903573683067060598735788967530;
    uint256 constant IC19y = 4916231579424691029023609238209652007948695286651522822324561337391128872200;
    
    uint256 constant IC20x = 20467454210237593615265327603537406685201259900624380362086637912357890060429;
    uint256 constant IC20y = 2354437030850948924649289027150977032000753136150856102527676773021111642370;
    
    uint256 constant IC21x = 3739085726540258481284487867954864239520133718803782329515765477300134204815;
    uint256 constant IC21y = 4983233419813882677889009915225996406646174175979979566430611550869070220604;
    
    uint256 constant IC22x = 8983969352642932852871783783545396187713702690115713382864683543806512951487;
    uint256 constant IC22y = 18547003936115812403686936927059803716115012197272143580478064164084973153497;
    
    uint256 constant IC23x = 947399428404081019338908599192726081259660113513492899142056353648944296000;
    uint256 constant IC23y = 8806459313318153660796733723893781089264899680859273438806253084524434776108;
    
    uint256 constant IC24x = 14764610552057301143793815351362090517805002488028053010447041382853275065411;
    uint256 constant IC24y = 13691953015587768041510322086421518454419810833801315849305775992662276125226;
    
    uint256 constant IC25x = 8630039324730796271527116227762014493995189849984744183983730005578739976603;
    uint256 constant IC25y = 18878433671214758169893327792183145294934260587474319900779252846653444989506;
    
    uint256 constant IC26x = 11155308689231072963542640217215214304888397616546146310050946909608178724692;
    uint256 constant IC26y = 7364910924621644027337151074857719852342667712126300691198026499290021625377;
    
    uint256 constant IC27x = 5677029497341719763839743200960545121114923535115913841133561547039453032629;
    uint256 constant IC27y = 14699504184243936646768182768487684047081217566306476872896650391018814144112;
    
    uint256 constant IC28x = 7741801233565922619702584725417132302870069959669749170821702336322094653048;
    uint256 constant IC28y = 16448454996449530330746333914305543130422642353675618717802042270520310496608;
    
    uint256 constant IC29x = 5528478849130282698380385764640703731675214683615547685767865128057611665419;
    uint256 constant IC29y = 13031986163259729101896048959783727042392934679890922903890001763390571628620;
    
    uint256 constant IC30x = 6549780469700002018943195797651583660390686006746216061408153109452616952489;
    uint256 constant IC30y = 8906130390113070657494979588927920870055821113632602073436090338798713104540;
    
    uint256 constant IC31x = 11334252706173641187671577570326062231659824912515528191814591526107006511866;
    uint256 constant IC31y = 14072772397507968037542860949471862212043648678581850146271047169272346296717;
    
    uint256 constant IC32x = 13348793084151811162914222860953171257685769790408837000621534984900085221632;
    uint256 constant IC32y = 5772239583934887775338242892864491249619665140357236999383652780148455892545;
    
    uint256 constant IC33x = 17992154150007867817797480043490667108596130420652496626428543591457453622859;
    uint256 constant IC33y = 6389800997920580878155636792319238018350870222347610673586384152938076154587;
    
    uint256 constant IC34x = 909568160222359704130015495242099946655676731664779241920535815678787593677;
    uint256 constant IC34y = 5616680908381044265355436592192942591558923227947286894230824919579220329920;
    
    uint256 constant IC35x = 19585925391017369144448400845971974836714570393211687450647891641793642786152;
    uint256 constant IC35y = 10359206112325689060442636644269316267053187736469600971520954286069897059039;
    
    uint256 constant IC36x = 20177814296912050230532974366540163611147804450950069242561582861201675911578;
    uint256 constant IC36y = 7552814045030074902100964235808271408561707117022107215635166405032341133030;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[36] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
