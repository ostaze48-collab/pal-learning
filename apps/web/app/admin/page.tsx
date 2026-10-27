'use client';

import {useEffect,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Health={version:string;database:{backend:string;persistent:boolean;production_recommended:boolean}};
type LearningHealth={students:number;books:number;lessons:number;source_packages:number;ai_jobs:number;question_attempts:number;correct_rate_percent:number;root_gaps_found:number;skills_needing_support_rows:number};
type ProductionReadiness={ready:boolean;checks:Record<string,boolean>;blockers:string[];details:{database_backend?:string;ai_provider?:string;production_origins?:string[];bootstrap_password_present?:boolean}};

const readinessLabels:Record<string,string>={
  persistent_database:'قاعدة بيانات PostgreSQL دائمة',
  jwt_secret_configured:'JWT_SECRET قوي ومُعد',
  cors_has_production_origin:'CORS يحتوي نطاق الإنتاج',
  cors_has_no_wildcard:'CORS بدون wildcard',
  admin_bootstrap_password_configured:'كلمة مرور Bootstrap Admin مُعدة',
  ai_provider_is_real:'مزود AI حقيقي بدل LOCAL_MOCK',
  ai_provider_configured:'مفتاح ونموذج AI مُعدان',
};

export default function Admin(){
  const [health,setHealth]=useState<Health|null>(null);
  const [learning,setLearning]=useState<LearningHealth|null>(null);
  const [readiness,setReadiness]=useState<ProductionReadiness|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const token=localStorage.getItem('pal_admin_token')||'';
    const auth={headers:{Authorization:`Bearer ${token}`}};
    Promise.all([
      fetch(`${API}/health`).then(r=>r.json()),
      fetch(`${API}/admin/learning-health`,auth).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.detail||'تعذر تحميل Learning Health');return b;}),
      fetch(`${API}/admin/production-readiness`,auth).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.detail||'تعذر تحميل Production Readiness');return b;}),
    ]).then(([h,l,p])=>{setHealth(h);setLearning(l);setReadiness(p)}).catch(e=>setError(e.message||'تعذر تحميل لوحة الإدارة'));
  },[]);
  const stats=[
    ['الطلاب',learning?.students],['الكتب',learning?.books],['الدروس',learning?.lessons],
    ['الرزم التعليمية',learning?.source_packages],['AI Jobs',learning?.ai_jobs],['محاولات الأسئلة',learning?.question_attempts],
    ['Root gaps',learning?.root_gaps_found],['تحتاج دعمًا',learning?.skills_needing_support_rows]
  ];
  return <main style={{maxWidth:1100,margin:'32px auto',padding:20}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><h1>لوحة الإدارة</h1><span style={{padding:'7px 11px',borderRadius:99,background:health?.database?.persistent?'#e8fff1':'#fff4e5'}}>{health?`API ${health.version} · ${health.database.backend}`:'جارٍ فحص النظام…'}</span></div>
    {readiness&&<section style={{padding:16,borderRadius:14,background:readiness.ready?'#ecfdf3':'#fff4e5',border:`1px solid ${readiness.ready?'#b8e7ca':'#ffd59a'}`,marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <strong>{readiness.ready?'Production Ready ✓':'Beta Readiness: BLOCKED'}</strong>
        <span>{readiness.details.database_backend||'—'} · {readiness.details.ai_provider||'—'}</span>
      </div>
      {!readiness.ready&&<p style={{margin:'8px 0 10px'}}>لن نعتبر المنصة جاهزة للـBeta حتى تُغلق العقبات التالية:</p>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:8}}>
        {Object.entries(readiness.checks).map(([key,ok])=><div key={key} style={{padding:'9px 10px',borderRadius:9,background:'rgba(255,255,255,.7)'}}>{ok?'✓':'✗'} {readinessLabels[key]||key}</div>)}
      </div>
    </section>}
    {!health?.database?.persistent&&health&&!readiness&&<div style={{padding:15,borderRadius:14,background:'#fff4e5',border:'1px solid #ffd59a',marginBottom:16}}><strong>تنبيه جاهزية:</strong> الـAPI يعمل حاليًا على SQLite. هذا مناسب للعرض التجريبي فقط؛ قبل Beta يجب ربط DATABASE_URL بقاعدة PostgreSQL الموجودة على Render.</div>}
    {error&&<div style={{padding:14,borderRadius:12,background:'#ffecec',marginBottom:14}}>{error} <a href="/admin/login">تسجيل دخول الإدارة</a></div>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12}}>{stats.map(([k,v])=><div key={String(k)} style={{background:'white',padding:18,borderRadius:14,border:'1px solid #e8edf5'}}><div>{k}</div><strong style={{fontSize:24}}>{v??'—'}</strong></div>)}</div>
    <section style={{marginTop:24,background:'white',padding:20,borderRadius:14,border:'1px solid #e8edf5'}}><h2>PS-G05-SCI-S2-2026</h2><p>المصدر الحالي: رزمة وزارة التربية الرسمية + كتاب تاريخي مرجعي + حلول تحتاج مطابقة طبعة. المصنع يعطي الأولوية للمصدر الرسمي النصي ولا يخلط الطبعات تلقائيًا.</p><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><a href="/admin/importer" style={{padding:'10px 14px',borderRadius:10,background:'#1f6feb',color:'white',textDecoration:'none'}}>استيراد المصادر</a><a href="/admin/curriculum" style={{padding:'10px 14px',borderRadius:10,background:'#eef4ff',color:'#124b9b',textDecoration:'none'}}>مصنع المنهاج</a><a href="/admin/staging" style={{padding:'10px 14px',borderRadius:10,background:'#eefbf3',color:'#176b3a',textDecoration:'none'}}>Candidate QA / Staging</a><a href="/admin/release" style={{padding:'10px 14px',borderRadius:10,background:'#fff4e5',color:'#8a4b00',textDecoration:'none'}}>Final Release Gate</a><a href="/admin/quality">بوابة الجودة</a><a href="/admin/analytics">Learning Health</a><a href="/admin/improvement">قائمة تطوير المحتوى</a><a href="/student/lesson">معاينة الطالب</a></div></section>
    {learning&&<section style={{marginTop:16,background:'white',padding:18,borderRadius:14,border:'1px solid #e8edf5'}}><h2>Learning snapshot</h2><p>معدل الإجابات الصحيحة: <strong>{learning.correct_rate_percent}%</strong></p></section>}
  </main>;
}
