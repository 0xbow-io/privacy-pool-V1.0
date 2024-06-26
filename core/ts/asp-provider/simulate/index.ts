import { Hono } from 'hono';
import { serve } from 'bun';
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import associationSet from './associationSet';

//create a new Hono app instance;
const app = new Hono()

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

//tests the GetAssociationSet()
app.route("/association", associationSet);
//add another route here for another function

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
