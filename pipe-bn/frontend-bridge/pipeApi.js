const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
let accessToken = localStorage.getItem("pipe_access_token");
let refreshToken = localStorage.getItem("pipe_refresh_token");
export function setPipeSession(session){accessToken=session?.access_token||null;refreshToken=session?.refresh_token||null;if(accessToken)localStorage.setItem("pipe_access_token",accessToken);else localStorage.removeItem("pipe_access_token");if(refreshToken)localStorage.setItem("pipe_refresh_token",refreshToken);else localStorage.removeItem("pipe_refresh_token");}
export function clearPipeSession(){setPipeSession(null)}
async function refresh(){if(!refreshToken)return false;const r=await fetch(`${API_URL}/auth/refresh`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refreshToken})});if(!r.ok){clearPipeSession();return false}const d=await r.json();setPipeSession(d.session);return true}
export async function pipeFetch(path,options={}){const opts={...options,headers:{"Content-Type":"application/json",...(options.headers||{})}};if(accessToken)opts.headers.Authorization=`Bearer ${accessToken}`;let r=await fetch(`${API_URL}${path}`,opts);if(r.status===401&&refreshToken){if(await refresh()){opts.headers.Authorization=`Bearer ${accessToken}`;r=await fetch(`${API_URL}${path}`,opts)}}const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.error?.message||"PIPE.ID API request failed.");return data;}
export const pipeApi={
 register:async(body)=>{const d=await pipeFetch("/auth/register",{method:"POST",body:JSON.stringify(body)});setPipeSession(d.session);return d},
 login:async(body)=>{const d=await pipeFetch("/auth/login",{method:"POST",body:JSON.stringify(body)});setPipeSession(d.session);return d},
 logout:async()=>{const d=await pipeFetch("/auth/logout",{method:"POST"});clearPipeSession();return d},
 refresh,
 profile:{get:()=>pipeFetch("/profile"),update:(body)=>pipeFetch("/profile",{method:"PATCH",body:JSON.stringify(body)})},
 accounts:{list:()=>pipeFetch("/accounts"),create:(body)=>pipeFetch("/accounts",{method:"POST",body:JSON.stringify(body)}),get:(id)=>pipeFetch(`/accounts/${id}`),update:(id,body)=>pipeFetch(`/accounts/${id}`,{method:"PATCH",body:JSON.stringify(body)}),deposit:(id,body)=>pipeFetch(`/accounts/${id}/deposit`,{method:"POST",body:JSON.stringify(body)}),withdraw:(id,body)=>pipeFetch(`/accounts/${id}/withdraw`,{method:"POST",body:JSON.stringify(body)}),transactions:(id)=>pipeFetch(`/accounts/${id}/transactions`)},
 trades:{list:(query="")=>pipeFetch(`/trades${query?`?${query}`:""}`),create:(body)=>pipeFetch("/trades",{method:"POST",body:JSON.stringify(body)}),get:(id)=>pipeFetch(`/trades/${id}`),update:(id,body)=>pipeFetch(`/trades/${id}`,{method:"PATCH",body:JSON.stringify(body)})},
 analytics:{overview:(accountId)=>pipeFetch(`/analytics/overview${accountId?`?accountId=${encodeURIComponent(accountId)}`:""}`),equity:(accountId)=>pipeFetch(`/analytics/equity${accountId?`?accountId=${encodeURIComponent(accountId)}`:""}`),monthly:(accountId)=>pipeFetch(`/analytics/monthly${accountId?`?accountId=${encodeURIComponent(accountId)}`:""}`),psychology:()=>pipeFetch("/analytics/psychology"),strategies:(accountId)=>pipeFetch(`/analytics/strategies${accountId?`?accountId=${encodeURIComponent(accountId)}`:""}`),pairs:(accountId)=>pipeFetch(`/analytics/pairs${accountId?`?accountId=${encodeURIComponent(accountId)}`:""}`)}
};
export { API_URL };
