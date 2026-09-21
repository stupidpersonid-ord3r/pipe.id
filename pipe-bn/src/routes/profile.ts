import type { FastifyInstance } from "fastify";
import { dbQuery } from "../db/client.js";
import { requireUser } from "../auth.js";
import { profileUpdateSchema } from "../schemas.js";
export async function profileRoutes(app:FastifyInstance){
  app.get("/profile",async(req,reply)=>{const id=await requireUser(req);if(!id)return reply.status(401).send({error:{code:"UNAUTHORIZED",message:"Authentication required."}});const r=await dbQuery<any>("select trader_name,journal_name,theme,avatar_url,backup_email,phone_whatsapp,created_at,updated_at from profiles where id=$1",[id]);return {data:r.rows[0]||null}});
  app.patch("/profile",async(req,reply)=>{
    const id=await requireUser(req);if(!id)return reply.status(401).send({error:{code:"UNAUTHORIZED",message:"Authentication required."}});
    const p=profileUpdateSchema.safeParse(req.body);if(!p.success)return reply.status(400).send({error:{code:"VALIDATION_ERROR",message:p.error.issues[0]?.message||"Invalid request."}});
    const current=(await dbQuery<any>("select * from profiles where id=$1",[id])).rows[0]||{};
    if(p.data.backupEmail){const u=(await dbQuery<any>("select email from users where id=$1",[id])).rows[0];if(u?.email===p.data.backupEmail)return reply.status(400).send({error:{code:"BACKUP_EMAIL_SAME",message:"Backup email must be different from login email."}})}
    const pick=(camel:string,snake:string)=>Object.prototype.hasOwnProperty.call(p.data,camel)?(p.data as any)[camel]:(current[snake]??null);
    const r=await dbQuery<any>(`update profiles set trader_name=$1,journal_name=$2,theme=$3,avatar_url=$4,backup_email=$5,phone_whatsapp=$6,updated_at=now() where id=$7 returning trader_name,journal_name,theme,avatar_url,backup_email,phone_whatsapp,created_at,updated_at`,[pick("traderName","trader_name"),pick("journalName","journal_name"),pick("theme","theme")??"light",pick("avatarUrl","avatar_url"),pick("backupEmail","backup_email"),pick("phoneWhatsapp","phone_whatsapp"),id]);
    return {data:r.rows[0]};
  });
}
