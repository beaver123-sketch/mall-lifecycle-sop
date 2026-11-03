(()=>{'use strict';
const $=s=>document.getElementById(s);
const CATS=['头像框','派对背景','资料卡','聊天气泡','座驾','推荐套餐','靓号'];
const CORE=CATS.slice(0,5),LABELS={'派对背景':'派对主题'};
const LAUNCH_KEY='mall-dashboard-launches-v1',SOP_NEW='mall-sop-v31-new',PERIOD_KEY='mall-dashboard-selected-period-v1';
const OCT_IDS='1397 1417 1416 1431 1398 1418 1419 1432 1399 1421 1420 1433 61 1400 1422 1423 1434 1386 1385 1387'.split(' ');
const ALIASES={
date:['时间','日期','统计日期','下单日期','购买日期','统计时间','date','day'],
type:['商品类型','品类','道具类型','商品类别','类别','type','category'],
term:['购买天数','购买期限','天数','duration'],
name:['商品名称','商品名','道具名称','道具','商品','itemname','productname'],
id:['商品ID','商品编号','道具ID','itemid','skuid'],
qty:['总销量','销量','总销售量','销售件数','数量','quantity'],
gq:['金币销量','金币购买件数','金币支付件数'],
hq:['荣誉券销量','荣誉券购买件数','荣誉券支付件数'],
ga:['金币金额','金币收入','总销售金币','销售金币'],
ha:['荣誉券金额','荣誉券收入','总销售荣誉券']};
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\s_\-—()（）【】[\]：:]/g,'');
const FIELD=Object.fromEntries(Object.entries(ALIASES).map(([k,a])=>[k,new Set(a.map(norm))]));
const pretty=n=>Number(n||0).toLocaleString('zh-CN',{maximumFractionDigits:2});
const dollars=n=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const percent=(a,b)=>b?(100*a/b).toFixed(2)+'%':'—';
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sum=(arr,k)=>arr.reduce((v,x)=>v+(Number(x[k])||0),0);
const dateFrom=(s)=>{if(typeof s==='number'&&s>20000&&s<80000)return new Date(Date.UTC(1899,11,30)+Math.floor(s)*86400000).toISOString().slice(0,10);let m=String(s||'').match(/^(\d{4})[\/.\-年](\d{1,2})[\/.\-月](\d{1,2})/);if(!m)return '';const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return d.getUTCFullYear()===+m[1]&&d.getUTCMonth()+1===+m[2]&&d.getUTCDate()===+m[3]?d.toISOString().slice(0,10):''};
const endMonth=(ym)=>new Date(Date.UTC(+ym.slice(0,4),+ym.slice(5),0)).toISOString().slice(0,10);
const dateDiff=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000)+1;
const catName=c=>LABELS[c]||c;
const catOf=t=>{const s=String(t||'').trim();if(/派对主题|派对背景|party\s*(background|theme)/i.test(s))return '派对背景';if(/头像框|avatar\s*frame/i.test(s))return '头像框';if(/资料卡|profile\s*card/i.test(s))return '资料卡';if(/聊天气泡|chat\s*bubble/i.test(s))return '聊天气泡';if(/座驾|vehicle|ride/i.test(s))return '座驾';if(/推荐套餐|套餐/i.test(s))return '推荐套餐';if(/靓号/i.test(s))return '靓号';return s};
const number=s=>{if(s===null||s===undefined||String(s).trim()==='')return null;const n=+String(s).replace(/[,，\s]/g,'');return Number.isFinite(n)?n:NaN};
const load=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let db=null,archive=new Map(),platform='POPPO',year=2026,month=10,view='overview',metric='qty',newMetric='qty',designSort='qty',snapshot=null;
let lifecycleNeedsRefresh=false;
let startupPromise=null;
let noticeTimer;
function notify(s,bad){const el=$('toast');el.textContent=s;el.hidden=false;el.style.background=bad?'#965a55':'#253557';clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.hidden=true,4000)}
function alertMsg(s){$('alert').textContent=s;$('alert').hidden=!s}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('mall-month-archive-v3',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('data'))r.result.createObjectStore('data',{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function transaction(mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction('data',mode),q=fn(tx.objectStore('data'));let val;q.onsuccess=()=>val=q.result;q.onerror=()=>reject(q.error);tx.oncomplete=()=>resolve(val);tx.onerror=()=>reject(tx.error)})}
const readAll=()=>transaction('readonly',s=>s.getAll());
const readOne=k=>transaction('readonly',s=>s.get(k));
const writeOne=x=>transaction('readwrite',s=>s.put(x));
const deleteOne=k=>transaction('readwrite',s=>s.delete(k));
const ym=()=>year+'-'+String(month).padStart(2,'0');
const key=(p,m)=>p+'|'+m;
const archiveEntry=(m)=>archive.get(key(platform,m));
function monthRec(m){return (archiveEntry(m)?.files||[]).flatMap(f=>f.rows||[])}
function launchesFor(m){const s=load(LAUNCH_KEY),k=key(platform,m);if(Object.prototype.hasOwnProperty.call(s,k))return s[k]||[];if(platform==='POPPO'&&m==='2026-10')return OCT_IDS.map(id=>({id,cat:'',date:''}));return []}
function launchIndex(m){const entries=launchesFor(m);return {byId:new Set(entries.filter(x=>!x.cat).map(x=>String(x.id))),byKey:new Set(entries.filter(x=>x.cat).map(x=>x.cat+'|'+x.id)),dateById:new Map(entries.map(x=>[(x.cat?x.cat+'|':'')+x.id,x.date||'']))}}
function isNew(row,ids){return ids.byKey.has(row.cat+'|'+row.id)||ids.byId.has(row.id)}
function aggregate(m){const rows=monthRec(m).filter(x=>x&&String(x.date||'').slice(0,7)===m);
 const grouped=new Map(),collisions=new Set();let duplicates=0,missing=0,paymentNotes=0;
 for(const r of rows){if(!r.date||!r.cat||!r.id||!Number.isFinite(+r.qty)){missing++;continue}
   const k=[r.date,r.cat,r.id,String(r.term||'')].join('|');
   const sig=['qty','gq','hq','ga','ha'].map(x=>r[x]===null||r[x]===undefined?'∅':r[x]).join('|');
   if(grouped.has(k)){const g=grouped.get(k);if(g.sig===sig)duplicates++;else collisions.add(k)}
   else grouped.set(k,{row:r,sig});
 }
 const ok=[...grouped.entries()].filter(([k])=>!collisions.has(k)).map(([,v])=>v.row);
 const launch=launchIndex(m),skus=new Map(),cats=new Map(),daily=new Map();const whole={qty:0,coin:0,ticket:0,newQty:0,newCoin:0,newTicket:0};
 for(const r of ok){
  const q=Number(r.qty)||0,coin=Number(r.ga)||0,ticket=Number(r.ha)||0,n=isNew(r,launch);
  if(r.gq!=null&&r.hq!=null&&Number(r.gq)+Number(r.hq)<q)paymentNotes++;
  const cs=r.cat||'其他';
  if(!cats.has(cs))cats.set(cs,{cat:cs,qty:0,coin:0,ticket:0,newQty:0,newCoin:0,newTicket:0,newSkus:new Set()});
  const c=cats.get(cs);c.qty+=q;c.coin+=coin;c.ticket+=ticket;
  const sk=cs+'|'+r.id;
  if(!skus.has(sk))skus.set(sk,{key:sk,id:String(r.id),cat:cs,name:r.name||r.id,qty:0,coin:0,ticket:0,dates:new Set(),first:r.date,new:false});
  const s=skus.get(sk);s.qty+=q;s.coin+=coin;s.ticket+=ticket;s.dates.add(r.date);if(r.date<s.first)s.first=r.date;
  whole.qty+=q;whole.coin+=coin;whole.ticket+=ticket;
  if(!daily.has(r.date))daily.set(r.date,{date:r.date,qty:0,coin:0,ticket:0,newQty:0,newCoin:0,newTicket:0});
  const d=daily.get(r.date);d.qty+=q;d.coin+=coin;d.ticket+=ticket;
  if(n){s.new=true;c.newQty+=q;c.newCoin+=coin;c.newTicket+=ticket;c.newSkus.add(sk);whole.newQty+=q;whole.newCoin+=coin;whole.newTicket+=ticket;d.newQty+=q;d.newCoin+=coin;d.newTicket+=ticket}
 }
 const dates=[];const last=endMonth(m);for(let d=m+'-01';d<=last;){dates.push(daily.get(d)||{date:d,qty:0,coin:0,ticket:0,newQty:0,newCoin:0,newTicket:0});const next=new Date(Date.parse(d+'T00:00:00Z')+86400000);d=next.toISOString().slice(0,10)}
 return {ym:m,rows:ok.length,skus:[...skus.values()],cats:[...cats.values()],daily:dates,whole,launchCount:launch.byId.size+launch.byKey.size,duplicates,collisions:collisions.size,missing,paymentNotes,files:(archiveEntry(m)?.files||[])};
}
const textMetric=(num,mode)=>mode==='coin'?('$'+dollars(num/1000)):pretty(num);
const metricValue=(val,mode)=>mode==='coin'?dollars(val/1000):pretty(val);
function renderChart(host,series,mode){const node=$(host);if(!snapshot?.rows){node.innerHTML=empty('上传订单后查看销售趋势',true);return}
 const xLeft=58,xRight=880,yTop=18,yBottom=242,plotWidth=xRight-xLeft,plotHeight=yBottom-yTop;
 const max=Math.max(...series.flatMap(s=>s.values),1)*1.14;
 const y=v=>yBottom-(v/max)*plotHeight,x=i=>xLeft+i*plotWidth/Math.max(1,snapshot.daily.length-1);
 let svg='<svg viewBox="0 0 915 270" preserveAspectRatio="none" role="img" aria-label="按日销售趋势折线图">';
 for(let i=0;i<5;i++){const yy=yTop+i*(plotHeight/4),label=max*(1-i/4);svg+='<line class="grid-line" x1="'+xLeft+'" x2="'+xRight+'" y1="'+yy+'" y2="'+yy+'"></line><text class="axis-label" x="46" y="'+(yy+4)+'" text-anchor="end">'+(mode==='coin'?Math.round(label/1000).toLocaleString('zh-CN'):Math.round(label).toLocaleString('zh-CN'))+'</text>'}
 for(let i=0;i<snapshot.daily.length;i++){if(i%5===0||i===snapshot.daily.length-1)svg+='<text class="axis-label" x="'+x(i)+'" y="264" text-anchor="middle">'+(i+1)+'日</text>'}
 series.forEach((s,idx)=>{const col=s.color,points=s.values.map((v,i)=>x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ');svg+='<polyline class="chart-line '+col+'" points="'+points+'"/>';
  s.values.forEach((v,i)=>{svg+='<g class="chart-point"><circle cx="'+x(i)+'" cy="'+y(v)+'" r="4" stroke="'+(col==='line-blue'?'#5570d7':col==='line-teal'?'#36aaa6':'#b6bed0')+'"></circle><circle cx="'+x(i)+'" cy="'+y(v)+'" r="10" fill="transparent" stroke="transparent" opacity="0"></circle><title>'+escapeHtml(snapshot.daily[i].date+' · '+s.name+' '+textMetric(v,mode))+'</title></g>'})});
 svg+='</svg>';node.innerHTML=svg;
}
function empty(t,compact){return '<div class="empty'+(compact?' compact':'')+'">'+escapeHtml(t)+'</div>'}
function card(label,value,foot,isDollar){return '<div class="metric"><div class="metric-label">'+label+'</div><div class="metric-amount">'+(isDollar?'<span class="currency">$</span>':'')+value+'</div><div class="metric-foot">'+(foot||'&nbsp;')+'</div></div>'}
function trendFoot(current,previous,unit){if(!previous)return '&nbsp;';const d=(current-previous)/previous*100;return '环比 <span class="'+(d>=0?'positive':'negative')+'">'+(d>=0?'+':'')+d.toFixed(1)+'%</span>'+(unit?' · '+unit:'')}
function renderOverview(){const a=snapshot,w=a.whole,pm=previousMonth(),prev=archiveEntry(pm)?aggregate(pm).whole:null;
 $('overviewPeriod').textContent=a.ym.replace('-','年')+'月 · '+a.daily.length+'天';
 $('overviewMetrics').innerHTML=card('总销量',pretty(w.qty),trendFoot(w.qty,prev?.qty))+
 card('金币收益',dollars(w.coin/1000),trendFoot(w.coin,prev?.coin),true)+
 card('荣誉券收益',pretty(w.ticket),trendFoot(w.ticket,prev?.ticket))+
 card('成交 SKU',pretty(a.skus.length),'覆盖 '+a.cats.length+' 个品类')+
 card('新品销量占比',percent(w.newQty,w.qty),pretty(w.newQty)+' 件新品');
 const vals=a.daily;renderChart('overviewTrend',[{name:'商城整体',color:'line-blue',values:vals.map(v=>v[metric])},{name:'本月新品',color:'line-teal',values:vals.map(v=>v['new'+metric[0].toUpperCase()+metric.slice(1)])}],metric);
 const cats=a.cats.slice().sort((a,b)=>b.qty-a.qty);$('categoryTitle').textContent=cats.length+' 个品类';
 $('categoryRows').innerHTML=cats.map(c=>'<tr><td><strong>'+escapeHtml(catName(c.cat))+'</strong></td><td class="num">'+pretty(c.qty)+'</td><td class="num"><span class="bar-cell"><span class="bar-track"><span class="bar-fill" style="width:'+Math.max(.5,100*c.qty/Math.max(w.qty,1))+'%"></span></span>'+percent(c.qty,w.qty)+'</span></td></tr>').join('')||'<tr><td colspan="3">'+empty('暂无数据',true)+'</td></tr>';
 $('rankingRows').innerHTML=a.skus.slice().sort((x,y)=>y.qty-x.qty).slice(0,8).map((s,i)=>'<tr><td><span class="rank-id '+(i<3?'top':'')+'">'+(i+1)+'</span><span class="product-name" style="display:inline">'+escapeHtml(s.name.replace(/[（(]\d+[）)]$/,''))+'</span></td><td><span class="tag">'+escapeHtml(catName(s.cat))+'</span></td><td class="num"><strong>'+pretty(s.qty)+'</strong></td></tr>').join('')||'<tr><td colspan="3">'+empty('暂无数据',true)+'</td></tr>';
}
function previousMonth(){return new Date(Date.UTC(year,month-2,1)).toISOString().slice(0,7)}
function renderNew(){const a=snapshot,w=a.whole,arr=a.skus.filter(x=>x.new);
 $('newPeriod').textContent=a.ym.replace('-','年')+'月';
 $('newMetrics').innerHTML=card('上新 SKU',pretty(arr.length),'登记 '+a.launchCount+' 个 ID')+
 card('新品销量',pretty(w.newQty),'占全部 '+percent(w.newQty,w.qty))+
 card('新品金币收益',dollars(w.newCoin/1000),'贡献 '+percent(w.newCoin,w.coin),true)+
 card('新品荣誉券',pretty(w.newTicket),'贡献 '+percent(w.newTicket,w.ticket))+
 card('新品销售贡献',percent(w.newQty,w.qty),pretty(w.qty-w.newQty)+' 件存量商品');
 const v=a.daily,m=newMetric,part='new'+m[0].toUpperCase()+m.slice(1);
 renderChart('newTrend',[{name:'本月新品',color:'line-teal',values:v.map(x=>x[part])},{name:'存量商品',color:'line-gray',values:v.map(x=>x[m]-x[part])}],m);
 const select=$('newType'),old=select.value;select.innerHTML='<option value="">全部商品</option>'+CATS.map(t=>'<option value="'+t+'">'+catName(t)+'</option>').join('');select.value=old;
 const filter=select.value,q=$('newSearch').value.toLowerCase().trim();
 const allCounts=new Map();for(const s of arr)allCounts.set(s.cat,(allCounts.get(s.cat)||0)+1);
 $('newTypeFilters').innerHTML='<button type="button" class="category-tab '+(!filter?'selected':'')+'" data-new-type="" aria-pressed="'+(!filter)+'">全部商品 <b>'+arr.length+'</b></button>'+
   CATS.filter(t=>allCounts.has(t)).map(t=>'<button type="button" class="category-tab '+(filter===t?'selected':'')+'" data-new-type="'+escapeHtml(t)+'" aria-pressed="'+(filter===t)+'">'+escapeHtml(catName(t))+' <b>'+allCounts.get(t)+'</b></button>').join('');
 const listed=arr.filter(x=>(!filter||x.cat===filter)&&(!q||x.name.toLowerCase().includes(q)||x.id.includes(q))).sort((x,y)=>y.qty-x.qty);
 $('newCount').textContent=listed.length+' 件商品';
 const cutoff=endMonth(ym());$('newRows').innerHTML=listed.map(s=>{const days=Math.max(1,dateDiff(s.first,cutoff));return '<tr><td><span class="product-name">'+escapeHtml(s.name.replace(/[（(]\d+[）)]$/,''))+'</span><span class="product-id">ID '+escapeHtml(s.id)+'</span></td><td><span class="type-badge type-'+(Math.max(0,CATS.indexOf(s.cat))%7)+'"><i></i>'+escapeHtml(catName(s.cat))+'</span></td><td class="num"><strong>'+pretty(s.qty)+'</strong></td><td class="num">'+dollars(s.coin/1000)+'</td><td class="num">'+pretty(s.ticket)+'</td><td>'+escapeHtml(s.first.slice(5))+'</td><td class="num">'+(s.qty/days).toFixed(1)+'</td></tr>'}).join('')||'<tr><td colspan="7">'+empty('暂无匹配的新品',true)+'</td></tr>';
}
function productSeries(n){return String(n||'').replace(/[（(]\s*\d+\s*[）)]\s*$/,'').trim().replace(/\s+/g,' ')||'未命名'}
function designGroups(){const map=new Map();for(const s of snapshot.skus.filter(x=>x.new)){const name=productSeries(s.name),id=name.toLowerCase();if(!map.has(id))map.set(id,{name,count:0,qty:0,coin:0,ticket:0,cats:new Set(),items:[]});const g=map.get(id);g.count++;g.qty+=s.qty;g.coin+=s.coin;g.ticket+=s.ticket;g.cats.add(s.cat);g.items.push(s)}return [...map.values()]}
function renderDesign(){const a=snapshot,groups=designGroups(),byQty=groups.slice().sort((x,y)=>y.qty-x.qty),byCoin=groups.slice().sort((x,y)=>y.coin-x.coin);
 $('designPeriod').textContent=a.ym.replace('-','年')+'月 · 基于新品销售数据';
 const top=byQty[0],gold=byCoin[0],multi=groups.slice().sort((x,y)=>y.cats.size-x.cats.size||y.qty-x.qty)[0];
 $('designHighlights').innerHTML=[
 {label:'销量领先的新品系列',name:top?.name||'—',info:top?pretty(top.qty)+' 件 · '+top.count+' SKU':'等待新品数据',cls:'focus'},
 {label:'金币收益领先系列',name:gold?.name||'—',info:gold?'$'+dollars(gold.coin/1000)+' · '+gold.count+' SKU':'等待新品数据',cls:''},
 {label:'跨品类覆盖最广系列',name:multi?.name||'—',info:multi?multi.cats.size+' 个品类 · '+pretty(multi.qty)+' 件':'等待新品数据',cls:''}
 ].map(x=>'<div class="highlight"><small>'+x.label+'</small><h3 class="'+x.cls+'">'+escapeHtml(x.name)+'</h3><p>'+escapeHtml(x.info)+'</p></div>').join('');
 const chosen=groups.sort((x,y)=>y[designSort]-x[designSort]);
 $('designRows').innerHTML=chosen.map((x,i)=>'<tr><td><strong>'+escapeHtml(x.name)+'</strong></td><td class="num">'+x.count+'</td><td class="num"><strong>'+pretty(x.qty)+'</strong></td><td class="num">'+dollars(x.coin/1000)+'</td><td class="num">'+pretty(x.ticket)+'</td><td>'+(i<3?'<span class="flag">重点延展观察</span>':'<span class="flag observe">持续观察</span>')+'</td></tr>').join('')||'<tr><td colspan="6">'+empty('请先登记并上传本月新品数据',true)+'</td></tr>';
 $('designCategoryRows').innerHTML=a.cats.filter(x=>CORE.includes(x.cat)).sort((a,b)=>b.newQty-a.newQty).map(c=>'<tr><td><strong>'+escapeHtml(catName(c.cat))+'</strong></td><td class="num">'+c.newSkus.size+'</td><td class="num">'+pretty(c.newQty)+'</td><td class="num">'+percent(c.newQty,c.qty)+'</td><td class="num">'+dollars(c.newCoin/1000)+'</td></tr>').join('')||'<tr><td colspan="5">'+empty('暂无数据',true)+'</td></tr>';
}
function issuesFor(a){let list=[];if(a.collisions)list.push({severity:'error',text:a.collisions+'组同日同商品存在不同统计值，已暂时排除'});if(a.missing)list.push({severity:'error',text:a.missing+'行缺少关键字段，未参与分析'});if(a.duplicates)list.push({severity:'info',text:a.duplicates+'条完全重复记录已去重'});if(a.paymentNotes)list.push({severity:'info',text:a.paymentNotes+'行的支付件数少于总销量，需核对支付方式'});
 for(const f of a.files){for(const i of (f.issues||[]).filter(x=>x.fatal).slice(0,3))list.push({severity:'error',text:f.name+' · '+i.line+'行：'+i.reason})}return list}
function renderData(){const a=snapshot;const name=ym();$('dataPeriod').textContent=name.replace('-','年')+'月';
 $('archivePeriod').textContent=year+'年';
 $('monthGrid').innerHTML=Array.from({length:12},(_,i)=>{const m=year+'-'+String(i+1).padStart(2,'0'),files=archiveEntry(m)?.files||[];return '<button class="month-pill '+(files.length?'available ':'')+(m===name?'selected':'')+'" data-m="'+(i+1)+'"><strong>'+String(i+1).padStart(2,'0')+'月</strong><small>'+(files.length?files.length+' 份文件':'—')+'</small></button>'}).join('');
 $('dataDetails').innerHTML=pretty(a.rows)+' 条有效记录 · '+pretty(a.skus.length)+' 个成交 SKU';
 $('fileList').innerHTML=a.files.map(f=>'<div class="file-item"><div><strong>'+escapeHtml(f.name)+'</strong><small>'+pretty((f.rows||[]).length)+' 行 · '+(f.size?pretty(Math.round(f.size/1024))+' KB':'已归档')+'</small></div><button class="text-button" data-remove="'+escapeHtml(f.name)+'">移除</button></div>').join('')||'<div class="empty compact">本月尚未上传文件</div>';
 $('launchInput').value=launchesFor(name).map(x=>x.id+(x.date?','+x.date:'')+(x.cat?','+x.cat:'')).join('\n');
 $('launchCount').textContent=launchesFor(name).length+' 个';
 const issues=issuesFor(a);$('issueCount').textContent=issues.length+' 项';
 $('issues').innerHTML=issues.map(x=>'<div class="issue">'+(x.severity==='error'?'<strong>需核对 · </strong>':'')+escapeHtml(x.text)+'</div>').join('')||'<div class="empty">未发现关键数据异常</div>';
}
function render(){snapshot=aggregate(ym());const a=snapshot;save(PERIOD_KEY,{year,month});syncMonthNavigators();document.body.classList.toggle('show-lifecycle',view==='lifecycle');document.body.classList.toggle('analysis-month-view',['overview','new','design'].includes(view));document.querySelectorAll('.view').forEach(e=>e.hidden=e.id!=='page-'+view);document.querySelectorAll('[data-page]').forEach(e=>e.classList.toggle('active',e.dataset.page===view));
 $('crumb').textContent={overview:'经营总览',new:'新品分析',design:'设计方向',lifecycle:'动态上下架',data:'数据管理'}[view]||'经营总览';
 $('archiveCount').textContent=[...archive.values()].filter(v=>v.platform===platform&&v.files?.length).length+'个月';
 const hasProblems=a.collisions||a.missing||a.files.some(f=>(f.issues||[]).some(x=>x.fatal));
 alertMsg(hasProblems?'当前月份存在待核验数据，请前往「数据管理」查看异常。':'');
 renderOverview();renderNew();renderDesign();renderData();
 if(view==='lifecycle')openLifecycleTab();
}
function openLifecycleTab(){
 const frame=$('lifecycleFrame');
 if(lifecycleNeedsRefresh){
  lifecycleNeedsRefresh=false;
  frame.src='lifecycle.html?revision='+Date.now();
  return;
 }
 if(frame.contentDocument)requestAnimationFrame(resizeLifecycleFrame);
}
let lifecycleObserver=null;
function resizeLifecycleFrame(){
 const frame=$('lifecycleFrame');
 if(!frame||!frame.contentDocument)return;
 const doc=frame.contentDocument;
 const height=Math.max(660,doc.body?.scrollHeight||0,doc.body?.offsetHeight||0)+12;
 if(Math.abs(frame.offsetHeight-height)>5)frame.style.height=height+'px';
}
function bindLifecycleFrame(){
 const frame=$('lifecycleFrame');
 frame.addEventListener('load',()=>{
  try{
   const doc=frame.contentDocument;
   if(!doc)return;
   const style=doc.createElement('style');
   style.textContent='.mall-dashboard-backlink{display:none!important}body{padding:8px 3px 30px!important}.wrap{max-width:none!important}';
   doc.head.appendChild(style);
   if(lifecycleObserver)lifecycleObserver.disconnect();
   lifecycleObserver=new ResizeObserver(()=>requestAnimationFrame(resizeLifecycleFrame));
   lifecycleObserver.observe(doc.body);
   requestAnimationFrame(resizeLifecycleFrame);
  }catch(err){console.warn('无法自动调整上下架页签高度',err)}
 });
 window.addEventListener('resize',()=>{if(view==='lifecycle')requestAnimationFrame(resizeLifecycleFrame)});
}


function selectPeriod(value){
 const m=/^(\d{4})-(\d{2})$/.exec(String(value||''));
 if(!m)return;
 const y=+m[1],mo=+m[2];
 if(y<2020||y>2100||mo<1||mo>12)return;
 year=y;month=mo;refreshSelections();render();
}
function shiftPeriod(step){
 const d=new Date(Date.UTC(year,month-1+step,1));
 selectPeriod(d.toISOString().slice(0,7));
}
function syncMonthNavigators(){
 const current=ym();
 const months=new Set([current]);
 for(const entry of archive.values())if(entry.platform===platform&&entry.files?.length&&/^\d{4}-\d{2}$/.test(entry.ym))months.add(entry.ym);
 const options=[...months].sort((a,b)=>b.localeCompare(a)).map(m=>{
  const stored=archiveEntry(m),hasRows=!!stored?.files?.some(f=>(f.rows||[]).length);
  const label=+m.slice(0,4)+'年'+(+m.slice(5))+'月'+(hasRows?'':' · 无数据');
  return '<option value="'+m+'">'+label+'</option>';
 }).join('');
 document.querySelectorAll('.month-picker').forEach(el=>{el.innerHTML=options;el.value=current});
 const prev=year>2020||month>1,next=year<2100||month<12;
 document.querySelectorAll('[data-month-step]').forEach(btn=>{
  btn.disabled=btn.dataset.monthStep==='-1'?!prev:!next;
 });
 const missing=!snapshot.rows;
 for(const page of ['overview','new','design']){
  const node=$('page-'+page);
  node.classList.toggle('month-no-data',missing);
  const empty=node.querySelector('.month-empty');
  if(empty)empty.hidden=!missing;
 }
}

function go(p){view=['overview','new','design','lifecycle','data'].includes(p)?p:'overview';history.replaceState(null,'','#'+view);render();window.scrollTo({top:0,behavior:'instant'})}
function refreshSelections(){const y=$('year');if(!y.options.length)for(let v=2024;v<=2030;v++)y.add(new Option(v+'年',v));y.value=year;
 const mo=$('month');if(!mo.options.length)for(let v=1;v<=12;v++)mo.add(new Option(v+'月',v));mo.value=month;
 $('platform').value=platform}
async function syncDB(){archive=new Map((await readAll()).map(x=>[x.key,x]));refreshSelections();render()}
function csvRows(src){src=src.replace(/^\uFEFF/,'');let out=[],row=[],cell='',quote=false;for(let i=0;i<src.length;i++){const c=src[i];if(quote){if(c==='"'&&src[i+1]==='"'){cell+='"';i++}else if(c==='"')quote=false;else cell+=c}else if(c==='"')quote=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&src[i+1]==='\n')i++;row.push(cell);if(row.some(x=>String(x).trim()))out.push(row);row=[];cell=''}else cell+=c}row.push(cell);if(row.some(x=>String(x).trim()))out.push(row);return out}
async function fileSheets(file){const buf=await file.arrayBuffer();if(/\.csv$/i.test(file.name)){let txt=new TextDecoder('utf-8').decode(buf);if(txt.includes('\ufffd'))txt=new TextDecoder('gb18030').decode(buf);return [{name:'CSV',rows:csvRows(txt)}]}if(!window.XLSX)throw Error('Excel解析组件未加载，请刷新重试');const book=XLSX.read(buf,{type:'array'});return book.SheetNames.map(n=>({name:n,rows:XLSX.utils.sheet_to_json(book.Sheets[n],{header:1,raw:true,defval:'',blankrows:false})}))}
function detectHeader(rows){for(let i=0;i<Math.min(rows.length,40);i++){const map={};for(let j=0;j<(rows[i]||[]).length;j++){const v=norm(rows[i][j]);for(const [k,terms] of Object.entries(FIELD))if(map[k]===undefined&&terms.has(v))map[k]=j}if(map.date!==undefined&&map.name!==undefined&&(map.qty!==undefined||(map.gq!==undefined&&map.hq!==undefined)))return {row:i,map}}return null}
async function parse(file){const result={name:file.name,size:file.size,rows:[],issues:[],scanned:0,skipped:0,blob:file};const problem=(line,reason)=>{if(result.issues.length<40)result.issues.push({line,reason,fatal:true})};
 let sheets=await fileSheets(file),detected=0;
 for(const tab of sheets){const found=detectHeader(tab.rows);if(!found)continue;detected++;const m=found.map;for(let i=found.row+1;i<tab.rows.length;i++){const raw=tab.rows[i];if(!raw?.some(x=>String(x??'').trim()))continue;result.scanned++;const get=k=>m[k]===undefined?'':raw[m[k]];const rawName=String(get('name')||'').trim();const mt=rawName.match(/[（(]\s*(\d+)\s*[）)]\s*$/),id=String(get('id')||mt?.[1]||'').trim().replace(/\.0+$/,'');const cat=catOf(get('type')||tab.name||file.name),date=dateFrom(get('date')),qty=number(get('qty'));const gq=number(get('gq')),hq=number(get('hq')),ga=number(get('ga')),ha=number(get('ha'));const total=qty===null&&gq!==null&&hq!==null?gq+hq:qty;
 if(!id||!date||!cat||!rawName||!Number.isInteger(total)||total<0||[gq,hq,ga,ha].some(v=>v!==null&&(!Number.isFinite(v)||v<0))){result.skipped++;problem(i+1,'日期、商品ID、销量或支付金额不合法');continue}
 result.rows.push({date,cat,id,name:rawName,qty:total,gq,hq,ga,ha,term:String(get('term')||''),source:file.name+'/'+tab.name,line:i+1})}}
 if(!detected)problem(1,'未识别到商城统计表头');
 return result}
