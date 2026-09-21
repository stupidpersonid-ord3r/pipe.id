import type { FastifyInstance } from "fastify";
import { pool } from "../db/client.js";
export async function healthRoutes(app:FastifyInstance){app.get("/health",async()=>{let db="not-connected";if(pool){try{await pool.query("select 1");db="connected"}catch{db="error"}}return {ok:true,service:"pipe-bn",version:"1.0.2",database:db}});}
