import { IsString } from 'class-validator';
import 'reflect-metadata';

export interface getSetBody {
    HashSet: string[];
    HashFilter: string;
}

export class getSetParams {
    @IsString()
    eventId: string;
  
    @IsString()
    eventHash: string;
  
    @IsString()
    type: string;
  
    @IsString()
    chain: string;

	@IsString()
	contract: string;

	@IsString()
	mtID: string;

	@IsString()
	merkleRoot: string;
  
    @IsString()
    actor: string;
  
    @IsString()
    sizeLimit: string;
  
    @IsString()
    rootOnly: string;

	@IsString()
	hashOnly: string;

	@IsString()
	random: string;

	@IsString()
	needSort: string;

	@IsString()
	pushToIPFS: string;

	//initialized the variables otherwise it will throw an error
	constructor() {
		this.eventId = '';
		this.eventHash = '';
		this.type = '';
		this.chain = '';
		this.contract = '';
		this.mtID = '';
		this.merkleRoot = '';
		this.actor = '';
		this.sizeLimit = '';
		this.rootOnly = '';
		this.hashOnly = '';
		this.random = '';
		this.needSort = '';
		this.pushToIPFS = '';
	  }
  
    getChainID(): number {
      switch (this.chain.toLowerCase()) {
        case 'sepolia':
          return ChainIDs.Sepolia;
        case 'goerli':
          return ChainIDs.Goerli;
        default:
          return ChainIDs.Mainnet;
      }
    }
	//might need to set as an interface
	IPFS(): boolean {
		return this.pushToIPFS === 'true';
	}

	getSetType(): number {
		switch (this.type) {
			case 'inclusion':
				return 1;
			case 'exclusion':
				return 2;
			default:
				return 1;
		}
	}

	getContractAddr(): string {
		//check if the address is a hex format
		
	}
}

export const ChainIDs = {
Sepolia: 11155111,
Goerli: 5,
Mainnet: 1,
};

  


/* 
package main

import (
	"encoding/hex"
	"fmt"
	"math/big"
	"strconv"
	"strings"

	ass "github.com/0xBow-io/asp-api/pkg/association"
	fMerkleTree "github.com/0xbow-io/fixed-merkle-tree"
	"github.com/ethereum/go-ethereum/common"
)

type GetSetBody struct {
	HashSet    []string `json:"hashSet"`
	HashFilter string   `json:"hashFilter"`
}

type GetSetParams struct {
	EventId   string `form:"event_id"`
	EventHash string `form:"event_hash"`
	Type      string `form:"type"`

	Chain      string `form:"chain"`
	Contract   string `form:"contract"`
	MtID       string `form:"mt_id"`
	MerkleRoot string `form:"merkle_root"`

	Actor string `form:"actor"`

	SizeLimit  string `form:"size_limit"`
	RootOnly   string `form:"root_only"`
	HashOnly   string `form:"hash_only"`
	Random     string `form:"random"`
	NeedSort   string `form:"needSort"`
	PushToIPFS string `form:"pin_to_ipfs"`
}

func (p *GetSetParams) GetChainID() int {
	switch strings.ToLower(p.Chain) {
	case "sepolia":
		return ass.SepoliaChainID
	case "goerli":
		return ass.GoerliChainID
	default:
		return ass.MainnetChainID
	}
}

func (p *GetSetParams) IPFS() bool {
	return p.PushToIPFS == "true"
}

func (p *GetSetParams) GetSetType() int {
	switch p.Type {
	case "inclusion":
		return ass.InclusionID
	case "exclusion":
		return ass.ExclusionID
	default:
		return ass.InclusionID
	}
}

func (p *GetSetParams) GetContractAddr() common.Address {
	// check that contract is hex format
	if common.IsHexAddress(p.Contract) {
		return common.HexToAddress(p.Contract)
	}
	return common.HexToAddress("0x1")
}

func (p *GetSetParams) GetMtID(id int) (fMerkleTree.Element, error) {
	// if there is a specified MtID
	if len(p.MtID) != 0 {
		return hex.DecodeString(p.MtID)
	}
	// default to inclusion
	treeType := ass.InclusionID
	if id == ass.ExclusionID {
		treeType = ass.ExclusionID
	}

	return ass.GenMtID(
		int64(p.GetChainID()),
		p.GetContractAddr(),
		int64(treeType))
}

func (params *GetSetParams) GetFilter(body *GetSetBody) (f *ass.Filter) {

	f = &ass.Filter{
		Actor:     params.Actor,
		HashSet:   body.HashSet,
		RootOnly:  params.RootOnly == "true",
		RandomSet: params.Random == "true",
		HashOnly:  params.HashOnly == "true",
		NeedSort:  params.NeedSort == "true",
		SizeLimit: uint64(100),
	}

	u, err := strconv.ParseUint(params.SizeLimit, 0, 64)
	if err == nil {
		f.SizeLimit = u
	}

	switch strings.ToLower(body.HashFilter) {
	case "except":
		f.Combination = "EXCEPT"
	case "intersect":
		f.Combination = "INTERSECT"
	case "union":
		f.Combination = "UNION"
	default:
		f.Combination = ""

	}
	// no hash specified but was given an Event Hash on the params
	if len(body.HashSet) == 0 && params.EventHash != "" {
		f.HashSet = []string{params.EventHash}
		f.Combination = "UNION"
	}

	return f
}

func (params *GetSetParams) GetEventId() uint64 {

	if len(params.EventId) == 0 {
		return 0
	}
	id, err := strconv.ParseUint(params.EventId, 0, 64)
	if err != nil {
		return 0
	}
	return id
}

// MerkleRootInt returns the merkle root as a big.Int, it may be nil
// if merkle root is not provided
func (params *GetSetParams) MerkleRootInt() (*big.Int, error) {
	var root *big.Int
	if len(params.MerkleRoot) == 0 {
		return nil, nil
	}
	root = new(big.Int)
	_, ok := root.SetString(params.MerkleRoot, 0)
	if !ok {
		return nil, fmt.Errorf("merkle root must be a valid hex or dec string")
	}
	return root, nil
}

func (params *GetSetParams) MerkleRootElement() (fMerkleTree.Element, error) {
	if len(params.MerkleRoot) == 0 {
		return nil, nil
	}
	return hex.DecodeString(params.MerkleRoot)
}

type KYTParams struct {
	DepositID  uint64 `form:"deposit_id"`
	ExternalID string `form:"external_id"`
	Vendor     string `form:"vendor"`
}

type GetKYTParams struct {
	KYTParams
}

type GetIPFSParams struct {
	GetSetParams
}
*/