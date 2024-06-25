export interface ApiResponse {
    uuid: string;
    mtID: string;
    zero: string;
    merkleRoot: string;
    hashSet: string[];
    proofs: JSONProof[];
    ipfsHash: string;
    txHash: string;
    status: string;
    timestamp: number;
  }

export interface JSONProof {
    hash: string;
    record: DepositEventJSONShort;
    proof: MerkleProofJson;
  }

export interface DepositEventJSONShort {
  txString: string;
  outputCommitment1: string;
  outputCommitment2: string;
  nullifierHash1: string;
  nullifierHash2: string;
  recordIndex: number;
  PublicAmount: string;
}

export interface MerkleProofJson {
  merkleTreeDepth: number;
  leaf: string;
  leadIndex: number;
  pathRoot: string;
  pathIndices: number[];
  pathPositions: string[];
  pathElements: string[];
}

export interface AssociationSetParams {
  chain: string, 
  contract: string, 
  hash_only?: string, 
  size_limit?: string, 
  pin_to_ipfs?: string
}