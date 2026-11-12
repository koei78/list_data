import * as netlify from '@netlify/identity';
export const usesOwnerAuth=()=>process.env.NEXT_PUBLIC_AUTH_PROVIDER==='vercel-owner';
async function action(path:string,body:any={}){const response=await fetch('/api/auth/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'same-origin'});const result=await response.json();if(!response.ok)throw new Error(result.error||'認証に失敗しました。');return result;}
export async function login(email:string,password:string){return usesOwnerAuth()?action('login',{email,password}):netlify.login(email,password);}
export async function logout(){return usesOwnerAuth()?action('logout'):netlify.logout();}
export async function signup(...args:Parameters<typeof netlify.signup>){if(usesOwnerAuth())throw new Error('管理者の初期設定を使用してください。');return netlify.signup(...args);}
export async function requestPasswordRecovery(email:string){if(usesOwnerAuth())throw new Error('管理者パスワードは設定画面から変更してください。');return netlify.requestPasswordRecovery(email);}
export async function hydrateSession(){if(!usesOwnerAuth())return netlify.hydrateSession();const response=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store'});return response.ok?(await response.json()).user:null;}
export async function handleAuthCallback():Promise<any>{if(usesOwnerAuth())throw new Error('新しいログイン画面を使用してください。');return netlify.handleAuthCallback();}
export async function acceptInvite(...args:Parameters<typeof netlify.acceptInvite>){if(usesOwnerAuth())throw new Error('管理者の初期設定を使用してください。');return netlify.acceptInvite(...args);}
export async function updateUser(...args:Parameters<typeof netlify.updateUser>){if(usesOwnerAuth())throw new Error('管理者パスワードは設定画面から変更してください。');return netlify.updateUser(...args);}
