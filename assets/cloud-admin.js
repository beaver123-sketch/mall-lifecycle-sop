(()=>{
'use strict';
const PROJECT_URL='https://zsymjxmhomftiesmlhgk.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_DPMRHmvS2clH9LjK8rF7Sg_ltxf-bb-';
const $=id=>document.getElementById(id);
const msg=(text,kind='')=>{const el=$('message');el.textContent=text;el.className='cloud-info '+kind};
let client;
async function update(){
 if(!client)return;
 const {data:{user},error}=await client.auth.getUser();
 if(error){msg('无法检查登录状态：'+error.message,'error');return}
 $('loginForm').hidden=!!user;$('account').hidden=!user;
 if(!user){$('email').disabled=false;return}
 $('accountEmail').textContent=user.email||'当前用户';
 const {data:rows,error:adminError}=await client.from('mall_admins').select('user_id').eq('user_id',user.id).limit(1);
 if(adminError){$('permission').textContent='权限检测失败';msg('云端权限检查失败：'+adminError.message,'error');return}
 if(rows?.length){
  $('permission').innerHTML='<span class="cloud-pill">已授予管理员权限</span>';
  msg('管理员身份验证成功。可以返回数据管理，下一步将启用云端上传与历史数据迁移。','success');
 }else{
  $('permission').innerHTML='<span class="cloud-pill">已验证邮箱 · 待授权</span>';
  msg('邮箱验证成功，但尚未授予管理员权限。\n请返回 ChatGPT 告诉我「已完成管理员邮箱验证」，我会核对项目内已验证的账号并进行授权。');
 }
}
async function init(){
 if(!window.supabase?.createClient){msg('身份验证组件加载失败，请检查网络并刷新页面。','error');return}
 client=window.supabase.createClient(PROJECT_URL,PUBLISHABLE_KEY,{
   auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,storageKey:'mall-dashboard-cloud-auth-v1'}
 });
 $('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const btn=$('submit');btn.disabled=true;const email=$('email').value.trim();
  try{
   const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname,shouldCreateUser:true}});
   if(error)throw error;
   msg('登录邮件已发出。请打开邮件中的验证链接。\n如果验证链接未返回本站，请先在 Supabase Auth → URL Configuration 中将当前网页地址添加到 Redirect URLs。','success');
  }catch(err){msg('发送失败：'+err.message,'error')}
  finally{btn.disabled=false}
 });
 $('signOut').addEventListener('click',async()=>{await client.auth.signOut();$('permission').textContent='';msg('已退出登录');await update()});
 $('refresh').addEventListener('click',update);
 client.auth.onAuthStateChange(()=>setTimeout(update,0));
 await update();
}
init().catch(e=>msg('身份验证初始化失败：'+e.message,'error'));
})();