async function importFiles(fs){if(startupPromise)await startupPromise;const files=fs.filter(f=>/\.(xlsx|xls|csv)$/i.test(f.name));if(!files.length){notify('请选择 Excel 或 CSV 文件',true);return}
 const button=$('headerUpload');button.disabled=true;button.textContent='正在解析…';let total=0,bad=[];
 try{const parsed=[];for(const f of files){const p=await parse(f);parsed.push(p);total+=p.rows.length;if(!p.rows.length)bad.push(f.name)}
  const byMonth=new Map();
  for(const p of parsed){const groups=new Map();for(const row of p.rows){const m=row.date.slice(0,7);if(!groups.has(m))groups.set(m,[]);groups.get(m).push(row)}
   if(!groups.size)groups.set(ym(),[]);
   for(const [m,rows] of groups){if(!byMonth.has(m))byMonth.set(m,[]);byMonth.get(m).push({...p,rows})}}
  for(const [m,entries] of byMonth){const k=key(platform,m),old=await readOne(k),map=new Map((old?.files||[]).map(f=>[f.name.toLowerCase(),f]));for(const f of entries)map.set(f.name.toLowerCase(),f);await writeOne({key:k,platform,ym:m,files:[...map.values()],savedAt:new Date().toISOString()})}
  const first=[...byMonth.keys()].sort()[0];if(first){year=+first.slice(0,4);month=+first.slice(5)}
  await syncDB();syncSOP();lifecycleNeedsRefresh=true;notify('已导入 '+files.length+' 个文件 · '+pretty(total)+' 条记录'+(bad.length?' · '+bad.length+' 个文件需要检查':''),!!bad.length);go('overview');
 }catch(e){notify('上传失败：'+e.message,true)}finally{button.disabled=false;button.textContent='＋ 上传数据';$('fileInput').value=''}}
