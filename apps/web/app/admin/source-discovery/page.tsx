'use client';

import {useEffect,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Discovery={
  source_code:string;package_code:string;intended_source_type:string;title:string;
  grade_code:string;subject_code:string;semester:number;academic_year:string;
  discovery_url:string;corroboration_urls:string[];discovery_kind:string;
  authority_claim:string;file_verified:boolean;ingestion_mode:string;
  discovered_on:string;notes:string;
};
type Catalog={catalog_version:string;entries:Discovery[];policy:{creates_source_files:boolean;adds_package_coverage:boolean;authorizes_generation:boolean;required_next_step:string}};

export default function SourceDiscoveryPage(){
  const [data,setData]=useState<Catalog|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const token=localStorage.getItem('pal_admin_token')||'';
    fetch(`${API}/importer/discovery-catalog?package_code=PS-G05-SCI-S2-2026`,{headers:{Authorization:`Bearer ${token}`}})
      .then(async r=>{const b=await r.json();if(!r.ok)throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر تحميل كتالوج الاكتشاف');return b;})
      .then(setData).catch(e=>setError(e.message||'تعذر تحميل كتالوج الاكتشاف'));
  },[]);

  return <main style={{maxWidth:980,margin:'30px auto',padding:18}}>
    <div style={{fontSize:14,opacity:.6}}>الإدارة ← مصادر المنهاج ← Discovery</div>
    <h1>مصادر مكتشفة تحتاج الملف الفعلي</h1>
    <p>هذه الصفحة تحفظ أدلة العثور على مصادر حديثة دون اعتبار صفحة الفهرسة نفسها مصدرًا تعليميًا. لا SourceFile، لا Coverage، ولا Generation حتى نحصل على الملف ونرفعه.</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <a href="/admin/importer">الذهاب إلى الاستيراد</a>
      <a href="/admin/source-policy">صلاحيات أنواع المصادر</a>
    </div>
    {error&&<div style={{padding:14,borderRadius:12,background:'#ffecec'}}>{error}</div>}
    {!data&&!error&&<p>جارٍ التحميل…</p>}
    {data&&<>
      <section style={{background:'#fff8e8',border:'1px solid #f0cf8b',padding:15,borderRadius:14,marginBottom:14}}>
        <strong>{data.catalog_version}</strong>
        <div style={{marginTop:6}}>creates_source_files = <b>{String(data.policy.creates_source_files)}</b> · adds_package_coverage = <b>{String(data.policy.adds_package_coverage)}</b> · authorizes_generation = <b>{String(data.policy.authorizes_generation)}</b></div>
        <div style={{marginTop:5}}>Next: <strong>{data.policy.required_next_step}</strong></div>
      </section>
      <div style={{display:'grid',gap:14}}>{data.entries.map(item=><article key={item.source_code} style={{background:'white',border:'1px solid #e8edf5',padding:18,borderRadius:15}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
          <strong>{item.title}</strong><span>{item.ingestion_mode}</span>
        </div>
        <div style={{marginTop:8,fontSize:14}}>Package: <code>{item.package_code}</code> · {item.grade_code} · {item.subject_code} · S{item.semester} · {item.academic_year}</div>
        <div style={{marginTop:6}}>Intended type: <strong>{item.intended_source_type}</strong> · File verified: <strong>{String(item.file_verified)}</strong></div>
        <div style={{marginTop:6}}>Discovery: {item.discovery_kind} · {item.authority_claim}</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}>
          <a href={item.discovery_url} target="_blank" rel="noreferrer">فتح صفحة المورد</a>
          {item.corroboration_urls.map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer">مرجع داعم {i+1}</a>)}
        </div>
        <p style={{fontSize:13,opacity:.7,marginBottom:0}}>{item.notes}</p>
      </article>)}</div>
    </>}
  </main>;
}
