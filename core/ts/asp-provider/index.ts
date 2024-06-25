import { Hono } from 'hono';
import { serve } from 'bun';
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import {baseUrl} from '@privacy-pool-v1/core-ts/asp-provider/classes/providers/0xbow/constants';
import associationSet from './routes/associationSet';

//create a new Hono app instance;
const app = new Hono()//.basePath(baseUrl);

//use the default logger from hono
app.use(logger());

// health checks if the API server is running
app.get("/health", (c) =>  {
    try {
        return c.json({status: "API is running"});
    }
    catch (error) {
        throw new HTTPException(500, { message: "Health check failed" });
    }
});
//Attached route section for the API (no 1:1 GO handler implementation yet, this might be cleaner than that)

app.route("/association", associationSet);

// handles the thrown HTTPException
app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    return c.json({ error: 'An unexpected error occurred' }, 500);
  });
  
//run the server
serve({
fetch(req) {
    return app.fetch(req);
},
port: Bun.env.PORT || 3030,
});

console.log(`Server is running at http://localhost:${Bun.env.PORT || 3030}`);
