import axios, { AxiosResponse } from 'axios'
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

async function getAssociationSet({aspBaseURI, network, contractAddr, hashSet, setFilter}: aspParams) { 
    try {
        const response = await axios.request({
            method: 'post',
            maxBodyLength: Infinity,
            url: `${aspBaseURI}/inclusion?chain=${network}&contract=${contractAddr}`,
            headers: { 
                'Content-Type': 'application/json'
            },
            data : JSON.stringify({
                "hashSet": hashSet,
                "hashFilter": setFilter
                })
            })
        
        const resp: aspResp = response.data || [];
        const associationSet: AssociationSet = {
            ipfsHash: resp.ipfsHash,
            uuid: resp.uuid,
            mtID: resp.mtID,
            timestamp: resp.timestamp,
            merkleRoot: '0x' + resp.merkleRoot,
            merkleDepth: 0,
            zeroElement: '0x'+resp.zero,
            txRecordEvents: resp.proofs
            .map((x: aspProof) => {
              return {
                blockNumber: 0,
                transactionHash: x.record_data.txHash,
                index: x.record_data.recordIndex,
                inputNullifier1: x.record_data.nullifierHash1,
                inputNullifier2: x.record_data.nullifierHash2,
                outputCommitment1: x.record_data.outputCommitment1,
                outputCommitment2: x.record_data.outputCommitment2,
                publicAmount: '0x' + x.record_data.publicAmount
              } as TxRecordEvent
            })
        }

        if (associationSet.txRecordEvents.length > 0) {
            associationSet.merkleDepth = resp.proofs[0].merkle_proof.merkle_tree_max_depth
        }
        
        return associationSet   
    } catch(err){
        throw new Error(`Error fetching association set: ${err}`)
        return {} as AssociationSet
    }  
}
export { getAssociationSet }