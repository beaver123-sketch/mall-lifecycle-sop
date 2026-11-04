/* Design Direction v1: evidence-led creative briefs, no fabricated sales data. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const CATS=['头像框','派对背景','资料卡','聊天气泡','座驾'];
const SET_CATS=['头像框','资料卡','派对背景','聊天气泡'];
const SETS=[
 ['月下誓约','婚礼','象牙白 × 香槟金','白玫瑰,双环,珍珠,月光,轻纱',
  '以月光婚礼为统一主题，整体温柔但保持金属与珍珠的高级材质，不使用厚重舞台造型。',
  '以白玫瑰花环、细金双环和珍珠构成头像框，顶部点缀微小月冠，确保人物脸部不被遮挡。',
  '象牙白丝绸底纹搭配金色细线与珍珠角饰，留出清晰的昵称和资料信息区。',
  '开阔月色花园中由白玫瑰和轻纱构成空间，月轮作为主体，避免常规对称舞台；预留麦位区域。',
  '奶油白半透明气泡，只在侧边点缀玫瑰枝与细金环，文字背景保持干净。',
  '月轮柔光、轻纱微动、花瓣缓落'],
 ['金鳞龙境','奇幻','曜黑 × 鎏金','黄金巨龙,龙鳞,云海,王冠,鎏金流光',
  '以完整金龙贯穿四种装扮，强调真实金属鳞片与东方威严，不做廉价塑料金。',
  '龙翼盘绕环形边框，龙首立于顶部；小面积红宝石强化视觉中心。',
  '黑金鳞纹底配金属徽章与云纹浮雕，重点文字区域使用低对比纹理。',
  '黄金巨龙以整条龙的体态横贯云海，龙首形成主要焦点，而非舞台式背景。',
  '龙鳞沿气泡边缘细密排列，一侧露出小型龙角；聊天文字区保持纯净。',
  '龙头流光、鳞片闪烁、云层缓动'],
 ['深海人鱼秘境','奇幻','深海蓝 × 珍珠紫','美人鱼,水晶珊瑚,贝母,珍珠,水纹流光',
  '以高透贝母、水晶与深海色调统一四款装扮，强调神秘海洋质感。',
  '珍珠贝壳与蓝紫水晶组成不对称外框，点缀精细鱼尾纹。',
  '深海蓝渐变叠加贝母薄纹，角落珊瑚金线点缀，信息层保持清晰。',
  '以完整美人鱼、巨型水晶珊瑚和深海光束构成立体海底世界，不套用舞台背景。',
  '贝壳曲线作为气泡一端的收尾装饰，中央采用半透明深蓝底保证阅读。',
  '鱼尾微摆、水面波纹、珍珠闪烁'],
 ['沙漠星月神殿','奢华','沙金 × 深靛蓝','新月,星芒,宝石,阿拉伯纹样,鎏金穹顶',
  '融合星月与沙漠宝石建筑元素，强调中东审美元素与高质感金属细节。',
  '新月弧线构成上半框，细宝石链与阿拉伯纹样连接两侧，整体精致利落。',
  '深靛蓝底与金色纹章结合，四角采用薄金镶边，确保信息可读。',
  '远景沙漠与悬浮星月穹顶形成纵深，主体是完整神殿与夜空而非麦位舞台。',
  '新月与星星只放在气泡两角，使用极细金边和低噪音半透明底。',
  '星光流动、宝石微闪、沙尘光晕'],
 ['凤凰涅槃','奇幻','深红 × 熔金','赤金凤凰,火羽,日轮,金属浮雕,余烬',
  '用凤凰羽翼和金红熔金材质形成统一身份装扮，视觉强烈但不堆砌烟火特效。',
  '凤凰双翼形成外框上缘，尖端羽毛收束于两侧，避开用户脸部。',
  '暗红材质底上排列精细羽纹和金色日轮图腾，正文区域降低纹理对比度。',
  '整只凤凰展开翅膀横贯天空，日轮与流云作背景，避开对称立柱与舞台。',
  '以一片金红火羽作角标、细金焰勾边，保持气泡阅读清晰。',
  '羽缘流火、余烬漂浮、光翼缓动'],
 ['蔷薇星河','婚礼','深紫 × 玫瑰金','蔷薇藤,星河,晶石,玫瑰金,细碎星光',
  '将蔷薇花枝与星空融合为统一轻梦幻主题，金属质感克制、空间感强。',
  '玫瑰金蔷薇枝沿头像外围缠绕，星屑点缀枝叶边缘。',
  '深紫星幕搭配玫瑰金纤细花藤，卡片信息区采用雾面遮罩。',
  '蔷薇藤蔓飘浮于广阔银河中，中央留展示空间，避免重复布置舞台道具。',
  '小蔷薇花瓣落在气泡右上边缘，主体使用纯净紫色薄底。',
  '星点流动、花瓣微晃、藤枝细闪'],
 ['冰晶王冠','自然','冰蓝 × 银白','冰晶,极光,王冠,蓝宝石,雪花',
  '以高透冰晶与蓝宝石为统一材质，形成清冷华丽但保持通透的整套装扮。',
  '透明冰晶组成不对称王冠框，蓝宝石镶于最高点，边缘晶体细致。',
  '冰蓝渐变背景与银色细纹，局部晶体折射但避免信息区域反光。',
  '以巨大冰晶王冠与极光冰原作为视觉主体，构图开阔、不使用舞台。',
  '雪晶只在气泡边缘点缀，半透明冰蓝底确保文字辨识。',
  '极光缓动、冰晶折射、细雪漂浮'],
 ['黑曜王权','奢华','黑曜石 × 古金','黑曜石,王室徽章,红宝石,金属浮雕,权杖',
  '以黑曜石与古金王室纹章形成庄严主题，四款设计保持统一纹样比例。',
  '古金王冠与徽章构成框顶，细金浮雕向两侧收束，辅以少量红宝石。',
  '黑曜石底纹叠加金属盾徽，文字信息区保持高对比，角部用精密纹样。',
  '巨大王室徽章与悬空权杖作为画面主视觉，以暗金空间构图代替舞台。',
  '以细古金线勾勒气泡轮廓、仅角落嵌一枚红宝石，不影响文字。',
  '徽章金线扫光、宝石微闪']
].map(([name,theme,palette,keywordText,idea,...details])=>({
 kind:'set',name,theme,palette,keywords:keywordText.split(','),idea,
 variants:Object.fromEntries(SET_CATS.map((cat,i)=>[cat,details[i]])),effect:details[4]
}));
const RIDES=[
 ['曜夜幻翼','科技','曜黑 × 冰蓝','黑金超跑,机械羽翼,蓝色尾焰,金属反光,速度','未来感黑金超跑从高空俯冲，机械羽翼展开并降落于镜头前，突出真实金属感。','俯冲、机械羽翼展开、甩尾定格'],
 ['沙漠黄金征服者','奢华','亮金 × 沙褐','黄金越野车,沙丘,沙尘,金属光泽,力量','黄金越野车冲坡腾跃后落地甩尾，以车体品质和冲击力为重点。','冲坡、腾跃、落地甩尾'],
 ['龙脊御风','奇幻','赤金 × 墨黑','黄金巨龙,龙首,龙鳞,云海,风暴','整条黄金巨龙穿云盘旋而至，在前景停留，突出龙身比例与鳞片质感。','穿云、盘旋、龙眼点亮'],
 ['星穹独角兽','奇幻','银白 × 星蓝','独角兽,星河,银白,蓝水晶,羽翼','独角兽从星云穿行落地，水晶与羽翼的细节随运动渐次点亮。','星际奔跑、羽翼舒展、停驻'],
 ['曜金飞舟','奢华','鎏金 × 深蓝','悬浮飞舟,黄金浮雕,月轮,流云,光轨','镶嵌宝石的悬浮飞舟掠过云端，在月轮前停驻，设计重点是飞舟结构。','掠过云层、光轨、悬停'],
 ['赤焰凤凰战车','奇幻','赤金 × 深红','凤凰,赤金战车,火羽,熔金,火焰','火羽形成战车尾翼，金属车身从赤焰中冲出，强调非塑料材质。','火羽展开、冲刺、焰光收束'],
 ['月神银翼','科技','银白 × 浅蓝','银翼飞行器,月轮,水晶核心,尾迹,流线外壳','银白飞行器沿月轮轨道滑翔后悬停，视觉高端而非复杂机械堆积。','滑翔、银翼展开、悬停'],
 ['沙海幻影','奢华','铂金 × 琥珀','沙漠跑车,琥珀宝石,金属切面,沙流,光线','铂金跑车从沙海疾驰而来，琥珀光泽沿车身切面滚动。','沙海冲刺、扬尘、刹车定格']
].map(([name,theme,palette,keywordText,idea,effect])=>({
 kind:'vehicle',name,theme,palette,keywords:keywordText.split(','),idea,effect
}));
const escape=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(Number(n)||0).toLocaleString('zh-CN');
const dollars=n=>(Number(n||0)/1000).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2});
const csv=v=>{let s=String(v==null?'':v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
const token=s=>String(s||'').split(/[,，、;；\n]/).map(x=>x.trim()).filter(Boolean).slice(0,8);
const key=(cat,id)=>cat+'|'+String(id);
let ctx=null,tags=[],loaded=false,loading=false,round=0,selected=[],tagFilter='';
function scopedTags(){return tags.filter(t=>t.platform===ctx?.platform);}
function monthReports(){
 if(!ctx)return [];
 return ctx.reports.filter(r=>r.period<=ctx.period).sort((a,b)=>b.period.localeCompare(a.period)).slice(0,3);
}
function metrics(){
 const months=monthReports(),tMap=new Map(scopedTags().map(t=>[key(t.category,t.sku_id),t]));
 const products=new Map(),bases=new Map(),groups=new Map();
 months.forEach(m=>(m.report?.skus||[]).forEach(s=>{
  const id=key(s.cat,s.id);if(!products.has(id))products.set(id,{cat:s.cat,id:String(s.id),name:s.name,qty:0,coin:0});
  const p=products.get(id);p.qty+=Number(s.qty)||0;p.coin+=Number(s.coin)||0;
 }));
 for(const p of products.values()){
  if(!bases.has(p.cat))bases.set(p.cat,{qty:0,items:0});
  const base=bases.get(p.cat);base.qty+=p.qty;base.items++;
  const tag=tMap.get(key(p.cat,p.id));if(!tag||!tag.theme)continue;
  const id=p.cat+'|'+tag.theme;
  if(!groups.has(id))groups.set(id,{cat:p.cat,theme:tag.theme,qty:0,coin:0,items:[],styles:new Set(),elements:new Set()});
  const g=groups.get(id);g.qty+=p.qty;g.coin+=p.coin;g.items.push(p);
  (tag.styles||[]).forEach(x=>g.styles.add(x));(tag.elements||[]).forEach(x=>g.elements.add(x));
 }
 return {months,products,bases,groups,tMap};
}
function renderCoverage(data){
 const relevant=[...data.products.values()].filter(x=>CATS.includes(x.cat));
 const covered=relevant.filter(p=>data.tMap.has(key(p.cat,p.id))).length;
 $('designCoverage').textContent='当前分析范围：'+data.months.length+' 个已发布月份 · '+covered+'/'+relevant.length+' 个 SKU 已标注';
 $('designTagCount').textContent=scopedTags().length+' 条标签';
}
function rankThemes(data){
 const mode=$('designRecommendCat').value,cats=mode==='set'?SET_CATS:['座驾'];
 const groups=new Map();
 [...data.groups.values()].filter(g=>cats.includes(g.cat)).forEach(g=>{
  if(!groups.has(g.theme))groups.set(g.theme,{theme:g.theme,cats:new Map(),qty:0,items:[]});
  const x=groups.get(g.theme);x.cats.set(g.cat,g);x.qty+=g.qty;x.items.push(...g.items);
 });
 const arr=[...groups.values()].sort((a,b)=>{
  const norm=x=>[...x.cats.values()].reduce((s,g)=>{const base=data.bases.get(g.cat);return s+(g.qty/g.items.length)/Math.max(base?.qty/base?.items||0,1)},0)/x.cats.size;
  return norm(b)-norm(a);
 });
 $('designThemeRows').innerHTML=arr.map(x=>{
  const breakdown=[...x.cats.values()].map(g=>{const base=data.bases.get(g.cat),avg=base?.items?base.qty/base.items:0;
   return escape(g.cat)+' '+fmt(g.qty)+' 件（单品均销 '+fmt(g.qty/g.items.length)+' / 品类均销 '+fmt(avg)+'）';
  }).join('<br>');
  return '<tr><td><strong>'+escape(x.theme)+'</strong></td><td class="num">'+x.cats.size+'/'+cats.length+'</td>'+
  '<td class="num">'+x.items.length+'</td><td class="num">'+fmt(x.qty)+'</td>'+
  '<td class="dd-source">'+breakdown+'</td><td class="dd-source">'+x.items.slice().sort((a,b)=>b.qty-a.qty).slice(0,4).map(p=>escape(p.name)+' (ID '+escape(p.id)+')').join('、')+'</td></tr>';
 }).join('')||'<tr><td colspan="6" class="dd-empty">当前没有覆盖该设计类型的已标注成交商品。请先在下方标签管理中设置历史商品主题材。</td></tr>';
}
function candidateScore(t,data){
 const cats=t.kind==='set'?SET_CATS:['座驾'];
 return cats.reduce((total,cat)=>{
  const g=data.groups.get(cat+'|'+t.theme),b=data.bases.get(cat);
  if(!g||!g.items.length)return total;
  const categoryAvg=b?.items?b.qty/b.items:0;
  return total+(g.qty/g.items.length)/Math.max(categoryAvg,1)+Math.min(g.items.length,5)*.12;
 },0);
}
function recLabel(t,data){
 const cats=t.kind==='set'?SET_CATS:['座驾'];
 const observations=cats.map(cat=>{
  const g=data.groups.get(cat+'|'+t.theme),b=data.bases.get(cat);
  if(!g||!g.items.length)return null;
  const avg=g.qty/g.items.length,baseAvg=b?.items?b.qty/b.items:0;
  return {cat,count:g.items.length,qty:g.qty,avg,baseAvg,
   products:g.items.slice().sort((a,b)=>b.qty-a.qty).slice(0,2).map(p=>p.name+'（'+p.id+'）').join('、')};
 }).filter(Boolean);
 if(!observations.length)return {cls:'idea',name:'创意候选 · 暂无题材销售依据',
  info:'所选统计周期内未找到已标注的相关历史商品。以下为创意方向示例，不代表已经验证畅销。'};
 const info=observations.map(o=>o.cat+'：'+o.count+' 个SKU、销量 '+fmt(o.qty)+' 件，单品均销 '+fmt(o.avg)+' 件（同品类均值 '+fmt(o.baseAvg)+'）；参考 '+o.products).join('。');
 const above=observations.filter(o=>o.avg>o.baseAvg&&o.count>=2);
 const strong=t.kind==='set'?above.length>=2:above.length>=1;
 return {cls:strong?'strong':'limited',name:strong?'多品类历史表现较好 · 可延展':'已有销售样本 · 需要继续验证',
  info:info+(t.kind==='set'?'。仅按品类分别比较，不将不同品类销量直接作为优劣依据。':'。')};
}
function makeRecommendations(data){
 const mode=$('designRecommendCat').value,count=Math.max(1,Math.min(8,Number($('designRecommendCount').value)||4));
 let items=(mode==='vehicle'?RIDES:SETS).slice().sort((a,b)=>candidateScore(b,data)-candidateScore(a,data));
 const start=round*2%items.length;items=items.slice(start).concat(items.slice(0,start));
 return items.slice(0,count).map(t=>({...t,evidence:recLabel(t,data)}));
}
function renderRecommendations(data){
 const mode=$('designRecommendCat').value;
 $('designRecommendCountTitle').textContent=mode==='vehicle'?'座驾款数':'主题套数';
 const suffix=mode==='vehicle'?'款':'套';
 Array.from($('designRecommendCount').options).forEach(o=>o.textContent=o.value+' '+suffix);
 selected=makeRecommendations(data);
 $('designRecommendCards').classList.toggle('dd-rides',mode==='vehicle');
 $('designRecommendCards').innerHTML=selected.map((r,i)=>{
  const type=r.kind==='set'?'主题套装 · 四品类':'独立座驾';
  const parts=r.kind==='set'?'<div class="dd-variant-heading">同一主题下的四个品类设计</div><div class="dd-variants">'+SET_CATS.map(cat=>
   '<div class="dd-variant"><strong>'+escape(cat)+'</strong><p>'+escape(r.variants[cat])+'</p></div>'
  ).join('')+'</div>':'<div class="dd-vehicle"><strong>座驾独立设计</strong><p>'+escape(r.idea)+'</p></div>';
  return '<article class="dd-card"><div class="dd-card-top"><span class="dd-index">'+String(i+1).padStart(2,'0')+'</span>'+
   '<span class="dd-category">'+type+'</span><span class="dd-evidence '+r.evidence.cls+'">'+escape(r.evidence.name)+'</span></div>'+
   '<h3>'+escape(r.name)+'</h3><div class="dd-palette">统一配色：'+escape(r.palette)+'</div>'+
   '<div class="dd-tags">'+r.keywords.map(k=>'<span>'+escape(k)+'</span>').join('')+'</div>'+
   (r.kind==='set'?'<p class="dd-idea">'+escape(r.idea)+'</p>':'')+parts+
   '<div class="dd-effect"><b>'+(r.kind==='set'?'套装动效方向':'登场动效')+'</b> '+escape(r.effect)+'</div>'+
   '<div class="dd-proof"><strong>历史销量参考</strong><p>'+escape(r.evidence.info)+'</p></div></article>';
 }).join('');
 const supported=selected.filter(r=>r.evidence.cls!=='idea').length;
 $('designRecommendNotice').textContent='已生成 '+selected.length+(mode==='set'?' 套统一主题装扮（每套包含头像框、资料卡、派对背景、聊天气泡，共 '+(selected.length*4)+' 个品类设计）':' 款独立座驾设计')+
  '。其中 '+supported+' 个方向关联到已标注历史销量；无样本的方案会明确标为创意候选。';
}
function allProducts(){
 const map=new Map();
 (ctx?.reports||[]).sort((a,b)=>b.period.localeCompare(a.period)).forEach(m=>(m.report?.skus||[]).forEach(s=>{
  const id=key(s.cat,s.id);if(!map.has(id))map.set(id,{cat:s.cat,id:String(s.id),name:String(s.name),qty:0});
  map.get(id).qty+=Number(s.qty)||0;
 }));
 return map;
}
function fillTag(cat,id){
 const prod=allProducts().get(key(cat,id)),tag=scopedTags().find(t=>t.category===cat&&t.sku_id===String(id));
 $('designTagCat').value=cat;$('designTagSku').value=String(id);
 $('designTagTheme').value=tag?.theme||'';
 $('designTagStyles').value=(tag?.styles||[]).join('、');
 $('designTagElements').value=(tag?.elements||[]).join('、');
 $('designTagProductName').textContent=prod?'当前商品：'+prod.name+(tag?' · 正在编辑已存标签':''):'未在已发布订单中找到对应 SKU';
 $('designTagsPanel').open=true;
}
function renderTags(data){
 const admin=!!ctx?.admin;
 $('designTagsPanel').hidden=!admin;
 if(!admin)return;
 const catalog=allProducts(),active=scopedTags().slice().sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
 const current=(ctx.reports.find(r=>r.period===ctx.period)?.report?.skus||[]).filter(s=>CATS.includes(s.cat));
 const needed=current.filter(s=>!data.tMap.has(key(s.cat,s.id))).sort((a,b)=>b.qty-a.qty).slice(0,10);
 $('designUntagged').innerHTML=needed.map(s=>'<button type="button" class="dd-untagged" data-cat="'+escape(s.cat)+'" data-sku="'+escape(s.id)+'">'+escape(s.cat)+' · '+escape(s.name)+' <small>ID '+escape(s.id)+'</small></button>').join('')||'<span class="dd-empty">本月暂无待标注的成交商品</span>';
 const filtered=active.filter(t=>!tagFilter||t.sku_id.includes(tagFilter)||t.name.includes(tagFilter)||t.theme.includes(tagFilter)).slice(0,80);
 $('designTagList').innerHTML=filtered.map(t=>'<div class="dd-tag-row"><div><strong>'+escape(t.name||catalog.get(key(t.category,t.sku_id))?.name||t.sku_id)+'</strong> <small>ID '+escape(t.sku_id)+' · '+escape(t.category)+'</small><p>'+escape(t.theme)+' · '+escape((t.styles||[]).join(' / '))+' · '+escape((t.elements||[]).join(' / '))+'</p></div><div class="dd-tag-actions"><button type="button" data-edit-cat="'+escape(t.category)+'" data-edit-sku="'+escape(t.sku_id)+'">编辑</button><button type="button" data-delete-cat="'+escape(t.category)+'" data-delete-sku="'+escape(t.sku_id)+'">删除</button></div></div>').join('')||'<div class="dd-empty">暂无已保存的标签</div>';
}
function renderAll(){
 if(!ctx||!$('designRecommendCards'))return;
 const data=metrics();renderCoverage(data);rankThemes(data);renderRecommendations(data);renderTags(data);
}
async function loadTags(){
 if(loading)return;loading=true;
 try{
  if(!window.MallCloud?.listDesignTags)throw Error('标签云端组件未就绪');
  tags=await window.MallCloud.listDesignTags();loaded=true;
  $('designLabelState').textContent='标签已同步云端';renderAll();
 }catch(err){$('designLabelState').textContent='标签读取失败：'+err.message;tags=[];renderAll();}
 finally{loading=false}
}
async function saveTag(){
 if(!ctx?.admin)return;
 const cat=$('designTagCat').value,id=$('designTagSku').value.trim(),theme=$('designTagTheme').value.trim(),prod=allProducts().get(key(cat,id));
 if(!prod){$('designTagProductName').textContent='请填写存在于已发布订单中的商品 ID，并确认所属品类';return}
 if(!theme||theme.length>60){$('designTagProductName').textContent='请填写有效的题材标签（最多60字）';return}
 const btn=$('designTagSave');btn.disabled=true;btn.textContent='正在保存…';
 try{
  await window.MallCloud.putDesignTag({platform:ctx.platform,category:cat,sku_id:id,name:prod.name,theme,styles:token($('designTagStyles').value),elements:token($('designTagElements').value)});
  await loadTags();$('designTagProductName').textContent='已保存至云端：'+prod.name;
 }catch(err){$('designTagProductName').textContent='保存失败：'+err.message}
 finally{btn.disabled=false;btn.textContent='保存标签'}
}
function downloadCsv(){
 if(!selected.length)return;
 const headers=['方案类型','主题名称','品类','设计题材','统一配色','核心关键词','统一设计构想','该品类设计说明','动效方向','销售判断','历史销售依据'];
 const rows=[headers];
 selected.forEach(r=>{
  if(r.kind==='set')SET_CATS.forEach(cat=>rows.push(['主题套装',r.name,cat,r.theme,r.palette,r.keywords.join(' / '),r.idea,r.variants[cat],r.effect,r.evidence.name,r.evidence.info]));
  else rows.push(['独立座驾',r.name,'座驾',r.theme,r.palette,r.keywords.join(' / '),r.idea,r.idea,r.effect,r.evidence.name,r.evidence.info]);
 });
 const blob=new Blob(['\uFEFF'+rows.map(row=>row.map(csv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
 a.download='商城设计提需_'+ctx.platform+'_'+ctx.period+'_'+(selected[0]?.kind==='set'?'四品类主题套装':'座驾')+'.csv';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
$('designRecommendCat').addEventListener('change',()=>{round=0;renderAll()});
$('designRecommendCount').addEventListener('change',()=>{round=0;renderAll()});
$('designRegenerate').addEventListener('click',()=>{round++;renderAll()});
$('designExportBrief').addEventListener('click',downloadCsv);
$('designTagSave').addEventListener('click',saveTag);
$('designTagSku').addEventListener('change',()=>fillTag($('designTagCat').value,$('designTagSku').value.trim()));
$('designTagCat').addEventListener('change',()=>fillTag($('designTagCat').value,$('designTagSku').value.trim()));
$('designTagSearch').addEventListener('input',e=>{tagFilter=e.target.value.trim();renderAll()});
$('designUntagged').addEventListener('click',e=>{const b=e.target.closest('[data-sku]');if(b)fillTag(b.dataset.cat,b.dataset.sku)});
$('designTagList').addEventListener('click',async e=>{
 const edit=e.target.closest('[data-edit-sku]');if(edit){fillTag(edit.dataset.editCat,edit.dataset.editSku);return}
 const del=e.target.closest('[data-delete-sku]');if(!del||!ctx?.admin)return;
 del.disabled=true;
 try{await window.MallCloud.removeDesignTag(ctx.platform,del.dataset.deleteCat,del.dataset.deleteSku);await loadTags()}
 catch(err){$('designTagProductName').textContent='删除失败：'+err.message;del.disabled=false}
});
window.addEventListener('mall:design-render',e=>{
 const changed=!ctx||ctx.platform!==e.detail.platform||ctx.period!==e.detail.period;
 ctx=e.detail;if(changed)round=0;
 renderAll();if(!loaded&&!loading)loadTags();
});
})();
