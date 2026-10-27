'use client';

import {useEffect,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';
const CURRENT_PACKAGE='PS-G05-SCI-S1-2026';

type Discovery={
  source_code:string;package_code:string;intended_source_type:string;title:string;
  grade_code:string;subject_code:string;semester:number;academic_year:string;
  discovery_url:string;corroboration_urls:string[];discovery_kind:string;
  authority_claim:string;file_verified:boolean;ingestion_mode:string;
  discovered_on:string;notes:string;reliability_score?:number;edition_claim?:string;
};
type Catalog={
  catalog_version:string;entries:Discovery[];
  policy:{
    unverified_discovery_creates_source_files:boolean;
    verified_direct_file_registration_requires_admin:boolean;
    adds_package_coverage_before_fetch:boolean;
    authorizes_generation:boolean;
    required_next_step:string;
  };
};

function authHeaders(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`};}

export default function SourceDiscoveryPage(){
  const [data,setData]=useState<Catalog|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState('');
  const [registered,setRegistered]=useState<Record<string,number>>({});

  async function load(){
    setError('');
    try{
      const r=await fetch(`${API}/importer/discovery-catalog?package_code=${encodeURIComponent(CURRENT_PACKAGE)}`,{headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر تحميل كتالوج الاكتشاف');
      setData(b);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل كتالوج الاكتشاف');}
  }
  useEffect(()=>{void load();},[]);

  async function register(item:Discovery){
    setBusy(item.source_code);setMessage('');setError('');
    try{
      const r=await fetch(`${API}/importer/discovery-catalog/${encodeURIComponent(item.source_code)}/register`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر تسجيل المصدر');
      setRegistered(prev=>({...prev,[item.source_code]:b.source_file_id}));
      setMessage(`تم تسجيل ${item.title} كـ SourceFile #${b.source_file_id}. التسجيل وحده لا يضيف factual authority.`);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تسجيل المصدر');}
    finally{setBusy('');}
  }

  async function fetchRegistered(item:Discovery){
    const id=registered[item.source_code];
    if(!id) return;
    setBusy(`fetch-${item.source_code}`);setMessage('');setError('');
    try{
      const r=await fetch(`${API}/importer/source-files/${id}/fetch-registered`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر جلب المصدر');
      setMessage(`تم جلب واستخراج ${item.title}: ${b.page_count||0} صفحة · ${b.status}. الاستخدام يبقى مقيدًا بدور ${item.intended_source_type}.`);
    }catch(e){setError(e instanceof Error?e.message:'تعذر جلب المصدر');}
    finally{setBusy('');}
  }

  return <main style={{maxWidth:980,margin:'30px auto',padding:18}}>
    <div style={{fontSize:14,opacity:.6}}>الإدارة ← الفصل الحالي ← Discovery</div>
    <h1>مصادر علوم خامس — الفصل الأول</h1>
    <p>الاكتشاف لا يعني الاعتماد. الملف المباشر الموثق يمكن تسجيله وجلبه، لكن Source Authority Policy تحدد ما إذا كان يصلح للحقائق أو التقييم أو الإرشاد التربوي.</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <a href="/admin/current-semester">الفصل الحالي</a>
      <a href="/admin/importer">الاستيراد المتقدم</a>
      <a href="/admin/source-policy">صلاحيات أنواع المصادر</a>
    </div>
    {message&&<div style={{padding:14,borderRadius:12,background:'#ecfdf3',marginBottom:12}}>{message}</div>}
    {error&&<div style={{padding:14,borderRadius:12,background:'#ffecec',marginBottom:12}}>{error}</div>}
    {!data&&!error&&<p>جارٍ التحميل…</p>}
    {data&&<>
      <section style={{background:'#fff8e8',border:'1px solid #f0cf8b',padding:15,borderRadius:14,marginBottom:14}}>
        <strong>{data.catalog_version}</strong>
        <div style={{marginTop:6}}>Unverified creates files = <b>{String(data.policy.unverified_discovery_creates_source_files)}</b> · coverage before fetch = <b>{String(data.policy.adds_package_coverage_before_fetch)}</b> · generation = <b>{String(data.policy.authorizes_generation)}</b></div>
        <div style={{marginTop:5}}>Next: <strong>{data.policy.required_next_step}</strong></div>
      </section>
      <div style={{display:'grid',gap:14}}>{data.entries.map(item=>{
        const sourceFileId=registered[item.source_code];
        const canRemote=item.file_verified&&item.ingestion_mode==='REMOTE_FETCH_ALLOWED';
        return <article key={item.source_code} style={{background:'white',border:'1px solid #e8edf5',padding:18,borderRadius:15}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
            <strong>{item.title}</strong><span>{item.ingestion_mode}</span>
          </div>
          <div style={{marginTop:8,fontSize:14}}>Package: <code>{item.package_code}</code> · {item.grade_code} · {item.subject_code} · S{item.semester} · {item.academic_year}</div>
          <div style={{marginTop:6}}>Type: <strong>{item.intended_source_type}</strong> · File verified: <strong>{String(item.file_verified)}</strong>{item.reliability_score!=null&&<> · Reliability {item.reliability_score}%</>}</div>
          <div style={{marginTop:6}}>Discovery: {item.discovery_kind} · {item.authority_claim}</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}>
            <a href={item.discovery_url} target="_blank" rel="noreferrer">فتح المورد</a>
            {item.corroboration_urls.map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer">مرجع داعم {i+1}</a>)}
          </div>
          <p style={{fontSize:13,opacity:.72}}>{item.notes}</p>
          {item.intended_source_type==='WORKSHEET'&&<div style={role}>الدور: تصميم الأسئلة والتقييم فقط — لا factual grounding.</div>}
          {item.intended_source_type==='TEACHER_GUIDE'&&<div style={role}>الدور: أهداف، تسلسل، استراتيجيات وأخطاء شائعة — لا factual grounding.</div>}
          {item.intended_source_type==='STUDENT_BOOK'&&<div style={role}>الدور: factual historical reference؛ يحتاج Current Scope Evidence إذا بقيت الطبعة تاريخية.</div>}
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
            {canRemote?<>
              <button disabled={!!busy} onClick={()=>register(item)}>تسجيل الملف المباشر</button>
              <button disabled={!!busy||!sourceFileId} onClick={()=>fetchRegistered(item)}>جلب واستخراج {sourceFileId?`#${sourceFileId}`:''}</button>
            </>:<span style={{padding:'8px 10px',borderRadius:9,background:'#fff5df',fontSize:13}}>UPLOAD_REQUIRED · احصل على الملف الفعلي أولًا</span>}
          </div>
        </article>;
      })}</div>
    </>}
  </main>;
}

const role:React.CSSProperties={marginTop:8,padding:9,borderRadius:9,background:'#f7f8fa',fontSize:12};
