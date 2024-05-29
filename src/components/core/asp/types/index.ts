import {TxRecordEvents, TxRecordEvent} from '@core/txRecord/types/events'

const ASP_UNION = 'UNION'
const ASP_INTERSECTION = 'INTERSECTION'

export type aspParams = {
    network: string;
    contractAddr: string;
    aspBaseURI: string;
    hashSet: string[];
    setFilter: string;
}

export type aspResp = {
    uuid: string;
    mtID: string;
    zero: string;
    merkleRoot: string;
    hashSet: string[];
    proofs: aspProof[];
    ipfsHash: string;
    txHash: string;
    timestamp: number;
  };
  
export type aspProof = {
    record_hash: string;
    record_data: aspRecordData;
    merkle_proof: aspMerkleProof;
};
  
export type aspRecordData = {
    txHash: string;
    outputCommitment1: string;
    outputCommitment2: string;
    nullifierHash1: string;
    nullifierHash2: string;
    recordIndex: number;
    publicAmount: string;
};
  
export type aspMerkleProof = {
    merkle_tree_max_depth: number;
    leaf: string;
    leaf_index: number;
    path_root: string;
    path_indices: number[];
    path_positions: number[];
    path_elements: string[];
};

export type AssociationSet = {
    ipfsHash: string;
    uuid: string;
    mtID: string;
    timestamp: number;
    merkleRoot: string;
    merkleDepth: number; 
    zeroElement: string;
    txRecordEvents: TxRecordEvents;

}
