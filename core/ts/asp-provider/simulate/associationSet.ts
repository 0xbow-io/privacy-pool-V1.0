import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception'
import type { ApiResponse, AssociationSetParams } from "@privacy-pool-v1/core-ts/asp-provider/interfaces/api";
import { GetAssociationSet } from "@privacy-pool-v1/core-ts/asp-provider/functions/api";
import axios from 'axios';

const app = new Hono;

app.post("/:type", async (c) => {
    const type = c.req.param('type') as 'inclusion' | 'exclusion';
    const { chain, contract, hash_only, size_limit, pin_to_ipfs } = c.req.query();
  
    try {

      const params: AssociationSetParams = {
      chain: chain as string,
      contract: contract as string,
      hash_only: hash_only as string,
      size_limit: size_limit as string,
      pin_to_ipfs: pin_to_ipfs as string,
      };

      const associationSet = await GetAssociationSet(type, params);
  
      console.log('Fetched Exclusion Set:', associationSet);
      return c.json(associationSet);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching exclusion set:', error.message);
        throw new HTTPException(500, { message: 'Error fetching exclusion set' });
      } else {
        console.error('An unknown error occurred:', error);
        throw new HTTPException(500, { message: 'An unknown error occurred' });
      }
    }
  });

export default app