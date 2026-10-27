'use client';

import {useEffect,useState} from 'react';
import {ActionButton,AdminShell,Card,Notice,StatusPill} from '../_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';
const PACKAGE_ID=1;

type CatalogDiff={
  package_id:number;
  package_code:string;
  missing_count:number;
  catalog_entries:Array<{
    source_code:string;
    registered_url:string;
    authority:string;
    registered_in_package:boolean;
    source_file_id:number|null;
    current_source_type:string|null;
    scope_verified:boolean;
  }>;
};

type SyncResult={
  package_id:number;
  package_code:string;
  created:number;
  existing:number;
  quarantined:number;
  sources:Array<{
    source_file_id:number;
    source_code:string;
    source_type:string;
    promoted_source_type:string;
    registered_url:string;
    authority:string;
    required_scope_terms:string[];
    status:string;
  }>;
};

type FetchResult={
  source_file_id:number;
  status:string;
  page_count:number|null;
  storage_backend:string|null;
  durable_storage:boolean;
  edition_match_score:number;
  warnings:string[];
};

type ScopeResult={
  source_file_id:number;
  source_code:string;
  scope_verified:boolean;
  matched_terms:string[];
  missing_terms:string[];
  source_type:string;
  status:string;
  package_completeness:number;
  package_quality:number;
};

