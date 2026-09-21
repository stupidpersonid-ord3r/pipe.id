import type { FastifyInstance } from "fastify";
import { dbQuery } from "../db/client.js";
import { requireUser } from "../auth.js";

export async function instrumentRoutes(app: FastifyInstance) {
  app.get("/instruments", async (req, reply) => {
    if (!(await requireUser(req))) return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required." } });
    const result = await dbQuery<any>(`select id,symbol,display_name,asset_type,base_asset,quote_asset,exchange,active from instrument_catalog where active=true order by asset_type,symbol`);
    return { data: result.rows };
  });
}
