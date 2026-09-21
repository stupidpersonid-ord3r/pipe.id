import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env, corsOrigins } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
export function buildApp(){
  const app=Fastify({logger:{level:env.NODE_ENV==="development"?"info":"warn"},trustProxy:true,bodyLimit:1024*1024});
  app.register(helmet);
  app.register(cors,{origin:corsOrigins,credentials:true});
  app.register(rateLimit,{max:100,timeWindow:"1 minute"});
  app.setErrorHandler((error,request,reply)=>{request.log.error(error);const status=typeof error==="object"&&error!==null&&"statusCode" in error&&typeof (error as any).statusCode==="number"?(error as any).statusCode:500;return reply.status(status).send({error:{code:status<500?"REQUEST_ERROR":"INTERNAL_SERVER_ERROR",message:env.NODE_ENV==="production"&&status>=500?"Internal server error.":error instanceof Error?error.message:"Request failed."}})});
  registerRoutes(app);return app;
}
