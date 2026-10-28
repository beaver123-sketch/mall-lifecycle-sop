(()=>{'use strict';
const $=x=>document.getElementById(x);
const TYPES=['头像框','派对背景','资料卡','聊天气泡','座驾'];
const QUOTAS={'头像框':[12,8],'派对背景':[12,10],'资料卡':[12,5],'聊天气泡':[12,4],'座驾':[3,1]};
const KEY_NEW='mall-sop-v31-new',KEY_DOWN='mall-sop-v31-delisted',KEY_HIST='mall-sop-v31-history';
const ALIASES={date:['日期','统计日期','下单日期','交易日期','购买日期','date','day'],
type:['商品类型','品类','商品类别','道具类型','类型','category','type'],
name:['商品名称','商品名','道具名称','道具','商品','productname','itemname'],
id:['商品id','道具id','商品编号','sku','skuid','itemid','productid'],
qty:['总销量','销量','销售数量','商品销量','销售件数','总销售量','购买数量','quantity','totalqty'],
gq:['金币销量','金币支付件数','金币购买件数','金币购买数量'],
hq:['荣誉券销量','荣誉券支付件数','荣誉券购买件数','荣誉券购买数量'],
ga:['金币金额','销售金币','金币收入','总销售金币'],
ha:['荣誉券金额','销售荣誉券','荣誉券收入','总销售荣誉券'],
term:['购买天数','购买期限','有效天数','天数','duration'],
platform:['平台','平台名称','所属平台','app']};
const norm=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[\s_\-—()（）【】[\]：:]/g,'');
const H=Object.fromEntries(Object.entries(ALIASES).map(([k,v])=>[k,new Set(v.map(norm))]));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=v=>Number(v||0).toLocaleString('zh-CN');
const ratio=v=>Number.isFinite(v)?(v*100).toFixed(1)+'%':'—';
const get=(r,m,k)=>m[k]===undefined?'':(r[m[k]]??'');
const $local=(key,def)=>{try{return JSON.parse(localStorage.getItem(key))??def;}catch(e){return def;}};
function save(key,val){try{localStorage.setItem(key,JSON.stringify(val));return true;}catch(e){msg('本机存储空间不足，请先导出备份','danger');return false;}}
function msg(t,k=''){$('v2Status').textContent=t;$('v2Status').className='v2-alert '+k;}
function date(v){if(typeof v==='number'&&v>20000&&v<80000)return new Date(Date.UTC(1899,11,30)+Math.floor(v)*86400000).toISOString().slice(0,10);
const m=String(v??'').trim().match(/^(\d{4})[\/.\-年](\d{1,2})[\/.\-月](\d{1,2})/);if(!m)return '';
const y=+m[1],mon=+m[2],d=+m[3],t=new Date(Date.UTC(y,mon-1,d));
return t.getUTCFullYear()===y&&t.getUTCMonth()+1===mon&&t.getUTCDate()===d?y+'-'+String(mon).padStart(2,'0')+'-'+String(d).padStart(2,'0'):'';}
function plus(s,n){const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function qrange(q){const m=/^(\d{4})-Q([1-4])$/.exec(q);if(!m)return null;const y=+m[1],n=+m[2],start=new Date(Date.UTC(y,3*n-3,1)).toISOString().slice(0,10),end=new Date(Date.UTC(y,3*n,0)).toISOString().slice(0,10);return {y,n,start,end,months:[n*3-2,n*3-1,n*3],days:Math.round((Date.parse(end)-Date.parse(start))/86400000)+1};}
function prevQ(q){const r=qrange(q);return !r?'':r.n===1?(r.y-1)+'-Q4':r.y+'-Q'+(r.n-1);}
function typeOf(s){s=String(s||'').trim();if(/派对背景|派对主题/.test(s))return '派对背景';if(/头像框|相框/.test(s))return '头像框';if(/资料卡/.test(s))return '资料卡';if(/聊天气泡|气泡/.test(s))return '聊天气泡';if(/座驾/.test(s))return '座驾';return s;}
function extract(s){s=String(s||'').trim();const m=s.match(/[（(]\s*(\d+)\s*[）)]\s*$/);return {id:m?m[1]:'',name:m?s.slice(0,m.index).trim():s};}
function numeric(s){if(s===null||s===undefined||String(s).trim()==='')return null;const v=String(s).replace(/[,，\s]/g,'');return /^-?\d+(\.\d+)?$/.test(v)?Number(v):NaN;}
function header(matrix){for(let i=0;i<Math.min(matrix.length,35);i++){const m={};(matrix[i]||[]).forEach((x,j)=>{const v=norm(x);for(const [k,s] of Object.entries(H))if(m[k]===undefined&&s.has(v))m[k]=j;});if(m.date!==undefined&&m.name!==undefined&&m.qty!==undefined)return {i,m};}return null;}
function csvRows(src){let result=[],line=[],cell='',q=false;src=src.replace(/^\uFEFF/,'');for(let i=0;i<src.length;i++){let c=src[i];if(q){if(c==='"'&&src[i+1]==='"'){cell+='"';i++;}else if(c==='"')q=false;else cell+=c;}else if(c==='"')q=true;else if(c===','){line.push(cell);cell='';}else if(c==='\r'||c==='\n'){if(c==='\r'&&src[i+1]==='\n')i++;line.push(cell);if(line.some(x=>String(x).trim()))result.push(line);line=[];cell='';}else cell+=c;}line.push(cell);if(line.some(x=>String(x).trim()))result.push(line);return result;}
async function workbook(file){const buf=await file.arrayBuffer();if(/\.csv$/i.test(file.name)){let raw=new TextDecoder('utf-8').decode(buf);if(raw.includes('\ufffd'))raw=new TextDecoder('gb18030').decode(buf);return [{name:'CSV',rows:csvRows(raw)}];}
if(!window.XLSX)throw Error('Excel解析组件未加载，请刷新网页或上传CSV文件');
const book=XLSX.read(buf,{type:'array',cellDates:false});return book.SheetNames.map(n=>({name:n,rows:XLSX.utils.sheet_to_json(book.Sheets[n],{header:1,raw:true,defval:'',blankrows:false})}));}
function problem(kind,source,line,reason,fatal=false){return {kind,source,line,reason,fatal};}
async function parseFile(file,platform,ym){let rows=[],issues=[],tabs=0;
for(const tab of await workbook(file)){const h=header(tab.rows);if(!h)continue;tabs++;
const fallback=[tab.name,file.name].map(typeOf).find(x=>TYPES.includes(x))||'';
if(h.m.gq===undefined||h.m.hq===undefined)issues.push(problem('支付拆分字段缺失',file.name+'/'+tab.name,h.i+1,'缺少金币或荣誉券销量列',true));
for(let j=h.i+1;j<tab.rows.length;j++){const raw=tab.rows[j];if(!raw.some(x=>String(x).trim()))continue;
const product=extract(get(raw,h.m,'name')),id=String(get(raw,h.m,'id')||product.id).trim(),dt=date(get(raw,h.m,'date')),cat=typeOf(get(raw,h.m,'type')||fallback),
qty=numeric(get(raw,h.m,'qty')),gq=numeric(get(raw,h.m,'gq')),hq=numeric(get(raw,h.m,'hq')),ga=numeric(get(raw,h.m,'ga')),ha=numeric(get(raw,h.m,'ha')),
src=file.name+'/'+tab.name,lin=j+1,provided=String(get(raw,h.m,'platform')).toUpperCase();
if(!dt||!id||!cat||!product.name||!Number.isInteger(qty)||qty<0){issues.push(problem('关键字段异常',src,lin,'日期/商品ID/品类/非负整数销量无法识别',true));continue;}
if(dt.slice(0,7)!==ym){issues.push(problem('月份不符',src,lin,'订单日期'+dt+'不在选定月份'+ym+'内',true));continue;}
if(provided&&((provided.includes('VONE')&&platform!=='VONE')||(provided.includes('POPPO')&&platform!=='POPPO'))){issues.push(problem('平台不符',src,lin,'导出数据平台与上传平台不一致',true));continue;}
if([gq,hq,ga,ha].some(v=>v!==null&&(!Number.isFinite(v)||v<0))||[gq,hq].some(v=>v!==null&&!Number.isInteger(v))){issues.push(problem('支付数据错误',src,lin,'支付件数或金额存在非法数字',true));continue;}
if(gq!==null&&hq!==null&&gq+hq!==qty){issues.push(problem('支付件数不符',src,lin,qty+'件总销量与两种支付渠道加总不一致',true));continue;}
rows.push({date:dt,id,cat,name:product.name,qty,gq,hq,ga,ha,term:String(get(raw,h.m,'term')||''),source:src,line:lin});
}}
if(!tabs)issues.push(problem('无法识别表格',file.name,'—','缺少日期/商品名称/总销量等关键列',true));
return {name:file.name,size:file.size,rows,issues,tabs,blob:file};}
function openDb(){return new Promise((resolve,reject)=>{if(!window.indexedDB){reject(Error('浏览器不支持本地数据库，月度文件不能保存'));return;}
const req=indexedDB.open('mall-month-archive-v3',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('data'))req.result.createObjectStore('data',{keyPath:'key'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
let db=null,year=2026,platform='POPPO',month=1,months=new Map(),results=null,launches=$local(KEY_NEW,{}),delisted=$local(KEY_DOWN,{}),history=$local(KEY_HIST,[]);
if(!Array.isArray(history))history=[];
const monthKey=(p,y,m)=>p+'|'+y+'-'+String(m).padStart(2,'0');
const downKey=(p,t,id)=>p+'|'+t+'|'+id;
function database(mode,cb){return new Promise((resolve,reject)=>{const tx=db.transaction('data',mode),req=cb(tx.objectStore('data'));let value;req.onsuccess=()=>value=req.result;req.onerror=()=>reject(req.error);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);});}
const readAll=()=>database('readonly',s=>s.getAll()),readOne=k=>database('readonly',s=>s.get(k)),writeOne=v=>database('readwrite',s=>s.put(v)),deleteOne=k=>database('readwrite',s=>s.delete(k));
const activeMonth=m=>months.get(monthKey(platform,year,m));
async function refresh(){months=new Map((await readAll()).filter(x=>x.platform===platform&&x.ym.startsWith(year+'-')).map(x=>[x.key,x]));drawMonths();}
function drawMonths(){
$('v23Months').innerHTML=Array.from({length:12},(_,i)=>{const m=i+1,f=activeMonth(m)?.files||[],count=f.reduce((a,x)=>a+x.rows.length,0),bad=f.reduce((a,x)=>a+x.issues.filter(v=>v.fatal).length,0);
return '<button type="button" class="v23-month '+(month===m?'selected ':'')+(f.length?'filled':'')+'" data-month="'+m+'"><b>'+String(m).padStart(2,'0')+'月</b><span>'+(f.length?f.length+'份 · '+format(count)+'行':'未上传')+'</span><small class="'+(bad?'v23-bad':'')+'">'+(bad?bad+'项异常':f.length?'已保存':'选择月份')+'</small></button>';}).join('');
$('v23SelectedMonth').textContent=year+'年'+month+'月 · 订单数据';
$('v2OrderFiles').innerHTML=(activeMonth(month)?.files||[]).map(f=>'<span class="v23-file-row">'+esc(f.name)+'（'+format(f.rows.length)+'行）<button data-remove-file="'+esc(f.name)+'" title="删除该文件">×</button></span>').join('');
}
function launchKey(p,q){return p+'|'+q;}
function launchSet(p,q){const v=launches[launchKey(p,q)]||{};return Object.fromEntries(TYPES.map(t=>[t,new Set(v[t]||[])]));}
function launchFields(){return [...document.querySelectorAll('.v23-new-id')];}
function showLaunches(){const q=$('v2Quarter').value,sets=launchSet(platform,q);launchFields().forEach(el=>el.value=[...sets[el.dataset.category]].join('，'));$('v23NewStatus').textContent=q+' · '+TYPES.reduce((a,t)=>a+sets[t].size,0)+'个新品';}
function storeLaunches(){const q=$('v2Quarter').value;const v={};launchFields().forEach(el=>v[el.dataset.category]=[...new Set((el.value.match(/\d+/g)||[]).map(x=>String(Number(x))).filter(x=>x!=='0'))]);launches[launchKey(platform,q)]=v;save(KEY_NEW,launches);showLaunches();analyze();msg('上新商品ID已保存，并重新计算下架候选','good');}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),900);}
function toCsv(name,header,rows){const quote=x=>{let s=String(x??'');if(/^[=+@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};download(new Blob(['\ufeff'+[header,...rows].map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),name);}
let uploading=false;
async function upload(files){files=files.filter(f=>/\.(xlsx|xls|csv)$/i.test(f.name));if(!files.length||uploading)return;uploading=true;$('v23Upload').disabled=true;const ym=year+'-'+String(month).padStart(2,'0');
try{msg('正在解析并保存 '+ym+' 的'+files.length+'份数据…');const k=monthKey(platform,year,month),old=await readOne(k),map=new Map((old?.files||[]).map(f=>[f.name.toLowerCase(),f]));
for(const file of files){const parsed=await parseFile(file,platform,ym);map.set(file.name.toLowerCase(),parsed);}
await writeOne({key:k,platform,ym,files:[...map.values()],savedAt:new Date().toISOString()});
await refresh();$('v2Quarter').value=year+'-Q'+Math.ceil(month/3);showLaunches();analyze();msg(ym+' 已保存'+files.length+'个文件。重新上传同名文件会替换旧文件。','good');
}catch(e){msg('文件上传或保存失败：'+e.message,'danger');}finally{uploading=false;$('v23Upload').disabled=false;}}
async function removeFile(name){const k=monthKey(platform,year,month),rec=await readOne(k);if(!rec)return;rec.files=rec.files.filter(f=>f.name!==name);if(rec.files.length)await writeOne(rec);else await deleteOne(k);await refresh();analyze();msg('已删除 '+name,'good');}
async function clearMonth(){if(!activeMonth(month))return;if(!confirm('确定清空'+year+'年'+month+'月的订单吗？'))return;await deleteOne(monthKey(platform,year,month));await refresh();analyze();}
function downloadMonth(){const data=(activeMonth(month)?.files||[]).flatMap(f=>f.rows);if(!data.length){msg('当前月份没有可导出的数据','danger');return;}
toCsv('商城订单_'+platform+'_'+year+'-'+String(month).padStart(2,'0')+'.csv',['日期','商品类型','商品ID','商品名称','总销量','金币销量','荣誉券销量','金币金额','荣誉券金额','购买天数'],data.map(r=>[r.date,r.cat,r.id,r.name,r.qty,r.gq,r.hq,r.ga,r.ha,r.term]));}
async function backupYear(){const data=(await readAll()).filter(x=>x.platform===platform&&x.ym.startsWith(year+'-')).map(x=>({...x,files:x.files.map(({blob,...rest})=>rest)}));
const exportData={format:'mall-sop-monthly-v3',version:1,year,platform,months:data,launches:Object.fromEntries(Object.entries(launches).filter(([k])=>k.startsWith(platform+'|'+year+'-'))),delisted:Object.values(delisted).filter(x=>x.platform===platform),history:history.filter(x=>x.platform===platform)};
download(new Blob([JSON.stringify(exportData)],{type:'application/json'}),'商城年度备份_'+platform+'_'+year+'.json');msg('年度数据备份已下载，包含各月订单、上新ID、已下架记录','good');}
async function restoreYear(file){const d=JSON.parse(await file.text());if(d?.format!=='mall-sop-monthly-v3'||!Array.isArray(d.months)||!Array.isArray(d.delisted)||!['POPPO','VONE'].includes(d.platform)||!Number.isInteger(d.year))throw Error('备份格式错误');
if(!confirm('恢复 '+d.platform+' '+d.year+'年度数据？同月份会覆盖当前保存的数据。'))return;
for(const x of d.months){if(x.platform!==d.platform||!String(x.ym).startsWith(d.year+'-')||!Array.isArray(x.files))throw Error('备份月份格式不符');await writeOne({...x,key:monthKey(d.platform,d.year,+x.ym.slice(-2))});}
Object.assign(launches,d.launches);save(KEY_NEW,launches);for(const x of d.delisted)if(x.id&&x.type)delisted[downKey(x.platform,x.type,x.id)]=x;save(KEY_DOWN,delisted);
for(const x of d.history||[])if(x.platform&&x.quarter)history=[x,...history.filter(v=>v.platform!==x.platform||v.quarter!==x.quarter)];save(KEY_HIST,history);
year=d.year;platform=d.platform;$('v23Year').value=year;$('v2Platform').value=platform;updateQuarter();await refresh();showLaunches();renderDelisted();analyze();msg('已恢复'+year+'年的月度订单及上下架记录','good');}
function downRecords(){return Object.values(delisted).filter(x=>x.platform===platform).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id,undefined,{numeric:true}));}
let editKey='';
function resetDown(){$('v23DelistForm').reset();$('v23DelistDate').value=new Date().toLocaleDateString('en-CA');$('v23SaveDelist').textContent='保存下架记录';$('v23CancelDelist').hidden=true;editKey='';}
function editDown(r){editKey=downKey(r.platform,r.type,r.id);$('v23DelistType').value=r.type;$('v23DelistId').value=r.id;$('v23DelistName').value=r.name||'';$('v23DelistDate').value=r.date;$('v23DelistNote').value=r.note||'';$('v23SaveDelist').textContent='更新记录';$('v23CancelDelist').hidden=false;$('v23-delisted').scrollIntoView({behavior:'smooth',block:'start'});}
function renderDelisted(){const a=downRecords(),q=$('v23DelistSearch').value.toLowerCase().trim(),t=$('v23DelistFilter').value;const rows=a.filter(x=>(!t||x.type===t)&&(!q||[x.id,x.name,x.note].some(v=>String(v||'').toLowerCase().includes(q))));
$('v23DelistedCount').textContent='已记录 '+a.length+' 个';
$('v23DelistedRows').innerHTML=rows.map(x=>'<tr><td><b>'+esc(x.id)+'</b></td><td>'+esc(x.name||'—')+'</td><td>'+esc(x.type)+'</td><td>'+esc(x.date)+'</td><td>'+esc(x.note||'—')+'</td><td><button type="button" class="v23-row-button" data-edit="'+esc(downKey(x.platform,x.type,x.id))+'">编辑</button><button type="button" class="v23-row-button warn" data-delete="'+esc(downKey(x.platform,x.type,x.id))+'">删除</button></td></tr>').join('')||'<tr><td colspan="6" class="v2-empty">暂无已下架记录</td></tr>';}
function saveDown(e){e.preventDefault();const type=$('v23DelistType').value,id=$('v23DelistId').value.trim(),name=$('v23DelistName').value.trim(),dt=$('v23DelistDate').value,note=$('v23DelistNote').value.trim();if(!/^\d+$/.test(id)||!dt){msg('请填写数字商品ID和实际下架日期','danger');return;}
const k=downKey(platform,type,id);if(!editKey&&delisted[k]&&!confirm('该商品已经登记，是否更新？'))return;if(editKey&&editKey!==k)delete delisted[editKey];
delisted[k]={platform,type,id,name,date:dt,note};save(KEY_DOWN,delisted);resetDown();renderDelisted();analyze();msg('已记录商品'+id+'，后续季度将排除该商品','good');}
function analyze(){const q=$('v2Quarter').value,r=qrange(q);if(!r)return;const errors=[],blocks=[],warnings=[],records=[],sources=[];
for(const m of r.months){const slot=activeMonth(m);if(!slot?.files?.length){blocks.push(m+'月未上传');continue;}for(const f of slot.files){sources.push(f.name);records.push(...f.rows);errors.push(...f.issues);}}
const today=new Date().toISOString().slice(0,10);if(r.end>=today)blocks.push('当前季度尚未结束，不能输出正式下架名单');if(errors.some(x=>x.fatal))blocks.push('订单文件存在关键字段异常');if(!records.length)blocks.push('本季度无可用订单');
const seen=new Map(),distinct=[];for(const x of records){const k=[x.date,x.cat,x.id,x.term].join('|');if(!seen.has(k)){seen.set(k,x);distinct.push(x);continue;}
const original=seen.get(k),same=['qty','gq','hq','ga','ha'].every(p=>original[p]===x[p]);errors.push(problem(same?'疑似重复':'同维度统计冲突',x.source,x.line,'与'+original.source+'第'+original.line+'行统计维度一致',!same));if(!same)blocks.push('订单统计冲突');}
const datadays=new Set(distinct.map(x=>x.date));if(datadays.size<r.days)warnings.push('有'+(r.days-datadays.size)+'个日期没有成交记录，可能无订单或漏导');
const current=launchSet(platform,q),prior=launchSet(platform,prevQ(q));if(TYPES.every(t=>current[t].size===0))warnings.push('尚未填写本季度上新ID，可能误选新品');
const group=new Map();for(const x of distinct){if(!TYPES.includes(x.cat))continue;const k=downKey(platform,x.cat,x.id);if(!group.has(k))group.set(k,{id:x.id,type:x.cat,name:x.name,qty:0,dates:new Set(),last:0,prev:0});const g=group.get(k);g.qty+=x.qty;if(x.qty>0)g.dates.add(x.date);
if(x.date>=plus(r.end,-29))g.last+=x.qty;else if(x.date>=plus(r.end,-89))g.prev+=x.qty;}
if(!group.size)blocks.push('没有可识别的五类商品');
const eligible=[],excluded=[];for(const g of group.values()){const p=current[g.type].has(g.id)?'本季度上新':prior[g.type].has(g.id)?'上季度上新':'';const down=delisted[downKey(platform,g.type,g.id)],reason=down&&down.date<=r.end?'已下架':p;
const item={...g,activeDays:g.dates.size,activeRate:g.dates.size/r.days,saleDays:r.days,rankQty:0,rankActive:0,reason,grade:'C'};(reason?excluded:eligible).push(item);}
const stats={},suggested=[],watch=[];for(const type of TYPES){const xs=eligible.filter(x=>x.type===type),count=Math.ceil(xs.length*.25),tie=(a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true});
const a=xs.slice().sort((x,y)=>x.qty-y.qty||tie(x,y)),b=xs.slice().sort((x,y)=>x.activeRate-y.activeRate||tie(x,y));a.forEach((x,i)=>x.rankQty=i+1);b.forEach((x,i)=>x.rankActive=i+1);
const strictLow=(arr,k)=>{
  if(!count)return new Set();
  const boundary=arr[count-1][k];
  const crosses=arr.some((x,i)=>i>=count&&x[k]===boundary);
  return new Set(arr.slice(0,count).filter(x=>!crosses||x[k]<boundary).map(x=>x.id));
 };
 const lq=strictLow(a,'qty'),la=strictLow(b,'activeRate');const good=[];
for(const x of xs){const mean=x.prev/2,rebound=x.last>=5&&(mean===0||x.last>=mean*1.2),both=lq.has(x.id)&&la.has(x.id);
if(both&&!rebound){x.grade='A';x.reason='季度销量和成交活跃度均处后25%，近期没有明显回升';good.push(x);}
else if(both||lq.has(x.id)||la.has(x.id)){x.grade='B';x.reason=rebound?'近期需求明显回升':lq.has(x.id)?'仅季度销量后25%':'仅成交活跃度后25%';watch.push(x);}}
good.sort((x,y)=>x.activeDays-y.activeDays||x.qty-y.qty||tie(x,y));const limit=QUOTAS[type][1];good.forEach((x,i)=>{if(i<limit)suggested.push(x);else{x.reason='超出本季度该品类配额';watch.push(x);}});
stats[type]={eligible:xs.length,lowBoth:xs.filter(x=>lq.has(x.id)&&la.has(x.id)).length,registered:current[type].size,quota:limit,plan:QUOTAS[type][0],suggested:Math.min(limit,good.length)};}
const formal=blocks.length===0;results={q,r,formal,blocks:[...new Set(blocks)],warnings,errors,eligible:eligible.length,suggested,watch,stats,sourceCount:sources.length,dayCount:datadays.size};
drawResults();if(formal)storeHistory(true);}
function drawResults(){if(!results)return;const x=results;$('v2Results').hidden=false;
$('v2Summary').innerHTML=[['统计季度',x.q],['参与评估SKU',x.eligible],['双重低效SKU',TYPES.reduce((n,t)=>n+x.stats[t].lowBoth,0)],['建议下架',x.formal?x.suggested.length:'待核验'],['总配额上限',28]].map(([t,v])=>'<div class="v2-metric"><small>'+esc(t)+'</small><strong>'+esc(v)+'</strong></div>').join('');
$('v2Quality').className='v2-alert '+(x.formal?'good':'danger');$('v2Quality').innerHTML='<b>'+(x.formal?'已完成本季度分析':'数据暂不满足正式下架条件')+'</b><div>'+esc([...x.blocks,...x.warnings].join('；')||'数据结构未发现关键异常，仍建议确认后台导出覆盖完整。')+'</div><small>'+x.sourceCount+'份文件 · '+x.dayCount+'/'+x.r.days+'个日期有成交记录</small>';
$('v2Overview').innerHTML=TYPES.map(t=>{const v=x.stats[t];return '<tr><td><b>'+t+'</b></td><td>'+v.plan+'</td><td>'+v.registered+'</td><td>'+v.quota+'</td><td>'+v.eligible+'</td><td>'+v.lowBoth+'</td><td><b>'+(x.formal?v.suggested:'待核验')+'</b></td><td>'+(x.formal?v.plan-v.suggested:'—')+'</td></tr>';}).join('')+'<tr><td><b>合计</b></td><td>51</td><td>'+TYPES.reduce((a,t)=>a+x.stats[t].registered,0)+'</td><td>28</td><td>'+x.eligible+'</td><td>'+TYPES.reduce((a,t)=>a+x.stats[t].lowBoth,0)+'</td><td><b>'+(x.formal?x.suggested.length:'待核验')+'</b></td><td>'+(x.formal?51-x.suggested.length:'—')+'</td></tr>';
$('v2CandidateCaption').textContent=x.formal?'已按规则生成商品ID，可在商城后台执行下架':'缺少季度月份数据或有关键问题，暂不允许导出正式下架名单';
drawCandidates();
$('v2ObserveRows').innerHTML=x.watch.slice(0,100).map(v=>'<tr><td><span class="v2-label b">观察</span></td><td><b>'+esc(v.name)+'</b><br><small>'+esc(v.id)+'</small></td><td>'+esc(v.type)+'</td><td>'+format(v.qty)+'</td><td>'+v.activeDays+'天</td><td>'+format(v.last)+'</td><td>'+esc(v.reason)+'</td></tr>').join('')||'<tr><td colspan="7">暂无观察商品</td></tr>';$('v2ObserveInfo').textContent='共'+x.watch.length+'条（展示前100条）';
$('v2ErrorRows').innerHTML=x.errors.slice(0,100).map(e=>'<tr><td>'+(e.fatal?'错误':'提示')+'</td><td>'+esc(e.kind)+'</td><td>'+esc(e.source)+' 第'+esc(e.line)+'行</td><td>'+esc(e.reason)+'</td></tr>').join('')||'<tr><td colspan="4">没有字段级异常</td></tr>';$('v2ErrorInfo').textContent=x.errors.length+'条';
$('v2Download').disabled=!x.formal||!x.suggested.length;$('v2Save').disabled=!x.formal;drawHistory();}
function drawCandidates(){if(!results)return;const t=$('v2FilterCat').value,search=$('v2FilterText').value.toLowerCase().trim();
const a=results.suggested.filter(x=>(!t||x.type===t)&&(!search||x.id.includes(search)||x.name.toLowerCase().includes(search)));$('v2CandidateCount').textContent=a.length+'条';
$('v2CandidateRows').innerHTML=a.map(v=>'<tr><td><span class="v2-label '+(results.formal?'a':'hold')+'">'+(results.formal?'建议下架':'待核验')+'</span></td><td><b>'+esc(v.name)+'</b><br><small>ID '+esc(v.id)+'</small></td><td>'+esc(v.type)+'</td><td>'+format(v.qty)+'</td><td>'+v.activeDays+'/'+v.saleDays+'（'+ratio(v.activeRate)+'）</td><td>'+v.rankQty+'/'+results.stats[v.type].eligible+'</td><td>'+v.rankActive+'/'+results.stats[v.type].eligible+'</td><td>'+format(v.last)+'</td><td>'+esc(v.reason)+'</td><td><button type="button" class="v23-row-button" data-to-delisted="'+esc(downKey(platform,v.type,v.id))+'">登记已下架</button></td></tr>').join('')||'<tr><td colspan="10" class="v2-empty">没有满足条件的下架商品</td></tr>';}
function exportCandidates(){if(!results?.formal)return;toCsv('建议下架_'+platform+'_'+results.q+'.csv',['平台','季度','品类','商品ID','名称','季度销量','成交天数','成交活跃度','销量排名','活跃度排名','近30天','前60天','原因'],results.suggested.map(v=>[platform,results.q,v.type,v.id,v.name,v.qty,v.activeDays,ratio(v.activeRate),v.rankQty,v.rankActive,v.last,v.prev,v.reason]));}
function exportIssues(){if(!results)return;toCsv('数据异常_'+platform+'_'+results.q+'.csv',['是否阻断','异常','来源','行号','内容'],results.errors.map(e=>[e.fatal?'是':'否',e.kind,e.source,e.line,e.reason]));}
function exportNew(){let a=[];for(const [k,v] of Object.entries(launches)){const [p,q]=k.split('|');if(p!==platform)continue;for(const t of TYPES)for(const id of v[t]||[])a.push([p,q,t,id]);}toCsv('季度上新ID_'+platform+'.csv',['平台','季度','品类','商品ID'],a);}
function exportDown(){toCsv('已下架记录_'+platform+'.csv',['平台','品类','商品ID','商品名称','下架日期','备注'],downRecords().map(x=>[x.platform,x.type,x.id,x.name,x.date,x.note]));}
function storeHistory(quiet=false){if(!results?.formal)return;const z={platform,quarter:results.q,eligible:results.eligible,total:results.suggested.length,time:new Date().toISOString(),items:results.suggested.map(v=>({type:v.type,id:v.id,name:v.name}))};
history=[z,...history.filter(x=>x.platform!==platform||x.quarter!==z.quarter)].slice(0,100);save(KEY_HIST,history);drawHistory();if(!quiet)msg('季度分析已保存','good');}
function drawHistory(){$('v2History').innerHTML=history.filter(x=>x.platform===platform).map(x=>'<tr><td>'+esc(x.quarter)+'</td><td>'+esc(x.platform)+'</td><td>'+x.eligible+'</td><td>'+x.total+'</td><td>'+esc(x.time.slice(0,16).replace('T',' '))+'</td></tr>').join('')||'<tr><td colspan="5">暂无记录</td></tr>';}
function updateQuarter(){const q=Number(($('v2Quarter').value||'').slice(-1))||1;$('v2Quarter').innerHTML=Array.from({length:4},(_,i)=>'<option value="'+year+'-Q'+(i+1)+'">'+year+'年第'+(i+1)+'季度</option>').join('');$('v2Quarter').value=year+'-Q'+q;}
async function start(){try{db=await openDb();}catch(e){msg(e.message+'，请启用浏览器网站存储','danger');return;}
const now=new Date();year=+$('v23Year').value||2026;month=now.getFullYear()===year?now.getMonth()+1:1;platform=$('v2Platform').value;
$('v2Quarter').value=year+'-Q'+Math.ceil(month/3);await refresh();showLaunches();renderDelisted();resetDown();analyze();
$('v23Months').addEventListener('click',e=>{const x=e.target.closest('[data-month]');if(!x)return;month=+x.dataset.month;drawMonths();});
$('v23Year').addEventListener('change',async()=>{const n=+$('v23Year').value;if(!Number.isInteger(n)||n<2020||n>2100){msg('年份范围为2020至2100','danger');return;}year=n;updateQuarter();await refresh();showLaunches();analyze();});
$('v2Platform').addEventListener('change',async()=>{platform=$('v2Platform').value;await refresh();showLaunches();renderDelisted();analyze();});
$('v2Quarter').addEventListener('change',()=>{showLaunches();analyze();});$('v2Run').addEventListener('click',analyze);
$('v23Upload').addEventListener('click',()=>$('v23FileInput').click());$('v23FileInput').addEventListener('change',async e=>{await upload([...e.target.files]);e.target.value='';});
$('v23RemoveMonth').addEventListener('click',()=>clearMonth().catch(e=>msg(e.message,'danger')));
$('v2OrderFiles').addEventListener('click',e=>{const b=e.target.closest('[data-remove-file]');if(b&&confirm('删除 '+b.dataset.removeFile+'？'))removeFile(b.dataset.removeFile).catch(err=>msg(err.message,'danger'));});
$('v23DownloadMonth').addEventListener('click',downloadMonth);
$('v23BackupYear').addEventListener('click',()=>backupYear().catch(e=>msg(e.message,'danger')));
$('v23RestoreYear').addEventListener('click',()=>$('v23RestoreInput').click());
$('v23RestoreInput').addEventListener('change',e=>{if(e.target.files[0])restoreYear(e.target.files[0]).catch(err=>msg('恢复失败：'+err.message,'danger'));e.target.value='';});
$('v23SaveNew').addEventListener('click',storeLaunches);$('v23ExportNew').addEventListener('click',exportNew);
$('v2FilterText').addEventListener('input',drawCandidates);$('v2FilterCat').addEventListener('change',drawCandidates);
$('v2Download').addEventListener('click',exportCandidates);$('v2Save').addEventListener('click',()=>storeHistory());
$('v2DownloadIssues').addEventListener('click',exportIssues);
$('v23DelistForm').addEventListener('submit',saveDown);$('v23CancelDelist').addEventListener('click',resetDown);
$('v23DelistSearch').addEventListener('input',renderDelisted);$('v23DelistFilter').addEventListener('change',renderDelisted);
$('v23ExportDelisted').addEventListener('click',exportDown);
$('v23DelistedRows').addEventListener('click',e=>{const b=e.target.closest('[data-edit]'),d=e.target.closest('[data-delete]');if(b&&delisted[b.dataset.edit])editDown(delisted[b.dataset.edit]);if(d&&delisted[d.dataset.delete]&&confirm('删除下架记录？')){delete delisted[d.dataset.delete];save(KEY_DOWN,delisted);renderDelisted();analyze();}});
$('v2CandidateRows').addEventListener('click',e=>{const b=e.target.closest('[data-to-delisted]');if(!b||!results)return;const x=results.suggested.find(z=>downKey(platform,z.type,z.id)===b.dataset.toDelisted);if(x)editDown({platform,type:x.type,id:x.id,name:x.name,date:new Date().toLocaleDateString('en-CA'),note:''});});
}
start().catch(e=>msg('初始化失败：'+e.message,'danger'));
})();