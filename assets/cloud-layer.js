/* Mall Data Center cloud storage. Public analytics are distinct from private source rows. */
(function (root) {
  'use strict';
  const URL='https://zsymjxmhomftiesmlhgk.supabase.co';
  const KEY='sb_publishable_DPMRHmvS2clH9LjK8rF7Sg_ltxf-bb-';
  const BUCKET='mall-order-source';
  let client=null,isAdmin=false,user=null;
  const fail=(label,error)=>{if(error)throw new Error(label+': '+(error.message||String(error)))};
  async function fetchPaged(table,columns) {
    const rows=[];
    for(let page=0;page<50;page++) {
      const {data,error}=await client.from(table).select(columns).range(page*1000,page*1000+999);
      fail('读取 '+table,error);
      rows.push(...(data||[]));
      if(!data||data.length<1000)break;
      if(page===49)throw Error('云端月份记录超过读取上限，请联系管理员');
    }
    return rows;
  }
  async function init() {
    if(!root.supabase?.createClient)throw Error('云端组件未加载，无法读取共享分析');
    client=root.supabase.createClient(URL,KEY,{
      auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,
        storageKey:'mall-dashboard-cloud-auth-v1'}
    });
    const {data:{user:authUser},error:authError}=await client.auth.getUser();
    // Invalid or expired cached sessions must not prevent anonymous reads.
    user=authError?null:authUser;
    isAdmin=false;
    if(user) {
      const {data,error}=await client.from('mall_admins').select('user_id').eq('user_id',user.id).limit(1);
      if(error)throw Error('管理员身份检查失败：'+error.message);
      isAdmin=!!data?.length;
    }
    return refresh();
  }
  async function refresh() {
    if(!client)throw Error('云端服务尚未初始化');
    const reports=await fetchPaged('mall_month_reports','platform,period,report,updated_at');
    const quarters=await fetchPaged('mall_lifecycle_reports','platform,quarter,report,updated_at');
    const archives=isAdmin?await fetchPaged('mall_private_month_archives','platform,period,archive,updated_at'):[];
    return {reports,quarters,archives,isAdmin,user};
  }
  function requireAdmin(){if(!client||!isAdmin)throw Error('只有已授权管理员可以修改云端数据')}
  async function putArchive(platform,period,archive){
    requireAdmin();
    const {error}=await client.from('mall_private_month_archives').upsert(
      {platform,period,archive,updated_at:new Date().toISOString()},{onConflict:'platform,period'}
    );fail('保存云端档案',error);
  }
  async function putReport(platform,period,report){
    requireAdmin();
    const {error}=await client.from('mall_month_reports').upsert(
      {platform,period,report,updated_at:new Date().toISOString()},{onConflict:'platform,period'}
    );fail('发布共享月报',error);
  }
  async function removeReport(platform,period){
    requireAdmin();
    const {error}=await client.from('mall_month_reports').delete().eq('platform',platform).eq('period',period);
    fail('删除云端月报',error);
  }
  async function uploadSource(file,platform){
    requireAdmin();
    const basename=String(file.name||'order').replace(/[/\\]+/g,'_').slice(0,90);
    const id=(root.crypto&&root.crypto.randomUUID)?root.crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
    const path=platform+'/'+new Date().toISOString().slice(0,7)+'/'+id+'-'+basename;
    const {error}=await client.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});
    fail('上传原始订单文件',error);
    return path;
  }
  async function removeSources(paths) {
    requireAdmin();
    const unique=[...new Set(paths.filter(Boolean))];
    if(!unique.length)return;
    const {error}=await client.storage.from(BUCKET).remove(unique);
    fail('移除云端原始文件',error);
  }
  async function listDesignTags() {
    if(!client)throw Error('云端服务尚未初始化');
    return fetchPaged('mall_design_product_tags','platform,category,sku_id,name,theme,styles,elements,updated_at');
  }
  async function putDesignTag(tag) {
    requireAdmin();
    const payload={platform:tag.platform,category:tag.category,sku_id:String(tag.sku_id),
      name:String(tag.name||''),theme:String(tag.theme),styles:tag.styles||[],elements:tag.elements||[],
      updated_at:new Date().toISOString()};
    const {error}=await client.from('mall_design_product_tags').upsert(payload,{onConflict:'platform,category,sku_id'});
    fail('保存商品设计标签',error);
  }
  async function removeDesignTag(platform,category,skuId) {
    requireAdmin();
    const {error}=await client.from('mall_design_product_tags').delete().eq('platform',platform)
      .eq('category',category).eq('sku_id',String(skuId));
    fail('删除商品设计标签',error);
  }
  root.MallCloud=Object.freeze({
    init,refresh,putArchive,putReport,removeReport,uploadSource,removeSources,
    listDesignTags,putDesignTag,removeDesignTag,
    get isAdmin(){return isAdmin},
    get user(){return user}
  });
})(window);
