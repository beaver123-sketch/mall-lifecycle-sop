/* Huaban reference slots: category-aware discovery, verified pin selection, shared admin write. */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const CATS=['头像框','资料卡','派对背景','聊天气泡','座驾'];
const TERMS={'头像框':'游戏头像框 UI边框','资料卡':'游戏资料卡 UI面板',
 '派对背景':'语音房派对背景 游戏场景','聊天气泡':'游戏聊天气泡 UI','座驾':'游戏坐骑 载具设计'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=o=>[o.platform,o.design_kind,o.design_name,o.category].join('|');
const pinOk=value=>{
 try {
  const u=new URL(String(value||'').trim());
  return u.protocol==='https:'&&['huaban.com','www.huaban.com'].includes(u.hostname)&&
    /^\/pins\/[0-9]+\/?$/.test(u.pathname);
 }catch{return false;}
};
const imageOk=value=>{
 if(!value)return true;
 try {
  const u=new URL(value);
  return u.protocol==='https:' && !u.username && !u.password &&
    u.hostname.length>3 && !/^(localhost|127\.|0\.|10\.|192\.168\.|172\.)/.test(u.hostname);
 }catch{return false;}
};
let context=null,refs=new Map(),loaded=false,loading=false,loadError='',editing=null;
function searchText(brief,cat){
 const primary=cat==='座驾'?(brief.object||brief.name):'';
 const tags=(brief.keywords||[]).filter(Boolean).slice(0,2).join(' ');
 return [TERMS[cat]||'设计参考',primary,tags].filter(Boolean).join(' ');
}
function searchUrl(brief,cat){
 return 'https://huaban.com/search/?q='+encodeURIComponent(searchText(brief,cat));
}
function itemFor(brief,category){
 return {platform:context?.platform||'POPPO',design_kind:brief.kind,
  design_name:brief.name,category};
}
function get(brief,cat){return refs.get(key(itemFor(brief,cat)))||null;}
function referenceMarkup(brief,cat){
 const item=itemFor(brief,cat),saved=get(brief,cat),text=searchText(brief,cat),search=searchUrl(brief,cat);
 const preview=saved?.image_url?
  '<a class="hb-preview" href="'+esc(saved.pin_url)+'" target="_blank" rel="noopener noreferrer" title="打开花瓣采集详情"><img src="'+esc(saved.image_url)+'" alt="'+esc(brief.name+' '+cat+' 花瓣参考图片')+'" referrerpolicy="no-referrer" loading="lazy" onerror="this.closest(\'.hb-preview\').classList.add(\'hb-image-failed\')"></a>':
  '<div class="hb-preview hb-no-preview"><span>'+esc(cat)+'</span><small>'+ (saved?'已有花瓣采集链接':'参考图待选') +'</small></div>';
 const meta=saved?
   '<span class="hb-confirmed">已选 1 张</span><a class="hb-primary-link" href="'+esc(saved.pin_url)+'" target="_blank" rel="noopener noreferrer">查看花瓣原图</a>'+
     (saved.note?'<p class="hb-note">'+esc(saved.note)+'</p>':''):
   '<span class="hb-pending">尚未选定对应参考图</span>';
 const edit=context?.admin?'<button class="hb-action" type="button" data-hb-edit="'+esc(brief.kind)+'" data-hb-name="'+esc(brief.name)+'" data-hb-cat="'+esc(cat)+'">'+(saved?'替换参考图':'添加选中图片')+'</button>':'';
 return '<div class="hb-ref" data-reference-key="'+esc(key(item))+'">'+preview+
  '<div class="hb-ref-body"><div class="hb-ref-heading">花瓣参考 · '+esc(cat)+'</div><div class="hb-ref-meta">'+meta+'</div>'+
  '<a class="hb-search" href="'+esc(search)+'" target="_blank" rel="noopener noreferrer" title="'+esc(text)+'">去花瓣搜索该品类参考</a>'+edit+
  '</div></div>';
}
function referenceMeta(brief,cat){
 const saved=get(brief,cat);
 return {pin_url:saved?.pin_url||'',image_url:saved?.image_url||'',
   note:saved?.note||'',search_url:searchUrl(brief,cat)};
}
function resolveBrief(kind,name){
 const cards=Array.isArray(root.MallDesignCurrentSelection)?root.MallDesignCurrentSelection:[];
 return cards.find(x=>x.kind===kind&&x.name===name)||null;
}
function showEditor(kind,name,cat){
 if(!context?.admin||!CATS.includes(cat)||!['set','vehicle'].includes(kind))return;
 if((kind==='vehicle')!==(cat==='座驾'))return;
 const brief=resolveBrief(kind,name);if(!brief)return;
 editing=itemFor(brief,cat);
 const saved=refs.get(key(editing));
 $('hbEditorTitle').textContent=name+' · '+cat;
 $('hbEditorQuery').textContent=searchText(brief,cat);
 $('hbEditorSearch').href=searchUrl(brief,cat);
 $('hbEditorPin').value=saved?.pin_url||'';
 $('hbEditorImage').value=saved?.image_url||'';
 $('hbEditorNote').value=saved?.note||'';
 $('hbEditorStatus').textContent=saved?'当前已绑定一条花瓣采集':'请在花瓣找到该品类的具体参考图，复制单张采集详情链接。';
 $('hbEditorRemove').hidden=!saved;
 const dialog=$('huabanReferenceDialog');if(!dialog)return;
 if(typeof dialog.showModal==='function')dialog.showModal();
 else dialog.open=true;
}
function closeEditor(){
 const dialog=$('huabanReferenceDialog');
 if(dialog?.close)dialog.close();else if(dialog)dialog.open=false;
 editing=null;
}
async function save(){
 if(!editing||!context?.admin)return;
 const pin=$('hbEditorPin').value.trim(),image=$('hbEditorImage').value.trim(),note=$('hbEditorNote').value.trim();
 if(!pinOk(pin)){
  $('hbEditorStatus').textContent='请填写花瓣单张采集链接，例如 https://huaban.com/pins/123456789/；搜索结果链接不能冒充选中图片。';
  return;
 }
 if(!imageOk(image)){$('hbEditorStatus').textContent='预览图片必须为有效 HTTPS 图片链接，或留空。';return;}
 if(note.length>200){$('hbEditorStatus').textContent='参考要点最多200字。';return;}
 const btn=$('hbEditorSave');btn.disabled=true;$('hbEditorStatus').textContent='正在保存到云端…';
 try {
  const payload={...editing,pin_url:pin,image_url:image,note};
  await root.MallCloud.putDesignReference(payload);refs.set(key(payload),payload);
  closeEditor();root.dispatchEvent(new Event('mall:huaban-refs-updated'));
 }catch(err){$('hbEditorStatus').textContent='保存失败：'+(err.message||err);}
 finally{btn.disabled=false;}
}
async function remove(){
 if(!editing||!context?.admin)return;
 const btn=$('hbEditorRemove');btn.disabled=true;$('hbEditorStatus').textContent='正在移除云端参考…';
 try{
  await root.MallCloud.removeDesignReference(editing);refs.delete(key(editing));
  closeEditor();root.dispatchEvent(new Event('mall:huaban-refs-updated'));
 }catch(err){$('hbEditorStatus').textContent='移除失败：'+(err.message||err);}
 finally{btn.disabled=false;}
}
async function reload(){
 if(loading||!root.MallCloud?.listDesignReferences)return;
 loading=true;loadError='';
 try {
  const rows=await root.MallCloud.listDesignReferences();
  refs=new Map(rows.map(x=>[key(x),x]));loaded=true;
 }catch(err){
  loadError=err.message||String(err);loaded=false;
 }finally{
  loading=false;
  const status=$('huabanReferenceStatus');
  if(status)status.textContent=loadError?'花瓣参考关联读取异常：'+loadError:'花瓣参考链接已同步云端';
  root.dispatchEvent(new Event('mall:huaban-refs-updated'));
 }
}
function setContext(next){
 context=next;
 if(!loaded&&!loading)reload();
}
$('designRecommendCards').addEventListener('click',e=>{
 const btn=e.target.closest('[data-hb-edit]');
 if(btn)showEditor(btn.dataset.hbEdit,btn.dataset.hbName,btn.dataset.hbCat);
});
$('hbEditorSave').addEventListener('click',save);
$('hbEditorRemove').addEventListener('click',remove);
$('hbEditorCancel').addEventListener('click',closeEditor);
$('huabanReferenceDialog').addEventListener('close',()=>{editing=null;});
root.MallHuabanReferences=Object.freeze({
 setContext,referenceMarkup,referenceMeta,
 get loaded(){return loaded},get error(){return loadError}
});
})(window);