function parseLaunches(raw){let out=[],seen=new Set();for(const line of raw.split(/[\r\n;；]+/)){const p=line.trim().split(/[,，\t]+/).map(x=>x.trim()).filter(Boolean);if(!p.length)continue;
 let match=p[0].match(/^(?:(头像框|派对背景|派对主题|资料卡|聊天气泡|座驾)\s*[:：]\s*)?(\d+)$/),id=match?.[2]||p[0].replace(/[^\d]/g,''),cat=match?.[1]?catOf(match[1]):'',launchDate='',extra=p.slice(1);
 for(const x of extra){if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(x))launchDate=dateFrom(x);else if(CATS.includes(catOf(x)))cat=catOf(x)}
 if(!id)continue;const k=(cat?cat+'|':'')+id;if(seen.has(k))continue;seen.add(k);out.push({id,cat,date:launchDate})}return out}
function syncSOP(){const all=load(LAUNCH_KEY),q=year+'-Q'+Math.ceil(month/3),sop=load(SOP_NEW),k=platform+'|'+q,prev=sop[k]||{},current={};for(const c of CORE)current[c]=[...(prev[c]||[])];
 const qmonths=[Math.floor((month-1)/3)*3+1,Math.floor((month-1)/3)*3+2,Math.floor((month-1)/3)*3+3];
 for(const mon of qmonths){const m=year+'-'+String(mon).padStart(2,'0'),n=all[key(platform,m)]||(platform==='POPPO'&&m==='2026-10'?OCT_IDS.map(id=>({id,cat:''})):[]);const records=monthRec(m);
  for(const z of n){let cats=z.cat?[z.cat]:[...new Set(records.filter(r=>r.id===z.id&&CORE.includes(r.cat)).map(r=>r.cat))];for(const c of cats)if(CORE.includes(c)&&!current[c].includes(z.id))current[c].push(z.id)}}
 sop[k]=current;save(SOP_NEW,sop)}
