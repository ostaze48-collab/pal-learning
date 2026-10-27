'use client';

import {useEffect,useMemo,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_code:string;title:string};
type Current={units:Array<{lessons:Lesson[]}>};
type Readiness={queue_ready:boolean;execution_ready:boolean;blockers:string[];next_actions:string[];authorized_factual_source_chunks:number;skills_count:number;provider:{provider:string;execution_ready:boolean}};
type FactoryStatus={provider:string;generation_ready:boolean;model_configured:boolean;key_configured:boolean;mode:string};
type Job={id:number;job_type:string;status:string;progress:number;model_route:string;prompt_version:string;error?:string|null;provider?:string|null};
type Candidate={id:number;version_label:string;status:string;schema_valid:boolean;provenance_score:number;validation?:Record<string,unknown>;created_at?:string};

export default function LessonGenerationPage(){
  const [lesson,setLesson]=useState<Lesson|null>(null);
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const [factory,setFactory]=useState<FactoryStatus|null>(null);
  const [jobs,setJobs]=useState<Job[]>([]);
  const [candidates,setCandidates]=useState<Candidate[]>([]);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState<number|null>(null);

  function headers(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`,'Content-Type':'application/json'};}

  async function load(){
    setError('');
    try{
      const currentRes=await fetch(`${API}/admin/current-semester`,{headers:headers()});
      const current:Current=await currentRes.json();
      if(!currentRes.ok) throw new Error((current as any).detail||'تعذر تحميل الفصل الحالي');
      const first=current.units?.[0]?.lessons?.[0];
      if(!first) throw new Error('لم يتم العثور على الدرس الأول');
      setLesson(first);

      const [readyRes,statusRes,jobsRes,candidatesRes]=await Promise.all([
        fetch(`${API}/factory/lessons/${first.id}/generation-readiness`,{headers:headers()}),
        fetch(`${API}/factory/status`,{headers:headers()}),
        fetch(`${API}/factory/lessons/${first.id}/jobs`,{headers:headers()}),
        fetch(`${API}/factory/lessons/${first.id}/candidates`,{headers:headers()}),
      ]);
      const ready=await readyRes.json();
      const status=await statusRes.json();
      const allJobs=await jobsRes.json();
      const candidateRows=await candidatesRes.json();
      if(!readyRes.ok) throw new Error(ready.detail||'تعذر تحميل Generation Readiness');
      if(!statusRes.ok) throw new Error(status.detail||'تعذر تحميل AI Provider status');
      if(!jobsRes.ok) throw new Error(allJobs.detail||'تعذر تحميل Jobs');
      if(!candidatesRes.ok) throw new Error(candidateRows.detail||'تعذر تحميل Candidates');
      setReadiness(ready);
      setFactory(status);
      setJobs((allJobs||[]).filter((job:Job)=>job.job_type==='GENERATE_LESSON'));
      setCandidates(candidateRows||[]);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل Lesson Generation');}
  }
  useEffect(()=>{void load();},[]);

  const latest=useMemo(()=>jobs[0]||null,[jobs]);

  async function queue(){
    if(!lesson) return;
    setBusy(-1);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/lessons/${lesson.id}/generate`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر إنشاء Generation Job');
      setMessage(`تم إنشاء Generation Job #${b.job_id}. لم يتم توليد محتوى بعد.`);await load();
    }catch(e){setError(e instanceof Error?e.message:'تعذر إنشاء Generation Job');}
    finally{setBusy(null);}
  }

  async function execute(jobId:number){
    setBusy(jobId);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/jobs/${jobId}/execute`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تنفيذ AI');
      if(b.status==='WAITING_PROVIDER') setMessage('الـJob متوقف على مزود AI حقيقي؛ لم يتم إنشاء درس وهمي.');
      else setMessage(`AI execution انتهى بحالة ${b.status}. إذا كان COMPLETED فتبقى مرحلة Output Validation.`);
      await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل تنفيذ AI');}
    finally{setBusy(null);}
  }

  async function ingest(jobId:number){
    setBusy(jobId);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/jobs/${jobId}/ingest-provider-output`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل التحقق من خرج المزود');
      setMessage(`Output Validated ✓ · Candidate #${b.candidate_id} · Provenance ${b.provenance_score}%.`);await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل التحقق من خرج المزود');}
    finally{setBusy(null);}
  }

  const retryable=latest&&['FAILED','STALE_INPUT','OUTPUT_REJECTED','OUTPUT_SCHEMA_INVALID'].includes(latest.status);

  return <main style={{maxWidth:1000,margin:'30px auto',padding:20}}>
    <div style={{fontSize:14,opacity:.65}}>الإدارة ← الفصل الحالي ← Lesson Generation</div>
    <h1>توليد حزمة الدرس</h1>
    <p>{lesson?`${lesson.lesson_code} · ${lesson.title}`:'جارٍ تحميل الدرس…'}</p>
    {message&&<div style={{padding:12,borderRadius:10,background:'#eefbf3',marginBottom:12}}>{message}</div>}
    {error&&<div style={{padding:12,borderRadius:10,background:'#ffecec',marginBottom:12}}>{error}</div>}

    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
      <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><strong>Generation Readiness</strong><div style={{fontSize:24,marginTop:6}}>{readiness?.queue_ready?'READY':'BLOCKED'}</div><small>Sources {readiness?.authorized_factual_source_chunks??'—'} · Skills {readiness?.skills_count??'—'}</small></div>
      <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><strong>AI Provider</strong><div style={{fontSize:24,marginTop:6}}>{factory?.provider||'—'}</div><small>{factory?.mode||'—'} · generation ready {String(factory?.generation_ready??false)}</small></div>
    </section>

    {!!readiness?.blockers?.length&&<div style={{marginTop:14,padding:12,borderRadius:10,background:'#fff1f1'}}>Blockers: {readiness.blockers.join(' · ')}</div>}

    <section style={{marginTop:16,background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:18}}>
      <h2 style={{marginTop:0}}>المرحلة الحالية</h2>
      {!latest&&<><p>لا يوجد Generation Job بعد. إنشاء Job يثبت Snapshot للمصادر والمهارات المعتمدة لكنه لا يستدعي AI.</p><button disabled={busy!==null||!readiness?.queue_ready} onClick={queue}>إنشاء Generation Job</button></>}
      {latest&&<div style={{padding:12,borderRadius:10,background:'#f8fafc'}}>
        <strong>Job #{latest.id} · {latest.status}</strong><div>Progress {latest.progress}% · route {latest.model_route}</div>{latest.error&&<div style={{color:'#9b2222',marginTop:6}}>{latest.error}</div>}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
          {latest.status==='QUEUED'&&factory?.generation_ready&&<button disabled={busy===latest.id} onClick={()=>execute(latest.id)}>تنفيذ AI</button>}
          {latest.status==='QUEUED'&&!factory?.generation_ready&&<span style={{padding:8,borderRadius:8,background:'#fff4e5'}}>يلزم إعداد مزود AI حقيقي قبل التنفيذ.</span>}
          {latest.status==='WAITING_PROVIDER'&&<span style={{padding:8,borderRadius:8,background:'#fff4e5'}}>WAITING_PROVIDER — لم يُنتج محتوى.</span>}
          {latest.status==='COMPLETED'&&<button disabled={busy===latest.id} onClick={()=>ingest(latest.id)}>تحقق من Output وأنشئ Candidate</button>}
          {latest.status==='OUTPUT_VALIDATED'&&<a href="/admin/staging">انتقل إلى Candidate QA / Staging</a>}
          {retryable&&readiness?.queue_ready&&<button disabled={busy!==null} onClick={queue}>أنشئ Job جديد من الاعتمادات الحالية</button>}
        </div>
      </div>}
    </section>

    <section style={{marginTop:16,background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:18}}>
      <h2 style={{marginTop:0}}>Generation Jobs</h2>
      {!jobs.length?<p>لا توجد Jobs.</p>:<div style={{display:'grid',gap:7}}>{jobs.map(job=><div key={job.id} style={{padding:9,borderRadius:8,background:'#f8fafc'}}>#{job.id} · <strong>{job.status}</strong> · {job.progress}% {job.error?`· ${job.error}`:''}</div>)}</div>}
    </section>

    <section style={{marginTop:16,background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:18}}>
      <h2 style={{marginTop:0}}>Content Candidates</h2>
      {!candidates.length?<p>لا يوجد Candidate بعد. وجود Job وحده لا يُعد محتوى مولدًا.</p>:<div style={{display:'grid',gap:8}}>{candidates.map(candidate=><div key={candidate.id} style={{padding:10,borderRadius:9,background:'#f8fafc'}}><strong>Candidate #{candidate.id} · {candidate.version_label}</strong><div>{candidate.status} · Provenance {candidate.provenance_score}% · Schema {String(candidate.schema_valid)}</div></div>)}</div>}
    </section>

    <div style={{display:'flex',gap:12,marginTop:18,flexWrap:'wrap'}}><a href="/admin/current-semester">الفصل الحالي</a><a href="/admin/staging">Candidate QA / Staging</a><a href="/admin">لوحة الإدارة</a></div>
  </main>;
}
