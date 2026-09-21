import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { env } from "./config/env.js";
const scrypt = promisify(scryptCallback);
const ACCESS_TTL = 60 * 60;
const REFRESH_TTL = 60 * 60 * 24 * 30;
const secret = env.JWT_SECRET || randomBytes(48).toString("hex");
const b64 = (v: string | Buffer) => Buffer.from(v).toString("base64url");
function sign(payload: Record<string, unknown>, ttl: number) { const body = b64(JSON.stringify({...payload, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+ttl})); const sig=createHmac("sha256",secret).update(body).digest("base64url"); return `${body}.${sig}`; }
export function verifyToken(token: string) { const [body,sig]=token.split("."); if(!body||!sig)return null; const expected=createHmac("sha256",secret).update(body).digest(); const actual=Buffer.from(sig,"base64url"); if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null; try { const p=JSON.parse(Buffer.from(body,"base64url").toString()) as any; if(!p.sub||!p.exp||p.exp<=Math.floor(Date.now()/1000))return null; return p; } catch { return null; } }
export function createAccessToken(userId:string){return sign({sub:userId,type:"access",jti:randomBytes(16).toString("hex")},ACCESS_TTL)}
export function createRefreshToken(userId:string){return sign({sub:userId,type:"refresh",jti:randomBytes(24).toString("hex")},REFRESH_TTL)}
export async function hashPassword(password:string){const salt=randomBytes(16).toString("hex");const d=await scrypt(password,salt,64) as Buffer;return `scrypt:${salt}:${d.toString("hex")}`}
export async function verifyPassword(password:string,stored:string){const [scheme,salt,hash]=stored.split(":");if(scheme!=="scrypt"||!salt||!hash)return false;const d=await scrypt(password,salt,64) as Buffer;const h=Buffer.from(hash,"hex");return h.length===d.length&&timingSafeEqual(h,d)}
export function hashToken(token:string){return createHmac("sha256",secret).update(token).digest("hex")}
export const tokenTtlSeconds=ACCESS_TTL;
export const refreshTtlSeconds=REFRESH_TTL;
