import type { ApiResponse, AssociationSetParams } from "@privacy-pool-v1/core-ts/asp-provider/interfaces/api";
import axios from 'axios';

export const buildURL = (type: string, params: AssociationSetParams): string => `https://api.0xbow.io/api/v1/${type}?chain=${params.chain}&contract=${params.contract}&hash_only=${params.hash_only ?? "0xdefault"}&size_limit=${params.size_limit ?? "default"}&pin_to_ipfs=${params.pin_to_ipfs ?? "default"}`;

export const getConfig = (type: string, params: AssociationSetParams) => {return {
  method: "post",
  maxBodyLength: Infinity,
  url: buildURL(type, params),
  headers: {
    "Content-Type": "application/json"
  },
  data:  {
    hashSet: [],
    hashFilter: ""
  }
}};


export async function GetAssociationSet(type: 'inclusion' | 'exclusion', params: AssociationSetParams): Promise<ApiResponse> {
  try {
    const response = await axios.request(getConfig(type, params));
    return response.data;
  } catch (error) {
    const err = error as Error;
    console.error('Error making external API request:', err.message);
    throw new Error('Error making external API request');
  }
}



