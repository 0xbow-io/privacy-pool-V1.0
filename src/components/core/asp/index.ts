export * from './types'
import axios, { AxiosResponse } from 'axios'
import {TxRecordEvents, TxRecordEvent} from '@core/txRecord/types/events'
import { aspParams, aspResp, AssociationSet, aspProof } from './types'


export type ASPSpec = {
    name: string;
    url: string;
    aspBaseURI: string;
    commitFee: number;
    releaseFee: number;
  };

export const ASPList: Map<string, ASPSpec> = new Map<string, ASPSpec>([
    [
        '0xBow.io',
        {
            name: '0xBow.io',
            url: 'https://0xbow.io',
            aspBaseURI: 'api.0xbow.io/api/v1',
            commitFee: 0.01,
            releaseFee: 0.00
        },
      ],
    ]);

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