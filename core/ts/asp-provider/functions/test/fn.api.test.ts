import { expect, test, describe, beforeEach, afterEach, it , jest } from "@jest/globals"
import { GetAssociationSet, buildURL, getConfig } from "@privacy-pool-v1/core-ts/asp-provider/functions/api"
import type { ApiResponse, AssociationSetParams } from "@privacy-pool-v1/core-ts/asp-provider/interfaces/api";
import {baseUrl, apiUrl} from "@privacy-pool-v1/core-ts/asp-provider/constants/api";
import axios from 'axios';

//mock successful response 
const mockData: ApiResponse = {
    uuid: "uuid",
    mtID: "mtID",
    zero: "zero",
    merkleRoot: "0x123",
    hashSet: ['test-hash1', 'test-hash2'],
    proofs: [],
    ipfsHash: 'test-ipfsHash',
    txHash: 'test-txHash',
    status: 'SUCCESS',
    timestamp: 1234567890
}

//mock valid params
const mockParams: AssociationSetParams = {
    chain: "sepolia",
    contract: "0xb0w",
    hash_only: "true",
    size_limit: "20",
    pin_to_ipfs: "false"
}

//mock axios request
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.request.mockResolvedValue({ data: mockData });


describe("Test GetAssociationSet", () => {

    it('should successfully return a response if parameter types are correct', async () =>{
        const type = "exclusion";
        const result = await GetAssociationSet(type, mockParams);
        expect(result).toEqual(mockData);
    });

    it('validates request structure for exclusion set', async () => {

        const type = "exclusion";

        const result = await GetAssociationSet(type, mockParams);
        expect(result).toEqual(mockData);

        const request = mockedAxios.request.mock.calls[0][0];
        //tests for proper url structure
        expect(request.url).toBe(`${baseUrl}${apiUrl}${type}?chain=${mockParams.chain}&contract=${mockParams.contract}&hash_only=${mockParams.hash_only}&size_limit=${mockParams.size_limit}&pin_to_ipfs=${mockParams.pin_to_ipfs}`)
        //tests for accurate header data
        expect(request.headers).toBeDefined(); //this was required as an error popped up for headers being undefined
        if (request.headers) {
        expect(request.headers['Content-Type']).toBe('application/json');
        }
        //tests for accurate data data
        expect(request.data).toEqual({
        hashSet: [],
        hashFilter: '',
        });

    });

    it('validates request structure for inclusion set', async () => {

        const type = "inclusion";

        const result = await GetAssociationSet(type, mockParams);
        expect(result).toEqual(mockData);

        const request = mockedAxios.request.mock.calls[0][0];
        //tests for proper url structure
        expect(request.url).toBe(`${baseUrl}${apiUrl}${type}?chain=${mockParams.chain}&contract=${mockParams.contract}&hash_only=${mockParams.hash_only}&size_limit=${mockParams.size_limit}&pin_to_ipfs=${mockParams.pin_to_ipfs}`)
        //tests for accurate header data
        expect(request.headers).toBeDefined(); //this was required as an error popped up for request.headers being undefined
        if (request.headers) {
        expect(request.headers['Content-Type']).toBe('application/json');
        }
        //tests for accurate data data
        expect(request.data).toEqual({
        hashSet: [],
        hashFilter: '',
        });

    });

    
    it('should throw an error for an API failure', async () => {
        //Simulate API failure, immediately rejects the promise with an Error
        mockedAxios.request.mockRejectedValueOnce(new Error('Network Error'));

        const type = 'exclusion';

        await expect(GetAssociationSet(type, mockParams)).rejects.toThrow('Error making external API request');
    });

    it('should handle missing optional parameters for the inclusion set', async () => {
        const type = 'inclusion';
        const params: AssociationSetParams = {
            chain: 'ethereum',
            contract: '0x123'
        }
        //call the function and assert the result
        const result = await GetAssociationSet(type, params);
        expect(result).toEqual(mockData);

        //gather request arguements that were sent to the mock
        const request = mockedAxios.request.mock.calls[0][0];
        expect(request.url).toBe(`${baseUrl}${apiUrl}${type}?chain=${params.chain}&contract=${params.contract}&hash_only=""&size_limit=""&pin_to_ipfs=""`)
    });

    it('should handle missing optional parameters for the exclusion set', async () => {
        const type = 'exclusion';
        const params: AssociationSetParams = {
            chain: 'ethereum',
            contract: '0x123'
        }
        //call the function and assert the result
        const result = await GetAssociationSet(type, params);
        expect(result).toEqual(mockData);

        //gather request arguements that were sent to the mock
        const request = mockedAxios.request.mock.calls[0][0];
        expect(request.url).toBe(`${baseUrl}${apiUrl}${type}?chain=${params.chain}&contract=${params.contract}&hash_only=""&size_limit=""&pin_to_ipfs=""`)
    });

    it('should throw an error for invalid parameters', async () => {
        const type = 'invalid-type' as 'inclusion' | 'exclusion';
        const params: AssociationSetParams = { 
            chain: 'invalid-chain', 
            contract: 'invalid-contract' 
        };
        await expect(GetAssociationSet(type, params)).rejects.toThrow('Error making external API request');
    });
    
});

