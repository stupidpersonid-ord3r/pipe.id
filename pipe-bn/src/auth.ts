import type { FastifyRequest } from "fastify";
import { dbQuery } from "./db/client.js";
import { verifyToken } from "./security.js";
export function getBearerToken(request:FastifyRequest){const h=request.headers.authorization;return h?.startsWith("Bearer ")?h.slice(7).trim()||null:null;}
export async function requireUser(request:FastifyRequest){const t=getBearerToken(request);if(!t)return null;const p=verifyToken(t);if(!p||p.type!=="access"||!p.sub)return null;try{const r=await dbQuery<{id:string}>("select id from users where id=$1",[p.sub]);return r.rowCount? p.sub:null;}catch{return null;}}