function saveLaunches(){const items=parseLaunches($('launchInput').value),store=load(LAUNCH_KEY);store[key(platform,ym())]=items;save(LAUNCH_KEY,store);syncSOP();lifecycleNeedsRefresh=true;render();notify('新品名单已保存 · '+items.length+' 个')}
async function removeFile(name){const k=key(platform,ym()),old=await readOne(k);if(!old)return;const files=(old.files||[]).filter(f=>f.name!==name);if(files.length===(old.files||[]).length)return;if(files.length)await writeOne({...old,files});else await deleteOne(k);await syncDB();lifecycleNeedsRefresh=true;notify('已移除：'+name)}
const download=(name,content,type)=>{const blob=new Blob([content],{type:type||'text/plain;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)};
const csvEsc=v=>{let s=String(v??'');if(/^[=+@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
function exportSummary(){const a=snapshot,w=a.whole,rows=[['月份','总销量','金币收益(美元)','荣誉券收益','成交SKU','新品SKU','新品销量','新品金币收益(美元)','新品荣誉券收益','新品销量贡献率'],[ym(),w.qty,(w.coin/1000).toFixed(2),w.ticket,a.skus.length,a.skus.filter(s=>s.new).length,w.newQty,(w.newCoin/1000).toFixed(2),w.newTicket,percent(w.newQty,w.qty)]];download('商城月报_'+ym()+'.csv','\uFEFF'+rows.map(x=>x.map(csvEsc).join(',')).join('\r\n'),'text/csv;charset=utf-8')}
async function backup(){const all=(await readAll()).filter(x=>x.platform===platform&&x.ym.startsWith(year+'-')).map(x=>({key:x.key,platform:x.platform,ym:x.ym,files:(x.files||[]).map(f=>({...f,blob:undefined}))}));const launches=load(LAUNCH_KEY),sop=load(SOP_NEW);download('商城数据备份_'+platform+'_'+year+'.json',JSON.stringify({format:'mall-dashboard-backup-v1',year,platform,months:all,launches,sop,createdAt:new Date().toISOString()}),'application/json;charset=utf-8');notify('已导出本年度备份')}
async function restore(file){try{const j=JSON.parse(await file.text());if(j.format!=='mall-dashboard-backup-v1'||!Array.isArray(j.months))throw Error('备份文件格式不匹配');if(!confirm('导入备份会替换备份内同月份的数据，是否继续？'))return;for(const m of j.months){if(!m.key||!m.platform||!Array.isArray(m.files))continue;await writeOne({...m,files:m.files.map(f=>({...f,blob:undefined}))})}if(j.launches)save(LAUNCH_KEY,{...load(LAUNCH_KEY),...j.launches});if(j.sop)save(SOP_NEW,{...load(SOP_NEW),...j.sop});platform=j.platform||platform;year=+j.year||year;month=10;await syncDB();lifecycleNeedsRefresh=true;notify('备份恢复成功')}catch(e){notify('备份恢复失败：'+e.message,true)}}
function initEvents(){
 document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();go(b.dataset.page)}));
 document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.goto)));
 document.querySelectorAll('.month-picker').forEach(el=>el.addEventListener('change',e=>selectPeriod(e.target.value)));
 document.querySelectorAll('[data-month-step]').forEach(btn=>btn.addEventListener('click',()=>shiftPeriod(+btn.dataset.monthStep)));
 $('platform').addEventListener('change',e=>{platform=e.target.value;render()});
 $('year').addEventListener('change',e=>{year=+e.target.value;render()});
 $('month').addEventListener('change',e=>{month=+e.target.value;render()});
 $('headerUpload').addEventListener('click',()=>$('fileInput').click());$('uploadButton').addEventListener('click',e=>{e.stopPropagation();$('fileInput').click()});
 $('fileInput').addEventListener('change',e=>importFiles([...e.target.files]));
 const dz=$('dropzone');dz.addEventListener('click',()=>$('fileInput').click());dz.addEventListener('keydown',e=>{if(e.key==='Enter')$('fileInput').click()});dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('dragging')});dz.addEventListener('dragleave',()=>dz.classList.remove('dragging'));dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('dragging');importFiles([...e.dataTransfer.files])});
 $('metricSwitch').addEventListener('click',e=>{const b=e.target.closest('[data-metric]');if(!b)return;metric=b.dataset.metric;setChosen('metricSwitch','data-metric',metric);renderOverview()});
 $('newMetricSwitch').addEventListener('click',e=>{const b=e.target.closest('[data-metric]');if(!b)return;newMetric=b.dataset.metric;setChosen('newMetricSwitch','data-metric',newMetric);renderNew()});
 $('designSort').addEventListener('click',e=>{const b=e.target.closest('[data-sort]');if(!b)return;designSort=b.dataset.sort;setChosen('designSort','data-sort',designSort);renderDesign()});
 $('newType').addEventListener('change',renderNew);$('newTypeFilters').addEventListener('click',e=>{const b=e.target.closest('[data-new-type]');if(!b)return;$('newType').value=b.dataset.newType;renderNew()});$('newSearch').addEventListener('input',renderNew);
 $('monthGrid').addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b)return;month=+b.dataset.m;refreshSelections();render()});
 $('saveLaunch').addEventListener('click',saveLaunches);
 $('fileList').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b||b.disabled)return;b.disabled=true;removeFile(b.dataset.remove).catch(err=>{b.disabled=false;notify('移除失败：'+err.message,true)})});
 $('exportSummary').addEventListener('click',exportSummary);
 $('backup').addEventListener('click',()=>backup().catch(e=>notify(e.message,true)));
 $('restoreButton').addEventListener('click',()=>$('backupInput').click());
 $('backupInput').addEventListener('change',e=>{const f=e.target.files[0];if(f)restore(f);e.target.value=''});
 $('goLifecycle').addEventListener('click',()=>go('lifecycle'));
 window.addEventListener('hashchange',()=>{const p=location.hash.slice(1);if(['overview','new','design','lifecycle','data'].includes(p))go(p)});
}
function setChosen(parent,attr,val){$(parent).querySelectorAll('button').forEach(b=>b.classList.toggle('chosen',b.getAttribute(attr)===val))}
async function init(){const period=load(PERIOD_KEY);if(Number.isInteger(period.year)&&period.year>=2020&&period.year<=2100)year=period.year;if(Number.isInteger(period.month)&&period.month>=1&&period.month<=12)month=period.month;const p=location.hash.slice(1);if(['overview','new','design','lifecycle','data'].includes(p))view=p;bindLifecycleFrame();startupPromise=openDB().then(async connection=>{db=connection;await syncDB();document.documentElement.dataset.mallReady='true'});initEvents();await startupPromise}
init().catch(e=>{alertMsg('无法使用浏览器数据存储：'+e.message);notify('页面初始化失败',true)});
})();