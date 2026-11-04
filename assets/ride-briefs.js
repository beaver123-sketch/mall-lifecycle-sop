/* Mall ride proposal engine: identifiable vehicle objects, prior-work exclusion, timed actions. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const TIERS={
 basic:{label:'基础款',duration:'5–6s',total:'5.5s',segments:[['0–1.5s','入场','arrival'],['1.5–3.5s','核心动作','main'],['3.5–5.5s','落点定格','end']]},
 advanced:{label:'进阶款',duration:'7–8s',total:'7.5s',segments:[['0–2s','入场','arrival'],['2–4.5s','核心动作','main'],['4.5–6s','追加动作','advanced'],['6–7.5s','落点定格','end']]},
 premium:{label:'高阶款',duration:'9–10s',total:'9.5s',segments:[['0–2s','入场','arrival'],['2–4s','核心动作','main'],['4–6s','追加动作','advanced'],['6–8s','高级演出','premium'],['8–9.5s','落点定格','end']]}
};
const catalog=[
{
 name:'极地雪铠',theme:'机械',type:'现实载具',object:'双履带封闭式雪地科考车',palette:'极地白 × 碳黑 × 冰蓝',aliases:['极地雪铠','履带式雪地科考车','双履带雪地车'],
 keywords:['双履带','封闭驾驶舱','铝合金防护','雪地碎冰','冰蓝探照灯'],
 structure:'车体两侧独立履带、双排封闭式驾驶舱、可见车门/车窗；不是单纯冰雪特效。',
 requirements:'雪地车前铲、铆钉钢板和防滑履带需真实可辨；冰蓝探照灯与轮廓照明点到为止。',
 action:{arrival:'双履带雪地车破开前景积雪驶入，探照灯扫过地面。',main:'左侧履带压过冰坡，车身抬起后稳稳越过。',advanced:'后部履带扬起碎雪，车辆完成一次小角度转向。',premium:'镜头由车侧快速绕至车前，冰粒随履带轨迹向两边散开。',end:'车头45°朝向镜头刹停，履带停止，展示完整驾驶舱和雪地车体。'}
},
{
 name:'暮光蒸汽列车',theme:'复古',type:'现实载具',object:'4-6-0蒸汽机车＋两节观景客厢',palette:'古铜 × 墨绿 × 暖金',aliases:['暮光蒸汽列车','蒸汽机车','蒸汽列车'],
 keywords:['4-6-0车轮组','蒸汽烟囱','观景客厢','铜质连杆','弧形铁轨'],
 structure:'明确展示蒸汽机车驾驶室、锅炉、6个驱动轮及连接客厢；座驾通过乘坐客厢实现载人。',
 requirements:'车轮连杆驱动必须机械合理，铜色为金属材质而非金色塑料，客厢可见窗框和舱门。',
 action:{arrival:'弧形铁轨从远处延伸，车头冒出少量蒸汽驶入画面。',main:'铜质连杆驱动机车车轮转动，客厢沿弧线跟随。',advanced:'机车响笛，顶端蒸汽随加速向后延伸。',premium:'镜头跟拍客厢侧面，再转向机车前方，暖光依次点亮车窗。',end:'机车缓缓停在镜头前45°角，车头与两节客厢完整入镜。'}
},
{
 name:'云顶双旋翼',theme:'机械',type:'现实载具',object:'前后双旋翼重型直升机',palette:'哑光钛灰 × 深蓝 × 冰银',aliases:['云顶双旋翼','前后双旋翼直升机','双旋翼重型直升机'],
 keywords:['前后双旋翼','封闭驾驶舱','起落架','钛灰机体','垂直降落'],
 structure:'前后各一组水平旋翼、可见机头驾驶舱和侧面舱门、下方起落架；具备明确载人能力。',
 requirements:'两组旋翼同步且方向合理，下降气流推动周围微粒，整体区别于已有喷气式战机。',
 action:{arrival:'双旋翼直升机从云层侧前方进入，前后旋翼持续旋转。',main:'机头转正，机身悬停后缓慢下降，起落架展开。',advanced:'机身侧向平移一小段，再微调姿态对准落点。',premium:'下降气流将周围云雾吹散，镜头从机侧移动到机头。',end:'起落架触地稳停，旋翼缓慢减速，完整展示驾驶舱和侧舱门。'}
},
{
 name:'深蓝探索者',theme:'深海',type:'现实载具',object:'双人透明观察舱深海潜航艇',palette:'深海蓝 × 钛银 × 宝石青',aliases:['深蓝探索者','透明观察舱潜航艇','深海潜航艇'],
 keywords:['双人观察舱','密封舱门','尾部推进器','机械抓臂','深海探照灯'],
 structure:'透明双人座观察舱、密封舱门、尾部螺旋推进器及两侧辅助推进器，明确可乘坐。',
 requirements:'潜航艇是水下封闭潜水器，非快艇；观察舱体现厚实玻璃折射，动作为水下航行。',
 action:{arrival:'深海探照灯先照亮水中微粒，潜航艇从暗处缓慢驶出。',main:'尾部推进器推动艇身穿过珊瑚侧边，机械抓臂收起。',advanced:'艇身侧转绕过礁石，舷窗内灯光显现。',premium:'潜航艇穿过一道水下拱门，气泡顺艇身向后扩散。',end:'艇身在画面中央悬停，机身45°展示观察舱、密封舱门与推进器。'}
},
{
 name:'荒原重甲犀',theme:'猛兽',type:'猛兽坐骑',object:'巨型披甲白犀牛坐骑',palette:'象牙白 × 暗金 × 深棕',aliases:['荒原重甲犀','重甲犀牛','犀牛坐骑'],
 keywords:['厚重犀角','金属甲片','双人鞍座','皮革缰绳','踏地尘土'],
 structure:'犀牛背部固定双人鞍座，胸侧有皮质固定带及脚蹬，头部缰绳连接骑乘区域。',
 requirements:'犀牛为四足猛兽，不是摆件或礼物；皮革鞍具的固定位置清晰，动作要有承重与惯性。',
 action:{arrival:'巨型白犀牛从荒原一侧踏步入场，鞍具随步伐轻晃。',main:'犀牛低头加速冲过碎石地面，前蹄重重踏地。',advanced:'冲刺后甩头转向，鞍座与缰绳随惯性摆动。',premium:'以低机位环绕犀牛一侧，强化重甲细节和压地尘浪。',end:'犀牛四足站稳、昂首停在画面前方，完整展示双人鞍座与甲片。'}
},
{
 name:'王廷战象',theme:'猛兽',type:'猛兽坐骑',object:'装配双人乘坐平台的成年战象',palette:'深蓝 × 象牙白 × 鎏金',aliases:['王廷战象','战象','载人战象'],
 keywords:['巨象长鼻','双人乘坐平台','背部鞍架','蓝金织物','金属脚镫'],
 structure:'背部固定双人骑乘平台、两侧攀登脚蹬及护栏，前方有象夫操控位置，能看出载人功能。',
 requirements:'身体比例真实厚重，装饰聚焦鞍架和护栏；禁止做成独立的大象礼物或纯飞行特效。',
 action:{arrival:'披甲战象踩着稳重步伐由远处缓缓入场，长鼻自然摆动。',main:'战象抬起前足踏下，背部鞍架轻微起伏。',advanced:'战象转身半侧向，卷起长鼻向前指引。',premium:'象群脚步扬起轻尘，镜头拉近鞍架细节后回到全景。',end:'战象正面偏侧定格，双人平台、攀登脚蹬与护栏清晰可见。'}
},
{
 name:'碧玉御龟',theme:'奇幻坐骑',type:'猛兽坐骑',object:'巨型陆龟＋龟背双人亭式鞍座',palette:'翡翠绿 × 古金 × 象牙白',aliases:['碧玉御龟','巨型陆龟坐骑','龟背双人鞍座'],
 keywords:['巨型陆龟','龟背亭式鞍座','青玉龟甲','护栏','缓慢稳行'],
 structure:'龟甲中央安装有承重支架的双人亭式鞍座，两侧设有栏杆和固定踏板。',
 requirements:'外观突出完整四足陆龟与龟壳承重结构；非水面漂浮宝物或无载人的神兽摆件。',
 action:{arrival:'巨型陆龟从草木边缓步进入，亭式鞍座轻微晃动。',main:'陆龟抬足跨过石阶，脚掌落地时带起细小草屑。',advanced:'陆龟转头并调整前足方向，龟背平台保持平稳。',premium:'青玉纹理沿龟甲一圈亮起，镜头由龟背转向正面全景。',end:'陆龟停在中央，龟背双人亭式鞍座与固定栏杆完整展示。'}
},
{
 name:'砂脊机械蝎',theme:'机械坐骑',type:'机械坐骑',object:'六足机械巨蝎＋背部双人驾驶鞍',palette:'黑钛 × 暖铜 × 沙金',aliases:['砂脊机械蝎','机械巨蝎','机械蝎坐骑'],
 keywords:['六足机械蝎','双人鞍座','钛合金外骨骼','分节蝎尾','履地关节'],
 structure:'中背设置双人鞍座、固定扶手和侧向脚踏，六足提供行走支撑，前方配有驾驶控制杆。',
 requirements:'以六足分节关节支撑、蝎尾动态平衡为重点；蝎尾不能遮挡乘坐结构，区别于礼物召唤特效。',
 action:{arrival:'机械巨蝎六足交替踏入沙地，蝎尾低位保持平衡。',main:'外骨骼关节收缩，机械蝎越过沙丘低坡。',advanced:'蝎尾抬起后回落，车身转向并露出双人驾驶鞍。',premium:'镜头绕行一周展示足部连杆与驾驶控制杆，沙粒随足步跳动。',end:'机械蝎以45°角稳稳停在镜头前，双人鞍座与六足结构清晰。'}
}
].map(o=>({...o,kind:'vehicle',idea:o.object+'；'+o.requirements,effect:o.action.main}));
const REVIEWED_EXCLUSIONS=['Desert Gold Runner','沙漠黄金越野车']; 
const normalize=s=>String(s||'').replace(/[（(]\s*\d+\s*[）)]\s*$/,'').normalize('NFKC').toLowerCase().replace(/[\s_\-\u00b7·：:（）()\[\]【】,.，。、]/g,'');
let ctx=null,settings={},loadedPlatform='',busy=false;
function platformSettings(){return settings[ctx?.platform]||{excluded_names:[],tier_prices:{}};}
function historical(){
 if(!ctx)return [];
 const m=new Map();
 (ctx.reports||[]).filter(r=>r.platform===ctx.platform||!r.platform).forEach(r=>(r.report?.skus||[]).filter(s=>s.cat==='座驾').forEach(s=>{
  const v=String(s.name||'').trim(),k=normalize(v);
  if(k&&!m.has(k))m.set(k,{name:v,id:String(s.id||'')});
 }));
 return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
}
function blockerNames(){
 return [...new Set([...historical().map(r=>r.name),...REVIEWED_EXCLUSIONS,...(platformSettings().excluded_names||[])].map(String))];
}
function eligible(items){
 const excluded=blockerNames().map(normalize).filter(Boolean);
 return items.filter(item=>!excluded.some(ex=>{
  if(ex===normalize(item.name))return true;
  return (item.aliases||[]).some(a=>{const x=normalize(a);return x.length>2&&(ex.includes(x)||x.includes(ex)&&ex.length>=4)});
 }));
}
function currentTier(){return TIERS[$('rideTier')?.value]?''+$('rideTier').value:'advanced';}
function priceFor(tier){
 const p=platformSettings().tier_prices||{},item=p[tier]||{};
 return {coin:Number.isInteger(+item.coin)&&Number(item.coin)>0?Number(item.coin):null,
  ticket:Number.isInteger(+item.ticket)&&Number(item.ticket)>0?Number(item.ticket):null};
}
function priceLabel(tier){
 const p=priceFor(tier);
 const fields=[];
 if(p.coin!=null)fields.push(p.coin.toLocaleString('zh-CN')+' 金币');
 if(p.ticket!=null)fields.push(p.ticket.toLocaleString('zh-CN')+' 荣誉券');
 return fields.length?fields.join(' / '):'尚未配置实际售价';
}
function timeline(entry,tier){
 const level=TIERS[tier]||TIERS.advanced;
 return level.segments.map(([range,title,field])=>({range,title,action:entry.action[field]}));
}
function card(entry){
 const t=currentTier(),level=TIERS[t],rows=timeline(entry,t);
 return '<div class="dd-ride-brief">'+
  '<div class="dd-ride-object"><div><small>具体设计对象</small><strong>'+escape(entry.object)+'</strong></div><span class="dd-ride-kind">'+escape(entry.type)+'</span></div>'+
  '<div class="dd-ride-fact"><b>载具属性</b><span>'+escape(entry.structure)+'</span></div>'+
  '<div class="dd-ride-fact"><b>设计要求</b><span>'+escape(entry.requirements)+'</span></div>'+
  '<div class="dd-ride-price"><div><small>售卖等级</small><strong>'+escape(level.label)+'</strong></div><div><small>总动画时长</small><strong>'+escape(level.total)+'（'+escape(level.duration)+'）</strong></div><div><small>该等级售价</small><strong>'+escape(priceLabel(t))+'</strong></div></div>'+
  '<div class="dd-ride-timeline-title">动画分镜说明 <span>时间 / 场景动作</span></div>'+
  '<div class="dd-ride-timeline">'+rows.map(row=>'<div class="dd-ride-action"><time>'+escape(row.range)+'</time><b>'+escape(row.title)+'</b><span>'+escape(row.action)+'</span></div>').join('')+'</div></div>';
}
function exportRow(entry){
 const tier=currentTier(),l=TIERS[tier],p=priceFor(tier);
 return [l.label,l.duration,l.total,p.coin??'待配置',p.ticket??'待配置',entry.type,entry.object,entry.structure,entry.requirements,
  timeline(entry,tier).map(t=>t.range+' '+t.title+'：'+t.action).join('；')];
}
function renderVisibility(){
 const vehicle=$('designRecommendCat')?.value==='vehicle';
 $('rideTierBox').hidden=!vehicle;
 $('ridePastBox').hidden=!vehicle;
 $('rideSettingsPanel').hidden=!vehicle||!ctx?.admin;
 if(!vehicle)return;
 const old=blockerNames();
 const fromOrders=historical().length,manual=(platformSettings().excluded_names||[]).length;
 $('ridePastCount').textContent=fromOrders+' 款历史成交 · '+REVIEWED_EXCLUSIONS.length+' 条已评审记录 · '+manual+' 条人工排除';
 $('ridePastNames').textContent=old.slice(0,20).map(s=>s.replace(/[（(]\d+[）)]$/,'')).join('、')+(old.length>20?' 等共 '+old.length+' 条':'');
 const t=currentTier(),price=priceLabel(t);
 $('rideTierHint').textContent=TIERS[t].label+' · '+TIERS[t].duration+' · '+price;
}
function fillSettings(){
 const s=platformSettings(),prices=s.tier_prices||{};
 for(const tier of Object.keys(TIERS)){
  for(const unit of ['coin','ticket']){
   const el=$('ridePrice_'+tier+'_'+unit);
   if(el)el.value=prices?.[tier]?.[unit]||'';
  }
 }
 $('rideManualExclude').value=(s.excluded_names||[]).join('\n');
}
async function loadSettings(){
 if(busy||!ctx||!window.MallCloud?.listRideSettings)return;
 busy=true;$('rideSettingsStatus').textContent='正在读取云端座驾配置…';
 try{
  const rows=await window.MallCloud.listRideSettings();
  settings=Object.fromEntries(rows.map(r=>[r.platform,r]));
  loadedPlatform=ctx.platform;fillSettings();
  $('rideSettingsStatus').textContent='云端配置已同步';
  window.dispatchEvent(new Event('mall:ride-refresh'));
 }catch(err){$('rideSettingsStatus').textContent='读取配置失败：'+err.message}
 finally{busy=false;}
}
function parsePrice(unit){
 const vals=Object.keys(TIERS).map(t=>($('ridePrice_'+t+'_'+unit)?.value||'').trim());
 if(vals.every(v=>v===''))return null;
 if(vals.some(v=>v===''||!/^\d+$/.test(v)||!Number.isSafeInteger(+v)||+v<=0))throw Error((unit==='coin'?'金币':'荣誉券')+'价格必须为三个等级都填写正整数，或全部留空');
 const nums=vals.map(Number);
 if(!(nums[0]<nums[1]&&nums[1]<nums[2]))throw Error((unit==='coin'?'金币':'荣誉券')+'售价必须：基础款 < 进阶款 < 高阶款');
 return nums;
}
async function saveSettings(){
 if(!ctx?.admin)return;
 const btn=$('rideSettingsSave');btn.disabled=true;
 try{
  const coins=parsePrice('coin'),tickets=parsePrice('ticket');
  const tiers={};
  Object.keys(TIERS).forEach((tier,i)=>tiers[tier]={coin:coins?.[i]??null,ticket:tickets?.[i]??null});
  const excluded=[...new Set(($('rideManualExclude').value||'').split(/\r?\n|、|；|;/g).map(s=>s.trim()).filter(Boolean))].slice(0,400);
  await window.MallCloud.putRideSettings(ctx.platform,excluded,tiers);
  settings[ctx.platform]={platform:ctx.platform,excluded_names:excluded,tier_prices:tiers};
  $('rideSettingsStatus').textContent='已保存到云端：座驾等级价格及历史排除名单';
  renderVisibility();window.dispatchEvent(new Event('mall:ride-refresh'));
 }catch(err){$('rideSettingsStatus').textContent='保存失败：'+err.message}
 finally{btn.disabled=false}
}
$('rideTier').addEventListener('change',()=>window.dispatchEvent(new Event('mall:ride-refresh')));
$('rideSettingsSave').addEventListener('click',saveSettings);
window.MallRideEngine=Object.freeze({catalog,eligible,card,exportRow,currentTier,renderVisibility,setContext(next){
 const changed=!ctx||ctx.platform!==next.platform;
 ctx=next;renderVisibility();
 if(changed||!loadedPlatform){loadedPlatform='';loadSettings();}
}});
})();