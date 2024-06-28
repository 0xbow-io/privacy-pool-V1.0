import type { ApiResponse, AssociationSetParams } from "@privacy-pool-v1/core-ts/asp-provider/interfaces/api";
import {baseUrl, apiUrl} from "./../constants"//"@privacy-pool-v1/core-ts/asp-provider/constants/api";
import axios from 'axios';

export const buildURL = (baseUrl: string, apiUrl: string, type: string, params: AssociationSetParams): string => {
  const queryParams = new URLSearchParams();
  
  queryParams.append('chain', params.chain);
  queryParams.append('contract', params.contract);
  
  if (params.hash_only) queryParams.append('hash_only', params.hash_only);
  if (params.size_limit) queryParams.append('size_limit', params.size_limit);
  if (params.pin_to_ipfs) queryParams.append('pin_to_ipfs', params.pin_to_ipfs);

  return `${baseUrl}${apiUrl}${type}?${queryParams.toString()}`;
};

export const getConfig = (baseUrl: string, apiUrl: string, type: string, params: AssociationSetParams) => {return {
  method: "post",
  maxBodyLength: Infinity,
  url: buildURL(baseUrl, apiUrl, type, params),
  headers: {
    "Content-Type": "application/json"
  },
  data:  {
    hashSet: [],
    hashFilter: ""
  }
}};

export function validateParams(params: AssociationSetParams): void {
  if (typeof params.chain !== 'string') {
    throw new Error('Invalid type for chain');
  }
  if (typeof params.contract !== 'string') {
    throw new Error('Invalid type for contract');
  }
  if (params.hash_only && typeof params.hash_only !== 'string') {
    throw new Error('Invalid type for hash_only');
  }
  if (params.size_limit && typeof params.size_limit !== 'string') {
    throw new Error('Invalid type for size_limit');
  }
  if (params.pin_to_ipfs && typeof params.pin_to_ipfs !== 'string') {
    throw new Error('Invalid type for pin_to_ipfs');
  }
}

export async function GetAssociationSet(type: 'inclusion' | 'exclusion', params: AssociationSetParams): Promise<ApiResponse> {
  try {

    await validateParams(params);
    const response = await axios.request(getConfig(baseUrl, apiUrl, type, params));
    return response.data;

  } catch (error) {

    const err = error as Error;
    console.error('Error making external API request:', err.message);
    throw new Error('Error making external API request');

  }
}



