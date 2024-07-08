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
    uint256 constant deltax1 = 2079341554291198462720782008018613809942236850532057200169130171223490941342;
    uint256 constant deltax2 = 4766643617888899981112347353791630754481521719910287900518914034970124346141;
    uint256 constant deltay1 = 9527266030605908143380786214190742547447608435903310727902452056670350560496;
    uint256 constant deltay2 = 11286704644080529410121174449534189083127438812924746304633699226020780933874;

    
    uint256 constant IC0x = 7291363509204273717723657624464623629768883442409594335063723431707274101529;
    uint256 constant IC0y = 9775630076883148164390140987589636911837924728109099465012416859579123056037;
    
    uint256 constant IC1x = 7292659060914819784019350639824819581389121479126335381774076023659382875408;
    uint256 constant IC1y = 20817136837696205616007575689305104424878591622631059823729549876223489849277;
    
    uint256 constant IC2x = 17149791822823157653592080211264313101360926115747225287865289961387476632584;
    uint256 constant IC2y = 10235725919687439954585191876955376467325372439852367398584982857443189490290;
    
    uint256 constant IC3x = 19094355441749552940154059018453886212735539264085315265929417583664561314166;
    uint256 constant IC3y = 4580332020931124735459485616244969555891715837908683622542427461032867696987;
    
    uint256 constant IC4x = 9508322079225586861472948792289463429649026503592854073139770271858024479567;
    uint256 constant IC4y = 10119690938256923333608985458446874358781368320562651397784722746875129338163;
    
    uint256 constant IC5x = 13657908783519657272430129112022620885780198518679838196819376899545076945191;
    uint256 constant IC5y = 20884680797880844113843757955378356304724603534774425920342183714960062790877;
    
    uint256 constant IC6x = 18724307780626876926379412838254111819869353327574362178311704875182590823901;
    uint256 constant IC6y = 1899754323488125470371056449681160742267237456160339461095642385230563958053;
    
    uint256 constant IC7x = 20564689182299252476016316371503739136217386454027784910735370118291461739622;
    uint256 constant IC7y = 8866930473461014586359934285667668765222358617581410775702458256518573204823;
    
    uint256 constant IC8x = 15029740813653144281917321392353905649311350640565724707970286129453582884713;
    uint256 constant IC8y = 13076723727819828162073491555911165244427899625248950388684498539837640576703;
    
    uint256 constant IC9x = 20831303275433932349625415202907782646608411082688453914526125913518932447595;
    uint256 constant IC9y = 5543294964147651819831814414153939661596697560839357644847379359728529933282;
    
    uint256 constant IC10x = 18433092545397062221010195601372459182522463580598075683685016022734273782740;
    uint256 constant IC10y = 16839867206186155263647382579773185328231848298622027206021568305793704154251;
    
    uint256 constant IC11x = 10052655395334400634267913811645453756953720539514837052251630984887679118370;
    uint256 constant IC11y = 15795825681147563369003550661628688836383003659680864253188714124466964454052;
    
    uint256 constant IC12x = 8886631357703951715942456239910174266324430471637099376821125364468280537074;
    uint256 constant IC12y = 17845532028033729928663715915524527801924456871662594665531181691920276558629;
    
    uint256 constant IC13x = 16211034273733136915778195854742429494276460089274612642530890139019701758970;
    uint256 constant IC13y = 11353151957076537039945396815937022481610218172501971300768263925273723062125;
    
    uint256 constant IC14x = 866093055859719424014611210691532502791987877681807658244238973081376388351;
    uint256 constant IC14y = 8685009184787047926079677678991888278295546019211013318346762269634928271101;
    
    uint256 constant IC15x = 13434856683925794310193832683228487892928048276371566486742476248491086501643;
    uint256 constant IC15y = 967140288294384952597899733419699080536267593052354756673034942402938565553;
    
    uint256 constant IC16x = 15070357890683716087446364858458923162184566155894407284733031882547092730608;
    uint256 constant IC16y = 13887668856099148403076128433318126406971824714934468727428312989861619486556;
    
    uint256 constant IC17x = 11906636711351007119990210956708042695450406691116961980570738816272600142677;
    uint256 constant IC17y = 4459007855372962195935111539377344789371525708880645983792512413401899481666;
    
    uint256 constant IC18x = 1222350766350766284103502939715045395916291886651670282221736789321600900757;
    uint256 constant IC18y = 7011307097175870860100946575491393572935017149810430277973471699360787865004;
    
    uint256 constant IC19x = 1271717154688509537486883493844118160076777484629982572624437798334499062457;
    uint256 constant IC19y = 1203113594308836507869405934268258193605596790329029390988060840922046855085;
    
    uint256 constant IC20x = 2770268845502414761990640118688218627114390192095511490566291667889295755100;
    uint256 constant IC20y = 5579329678469699874036477284547517978189279529325612890155434854165211979979;
    
    uint256 constant IC21x = 4217729026082479336028251802140830136468433028579866208432025619671422898003;
    uint256 constant IC21y = 4094371565520356223170043144343488554519830096750286548026661660137809615061;
    
    uint256 constant IC22x = 18175251116534308372358487211884947614029564838621059445654962289942305456356;
    uint256 constant IC22y = 16292195792362464779736963619735306520418731409698536365285868704890760762258;
    
    uint256 constant IC23x = 16877778382256811332889406835696219543101790508003177781590237927211926909473;
    uint256 constant IC23y = 20506222625969764260864959504601717207147013603171378672225689002477067402033;
    
    uint256 constant IC24x = 9398180242661487865852297252756195773334513565303291626496991341678434927492;
    uint256 constant IC24y = 3225961432822007820338791486958633524303261709608452920961987094109064371405;
    
    uint256 constant IC25x = 821686781444496645326254070343499033211609722709467838495213367314060121308;
    uint256 constant IC25y = 4839774060924264408828839367217402864083859039326521137744308825004269197718;
    
    uint256 constant IC26x = 20316128027395081017975511400116980202163138891764176220131843140983604136671;
    uint256 constant IC26y = 16954450511206448020326070167876005011720549836517816835385260901911019046116;
    
    uint256 constant IC27x = 16888732088983339394653587007715858830303041432581187501624761930382838160329;
    uint256 constant IC27y = 12977661606957252087934903580388000870086862611080806826979852655766178109099;
    
    uint256 constant IC28x = 18793821733651402061197798661388123174363009847721264618049577663082787374559;
    uint256 constant IC28y = 2885945438491107762337630237374882555882257701063544355658666628780160492079;
    
    uint256 constant IC29x = 5968797986097590747653785425892808306184689548470093950406103552792277357465;
    uint256 constant IC29y = 20510068704380731018985970352082539974609114275238929849584612838870381437202;
    
    uint256 constant IC30x = 3641648319539794421984678743310727768457478064172059946671236114199741159928;
    uint256 constant IC30y = 2926108298874026455761085908134320200211296402286525792759628153691227935169;
    
    uint256 constant IC31x = 14114431779002608542671485714095008474056514057383146392620356681057792067341;
    uint256 constant IC31y = 18508207177302390108802218368757870994627974659812366025831376895037749264958;
    
    uint256 constant IC32x = 11541560765704365108497611540181167159697495053222821933619849572526161649284;
    uint256 constant IC32y = 18108444948407803034394952197755115127157281681039413670919216884380509982858;
    
    uint256 constant IC33x = 7590153711883747335842739946389812012002138659113725190015046866136913686928;
    uint256 constant IC33y = 1363362605298494195739271925638851572582397253252925649368005584666924497452;
    
    uint256 constant IC34x = 1060650203025825472261397424706956178703867274423803404560704610091592295604;
    uint256 constant IC34y = 19414061202716118666829972302687377150788586561439800359590021579940088879694;
    
    uint256 constant IC35x = 20777044716065616816929324065868789216729329717615381259504770931323846461438;
    uint256 constant IC35y = 1998939350269882675161319803293268505867994981607957332379075461839021082278;
    
    uint256 constant IC36x = 395568005038210690842643445210372278455802419419653418283455957332322611700;
    uint256 constant IC36y = 7985011844049716785961330931675107169624629114480222498537502385815568878650;
    
 
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
