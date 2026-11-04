/* Historical design registry: built from published uploaded-order reports + admin corrections. */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const CATS=['头像框','资料卡','派对背景','聊天气泡','座驾'];
const STATUSES=['待设计','设计中','已完成','已上架','已下架'];
const SET_SUBJECTS={'月下誓约':'月轮白玫瑰','金鳞龙境':'龙','深海人鱼秘境':'美人鱼','沙漠星月神殿':'星月神殿','凤凰涅槃':'凤凰','蔷薇星河':'蔷薇星河','冰晶王冠':'冰晶王冠','黑曜王权':'王室徽章','玄铜天文仪':'天文仪','琉璃风铃塔':'风铃塔','翡翠圣甲虫':'圣甲虫','悬空蓝晶书库':'图书馆','沙金日晷':'日晷','飞毯星河城':'飞毯'};
const GROUPS=[
 ['凤凰','不死鸟','火凤凰','冰凤凰','金凤凰','赤金凤凰','火凤'],
 ['美人鱼','人鱼','mermaid'],
 ['巨龙','飞龙','火龙','龙王','龙焰','龙火','龙翼','金龙','银龙','龙'],
 ['王冠','圣冕','皇冠','crown'],
 ['犀牛','重甲犀'],['战象','巨象','大象'],
 ['陆龟','巨龟','乌龟'],['巨蝎','机械蝎','蝎子','蝎'],
 ['天文仪','星盘','天象仪'],['风铃塔','风铃'],['圣甲虫','甲虫'],['图书馆','书库'],['日晷'],['飞毯'],
 ['雪地车','履带雪地车'],['蒸汽列车','蒸汽机车'],['潜航艇','潜水艇','潜艇']
];
const escape=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const clean=s=>String(s||'').replace(/[（(]\s*\d+\s*[）)]\s*$/,'').trim();
const norm=s=>clean(s).normalize('NFKC').toLowerCase().replace(/[\s·•.,，。_\-—:：\/\\()（）【】[\]]/g,'');
const split=s=>String(s||'').split(/[、，,；;\r\n]/).map(x=>x.trim()).filter(Boolean).slice(0,16);
const csv=s=>{let v=String(s==null?'':s);if(/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';};
const group=s=>{const t=norm(s);return GROUPS.find(g=>g.some(a=>t.includes(norm(a))))||null;};
let ctx=null,tags=[],entries=[],loaded=false,loadError='',loading=false,pane='brief';
let query='',catFilter='',statusFilter='',limit=60,allRendered=[],editing=null;
function baseRows(){
 const map=new Map();
 (ctx?.reports||[]).forEach(item=>{
  (item.report?.skus||[]).forEach(s=>{
   const cat=s.cat,id=String(s.id||'');
   if(!CATS.includes(cat)||!id)return;
   const k=cat+'|'+id;
   if(!map.has(k))map.set(k,{row_key:k,category:cat,sku_id:id,name:clean(s.name),design_object:'',
    theme:'',elements:[],status:'历史成交',source:'上传订单（月报）',first_seen:item.period,last_seen:item.period,months:new Set(),entry_id:null,notes:'',sales:true});
   const row=map.get(k);
   if(item.period<row.first_seen)row.first_seen=item.period;
   if(item.period>row.last_seen)row.last_seen=item.period;
   row.months.add(item.period);
   if(!row.name)row.name=clean(s.name);
  });
 });
 const lookup=new Map((tags||[]).filter(x=>x.platform===ctx?.platform).map(x=>[x.category+'|'+x.sku_id,x]));
 for(const r of map.values()){
  const t=lookup.get(r.row_key);
  if(t){r.theme=t.theme||'';r.elements=[...(t.elements||[])];}
 }
 return map;
}
function getRows(){
 const map=baseRows();
 (entries||[]).filter(r=>r.platform===ctx?.platform).forEach(item=>{
  const key=item.sku_id?item.category+'|'+item.sku_id:'manual|'+item.entry_id;
  const old=map.get(key);
  const merged={...(old||{}),...item,row_key:key,source:old?'上传订单 + 人工校对':'人工登记',
    sales:!!old?.sales,first_seen:old?.first_seen||'',last_seen:old?.last_seen||'',months:old?.months||new Set()};
  map.set(key,merged);
 });
 return [...map.values()].sort((a,b)=>{
  if(Boolean(a.sales)!==Boolean(b.sales))return a.sales?1:-1;
  return String(b.last_seen||b.updated_at||'').localeCompare(String(a.last_seen||a.updated_at||''))||
    a.category.localeCompare(b.category,'zh-CN')||a.name.localeCompare(b.name,'zh-CN');
 });
}
function check(candidate){
 if(!candidate||!ctx)return {blocked:false,hits:[],checked:false};
 const rows=getRows().filter(r=>candidate.kind==='vehicle'?r.category==='座驾':r.category!=='座驾');
 const subject=candidate.kind==='set'?(SET_SUBJECTS[candidate.name]||candidate.name):(candidate.object||candidate.name);
 const nSubject=norm(subject),nName=norm(candidate.name);
 const variants=[subject,candidate.name,...(candidate.aliases||[])].map(norm).filter(Boolean);
 const identified=group(subject);
 const hits=[];
 for(const r of rows){
  const historical=[norm(r.name),norm(r.design_object)].filter(Boolean);
  if(!historical.length)continue;
  let same=false,why='';
  if(variants.some(v=>v.length>=3&&historical.some(h=>h===v||h.includes(v)&&v.length>=4))){
   same=true;why='名称 / 设计对象重复';
  }
  if(!same&&identified){
   const histGroup=historical.some(h=>identified.some(v=>h.includes(norm(v))));
   if(histGroup){same=true;why='设计主体相同（含别名）';}
  }
  if(!same&&nSubject.length>=3&&historical.some(h=>h.includes(nSubject)||nSubject.includes(h)&&h.length>=4)){
   same=true;why='主体关键词高度相似';
  }
  if(same){hits.push({name:r.name,sku_id:r.sku_id,category:r.category,why,status:r.status});if(hits.length>=6)break;}
 }
 return {blocked:hits.length>0,hits,checked:loaded||!loadError};
}
function buildUI(){
 const page=$('page-design'),head=page?.querySelector('.page-head');
 if(!page||!head||$('designHistoryWorkspace'))return;
 const work=document.createElement('div');work.id='designBriefWorkspace';work.className='dd-workspace';
 const rest=[...page.children].filter(x=>x!==head);
 rest.forEach(x=>work.appendChild(x));
 const tabbar=document.createElement('div');tabbar.className='dd-workspace-tabs';tabbar.innerHTML=
  '<button class="dd-workspace-tab is-active" data-history-pane="brief" type="button">设计需求生成</button>'+
  '<button class="dd-workspace-tab" data-history-pane="history" type="button">历史设计题材库</button>'+
  '<span class="dd-workspace-hint">历史查重 · 主题套装与座驾独立设计</span>';
 const history=document.createElement('div');history.id='designHistoryWorkspace';history.className='dd-workspace';history.hidden=true;
 history.innerHTML=
  '<section class="panel dd-history-panel">'+
  '<div class="dd-history-heading"><div><h2>历史设计题材库</h2><p>根据已上传订单文件的云端月报自动归集历史成交商品；未上架、已完成及待设计方案由管理员补录。</p></div>'+
  '<div class="dd-history-actions"><button id="historyExport" class="button light" type="button">导出题材库</button><button id="historyAdd" class="button primary" type="button" hidden>＋ 新增设计记录</button></div></div>'+
  '<div class="dd-history-stats" id="historyStats"></div>'+
  '<div class="dd-history-note" id="historyNotice" role="status"></div>'+
  '<div class="dd-history-filters"><input id="historySearch" type="search" placeholder="搜索名称、商品ID、设计对象、关键词（如：凤凰）" aria-label="搜索历史设计">'+
  '<select id="historyCategory"><option value="">全部品类</option>'+CATS.map(x=>'<option>'+x+'</option>').join('')+'</select>'+
  '<select id="historyStatus"><option value="">全部状态</option><option>历史成交</option>'+STATUSES.map(x=>'<option>'+x+'</option>').join('')+'</select></div>'+
  '<div class="table-wrap dd-history-tablewrap"><table class="dd-history-table"><thead><tr><th>历史设计 / 商品 ID</th><th>品类</th><th>设计对象 / 题材</th><th>记录状态</th><th>数据来源 / 月份</th><th>操作</th></tr></thead><tbody id="historyRows"></tbody></table></div>'+
  '<div class="dd-history-footer"><span id="historyRange"></span><button type="button" class="button light" id="historyMore" hidden>显示更多</button></div>'+
  '</section>'+
  '<section class="panel dd-history-editor" id="historyEditor" hidden><div class="panel-head"><h2 id="historyEditorTitle">补充历史设计</h2><button id="historyCancel" type="button" class="button light">取消</button></div>'+
  '<p class="dd-history-edit-tip">已经售卖的历史商品可校对设计主体；未上线的需求可直接登记。补录后会参与下次设计需求自动查重。</p>'+
  '<form id="historyForm"><div class="dd-history-form-grid">'+
  '<label>商品品类<select id="historyFormCategory" required>'+CATS.map(x=>'<option>'+x+'</option>').join('')+'</select></label>'+
  '<label>商品 ID（未上线可留空）<input id="historyFormSku" maxlength="64" placeholder="例：178"></label>'+
  '<label>具体设计名称 *<input id="historyFormName" maxlength="120" required placeholder="如：赤金凤凰"></label>'+
  '<label>核心设计对象 *<input id="historyFormObject" maxlength="120" required placeholder="如：凤凰 / 黄金越野车"></label>'+
  '<label>主题题材<input id="historyFormTheme" maxlength="60" placeholder="如：婚礼、科幻、奇幻"></label>'+
  '<label>制作状态<select id="historyFormStatus">'+STATUSES.map(x=>'<option>'+x+'</option>').join('')+'</select></label>'+
  '<label class="dd-history-span">视觉元素 / 关键词<input id="historyFormElements" placeholder="用顿号分隔，如：金属火羽、日轮、赤金"></label>'+
  '<label class="dd-history-span">设计备注<textarea id="historyFormNotes" maxlength="500" rows="2" placeholder="已制作但未售卖、设计排除范围等"></textarea></label>'+
  '</div><div class="dd-history-form-actions"><button class="button primary" id="historySave" type="submit">保存云端记录</button><span id="historyFormStatusText"></span></div></form></section>';
 page.appendChild(tabbar);page.appendChild(work);page.appendChild(history);
 tabbar.addEventListener('click',e=>{const b=e.target.closest('[data-history-pane]');if(b)setPane(b.dataset.historyPane);});
 $('historySearch').addEventListener('input',e=>{query=e.target.value.trim();limit=60;render();});
 $('historyCategory').addEventListener('change',e=>{catFilter=e.target.value;limit=60;render();});
 $('historyStatus').addEventListener('change',e=>{statusFilter=e.target.value;limit=60;render();});
 $('historyMore').addEventListener('click',()=>{limit+=60;render();});
 $('historyAdd').addEventListener('click',()=>edit(null));
 $('historyCancel').addEventListener('click',()=>{$('historyEditor').hidden=true;});
 $('historyExport').addEventListener('click',exportCsv);
 $('historyRows').addEventListener('click',e=>{
  const el=e.target.closest('[data-history-edit]');if(!el||!ctx?.admin)return;
  edit(allRendered[Number(el.dataset.historyEdit)]||null);
 });
 $('historyForm').addEventListener('submit',save);
}
function setPane(p){
 pane=p==='history'?'history':'brief';
 $('page-design').classList.toggle('dd-history-mode',pane==='history');
 $('designBriefWorkspace').hidden=pane!=='brief';
 $('designHistoryWorkspace').hidden=pane!=='history';
 document.querySelectorAll('[data-history-pane]').forEach(el=>el.classList.toggle('is-active',el.dataset.historyPane===pane));
 if(pane==='history')render();
}
function render(){
 if(!ctx||!$('historyRows'))return;
 const rows=getRows(),manual=rows.filter(x=>!!x.entry_id).length,sold=rows.filter(x=>x.sales).length;
 const months=new Set((ctx.reports||[]).map(x=>x.period));
 $('historyStats').innerHTML='<div><b>'+sold.toLocaleString('zh-CN')+'</b><span>历史成交 SKU</span></div>'+
  '<div><b>'+manual.toLocaleString('zh-CN')+'</b><span>人工校对 / 补录</span></div>'+
  '<div><b>'+months.size+'</b><span>已发布历史月份</span></div>'+
  '<div><b>'+rows.length.toLocaleString('zh-CN')+'</b><span>可查重设计记录</span></div>';
 $('historyAdd').hidden=!ctx.admin;
 $('historyNotice').textContent=loadError?
  '历史手工记录读取异常：'+loadError+'；目前仅依据可访问的月报进行查重，可能漏掉未上线设计。':
  !loaded?'正在同步云端历史设计补录；已显示订单历史数据。':
  '数据源：后台已上传并发布的 '+[...months].sort().join('、')+' 月订单汇总，按「平台+品类+商品ID」去重；售卖状态未知，不将历史成交直接视为当前在售。题材名称不明确时需人工校对。';
 const q=norm(query);
 const filtered=rows.filter(r=>(!catFilter||r.category===catFilter)&&(!statusFilter||r.status===statusFilter)&&
  (!q||[r.name,r.sku_id,r.design_object,r.theme,(r.elements||[]).join(' ')].some(v=>norm(v).includes(q))));
 allRendered=filtered;
 $('historyRows').innerHTML=filtered.slice(0,limit).map((r,i)=>{
  const keywords=(r.elements||[]).slice(0,3).join(' / ');
  const appearance=r.sales?r.first_seen+(r.last_seen!==r.first_seen?' ～ '+r.last_seen:''):'—';
  return '<tr><td><strong>'+escape(r.name)+'</strong><small>ID '+escape(r.sku_id||'未上线')+'</small></td>'+
    '<td>'+escape(r.category)+'</td>'+
    '<td><span>'+escape(r.design_object||'待识别 / 可校对')+'</span><small>'+escape(r.theme||'未标注题材')+(keywords?' · '+escape(keywords):'')+'</small></td>'+
    '<td><span class="dd-history-badge">'+escape(r.status)+'</span></td>'+
    '<td><span>'+escape(r.source)+'</span><small>'+escape(appearance)+'</small></td>'+
    '<td>'+(ctx.admin?'<button class="dd-history-link" data-history-edit="'+i+'" type="button">'+(r.entry_id?'编辑':'校对')+'</button>':'<span class="dd-muted">只读</span>')+'</td></tr>';
 }).join('')||'<tr><td colspan="6" class="dd-empty">没有符合条件的历史设计记录。</td></tr>';
 $('historyRange').textContent='当前展示 '+Math.min(limit,filtered.length)+' / '+filtered.length+' 条';
 $('historyMore').hidden=filtered.length<=limit;
}
function edit(row){
 if(!ctx?.admin)return;
 editing=row;
 $('historyEditor').hidden=false;
 $('historyEditorTitle').textContent=row?'校对 / 编辑历史设计':'登记尚未上架的设计方案';
 $('historyFormCategory').value=row?.category||'头像框';
 $('historyFormSku').value=row?.sku_id||'';
 $('historyFormName').value=row?.name||'';
 $('historyFormObject').value=row?.design_object||row?.name||'';
 $('historyFormTheme').value=row?.theme||'';
 $('historyFormElements').value=(row?.elements||[]).join('、');
 $('historyFormStatus').value=row?.entry_id?row.status:row?.sales?'已上架':'待设计';
 $('historyFormNotes').value=row?.notes||'';
 $('historyFormStatusText').textContent=row?.sales?'订单记录会保留；本次只补充设计信息与状态。':'';
 $('historyFormSku').disabled=!!row?.entry_id;
 $('historyFormCategory').disabled=!!row?.entry_id;
 const btn=$('historySave');btn.disabled=false;
 let old=$('historyDelete');
 if(old)old.remove();
 if(row?.entry_id){
  const del=document.createElement('button');del.type='button';del.id='historyDelete';del.className='button light';del.textContent='删除人工补录';
  del.onclick=async()=>{if(!ctx?.admin||!row.entry_id)return;del.disabled=true;try{
    await root.MallCloud.removeDesignHistory(row.entry_id);await reload();
    $('historyEditor').hidden=true;
   }catch(err){$('historyFormStatusText').textContent='删除失败：'+err.message;del.disabled=false;}};
  $('historySave').after(del);
 }
 $('historyEditor').scrollIntoView({behavior:'smooth',block:'center'});
}
async function save(ev){
 ev.preventDefault();
 if(!ctx?.admin)return;
 const cat=$('historyFormCategory').value,sku=$('historyFormSku').value.trim()||null;
 const name=$('historyFormName').value.trim(),object=$('historyFormObject').value.trim();
 if(!name||!object){$('historyFormStatusText').textContent='需要填写具体设计名称和核心设计对象。';return;}
 const payload={entry_id:editing?.entry_id||null,platform:ctx.platform,category:cat,sku_id:sku,
  name,design_object:object,theme:$('historyFormTheme').value.trim(),
  elements:split($('historyFormElements').value),status:$('historyFormStatus').value,
  notes:$('historyFormNotes').value.trim()};
 const btn=$('historySave');btn.disabled=true;$('historyFormStatusText').textContent='正在保存云端记录…';
 try{
  await root.MallCloud.putDesignHistory(payload);
  await reload();$('historyFormStatusText').textContent='云端保存成功，已加入自动查重。';
  $('historyEditor').hidden=true;
 }catch(err){$('historyFormStatusText').textContent='保存失败：'+err.message;}
 finally{btn.disabled=false;}
}
function exportCsv(){
 const headings=['平台','品类','商品ID','设计名称','具体设计对象','主题题材','视觉元素','记录状态','来源','最早成交月份','最近成交月份','备注'];
 const lines=[headings];
 getRows().forEach(r=>lines.push([ctx.platform,r.category,r.sku_id||'',r.name,r.design_object||'待校对',r.theme,(r.elements||[]).join(' / '),r.status,r.source,r.first_seen||'',r.last_seen||'',r.notes||'']));
 const blob=new Blob(['\uFEFF'+lines.map(row=>row.map(csv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='商城历史设计题材库_'+ctx.platform+'.csv';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function reload(){
 if(loading)return;
 loading=true;loadError='';
 try{
  if(!root.MallCloud?.listDesignHistory)throw Error('历史题材云端服务未就绪');
  entries=await root.MallCloud.listDesignHistory();loaded=true;
 }catch(err){loadError=err.message||String(err);loaded=false;}
 finally{loading=false;render();root.dispatchEvent(new Event('mall:design-history-change'));}
}
function setContext(next){
 const was=!ctx||ctx.platform!==next.platform;
 ctx=next;render();
 if(!loaded&&!loading)reload();
 else if(was)root.dispatchEvent(new Event('mall:design-history-change'));
}
function setTags(next){tags=next||[];render();root.dispatchEvent(new Event('mall:design-history-change'));}
async function registerRecommendation(candidate){
 if(!ctx?.admin)throw Error('仅云端管理员可登记设计需求');
 if(!candidate||check(candidate).blocked)throw Error('该设计与历史记录重复，请更换设计对象');
 if(!root.MallCloud?.putDesignHistoryBatch)throw Error('云端批量登记功能尚未就绪');
 const cats=candidate.kind==='vehicle'?['座驾']:['头像框','资料卡','派对背景','聊天气泡'];
 const designObject=candidate.kind==='vehicle'?candidate.object:(SET_SUBJECTS[candidate.name]||candidate.name);
 const payload=cats.map(category=>({
  platform:ctx.platform,category,sku_id:null,name:candidate.name,
  design_object:designObject,theme:candidate.theme||'',
  elements:[...(candidate.keywords||[])].slice(0,12),status:'待设计',
  notes:(candidate.kind==='vehicle'?
   (candidate.requirements||candidate.structure||''):
   (candidate.idea||'')+'；'+(candidate.variants?.[category]||'')).slice(0,500)
 }));
 await root.MallCloud.putDesignHistoryBatch(payload);
 await reload();
 query=candidate.name;$('historySearch').value=query;
 catFilter='';$('historyCategory').value='';
 statusFilter='';$('historyStatus').value='';
 limit=60;setPane('history');
}

buildUI();
root.MallDesignHistory=Object.freeze({setContext,setTags,check,getRows,registerRecommendation,open:()=>setPane('history'),get loaded(){return loaded;},get error(){return loadError;}});
})(window);