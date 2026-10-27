'use client';

import {useEffect,useState} from 'react';
import {ActionLink,AdminShell,ButtonRow,Card,MetricCard,Notice,SectionHeader,StatusPill} from './_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Health={version:string;database:{backend:string;persistent:boolean;production_recommended:boolean};experimental_demo?:{enabled:boolean;book_code:string;lesson_code:string;student_scope:string};current_semester?:{semester:number;priority_book_code:string;priority_package_code:string}};
type LearningHealth={students:number;books:number;lessons:number;source_packages:number;ai_jobs:number;question_attempts:number;correct_rate_percent:number;root_gaps_found:number;skills_needing_support_rows:number};
type ProductionReadiness={ready:boolean;checks:Record<string,boolean>;blockers:string[];details:{database_backend?:string;migration_revision?:string|null;migration_head?:string|null;ai_provider?:string;storage_backend?:string;storage_durable?:boolean;storage_configured?:boolean;storage_bucket?:string|null;storage_missing?:string[];release_policy?:{direct_legacy_publish_enabled?:boolean;audited_release_transaction_implemented?:boolean}}};

const readinessLabels:Record<string,string>={persistent_database:'قاعدة بيانات PostgreSQL دائمة',database_migration_current:'قاعدة البيانات على Alembic head الحالي',durable_source_storage:'تخزين دائم لملفات المنهاج',source_storage_configured:'إعدادات التخزين كاملة',jwt_secret_configured:'JWT_SECRET قوي',cors_has_production_origin:'CORS يحتوي نطاق الإنتاج',cors_has_no_wildcard:'CORS بلا wildcard',admin_bootstrap_password_configured:'Bootstrap Admin مُعد',ai_provider_is_real:'مزود AI حقيقي',ai_provider_configured:'مفتاح ونموذج AI مُعدان',source_authority_policy_fail_closed:'Source Authority fail-closed',legacy_direct_publish_disabled:'النشر القديم المباشر معطّل',audited_release_transaction_available:'Audited Release Transaction متاح'};