describe("Test buildURL", () => {

    it('should generate a URL which matches the parameters. All parameters are included.', () => {
      const type = 'inclusion';
      const result = buildURL(baseUrl, apiUrl, type, mockParams);
      expect(result).toBe("https://api.0xbow.io/api/v1/inclusion?chain=sepolia&contract=0xb0w&hash_only=true&size_limit=20&pin_to_ipfs=false");
    });

    it('should handle empty parameters', () => {
        const type = 'inclusion';
        const params: AssociationSetParams = { chain: '', contract: '' };
        const result = buildURL(baseUrl, apiUrl, type, params);
        expect(result).toBe("https://api.0xbow.io/api/v1/inclusion?chain=&contract=");
    });
  
    test('should handle missing optional parameters', () => {
      const type = 'exclusion';
      const params: AssociationSetParams = { chain: 'sepolia', contract: '0x123' };
      const result = buildURL(baseUrl, apiUrl, type, params);
      expect(result).toBe("https://api.0xbow.io/api/v1/exclusion?chain=sepolia&contract=0x123");
    });

    test('should handle missing optional parameters. Only hash_only available', () => {
        const type = 'exclusion';
        const params: AssociationSetParams = { chain: 'sepolia', contract: '0x123' , hash_only: 'true'};
        const result = buildURL(baseUrl, apiUrl, type, params);
        expect(result).toBe("https://api.0xbow.io/api/v1/exclusion?chain=sepolia&contract=0x123&hash_only=true");
    });

    test('should handle missing optional parameters. Only hash_only, size_limit available', () => {
        const type = 'exclusion';
        const params: AssociationSetParams = { chain: 'sepolia', contract: '0x123' , hash_only: 'true', size_limit: '20'};
        const result = buildURL(baseUrl, apiUrl, type, params);
        expect(result).toBe("https://api.0xbow.io/api/v1/exclusion?chain=sepolia&contract=0x123&hash_only=true&size_limit=20");
    });
  
});

describe("Test getConfig", () => {

    it('should generate a config which matches the parameters', () => {
        const type = 'inclusion'
        //mock return response which matches the params for this test
        const confResponse = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://api.0xbow.io/api/v1/inclusion?chain=sepolia&contract=0xb0w&hash_only=true&size_limit=20&pin_to_ipfs=false",
            headers: {
                "Content-Type": "application/json"
              },
              data:  {
                hashSet: [],
                hashFilter: ""
              }
        };

        const result = getConfig(baseUrl, apiUrl, type, mockParams);
        expect(result).toEqual(confResponse)
    });

    it('should handle missing optional parameters', () => {
        const type = 'exclusion';
        const params: AssociationSetParams = { chain: 'sepolia', contract: '0x123' };
        //mock return response which matches the params for this test
        const confResponse = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://api.0xbow.io/api/v1/exclusion?chain=sepolia&contract=0x123",
            headers: {
                "Content-Type": "application/json"
              },
              data:  {
                hashSet: [],
                hashFilter: ""
              }
        };

        const result = getConfig(baseUrl, apiUrl, type, params);
        expect(result).toEqual(confResponse);
    });

    it('should handle empty parameters', () => {
        const type = 'inclusion';
        const params: AssociationSetParams = { chain: '', contract: '' };
        //mock return response which matches the params for this test
        const confResponse = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://api.0xbow.io/api/v1/inclusion?chain=&contract=",
            headers: {
                "Content-Type": "application/json"
              },
              data:  {
                hashSet: [],
                hashFilter: ""
              }
        };

        const result = getConfig(baseUrl, apiUrl, type, params);
        expect(result).toEqual(confResponse);
    });
});