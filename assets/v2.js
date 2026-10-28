(function(){
"use strict";
const $=id=>document.getElementById(id), QUOTAS={'头像框':[4,8],'派对背景':[4,10],'资料卡':[4,5],'聊天气泡':[4,4],'座驾':[1,1]};
const LS_CATALOG='mall-sop-v2-catalog',LS_HISTORY='mall-sop-v2-history';
const cols={
 date:['日期','交易日期','统计日期','下单日期','购买日期','date','day'],
 type:['商品类型','商品类别','品类','类型','道具类型','category','type'],
 item:['商品名称','道具名称','道具','商品名','商品','itemname','productname'],
 id:['商品id','商品编号','道具id','道具编号','skuid','sku','itemid','productid'],
 qty:['总销量','销售件数','总销售量','销量','购买数量','销售数量','totalqty','quantity'],
 goldQty:['金币销量','金币支付销量','金币支付件数','金币购买件数'],
 honorQty:['荣誉券销量','荣誉券支付销量','荣誉券支付件数','荣誉券购买件数'],
 goldAmount:['金币金额','总销售金币','销售金币','金币收入','金币销售额'],
 honorAmount:['荣誉券金额','总销售荣誉券','销售荣誉券','荣誉券收入','荣誉券销售额'],
 days:['购买天数','购买期限','有效天数','天数','duration'],
 listed:['上架日期','首次上架日期','商品上架时间','上架时间','上市日期','listeddate','launchdate'],
 status:['在售状态','商品状态','状态','售卖状态','销售状态','status'],
 platform:['平台','所属平台','平台名称','app'],
 special:['特殊类型','商品属性','活动属性','是否限时','商品标记','商品标签','special'],
 ended:['停止售卖日期','下架日期','下架时间','停售日期','enddate']
};
const compact=x=>String(x??'').normalize('NFKC').toLowerCase().replace(/[\s_\-—()（）\[\]【】:：]+/g,'');
const dict=Object.fromEntries(Object.entries(cols).map(([k,v])=>[k,new Set(v.map(compact))]));
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
const val=(r,m,k)=>m[k]===undefined?'':(r[m[k]]??'');
function detect(matrix,mode){
 for(let i=0;i<Math.min(matrix.length,35);i++){
  const map={};(matrix[i]||[]).forEach((c,j)=>{const t=compact(c);Object.entries(dict).forEach(([k,set])=>{if(map[k]===undefined&&set.has(t))map[k]=j;});});
  if(mode==='orders'&&map.date!==undefined&&map.item!==undefined&&map.qty!==undefined)return {at:i,map};
  if(mode==='catalog'&&map.item!==undefined&&(map.id!==undefined||map.type!==undefined)&&map.listed!==undefined)return {at:i,map};
 }
 return null;
}
function day(raw){
 if(raw==null||raw==='')return '';
 if(typeof raw==='number'&&raw>10000&&raw<80000){return new Date(Date.UTC(1899,11,30)+Math.floor(raw)*86400000).toISOString().slice(0,10);}
 let t=String(raw).trim(),m=t.match(/^(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})/);
 if(!m)return '';
 let y=+m[1],mo=+m[2],d=+m[3],dt=new Date(Date.UTC(y,mo-1,d));
 if(dt.getUTCFullYear()!==y||dt.getUTCMonth()+1!==mo||dt.getUTCDate()!==d)return '';
 return [y,String(mo).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
}
function plus(iso,n){let d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function between(a,b){return Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000)+1;}
function qkey(date){let y=date.slice(0,4),mo=+date.slice(5,7);return y+'-Q'+Math.ceil(mo/3);}
function qrange(k){const m=String(k).match(/^(\d{4})-Q([1-4])$/);if(!m)return null;const y=+m[1],n=+m[2],start=new Date(Date.UTC(y,(n-1)*3,1)).toISOString().slice(0,10),end=new Date(Date.UTC(y,n*3,0)).toISOString().slice(0,10);return {start,end,days:between(start,end),label:y+'年第'+n+'季度'};}
function number(v){
 if(v===null||v===undefined||String(v).trim()==='')return null;
 const s=String(v).trim().replace(/[,，\s]/g,'');return /^-?\d+(\.\d+)?$/.test(s)?Number(s):NaN;
}
function cat(v){v=String(v??'').trim();if(/派对(主题|背景)/.test(v))return '派对背景';if(/头像框|相框/.test(v))return '头像框';if(/资料卡/.test(v))return '资料卡';if(/聊天气泡|气泡/.test(v))return '聊天气泡';if(/座驾/.test(v))return '座驾';if(/靓号/.test(v))return '靓号';if(/套餐/.test(v))return '推荐套餐';return v||'';}
function fromName(v){const s=String(v??'').trim();const m=s.match(/[（(]\s*(\d+)\s*[）)]\s*$/);return {name:m?s.slice(0,m.index).trim():s,id:m?m[1]:''};}
function idkey(p,c,id){return [p,c,id].join('|');}
function safePlatform(s,fallback){s=String(s||'').trim().toUpperCase();if(s.includes('VONE'))return 'VONE';if(s.includes('POPPO'))return 'POPPO';return fallback;}
function csvRows(text){
 const out=[];let row=[],field='',quoted=false; text=text.replace(/^\ufeff/,'');
 for(let i=0;i<text.length;i++){
  const ch=text[i];if(quoted){if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=false;else field+=ch;continue;}
  if(ch==='"'){quoted=true;continue;}
  if(ch===','){row.push(field);field='';continue;}
  if(ch==='\r'||ch==='\n'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>String(x).trim()))out.push(row);row=[];field='';continue;}
  field+=ch;
 }
 row.push(field);if(row.some(x=>String(x).trim()))out.push(row);return out;
}
async function sheets(file){
 if(/\.csv$/i.test(file.name)){
  const b=await file.arrayBuffer();let text=new TextDecoder('utf-8').decode(b);
  if(text.includes('\ufffd'))text=new TextDecoder('gb18030').decode(b);
  return [{name:'CSV',rows:csvRows(text)}];
 }
 if(!window.XLSX)throw new Error('Excel解析组件未加载。请检查网络，或将文件保存为CSV后重试。');
 const w=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
 return w.SheetNames.map(name=>({name,rows:XLSX.utils.sheet_to_json(w.Sheets[name],{header:1,raw:true,defval:'',blankrows:false})}));
}
function storageGet(k,fallback){try{const v=JSON.parse(localStorage.getItem(k));return v??fallback;}catch(e){return fallback;}}
function storagePut(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){notice('浏览器本地存储空间不足，建议导出CSV备份。','danger');return false;}}
let catalog=storageGet(LS_CATALOG,{}),history=storageGet(LS_HISTORY,[]),orders=[],catalogIssues=[],orderIssues=[],orderFiles=[],issues=[],outcome=null;
function notice(t,kind=''){const e=$('v2Status');if(!e)return;e.textContent=t;e.className='v2-alert '+kind;}
function label(text,cls){return '<span class="v2-label '+cls+'">'+escape(text)+'</span>';}
function fmt(n){return Number(n||0).toLocaleString('zh-CN');}
function pct(n){return Number.isFinite(n)?(n*100).toFixed(1)+'%':'—';}
function inferType(fileName,sheetName){for(const v of [sheetName,fileName]){const c=cat(v);if(Object.keys(QUOTAS).includes(c))return c;}return '';}
function parseOrderRow(row,map,meta,fallback){
 const p=fromName(val(row,map,'item')),qty=number(val(row,map,'qty')),gq=number(val(row,map,'goldQty')),hq=number(val(row,map,'honorQty'));
 return {date:day(val(row,map,'date')),name:p.name,id:String(val(row,map,'id')||p.id).trim(),type:cat(val(row,map,'type')||fallback),
 qty,gq,hq,ga:number(val(row,map,'goldAmount')),ha:number(val(row,map,'honorAmount')),
 platform:safePlatform(val(row,map,'platform'),meta.platform),origin:meta.origin,line:meta.line,days:String(val(row,map,'days')).trim()};
}
function issue(kind,origin,line,message,level='warning'){return {kind,origin,line,message,level};}
async function loadOrders(files){
 if(!files.length)return;
 let all=[],errs=[],used=0;
 for(const f of files){let tabs;try{tabs=await sheets(f);}catch(e){errs.push(issue('文件读取失败',f.name,'—',e.message,'error'));continue;}
  let any=false;
  for(const t of tabs){const h=detect(t.rows,'orders');if(!h)continue;any=true;used++;
   const fallback=inferType(f.name,t.name);
   if(h.map.goldQty===undefined||h.map.honorQty===undefined)errs.push(issue('支付拆分缺失',f.name+' / '+t.name,h.at+1,'金币销量或荣誉券销量字段缺失；无法完成支付拆分校验','error'));
   for(let i=h.at+1;i<t.rows.length;i++){
    const line=t.rows[i];if(!line.some(x=>String(x).trim()))continue;
    const r=parseOrderRow(line,h.map,{origin:f.name+' / '+t.name,line:i+1,platform:$('v2Platform').value},fallback);
    if(!r.date||!r.name||!r.type||!Number.isInteger(r.qty)||r.qty<0||!r.id){
     errs.push(issue('订单字段异常',r.origin,r.line,'日期、商品ID、品类或非负整数销量缺失/不正确','error'));continue;
    }
    if([r.gq,r.hq,r.ga,r.ha].some(x=>x!==null&&(!Number.isFinite(x)||x<0)))errs.push(issue('支付金额或件数异常',r.origin,r.line,'存在无效负数或非法支付金额/销量','error'));
    if(r.gq!==null&&r.hq!==null&&(r.gq+r.hq!==r.qty))errs.push(issue('支付销量不符',r.origin,r.line,'总销量 '+r.qty+' ≠ 金币销量 '+r.gq+' + 荣誉券销量 '+r.hq,'error'));
    all.push(r);
   }
  }
  if(!any)errs.push(issue('无法识别表格',f.name,'—','未找到日期、商品名称、总销量表头；文件未计入','error'));
 }
 orders=all;orderIssues=errs;orderFiles=files.map(f=>f.name);
 $('v2OrderFiles').innerHTML=files.map(f=>'<span class="v2-file-chip">'+escape(f.name)+'</span>').join('');
 const periods=[...new Set(orders.map(r=>qkey(r.date)))].sort();
 const current=new Date(),today=[current.getFullYear(),String(current.getMonth()+1).padStart(2,'0'),String(current.getDate()).padStart(2,'0')].join('-');
 const valid=periods.filter(q=>qrange(q).end<today);
 $('v2Quarter').innerHTML=periods.map(q=>'<option value="'+q+'">'+qrange(q).label+(qrange(q).end>=today?'（未结束）':'')+'</option>').join('');
 $('v2Quarter').value=valid.at(-1)||periods.at(-1)||'';
 $('v2Run').disabled=!orders.length;
 if(orders.length){notice('已读取 '+files.length+' 个文件、'+used+' 个数据页、'+fmt(orders.length)+' 条订单统计记录。正在套用季度规则…');analyze();}
 else {notice('没有可分析的有效记录，请检查Excel表头和商品ID。','danger');renderIssues(errs);}
}
function isActiveStatus(s){s=String(s).trim().toLowerCase();return ['在售','上架','出售中','正常','售卖中','active','selling','on','1','true','enabled'].includes(s);}
function isSpecial(s){s=String(s||'').trim().toLowerCase();return !!s&&!['常规','普通','普通商品','常驻','无','否','normal','no','0'].includes(s);}
async function loadCatalog(files){
 if(!files.length)return;
 let next={...catalog},errs=[],seen=new Map(),found=0,okRows=0;
 for(const f of files){let tabs;try{tabs=await sheets(f);}catch(e){errs.push(issue('清单读取失败',f.name,'—',e.message,'error'));continue;}
  let matched=false;
  for(const t of tabs){
   const h=detect(t.rows,'catalog');if(!h)continue;matched=true;found++;
   for(let i=h.at+1;i<t.rows.length;i++){
    const row=t.rows[i];if(!row.some(x=>String(x).trim()))continue;
    const p=fromName(val(row,h.map,'item')),id=String(val(row,h.map,'id')||p.id).trim(),type=cat(val(row,h.map,'type')||inferType(f.name,t.name)),listed=day(val(row,h.map,'listed'));
    const status=String(val(row,h.map,'status')).trim(),special=String(val(row,h.map,'special')).trim(),end=day(val(row,h.map,'ended'));
    const platform=safePlatform(val(row,h.map,'platform'),$('v2Platform').value);
    if(!id||!type||!listed||!status){errs.push(issue('基础清单字段缺失',f.name+' / '+t.name,i+1,'需要商品ID、商品类型、上架日期、在售状态','error'));continue;}
    const o={id,type,name:p.name,listed,status,special,ended:end,platform,source:f.name};
    const key=idkey(platform,type,id);
    if(seen.has(key)){
     const prev=seen.get(key);if(prev.listed!==o.listed||prev.status!==o.status)errs.push(issue('基础清单冲突',f.name+' / '+t.name,i+1,'同一商品ID有不同上架日期/状态','error'));
    }
    seen.set(key,o);next[key]=o;okRows++;
   }
  }
  if(!matched)errs.push(issue('无法识别基础清单',f.name,'—','需含商品ID/名称、品类、上架日期、在售状态','error'));
 }
 if(!found){catalogIssues=errs;notice('没有找到有效商品基础清单，请核对表头。','danger');renderIssues(errs);return;}
 // If a complete replacement source omits a previously marked product, preserve it only as historical reference.
 catalog=next;catalogIssues=errs;storagePut(LS_CATALOG,catalog);renderCatalog();
 notice('基础清单已保存到本浏览器：本次识别'+okRows+'行，当前累计'+Object.keys(catalog).length+'个商品。'+(errs.length?'部分记录存在异常，请核对。':''),errs.length?'':'good');
 if(orders.length)analyze();
}
function renderCatalog(){
 const all=Object.values(catalog),p=$('v2Platform').value,selected=all.filter(x=>x.platform===p);
 $('v2CatalogStatus').textContent=selected.length?'已保存 '+selected.length+' 个'+p+'商品（跨批次复用）':'尚无'+p+'商品基础清单：无法识别零销量商品、上架时间和在售状态。';
 $('v2CatalogStatus').className='v2-alert '+(selected.length?'good':'');
}
function analyze(){
 if(!orders.length)return;
 const sel=$('v2Quarter').value,rng=qrange(sel);if(!rng){notice('请选择季度。','danger');return;}
 const platform=$('v2Platform').value,now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const warnings=[],blocks=[],r0=orders.filter(r=>r.platform===platform&&r.date>=rng.start&&r.date<=rng.end);
 const rangeEnds=r0.map(x=>x.date).sort();
 if(rng.end>=today)blocks.push('本季度尚未结束，不能生成正式下架名单');
 if(!r0.length)blocks.push('所选平台与季度没有订单记录');
 if(rangeEnds.length&&(rangeEnds[0]>rng.start||rangeEnds.at(-1)<rng.end))warnings.push('本季度首尾有无记录日期，可能是零成交或导出缺失，需与后台对账');
 const perDay=new Set(r0.map(x=>x.date));if(perDay.size<rng.days)warnings.push('季度内 '+(rng.days-perDay.size)+' 天没有任何记录；无法仅凭订单确定是零销量还是漏导');
 const priorIssues=orderIssues.filter(e=>e.level==='error');
 if(priorIssues.length)blocks.push('原始文件有 '+priorIssues.length+' 项关键字段或支付拆分错误');
 const seen=new Map(),valid=[],dedup=[],clash=[];
 const metrics=['qty','gq','hq','ga','ha'];
 for(const r of r0){
  const k=[r.platform,r.date,r.type,r.id,r.days].join('|');
  if(!seen.has(k)){seen.set(k,r);valid.push(r);continue;}
  const old=seen.get(k),same=metrics.every(n=>old[n]===r[n]);
  const err=issue(same?'完全重复':'相同维度数值冲突',r.origin,r.line,'对应 '+old.origin+' 第'+old.line+'行'+(same?'；临时仅保留一条':'；两行统计值不同，暂停正式建议'),same?'warning':'error');
  (same?dedup:clash).push(err);
 }
 if(dedup.length)warnings.push('发现'+dedup.length+'条完全相同的疑似重复记录，已经按汇总维度临时去重');
 if(clash.length)blocks.push('发现'+clash.length+'条同维度冲突记录');
 const catRows=Object.values(catalog).filter(x=>x.platform===platform&&Object.keys(QUOTAS).includes(x.type));
 const inQuarter=catRows.filter(x=>isActiveStatus(x.status)&&x.listed<=rng.end&&(!x.ended||x.ended>=rng.end)&&!isSpecial(x.special));
 if(!catRows.length)blocks.push('没有当前平台的商品基础清单；零销量SKU和新品资格无法确认');
 if(!inQuarter.length&&catRows.length)blocks.push('基础清单中没有本季度可评估的常规在售商品');
 const catalogByKey=new Map(inQuarter.map(x=>[idkey(platform,x.type,x.id),x]));
 let missingCatalog=new Set();
 for(const r of valid){if(!Object.keys(QUOTAS).includes(r.type))continue; if(!catalogByKey.has(idkey(r.platform,r.type,r.id)))missingCatalog.add(idkey(r.platform,r.type,r.id));}
 if(missingCatalog.size)warnings.push('订单内有'+missingCatalog.size+'个SKU不在当期常规在售清单中（可能是本期已下架、活动商品或清单漏项）');
 // Catalog is a snapshot. Historical delisted items may be absent, which is expected. We do not rank them.
 const orderAgg=new Map();
 for(const r of valid){
  const k=idkey(r.platform,r.type,r.id);if(!orderAgg.has(k))orderAgg.set(k,{qty:0,days:new Set(),last:0,prev:0});
  const t=orderAgg.get(k);t.qty+=r.qty;if(r.qty>0)t.days.add(r.date);
  if(r.date>=plus(rng.end,-29))t.last+=r.qty;
  else if(r.date>=plus(rng.end,-89))t.prev+=r.qty;
 }
 let eligible=[],ineligible=[],notStarted=0;
 const minListed=plus(rng.end,-179);
 for(const c of inQuarter){
  const listedDays=between(c.listed,rng.end),saleStart=c.listed>rng.start?c.listed:rng.start,saleDays=between(saleStart,rng.end);
  const a=orderAgg.get(idkey(platform,c.type,c.id))||{qty:0,days:new Set(),last:0,prev:0};
  const item={...c,qty:a.qty,activeDays:a.days.size,saleDays,activeRate:saleDays?a.days.size/saleDays:0,last:a.last,prev:a.prev,rankQty:0,rankActive:0,grade:'C',reason:'未命中双重低效',rankTotal:0};
  if(listedDays>=180&&c.listed<=rng.start)eligible.push(item);
  else{ineligible.push(item);if(listedDays<90)notStarted++;}
 }
 if(!eligible.length)blocks.push('当前季度没有符合上架满180天条件的商品');
 const totals={},grades={A:[],B:[],C:[]};
 const known=Object.keys(QUOTAS);
 for(const type of known){
  const xs=eligible.filter(x=>x.type===type),n=xs.length,cut=Math.ceil(n*.25);
  totals[type]={eligible:n,lowBoth:0,a:0,b:0,c:0,quota:QUOTAS[type][1],newSku:QUOTAS[type][0]*3,allCatalog:inQuarter.filter(x=>x.type===type).length};
  if(!n)continue;
  const bySales=xs.slice().sort((a,b)=>a.qty-b.qty||a.id.localeCompare(b.id,undefined,{numeric:true}));
  const byActive=xs.slice().sort((a,b)=>a.activeRate-b.activeRate||a.id.localeCompare(b.id,undefined,{numeric:true}));
  const lowSales=new Set(bySales.slice(0,cut).map(x=>x.id)),lowActive=new Set(byActive.slice(0,cut).map(x=>x.id));
  bySales.forEach((x,i)=>x.rankQty=i+1);byActive.forEach((x,i)=>x.rankActive=i+1);
  for(const x of xs){
   const v=x.prev/2;const recovery=x.last>=5&&(v===0||x.last>=v*1.2);
   x.lowQty=lowSales.has(x.id);x.lowActive=lowActive.has(x.id);x.recovery=recovery;
   x.double=x.lowQty&&x.lowActive;if(x.double)totals[type].lowBoth++;
   if(x.double&&!recovery){x.grade='A';x.reason='季度销量后25% + 成交活跃度后25% + 近30天无明显回升';}
   else if(x.lowQty||x.lowActive){x.grade='B';x.reason=x.double&&recovery?'近30天需求明显回升':(x.lowQty?'季度销量后25%':'成交活跃度后25%');}
   else{x.grade='C';}
   grades[x.grade].push(x);
  }
 }
 const sorter=(a,b)=>a.activeDays-b.activeDays||a.qty-b.qty||a.id.localeCompare(b.id,undefined,{numeric:true});
 const recommendations=[];
 for(const type of known){
  const arr=grades.A.filter(x=>x.type===type).sort(sorter),limit=totals[type].quota;
  arr.forEach((x,i)=>{if(i<limit){recommendations.push(x);totals[type].a++;}else{x.grade='B';x.reason='符合下架条件，但超过品类本季度配额';grades.B.push(x);}});
  totals[type].b=grades.B.filter(x=>x.type===type).length;
  totals[type].c=grades.C.filter(x=>x.type===type).length;
 }
 const allIssues=[...orderIssues,...catalogIssues,...dedup,...clash];
 const formal=blocks.length===0;
 if(!formal)warnings.push('数据未满足正式输出条件，以下仅显示待核验分析，不应直接执行下架');
 if(!catRows.length){
  // No catalog: show observed SKU analysis, but never claim that ranking is complete.
  recommendations.length=0;
 }
 outcome={sel,range:rng,platform,formal,blocks,warnings,totals,recommendations,eligible,ineligible,issues:allIssues,orderCount:r0.length,dedup:dedup.length,conflict:clash.length,distinct:perDay.size,notStarted,processed:valid.length};
 renderAll();
}
function renderAll(){
 if(!outcome)return;
 const x=outcome;
 $('v2Results').hidden=false;
 $('v2Summary').innerHTML=[
  ['分析季度',x.range.label],['在售符合资格',fmt(x.eligible.length)+'个'],['低效双重命中',fmt(Object.values(x.totals).reduce((a,b)=>a+b.lowBoth,0))+'个'],['建议下架',x.formal?fmt(x.recommendations.length)+'个':'待核验'],['季度下架上限','28个']
 ].map(([title,value])=>'<div class="v2-metric"><small>'+escape(title)+'</small><strong>'+escape(value)+'</strong></div>').join('');
 const desc=[...x.blocks,...x.warnings];
 $('v2Quality').className='v2-alert '+(x.formal?'good':'danger');
 $('v2Quality').innerHTML='<b>'+(x.formal?'✅ 数据结构检查通过，已生成本季度数据推荐名单':'⚠️ 数据不完整，暂停正式下架建议')+'</b><div>'+escape(desc.length?desc.join('；'):'检查未发现关键错误。仍需确保来源导出完整、数据真实。')+'</div><small>数据来源：'+escape(orderFiles.join('、')||'—')+'；有效统计 '+x.distinct+'/'+x.range.days+' 天；重复 '+x.dedup+' 条、冲突 '+x.conflict+' 条。</small>';
 $('v2Overview').innerHTML=Object.entries(x.totals).map(([type,v])=>'<tr><td><b>'+type+'</b></td><td>'+v.newSku+'</td><td>'+v.quota+'</td><td>'+v.eligible+'</td><td>'+v.lowBoth+'</td><td><b>'+ (x.formal?v.a:'待核验') +'</b></td><td>'+(x.formal?v.newSku-v.a:'—')+'</td></tr>').join('')+
 '<tr><td><b>合计</b></td><td>51</td><td>28</td><td>'+x.eligible.length+'</td><td>'+Object.values(x.totals).reduce((a,b)=>a+b.lowBoth,0)+'</td><td><b>'+(x.formal?x.recommendations.length:'待核验')+'</b></td><td>'+(x.formal?51-x.recommendations.length:'—')+'</td></tr>';
 $('v2CandidateCaption').textContent=x.formal?'本期符合规则的下架商品（按品类配额截取）':'待核验预览：必须完成基础清单及数据校验后才能执行下架';
 const options=x.recommendations.length?x.recommendations:[];
 const sel=$('v2FilterCat').value;let term=$('v2FilterText').value.trim().toLowerCase();
 const shown=options.filter(v=>(!sel||v.type===sel)&&(!term||v.name.toLowerCase().includes(term)||v.id.includes(term)));
 $('v2CandidateRows').innerHTML=shown.length?shown.map(v=>'<tr><td>'+label(x.formal?'建议下架':'待核验',x.formal?'a':'hold')+'</td><td><b>'+escape(v.name)+'</b><br><small>ID '+escape(v.id)+'</small></td><td>'+escape(v.type)+'</td><td>'+fmt(v.qty)+'</td><td>'+v.activeDays+'/'+v.saleDays+'（'+pct(v.activeRate)+'）</td><td>'+v.rankQty+'/'+x.totals[v.type].eligible+'</td><td>'+v.rankActive+'/'+x.totals[v.type].eligible+'</td><td>'+fmt(v.last)+'</td><td>'+escape(v.reason)+'</td></tr>').join(''):'<tr><td colspan="9" class="v2-empty">本季度没有满足所有筛选条件的建议下架商品</td></tr>';
 $('v2CandidateCount').textContent='显示 '+shown.length+' 条';
 const others=[...x.eligible.filter(v=>v.grade==='B')].sort((a,b)=>a.type.localeCompare(b.type)||a.activeDays-b.activeDays||a.qty-b.qty);
 $('v2ObserveRows').innerHTML=others.slice(0,120).map(v=>'<tr><td>'+label('持续观察','b')+'</td><td><b>'+escape(v.name)+'</b><br><small>'+escape(v.id)+'</small></td><td>'+escape(v.type)+'</td><td>'+fmt(v.qty)+'</td><td>'+v.activeDays+'天</td><td>'+fmt(v.last)+'</td><td>'+escape(v.reason)+'</td></tr>').join('')||'<tr><td colspan="7">暂无观察商品</td></tr>';
 $('v2ObserveInfo').textContent='共'+others.length+'条（展示前120条）';
 renderIssues(x.issues);
 $('v2Download').disabled=!x.formal||!x.recommendations.length;
 $('v2Save').disabled=!x.formal;
 renderHistory();
}
function renderIssues(list){
 $('v2ErrorRows').innerHTML=(list||[]).slice(0,80).map(i=>'<tr><td>'+label(i.level==='error'?'阻断':'提示',i.level==='error'?'a':'b')+'</td><td>'+escape(i.kind)+'</td><td>'+escape(i.origin)+' · 行'+escape(i.line)+'</td><td>'+escape(i.message)+'</td></tr>').join('')||'<tr><td colspan="4">未发现字段级异常</td></tr>';
 $('v2ErrorInfo').textContent=(list||[]).length+'条异常 / 提示（展示前80条）';
}
function csvSave(filename,headers,data){
 const line=a=>a.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',');
 const blob=new Blob(['\ufeff'+[headers,...data].map(line).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),800);
}
function downloadList(){
 if(!outcome||!outcome.formal)return;
 const x=outcome;
 csvSave('商城季度下架清单_'+x.platform+'_'+x.sel+'.csv',['季度','平台','商品类型','商品ID','商品名称','季度销量','成交天数','有效可售天数','成交活跃度','销量排名','活跃度排名','近30天销量','前60天总销量','下架依据'],
 x.recommendations.map(v=>[x.sel,x.platform,v.type,v.id,v.name,v.qty,v.activeDays,v.saleDays,pct(v.activeRate),v.rankQty,v.rankActive,v.last,v.prev,v.reason]));
}
function downloadIssues(){
 if(!outcome)return;csvSave('商城数据质量_'+outcome.sel+'.csv',['级别','异常类型','文件','行号','详情'],outcome.issues.map(i=>[i.level,i.kind,i.origin,i.line,i.message]));
}
function exportCatalog(){
 const all=Object.values(catalog);csvSave('商城商品基础清单.csv',['平台','商品类型','商品ID','商品名称','上架日期','在售状态','特殊类型','停止售卖日期'],all.map(x=>[x.platform,x.type,x.id,x.name,x.listed,x.status,x.special,x.ended]));
}
function saveHistory(){
 if(!outcome||!outcome.formal)return;
 const x=outcome,record={id:x.platform+'|'+x.sel,platform:x.platform,quarter:x.sel,time:new Date().toISOString(),eligible:x.eligible.length,total:x.recommendations.length,items:x.recommendations.map(v=>({type:v.type,id:v.id,name:v.name,qty:v.qty,activeDays:v.activeDays,rate:v.activeRate})),totals:Object.fromEntries(Object.entries(x.totals).map(([k,v])=>[k,{quota:v.quota,actual:v.a}]))};
 history=[record,...history.filter(z=>z.id!==record.id)].slice(0,24);storagePut(LS_HISTORY,history);renderHistory();notice(x.sel+' 分析结果已保存到本浏览器，可在历史记录中查看。','good');
}
function renderHistory(){
 $('v2History').innerHTML=history.length?history.map(r=>'<tr><td>'+escape(r.quarter)+'</td><td>'+escape(r.platform)+'</td><td>'+r.eligible+'</td><td><b>'+r.total+'</b></td><td>'+escape(r.time.slice(0,16).replace('T',' '))+'</td></tr>').join(''):'<tr><td colspan="5">暂无历史批次。分析通过后点击“保存本期结果”。</td></tr>';
}
function setupDrop(zoneId,inputId,handler){
 const zone=$(zoneId),input=$(inputId);
 zone.addEventListener('click',()=>input.click());zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();}});
 ['dragover','dragenter'].forEach(t=>zone.addEventListener(t,e=>{e.preventDefault();zone.classList.add('drag');}));
 ['dragleave','drop'].forEach(t=>zone.addEventListener(t,e=>{e.preventDefault();zone.classList.remove('drag');}));
 zone.addEventListener('drop',e=>handler([...e.dataTransfer.files]));
 input.addEventListener('change',()=>{handler([...input.files]);input.value='';});
}
setupDrop('v2OrderDrop','v2OrderInput',async files=>{notice('正在解析订单文件…');try{await loadOrders(files.filter(f=>/\.(csv|xls|xlsx)$/i.test(f.name)));}catch(e){notice('订单解析失败：'+e.message,'danger');}});
setupDrop('v2CatalogDrop','v2CatalogInput',async files=>{notice('正在整理商品基础清单…');try{await loadCatalog(files.filter(f=>/\.(csv|xls|xlsx)$/i.test(f.name)));}catch(e){notice('基础清单解析失败：'+e.message,'danger');}});
$('v2Quarter').addEventListener('change',analyze);$('v2Run').addEventListener('click',analyze);
$('v2Platform').addEventListener('change',()=>{renderCatalog();if(orders.length)analyze();});
$('v2FilterCat').addEventListener('change',()=>{if(outcome)renderAll();});
$('v2FilterText').addEventListener('input',()=>{if(outcome)renderAll();});
$('v2Download').addEventListener('click',downloadList);
$('v2DownloadIssues').addEventListener('click',downloadIssues);
$('v2Save').addEventListener('click',saveHistory);
$('v2DownloadCatalog').addEventListener('click',exportCatalog);
$('v2ClearCatalog').addEventListener('click',()=>{
 if(!confirm('确认清除当前平台的商品基础清单？其他平台不受影响。'))return;
 const p=$('v2Platform').value;catalog=Object.fromEntries(Object.entries(catalog).filter(([k,v])=>v.platform!==p));
 storagePut(LS_CATALOG,catalog);renderCatalog();if(orders.length)analyze();
});
renderCatalog();renderHistory();
})();