export default function Admin(){
  const [health,setHealth]=useState<Health|null>(null);const [learning,setLearning]=useState<LearningHealth|null>(null);const [readiness,setReadiness]=useState<ProductionReadiness|null>(null);const [error,setError]=useState('');
  useEffect(()=>{
    const token=localStorage.getItem('pal_admin_token')||'';const auth={headers:{Authorization:`Bearer ${token}`}};
    Promise.all([
      fetch(`${API}/health`).then(r=>r.json()),
      fetch(`${API}/admin/learning-health`,auth).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.detail||'تعذر تحميل Learning Health');return b;}),
      fetch(`${API}/admin/production-readiness`,auth).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.detail||'تعذر تحميل Production Readiness');return b;}),
    ]).then(([h,l,p])=>{setHealth(h);setLearning(l);setReadiness(p)}).catch(e=>setError(e.message||'تعذر تحميل لوحة الإدارة'));
  },[]);
  const currentPackage=health?.current_semester?.priority_package_code||'PS-G05-SCI-S1-2026';
  const passed=readiness?Object.values(readiness.checks).filter(Boolean).length:0;const total=readiness?Object.keys(readiness.checks).length:0;

  return <AdminShell eyebrow="Palestinian Learning OS" title="لوحة الإدارة" description="نسخة تجريبية كاملة وظيفيًا بمحتوى طالب واحد: علوم الصف الخامس — الدرس الأول «المجهر واكتشاف الخلية». البنية الإنتاجية تبقى منفصلة ومحكومة ببوابات QA والإصدار.">
    <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}><StatusPill tone="warn">EXPERIMENTAL BETA</StatusPill><StatusPill tone={health?.database?.persistent?'good':'warn'}>{health?`API ${health.version}`:'API…'}</StatusPill><StatusPill tone={health?.database?.persistent?'good':'warn'}>{health?.database?.backend||'DB…'}</StatusPill></div>
      <ActionLink href="/admin/current-semester">فتح Control Center ←</ActionLink>
    </div>

    {error&&<div style={{marginBottom:14}}><Notice tone="bad">{error} · <a href="/admin/login">تسجيل دخول الإدارة</a></Notice></div>}

    <Card style={{marginBottom:14,background:'linear-gradient(135deg,#f3fbf5,#f3f7ff)',borderColor:'#cfe4d6'}}>
      <SectionHeader title="نطاق النسخة التجريبية" description="كل واجهات المنصة تعمل، لكن الطالب يرى درسًا واحدًا فقط. لا نستخدم حالة PUBLISHED لهذا المحتوى؛ التجربة تعمل عبر Demo API معزولة." aside={<StatusPill tone="good">Single Lesson Beta</StatusPill>}/>
      <div style={{fontSize:22,fontWeight:900}}>المجهر واكتشاف الخلية</div><div style={{color:'#667085',marginTop:4}}>الصف الخامس · العلوم والحياة · الفصل الأول · الوحدة الأولى: الخلية</div>
      <div style={{marginTop:13}}><ButtonRow><ActionLink href="/admin/current-semester">إدارة الدرس والمصادر</ActionLink><ActionLink href="/student" tone="secondary">فتح تجربة الطالب</ActionLink><ActionLink href="/student/register" tone="secondary">إنشاء طالب تجريبي</ActionLink></ButtonRow></div>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:14}}>
      <MetricCard label="الطلاب" value={learning?.students??'—'}/><MetricCard label="الكتب" value={learning?.books??'—'}/><MetricCard label="الدروس" value={learning?.lessons??'—'}/><MetricCard label="الرزم" value={learning?.source_packages??'—'}/><MetricCard label="AI Jobs" value={learning?.ai_jobs??'—'}/><MetricCard label="محاولات الأسئلة" value={learning?.question_attempts??'—'}/><MetricCard label="Root gaps" value={learning?.root_gaps_found??'—'} tone={learning?.root_gaps_found?'warn':'neutral'}/><MetricCard label="تحتاج دعمًا" value={learning?.skills_needing_support_rows??'—'} tone={learning?.skills_needing_support_rows?'warn':'neutral'}/>
    </div>

    <Card style={{marginBottom:14}}>
      <SectionHeader title="مسار صناعة المحتوى" description={currentPackage}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:9}}>{[
        ['1','المصدر','/admin/current-semester'],['2','Source Review','/admin/source-link-review'],['3','Skill Mapping','/admin/skill-mapping'],['4','Generation','/admin/lesson-generation'],['5','QA / Staging','/admin/staging'],['6','Release Gate','/admin/release'],
      ].map(([n,label,href])=><a key={n} href={href} style={{padding:13,border:'1px solid #e6ebf2',borderRadius:13,textDecoration:'none',color:'#14213d',background:'#fafbfc'}}><div style={{fontSize:11,color:'#176b3a',fontWeight:900}}>المرحلة {n}</div><strong style={{display:'block',marginTop:4}}>{label}</strong></a>)}</div>
    </Card>

    {readiness&&<Card style={{marginBottom:14,background:readiness.ready?'#f3fcf6':'#fffaf0',borderColor:readiness.ready?'#bfe4cb':'#f0d89b'}}>
      <SectionHeader title="Production Readiness" description="هذه لا تمنع الـBeta المعزول، لكنها تمنع تحويله إلى إطلاق إنتاجي قبل تجهيز البيئة." aside={<StatusPill tone={readiness.ready?'good':'warn'}>{passed}/{total} checks</StatusPill>}/>
      <div style={{height:9,background:'#edf0f4',borderRadius:99,overflow:'hidden',marginBottom:12}}><div style={{height:'100%',width:`${total?Math.round(passed/total*100):0}%`,background:readiness.ready?'#176b3a':'#d28a00'}}/></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:8}}>{Object.entries(readiness.checks).map(([key,ok])=><div key={key} style={{padding:'10px 11px',borderRadius:10,background:'#fff',border:'1px solid #edf0f4',display:'flex',gap:8}}><strong style={{color:ok?'#067647':'#b42318'}}>{ok?'✓':'✗'}</strong><span style={{fontSize:13}}>{readinessLabels[key]||key}</span></div>)}</div>
      {!!readiness.blockers?.length&&<div style={{marginTop:11}}><Notice tone="warn"><strong>Production blockers:</strong> {readiness.blockers.join(' · ')}</Notice></div>}
    </Card>}

    <Card>
      <SectionHeader title="أدوات إضافية" description="للفحص والتطوير والتحليلات."/>
      <ButtonRow><ActionLink href="/admin/current-semester/matrix" tone="secondary">مصفوفة الفصل</ActionLink><ActionLink href="/admin/source-discovery" tone="secondary">اكتشاف المصادر</ActionLink><ActionLink href="/admin/source-policy" tone="secondary">صلاحيات المصادر</ActionLink><ActionLink href="/admin/importer" tone="secondary">المستورد</ActionLink><ActionLink href="/admin/analytics" tone="secondary">Learning Health</ActionLink><ActionLink href="/admin/improvement" tone="secondary">تحسين المحتوى</ActionLink></ButtonRow>
      {learning&&<div style={{marginTop:13}}><Notice tone="info">معدل الإجابات الصحيحة الحالي: <strong>{learning.correct_rate_percent}%</strong></Notice></div>}
    </Card>
  </AdminShell>;
}
