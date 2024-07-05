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
    uint256 constant deltax1 = 10288663283583315954926009785826982548388254170788977189699841892310599816665;
    uint256 constant deltax2 = 8580183526105673073597448740023638369868604867093511578804897461186124997639;
    uint256 constant deltay1 = 17640860968280171395118107926880530999862139002810085079917784764513584873960;
    uint256 constant deltay2 = 2980137451527127982755911028532052283873747240428633807215516116255908359624;

    
    uint256 constant IC0x = 18979685351967492511119212246077134419019493880448154672476100437294710801070;
    uint256 constant IC0y = 21878841016964088642461968388476373337468631056720385225600239678351225809185;
    
    uint256 constant IC1x = 7008974658224945817155105734034409656278444522891399974235392231918396170011;
    uint256 constant IC1y = 796101645865090410052672667820106270388898277011913903484140893752632659623;
    
    uint256 constant IC2x = 15428932679244928985170845563475435453154513838420890728659410307191148420792;
    uint256 constant IC2y = 19923188831504905413826229846232900853998110667127804218118083047470106012769;
    
    uint256 constant IC3x = 7157120973086395324486193219476659491196031689613804242978521558573277495665;
    uint256 constant IC3y = 3354061174279589770174285324484940804578958207769214195416328673020382347543;
    
    uint256 constant IC4x = 798133622142818139533741905138632463907218961571571089368478818981937211504;
    uint256 constant IC4y = 6954754990156666681190562685568211134361363975212223636478704382784924432657;
    
    uint256 constant IC5x = 1426575989343561946828822435347253275493739904175860209681418890602676910967;
    uint256 constant IC5y = 8095256442111757585502599691147132801363441931588785753717676131873302802958;
    
    uint256 constant IC6x = 15212112345480593495078139606140701652626343022923202246216324034302951688214;
    uint256 constant IC6y = 17167771914193404137838472399268442628531624839516730144824172002961436250992;
    
    uint256 constant IC7x = 5461753017847586651143827872136517149410313858076807001740195113486100217057;
    uint256 constant IC7y = 7666930315660193019668986607912726289758121345524421853814298860447699151995;
    
    uint256 constant IC8x = 13081798924608344990754039763177387624072983684148172547829601686047225452922;
    uint256 constant IC8y = 895059820450978616809377341036809299134283552553854140782130169333743720444;
    
    uint256 constant IC9x = 6338177816723398131745883596362682571386349527120285524473820785081616804475;
    uint256 constant IC9y = 12917063961574104769829802130480602461806244565550524997422217510360770418667;
    
    uint256 constant IC10x = 9457564390053257443422329475299509704279286539112504669339157309041466343495;
    uint256 constant IC10y = 14411673036736198677384602364801764112608058006603762485628572432084151930656;
    
    uint256 constant IC11x = 2944033339773978539681449628930810444778919652322468484076775296505031263911;
    uint256 constant IC11y = 2719827735582334699440764897592396234274566040167165847240342198065228681309;
    
    uint256 constant IC12x = 20952798971115235537287958596890159674523110440644540796664689257177113179481;
    uint256 constant IC12y = 16417940927052500581132767914334681537964346661223536072042752273872381644691;
    
    uint256 constant IC13x = 11131926698345419851158469975457834666562451247918894644355692547314621010581;
    uint256 constant IC13y = 14583408996635930886829977147766165225331818638260354800970476041091027521175;
    
    uint256 constant IC14x = 4416322441304608917988757144094037099154537507455644292857419891132142469125;
    uint256 constant IC14y = 12315026907245541770000340037436923874733660279390075140236621470367473276716;
    
    uint256 constant IC15x = 14242299821243066293501561529076374633537803260711808118926694724319618208574;
    uint256 constant IC15y = 9621564721065552852641225550438022481733555767963088424211203449946909408077;
    
    uint256 constant IC16x = 2873023480745209740930178253386324948329967400525202110725736681911918706364;
    uint256 constant IC16y = 12530816490763542927751924545521026741371947389838792616865966144160395647105;
    
    uint256 constant IC17x = 7263345308137069304021507119011544641113379438738224488143151622369258357219;
    uint256 constant IC17y = 2265546169569015834915929250275095157562776951881785629291002015228796264278;
    
    uint256 constant IC18x = 7327829159636224439504280111143098594745119093846761143989478374482399494168;
    uint256 constant IC18y = 12816073626888399625107495737564689325580772018415003789395788156388723748419;
    
    uint256 constant IC19x = 8573492345288826944603578007087186796963871929889369845925273797286088764500;
    uint256 constant IC19y = 13114730417891479853093258139869093135696724754127892094219725932868657459467;
    
    uint256 constant IC20x = 4056294962473668708041647960447820152882127456545478439037006982240628835389;
    uint256 constant IC20y = 21631469303923254764409909380524326470550639832970043157701613995499774432318;
    
    uint256 constant IC21x = 15349283825716617962565688227716584994901869790422073761683786944618382749887;
    uint256 constant IC21y = 7004396473889304109617456085439235690245193760481903791627608183550236606964;
    
    uint256 constant IC22x = 16013386099332821283975825813219391741588901440605458260687648513476368409518;
    uint256 constant IC22y = 18977826218180820498507718699041024009838204204435245196582817535713158646758;
    
    uint256 constant IC23x = 8416650259094135606757038236546387793829261496847172148290017090490205458522;
    uint256 constant IC23y = 3863145225576435104291708163064420001900252417871365582001772333632748194178;
    
    uint256 constant IC24x = 21731858278095812794535707405028140980052425022158723559685292958286001275937;
    uint256 constant IC24y = 760432781830604454956221807769207336249803517642176793845737634376702776761;
    
    uint256 constant IC25x = 6401637455019596068705155763208544810591777975148178261496382821710507206079;
    uint256 constant IC25y = 8688844820992134424403121329017220053019984100819337338250956042399549475640;
    
    uint256 constant IC26x = 13735691113200164225259195705916258926068781455893252864506077717902079645979;
    uint256 constant IC26y = 8422914375325343760811124906069786928042320210761446975390662035460739020596;
    
    uint256 constant IC27x = 8592960622355378164187147746892885869915184489677141728981261161767670636848;
    uint256 constant IC27y = 17814672483570581815209125154566006108607379778906226992166632635095429477974;
    
    uint256 constant IC28x = 19635225538240190913050179877735297717881416839487578190279289371178816234388;
    uint256 constant IC28y = 10623671002318889551410825381995957073793036377743160509731527304831252068741;
    
    uint256 constant IC29x = 4494602677930217877512697875409317150480204711777287321986234546727676658904;
    uint256 constant IC29y = 12838758099166030880760085966044782088077414596331483995724010242505230371692;
    
    uint256 constant IC30x = 11085303411825750644468956082934764763328178132685146048110835395763932696976;
    uint256 constant IC30y = 16059847820885944220291115636140869486231479967588111440036655544192617003091;
    
    uint256 constant IC31x = 6477591843017380054332400368204737386546060127969907329715575186462873581283;
    uint256 constant IC31y = 11868082033809582462763148526053030070879099037511272759493618581477119418964;
    
    uint256 constant IC32x = 15480697493784009565680768005751282646810922426487545811151544986726788792872;
    uint256 constant IC32y = 12913026267866759866998961929098538283555854837024485935694047232063109751998;
    
    uint256 constant IC33x = 17356619161753667576204541575898375877409728191132672277454107431999097544198;
    uint256 constant IC33y = 20004889623298474564906116399891881720015952571778590678182983830600511893624;
    
    uint256 constant IC34x = 19078855882549901367421048660859024829397922233045432325187561117532783213965;
    uint256 constant IC34y = 2474038549623282494386242837906944054874893842839557008142981107056965471046;
    
    uint256 constant IC35x = 217492333628992428342926300280305304601120513298740798428412630302602352493;
    uint256 constant IC35y = 19483589973627122339074249831558210462905814532227456999474066914148271647000;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[35] calldata _pubSignals) public view returns (bool) {
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
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
