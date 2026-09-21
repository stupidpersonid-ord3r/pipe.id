import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { pool } from "../db/client.js";
export async function apiRoutes(app:FastifyInstance){app.get("/",async()=>({name:"PIPE.ID API",version:"v1",status:"ready",database:pool?"configured":"not-configured",environment:env.NODE_ENV}));}
