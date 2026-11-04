/* Design Direction v1: evidence-led creative briefs, no fabricated sales data. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const CATS=['头像框','派对背景','资料卡','聊天气泡','座驾'];
const LIB=[
['头像框','月下誓约','婚礼','香槟金,白玫瑰,珍珠,月光,双环','以珍珠与白玫瑰围合头像，双环悬于顶部，轻纱与月光提供精致层次。','珍珠微光、花瓣轻飘'],
['头像框','赤焰龙冠','奇幻','黑金,赤龙,红宝石,王冠,火焰','以红宝石王冠为焦点，龙翼向两侧舒展，金属鳞片与火焰形成威严轮廓。','龙眼点亮、鳞片流光'],
['头像框','星穹圣翼','奇幻','银蓝,天使羽翼,星芒,水晶,流光','银蓝羽翼自然环绕头像，星芒与水晶点缀，保留人物面部可视空间。','羽翼微动、星点闪烁'],
['头像框','鎏金花冠','婚礼','黄金浮雕,玫瑰,蕾丝,珍珠,光泽','以精雕玫瑰和金属花枝构筑贵族式花冠，突出细腻材质而非堆积体量。','金边呼吸光'],
['头像框','冰晶王座','自然','冰晶,极光,宝石,银白,雪花','透明冰晶构成不对称冠饰，点缀极光与蓝宝石，整体保持轻盈。','冰晶折射、雪光闪动'],
['头像框','月曜黑金','奢华','黑曜石,鎏金,新月,浮雕,宝石','黑曜石弧面搭配纤细鎏金边框，新月图腾立于顶端，突出沉稳贵气。','金线流光'],
['派对背景','金鳞龙境','奇幻','黄金巨龙,盘龙,云海,龙鳞,金色流光','以完整黄金巨龙盘踞画面为主体，云海穿行其间，不采用传统舞台式构图。','龙头流光、龙鳞闪烁、云雾缓动'],
['派对背景','深海人鱼秘境','奇幻','美人鱼,深海,水晶珊瑚,珍珠,蓝紫流光','以人鱼与大型珊瑚群构成海底世界，预留语音麦位的可视空间。','鱼尾微摆、水波、珍珠闪烁'],
['派对背景','月光婚礼花园','婚礼','白玫瑰,月光,婚礼花园,纱幔,花瓣','以开阔夜色花园、月轮和攀藤玫瑰营造浪漫感，避免标准舞台布景。','纱幔轻动、花瓣缓落'],
['派对背景','沙漠星月神殿','奢华','金色穹顶,星月,沙漠,宝石,阿拉伯纹样','以沙漠天际与悬浮星月神殿形成纵深，华丽纹样只作局部点缀。','星光流动、沙尘微光'],
['派对背景','凤凰涅槃之翼','奇幻','金红凤凰,羽翼,熔金,云层,火焰','凤凰双翼横贯画面，以羽翼作为视觉主体，避免对称舞台和重复立柱。','羽缘流火、余烬漂浮'],
['派对背景','蔷薇星河','婚礼','深紫星河,蔷薇藤,银河,晶石,光点','蔷薇花枝悬浮于星河之间，中央保留清晰展示区，构建轻梦幻空间。','星点流动、花瓣微晃'],
['资料卡','黑曜王权','奢华','黑曜石,鎏金,王室纹章,浮雕,金属质感','以黑曜石纹理为底，边缘用精密金色浮雕及王室纹章强化高阶身份感。','金线扫光'],
['资料卡','月白誓言','婚礼','象牙白,珍珠,丝绸,白玫瑰,金线','以纯净白与香槟金构成低饱和婚礼气质，卡片信息区保持高可读性。','微光扫过'],
['资料卡','翡翠秘典','自然','祖母绿,宝石切面,藤蔓,银纹,深绿','宝石切面与植物纹理叠层，信息区使用深色衬底保障文字对比度。','宝石折射'],
['资料卡','星轨档案','科技','深蓝,星轨,流线,晶格,冷银','星轨与晶格形成科技感信息背景，避免动态元素干扰正文阅读。','星轨慢移'],
['资料卡','赤金荣耀','奇幻','赤金,盾徽,王冠,红宝石,浮雕','红金徽章搭配立体金属铭纹，营造荣誉身份视觉层级。','徽章高光'],
['资料卡','海蓝秘境','自然','深海蓝,珍珠母贝,珊瑚线条,水纹,水晶','以贝母纹理与水光构筑轻奢海洋主题资料卡。','柔和水波'],
['聊天气泡','星月密语','奢华','深蓝,星月,细金边,星光,半透明','薄金边与小型星月装饰点缀气泡边角，聊天文字区保持净空。','边角星点闪光'],
['聊天气泡','蔷薇来信','婚礼','白玫瑰,丝带,香槟粉,珍珠,半透明','将玫瑰和细丝带集中于气泡边缘，保持文字背景干净。','花瓣轻飘'],
['聊天气泡','冰蓝絮语','自然','冰蓝,雪晶,银线,通透,微光','冰晶仅在两端点缀，中部使用高对比度的半透明底。','冰晶闪光'],
['聊天气泡','龙焰回响','奇幻','赤金,龙鳞,暗红,火苗,金属边','沿轮廓铺设小面积龙鳞和火焰纹理，避免遮挡文本。','边框微焰'],
['聊天气泡','极夜星轨','科技','深空黑,蓝色光轨,粒子,薄边,霓虹','极夜底色与轻薄光轨结合，保持信息优先。','光轨缓行'],
['聊天气泡','珍珠絮语','婚礼','奶油白,金边,珍珠,纱纹,柔光','以细金线与珍珠粒形成柔和、精致的婚礼气泡。','珍珠细闪'],
['座驾','曜夜幻翼','科技','黑金超跑,机械羽翼,蓝色尾焰,流光,速度','未来豪华超跑展开机械羽翼后降落，最终定格为正面展示。','冲刺、羽翼展开、甩尾定格'],
['座驾','沙漠黄金征服者','奢华','黄金越野车,沙丘,沙尘,金属光泽,力量','黄金越野车冲坡腾跃、落地甩尾，突出车身品质和真实动态。','冲坡、腾跃、落地甩尾'],
['座驾','龙脊御风','奇幻','东方巨龙,金鳞,龙首,云海,风暴','黄金巨龙穿云而至，盘旋落定，强化幻想生物的宏大冲击力。','穿云、盘旋、定格'],
['座驾','星穹独角兽','奇幻','独角兽,星河,银白,蓝水晶,羽翼','独角兽自星云穿行落地，水晶与羽翼形成高品质细节。','星际奔跑、羽翼舒展'],
['座驾','曜金飞舟','奢华','飞舟,金属浮雕,黄金,月轮,流云','悬浮飞舟掠过云端，月轮映衬车体，最终稳稳落于镜头前。','飞行、光轨、悬停'],
['座驾','赤焰凤凰战车','奇幻','凤凰,赤金战车,火羽,熔金,火焰','凤凰火羽形成战车尾翼，金属车体从火焰中冲出，避免塑料质感。','火羽展开、冲刺、熄焰定格']
].map(([cat,name,theme,keywords,idea,effect])=>({cat,name,theme,keywords:keywords.split(','),idea,effect}));
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
 const cat=$('designRecommendCat').value;
 const all=[...data.groups.values()].filter(g=>cat==='全部'||g.cat===cat).sort((a,b)=>(b.qty/b.items)-(a.qty/a.items));
 $('designThemeRows').innerHTML=all.map(g=>'<tr><td><strong>'+escape(g.theme)+'</strong><small class="dd-cat">'+escape(g.cat)+'</small></td><td class="num">'+g.items.length+'</td><td class="num">'+fmt(g.qty)+'</td><td class="num">'+fmt(g.qty/g.items.length)+'</td><td class="num">$'+dollars(g.coin)+'</td><td class="dd-source">'+g.items.slice(0,3).map(p=>escape(p.name)+' (ID '+escape(p.id)+')').join('、')+'</td></tr>').join('')||
 '<tr><td colspan="6" class="dd-empty">当前筛选条件下尚无带题材标签的成交商品。管理员标注后即可生成真实题材排行。</td></tr>';
}
function candidateScore(t,data){
 const g=data.groups.get(t.cat+'|'+t.theme),base=data.bases.get(t.cat);
 if(!g||!g.items.length)return 0;
 const categoryAvg=base?.items?base.qty/base.items:0;
 return 1+Math.min(g.qty/g.items.length/Math.max(categoryAvg,1),5)+Math.min(g.items.length,5)*.12;
}
function recLabel(t,data){
 const g=data.groups.get(t.cat+'|'+t.theme),base=data.bases.get(t.cat);
 if(!g||!g.items.length)return {cls:'idea',name:'创意候选 · 待数据验证',info:'当前统计月份中暂无已标注的同品类、同题材成交商品。'};
 const avg=g.qty/g.items.length,refAvg=base?.items?base.qty/base.items:0;
 const comparison='单品均销 '+fmt(avg)+' 件；同品类均值 '+fmt(refAvg)+' 件';
 const products=g.items.slice().sort((a,b)=>b.qty-a.qty).slice(0,2).map(p=>p.name+'（'+p.id+'）').join('、');
 const info='已标注 '+g.items.length+' 款历史商品，合计销售 '+fmt(g.qty)+' 件。'+comparison+'。关联：'+products;
 if(g.items.length>=2&&avg>refAvg)return {cls:'strong',name:'历史表现较好 · 可延展',info};
 return {cls:'limited',name:'已有销售样本 · 继续观察',info};
}
function makeRecommendations(data){
 const cat=$('designRecommendCat').value,count=Math.max(1,Math.min(8,Number($('designRecommendCount').value)||4));
 let items=LIB.filter(x=>cat==='全部'||x.cat===cat).sort((a,b)=>candidateScore(b,data)-candidateScore(a,data));
 if(!items.length)return [];
 const start=round*2%items.length;
 items=items.slice(start).concat(items.slice(0,start));
 // All-category mode cycles categories to prevent a single category filling every slot.
 if(cat==='全部'){
  const buckets=CATS.map(c=>items.filter(x=>x.cat===c)),mixed=[];
  while(buckets.some(b=>b.length))for(const b of buckets)if(b.length)mixed.push(b.shift());
  items=mixed;
 }
 return items.slice(0,count).map(t=>({...t,evidence:recLabel(t,data)}));
}
function renderRecommendations(data){
 selected=makeRecommendations(data);
 $('designRecommendCards').innerHTML=selected.map((r,i)=>'<article class="dd-card"><div class="dd-card-top"><span class="dd-index">'+String(i+1).padStart(2,'0')+'</span><span class="dd-category">'+escape(r.cat)+'</span><span class="dd-evidence '+r.evidence.cls+'">'+escape(r.evidence.name)+'</span></div>'+
 '<h3>'+escape(r.name)+'</h3><div class="dd-tags">'+r.keywords.map(k=>'<span>'+escape(k)+'</span>').join('')+'</div>'+
 '<p class="dd-idea">'+escape(r.idea)+'</p><div class="dd-effect"><b>动效参考</b> '+escape(r.effect)+'</div>'+
 '<div class="dd-proof"><strong>销售依据</strong><p>'+escape(r.evidence.info)+'</p></div></article>').join('');
 const evidence=selected.filter(r=>r.evidence.cls==='strong').length;
 $('designRecommendNotice').textContent='已生成 '+selected.length+' 个明确提需方向 · '+evidence+' 个方向具备同品类题材销售支持。建议结合设计档期与美术判断审核，不将创意候选视为已验证爆款。';
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
 const rows=[['商品品类','设计名称','设计题材','核心关键词','设计构想','动效参考','数据判断','销售数据依据']]
 .concat(selected.map(x=>[x.cat,x.name,x.theme,x.keywords.join(' / '),x.idea,x.effect,x.evidence.name,x.evidence.info]));
 const blob=new Blob(['\uFEFF'+rows.map(row=>row.map(csv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='商城设计提需_'+ctx.platform+'_'+ctx.period+'.csv';
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
