import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { apiRoutes } from "./api.js";
import { authRoutes } from "./auth.js";
import { profileRoutes } from "./profile.js";
import { accountRoutes } from "./accounts.js";
import { tradeRoutes } from "./trades.js";
import { analyticsRoutes } from "./analytics.js";
import { instrumentRoutes } from "./instruments.js";
export function registerRoutes(app:FastifyInstance){app.register(healthRoutes);app.register(apiRoutes,{prefix:"/api/v1"});app.register(authRoutes,{prefix:"/api/v1"});app.register(profileRoutes,{prefix:"/api/v1"});app.register(accountRoutes,{prefix:"/api/v1"});app.register(tradeRoutes,{prefix:"/api/v1"});app.register(analyticsRoutes,{prefix:"/api/v1"});
app.register(instrumentRoutes,{prefix:"/api/v1"});}