async function adminJson<T>(path:string,init:RequestInit={}):Promise<T>{
  const token=typeof window!=='undefined'?(localStorage.getItem('pal_admin_token')||''):'';
  const headers=new Headers(init.headers||{});
  if(token)headers.set('Authorization',`Bearer ${token}`);
  const response=await fetch(`${API}${path}`,{...init,headers});
  const body=await response.json().catch(()=>({}));
  if(!response.ok){
    const detail=body?.detail;
    const message=typeof detail==='string'?detail:detail?.message||`HTTP ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

export default function OfficialSourceWorkflowPage(){
  const [diff,setDiff]=useState<CatalogDiff|null>(null);
  const [sync,setSync]=useState<SyncResult|null>(null);
  const [fetchResult,setFetchResult]=useState<FetchResult|null>(null);
  const [scope,setScope]=useState<ScopeResult|null>(null);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');

  async function refresh(){
    setError('');
    try{
      setDiff(await adminJson<CatalogDiff>(`/importer/catalog/source-packages/${PACKAGE_ID}/diff`));
    }catch(e:any){setError(e.message||'تعذر قراءة كتالوج المصدر الرسمي');}
  }

  useEffect(()=>{void refresh();},[]);

  async function runWorkflow(){
    setBusy('sync');setError('');setSync(null);setFetchResult(null);setScope(null);
    try{
      const synced=await adminJson<SyncResult>(`/importer/catalog/source-packages/${PACKAGE_ID}/sync`,{method:'POST'});
      setSync(synced);
      const source=synced.sources[0];
      if(!source)throw new Error('لم يُرجع الكتالوج مصدرًا رسميًا لهذه الحزمة.');

      setBusy('fetch');
      const fetched=await adminJson<FetchResult>(`/importer/source-files/${source.source_file_id}/fetch-registered`,{method:'POST'});
      setFetchResult(fetched);

      setBusy('scope');
      const verified=await adminJson<ScopeResult>(`/importer/catalog/source-files/${source.source_file_id}/verify-scope`,{method:'POST'});
      setScope(verified);
      await refresh();
    }catch(e:any){
      setError(e.message||'تعذر إكمال استيراد المصدر الرسمي.');
    }finally{setBusy('');}
  }

  const entry=diff?.catalog_entries?.[0];
  const currentStep=busy==='sync'?'تسجيل المصدر':busy==='fetch'?'تنزيل واستخراج الملف':busy==='scope'?'التحقق من نطاق الفصل الأول':'';

  return <AdminShell eyebrow="Official Curriculum Source" title="المصدر الرسمي · علوم الصف الخامس" description="استيراد آمن من كتالوج وزارة التربية والتعليم مع حجر المصدر حتى يثبت نطاق الفصل الأول.">
    {error&&<div style={{marginBottom:14}}><Notice tone="bad">{error} · <a href="/admin/login">تأكد من تسجيل دخول الإدارة</a></Notice></div>}

    <Card>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:12,color:'#667085',fontWeight:800}}>Official Source Catalog</div>
          <h2 style={{margin:'5px 0 6px'}}>PS.G05.SCI.GAZA.CURRENT.S1</h2>
          <div style={{color:'#667085',lineHeight:1.8}}>المصدر المسجل: وزارة التربية والتعليم الفلسطينية · الحزمة الحالية لعلوم الصف الخامس.</div>
        </div>
        <StatusPill tone={entry?.scope_verified?'good':'warn'}>{entry?.scope_verified?'نطاق الفصل الأول موثق':'قيد التحقق'}</StatusPill>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginTop:14}}>
        <div style={{padding:12,border:'1px solid #e4e7ec',borderRadius:12}}><div style={{fontSize:11,color:'#667085'}}>الحزمة</div><strong>{diff?.package_code||'PS-G05-SCI-S1-2026'}</strong></div>
        <div style={{padding:12,border:'1px solid #e4e7ec',borderRadius:12}}><div style={{fontSize:11,color:'#667085'}}>التسجيل</div><strong>{entry?.registered_in_package?'مسجل في قاعدة البيانات':'غير مسجل بعد'}</strong></div>
        <div style={{padding:12,border:'1px solid #e4e7ec',borderRadius:12}}><div style={{fontSize:11,color:'#667085'}}>نوع المصدر الحالي</div><strong>{entry?.current_source_type||'CATALOG_CANDIDATE'}</strong></div>
      </div>

      <div style={{marginTop:14}}><ActionButton disabled={!!busy} onClick={()=>void runWorkflow()}>{busy?`جارٍ ${currentStep}…`:'استيراد المصدر الرسمي والتحقق منه'}</ActionButton></div>
      <div style={{fontSize:12,color:'#667085',marginTop:8,lineHeight:1.7}}>لن يتحول المصدر إلى OFFICIAL_PACKAGE إلا إذا احتوى الملف المستخرج على أدلة نطاق الفصل الأول المطلوبة. الفشل يبقيه محجورًا ولا يسمح له بتغذية AI.</div>
    </Card>

    {(sync||fetchResult||scope)&&<div style={{display:'grid',gap:12,marginTop:14}}>
      <Card>
        <h3 style={{marginTop:0}}>1. تسجيل الكتالوج</h3>
        <div>جديد: <strong>{sync?.created??0}</strong> · موجود: <strong>{sync?.existing??0}</strong> · محجور: <strong>{sync?.quarantined??0}</strong></div>
      </Card>

      {fetchResult&&<Card>
        <h3 style={{marginTop:0}}>2. تنزيل واستخراج الملف</h3>
        <div style={{display:'grid',gap:7}}>
          <div>الحالة: <strong>{fetchResult.status}</strong></div>
          <div>الصفحات: <strong>{fetchResult.page_count??'—'}</strong></div>
          <div>التخزين: <strong>{fetchResult.storage_backend||'—'}</strong> · {fetchResult.durable_storage?'دائم ✓':'غير دائم ⚠'}</div>
          <div>مطابقة الإصدار: <strong>{fetchResult.edition_match_score}%</strong></div>
        </div>
        {!fetchResult.durable_storage&&<div style={{marginTop:10}}><Notice tone="warn">تم استخراج المصدر، لكن التخزين الدائم غير مؤكد. لن نعتمد إنتاجًا واسعًا قبل تهيئة R2 أو تخزين دائم مكافئ.</Notice></div>}
      </Card>}

      {scope&&<Card>
        <h3 style={{marginTop:0}}>3. تحقق نطاق الفصل الأول</h3>
        <StatusPill tone={scope.scope_verified?'good':'bad'}>{scope.scope_verified?'PASS · مصدر رسمي معتمد':'BLOCKED · النطاق غير مثبت'}</StatusPill>
        <div style={{marginTop:10,lineHeight:1.9}}>مصطلحات مطابقة: <strong>{scope.matched_terms.join('، ')||'لا يوجد'}</strong></div>
        <div style={{lineHeight:1.9}}>مصطلحات مفقودة: <strong>{scope.missing_terms.join('، ')||'لا يوجد'}</strong></div>
        <div style={{marginTop:6}}>نوع المصدر النهائي: <strong>{scope.source_type}</strong></div>
        <div>جودة الحزمة: <strong>{scope.package_quality}%</strong></div>
      </Card>}
    </div>}
  </AdminShell>;
}
