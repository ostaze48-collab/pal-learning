'use client';

import {useEffect,useMemo,useState} from 'react';
import {ActionButton,ActionLink,AdminShell,ButtonRow,Card,MetricCard,Notice,SectionHeader,StatusPill} from '../_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_code:string;title:string};
type Current={units:Array<{lessons:Lesson[]}>};
type Readiness={queue_ready:boolean;execution_ready:boolean;blockers:string[];next_actions:string[];authorized_factual_source_chunks:number;skills_count:number;scope_evidence_count?:number;provider:{provider:string;execution_ready:boolean}};
type FactoryStatus={provider:string;generation_ready:boolean;model_configured:boolean;key_configured:boolean;mode:string};
type Job={id:number;job_type:string;status:string;progress:number;model_route:string;prompt_version:string;error?:string|null;provider?:string|null};
type Candidate={id:number;version_label:string;status:string;schema_valid:boolean;provenance_score:number;validation?:Record<string,unknown>;created_at?:string};

function jobTone(status:string):'good'|'warn'|'bad'|'info'|'neutral'{
  if(['OUTPUT_VALIDATED','COMPLETED'].includes(status)) return 'good';
  if(['FAILED','STALE_INPUT','OUTPUT_REJECTED','OUTPUT_SCHEMA_INVALID'].includes(status)) return 'bad';
  if(['QUEUED','WAITING_PROVIDER'].includes(status)) return 'warn';
  return 'info';
}

export default function LessonGenerationPage(){
  const [lessons,setLessons]=useState<Lesson[]>([]);
  const [lesson,setLesson]=useState<Lesson|null>(null);
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const [factory,setFactory]=useState<FactoryStatus|null>(null);
  const [jobs,setJobs]=useState<Job[]>([]);
  const [candidates,setCandidates]=useState<Candidate[]>([]);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState<number|null>(null);

  function headers(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`,'Content-Type':'application/json'};}

  async function load(targetLessonId?:number){
    setError('');
    try{
      const currentRes=await fetch(`${API}/admin/current-semester`,{headers:headers()});
      const current:Current=await currentRes.json();
      if(!currentRes.ok) throw new Error((current as any).detail||'تعذر تحميل الفصل الحالي');
      const all=current.units.flatMap(unit=>unit.lessons||[]);setLessons(all);
      const requested=targetLessonId||Number(new URLSearchParams(window.location.search).get('lesson_id')||0);
      const selected=all.find(item=>item.id===requested)||all[0];
      if(!selected) throw new Error('لم يتم العثور على درس في الفصل الحالي');
      setLesson(selected);

      const [readyRes,statusRes,jobsRes,candidatesRes]=await Promise.all([
        fetch(`${API}/factory/lessons/${selected.id}/generation-readiness`,{headers:headers()}),
        fetch(`${API}/factory/status`,{headers:headers()}),
        fetch(`${API}/factory/lessons/${selected.id}/jobs`,{headers:headers()}),
        fetch(`${API}/factory/lessons/${selected.id}/candidates`,{headers:headers()}),
      ]);
      const ready=await readyRes.json();const status=await statusRes.json();const allJobs=await jobsRes.json();const candidateRows=await candidatesRes.json();
      if(!readyRes.ok) throw new Error(typeof ready.detail==='string'?ready.detail:ready.detail?.message||'تعذر تحميل Generation Readiness');
      if(!statusRes.ok) throw new Error(status.detail||'تعذر تحميل AI Provider status');
      if(!jobsRes.ok) throw new Error(allJobs.detail||'تعذر تحميل Jobs');
      if(!candidatesRes.ok) throw new Error(candidateRows.detail||'تعذر تحميل Candidates');
      setReadiness(ready);setFactory(status);setJobs((allJobs||[]).filter((job:Job)=>job.job_type==='GENERATE_LESSON'));setCandidates(candidateRows||[]);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل Lesson Generation');}
  }
  useEffect(()=>{void load();},[]);

  const latest=useMemo(()=>jobs[0]||null,[jobs]);
  const retryable=!!latest&&['FAILED','STALE_INPUT','OUTPUT_REJECTED','OUTPUT_SCHEMA_INVALID'].includes(latest.status);

  async function chooseLesson(id:number){
    const url=new URL(window.location.href);url.searchParams.set('lesson_id',String(id));window.history.replaceState({},'',url);
    setJobs([]);setCandidates([]);setMessage('');await load(id);
  }

  async function queue(){
    if(!lesson) return;
    setBusy(-1);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/lessons/${lesson.id}/generate`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر إنشاء Generation Job');
      setMessage(`تم إنشاء Generation Job #${b.job_id}. تم تثبيت Snapshot للمصادر والمهارات؛ لم يتم توليد محتوى بعد.`);await load(lesson.id);
    }catch(e){setError(e instanceof Error?e.message:'تعذر إنشاء Generation Job');}
    finally{setBusy(null);}
  }

  async function execute(jobId:number){
    setBusy(jobId);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/jobs/${jobId}/execute`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تنفيذ AI');
      setMessage(b.status==='WAITING_PROVIDER'?'الـJob ينتظر مزود AI حقيقي؛ لم يتم إنشاء محتوى وهمي.':`انتهى تنفيذ AI بحالة ${b.status}.`);await load(lesson?.id);
    }catch(e){setError(e instanceof Error?e.message:'فشل تنفيذ AI');}
    finally{setBusy(null);}
  }

  async function ingest(jobId:number){
    setBusy(jobId);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/jobs/${jobId}/ingest-provider-output`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل التحقق من خرج المزود');
      setMessage(`Output Validated ✓ · Candidate #${b.candidate_id} · Provenance ${b.provenance_score}%.`);await load(lesson?.id);
    }catch(e){setError(e instanceof Error?e.message:'فشل التحقق من خرج المزود');}
    finally{setBusy(null);}
  }

  return <AdminShell eyebrow="الإدارة ← الفصل الحالي ← Lesson Generation" title="توليد حزمة الدرس" description="التوليد لا يبدأ إلا بعد Source Review وSkill Approval. خرج AI يبقى Candidate منفصلًا ولا يلمس الدرس الحي قبل QA وStaging.">
    <Card style={{marginBottom:14}}>
      <SectionHeader title="الدرس الحالي" description={lesson?`${lesson.lesson_code} · ${lesson.title}`:'جارٍ تحميل الدرس'} aside={readiness?<StatusPill tone={readiness.queue_ready?'good':'bad'}>{readiness.queue_ready?'QUEUE READY':'BLOCKED'}</StatusPill>:undefined}/>
      <select value={lesson?.id||''} onChange={e=>void chooseLesson(Number(e.target.value))} style={{width:'100%',minHeight:46,border:'1px solid #cfd6df',borderRadius:11,padding:'0 12px',background:'#fff',fontSize:15}}>
        {lessons.map(item=><option key={item.id} value={item.id}>{item.lesson_code} · {item.title}</option>)}
      </select>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10,marginBottom:14}}>
      <MetricCard label="Generation Readiness" value={readiness?.queue_ready?'READY':'BLOCKED'} tone={readiness?.queue_ready?'good':'bad'} detail={`Sources ${readiness?.authorized_factual_source_chunks??'—'} · Skills ${readiness?.skills_count??'—'}`}/>
      <MetricCard label="AI Provider" value={factory?.provider||'—'} tone={factory?.generation_ready?'good':'warn'} detail={`${factory?.mode||'—'} · execution ${factory?.generation_ready?'ready':'blocked'}`}/>
      <MetricCard label="Candidates" value={candidates.length} tone={candidates.length?'good':'neutral'} detail="كل Candidate مستقل عن المحتوى المنشور"/>
      <MetricCard label="Generation Jobs" value={jobs.length} detail={latest?`Latest: #${latest.id} ${latest.status}`:'لا يوجد Job'}/>
    </div>

    {message&&<div style={{marginBottom:12}}><Notice tone="good">{message}</Notice></div>}
    {error&&<div style={{marginBottom:12}}><Notice tone="bad">{error}</Notice></div>}
    {!!readiness?.blockers?.length&&<div style={{marginBottom:14}}><Notice tone="bad"><strong>Blockers:</strong> {readiness.blockers.join(' · ')}{readiness.next_actions?.length?<div style={{marginTop:5}}><strong>Next:</strong> {readiness.next_actions.join(' · ')}</div>:null}</Notice></div>}

    <Card style={{marginBottom:14}}>
      <SectionHeader title="الإجراء الحالي" description="هذه الأزرار تتبع حالة الـJob ولا تتجاوز أي بوابة."/>
      {!latest&&<div><Notice tone={readiness?.queue_ready?'info':'warn'}>{readiness?.queue_ready?'كل البوابات غير المرتبطة بالمزود جاهزة. يمكنك إنشاء Job.':'أكمل Source Review وSkill Mapping أولًا.'}</Notice><div style={{marginTop:12}}><ActionButton disabled={busy!==null||!readiness?.queue_ready} onClick={()=>void queue()}>+ إنشاء Generation Job</ActionButton></div></div>}
      {latest&&<div style={{padding:14,border:'1px solid #e7ebf1',borderRadius:13,background:'#fafbfc'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><div><strong>Job #{latest.id}</strong><div style={{fontSize:12,color:'#667085',marginTop:3}}>route {latest.model_route} · prompt {latest.prompt_version}</div></div><StatusPill tone={jobTone(latest.status)}>{latest.status}</StatusPill></div>
        <div style={{height:8,background:'#e9edf2',borderRadius:99,overflow:'hidden',marginTop:11}}><div style={{height:'100%',width:`${Math.max(0,Math.min(100,latest.progress||0))}%`,background:'#176b3a'}}/></div>
        {latest.error&&<div style={{marginTop:10}}><Notice tone="bad">{latest.error}</Notice></div>}
        <div style={{marginTop:12}}><ButtonRow>
          {latest.status==='QUEUED'&&factory?.generation_ready&&<ActionButton disabled={busy===latest.id} onClick={()=>void execute(latest.id)}>تشغيل AI الآن</ActionButton>}
          {latest.status==='QUEUED'&&!factory?.generation_ready&&<ActionLink href="/admin/readiness" tone="secondary">إعداد Production / AI Readiness</ActionLink>}
          {latest.status==='COMPLETED'&&<ActionButton disabled={busy===latest.id} onClick={()=>void ingest(latest.id)}>تحقق من Output وأنشئ Candidate</ActionButton>}
          {latest.status==='OUTPUT_VALIDATED'&&<ActionLink href="/admin/staging">التالي: Candidate QA / Staging</ActionLink>}
          {retryable&&readiness?.queue_ready&&<ActionButton tone="secondary" disabled={busy!==null} onClick={()=>void queue()}>إنشاء Job جديد من الاعتمادات الحالية</ActionButton>}
        </ButtonRow></div>
        {latest.status==='WAITING_PROVIDER'&&<div style={{marginTop:10}}><Notice tone="warn">WAITING_PROVIDER — النظام رفض اختلاق محتوى محلي. يجب إعداد مزود AI حقيقي.</Notice></div>}
      </div>}
    </Card>

    <Card style={{marginBottom:14}}>
      <SectionHeader title="Generation Jobs" description="سجل محاولات التوليد للدرس الحالي."/>
      {!jobs.length?<Notice>لا توجد Jobs.</Notice>:<div style={{display:'grid',gap:8}}>{jobs.map(job=><div key={job.id} style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',padding:11,border:'1px solid #edf0f4',borderRadius:11}}><div><strong>#{job.id}</strong> · {job.progress}%<div style={{fontSize:12,color:'#667085'}}>{job.model_route} · {job.prompt_version}</div></div><StatusPill tone={jobTone(job.status)}>{job.status}</StatusPill></div>)}</div>}
    </Card>

    <Card style={{marginBottom:14}}>
      <SectionHeader title="Content Candidates" description="Candidate لا يعني Published. سيذهب بعد ذلك إلى Preflight وStaging وAcademic QA." aside={candidates.length?<ActionLink href="/admin/staging">فتح Staging Console</ActionLink>:undefined}/>
      {!candidates.length?<Notice>لا يوجد Candidate بعد. وجود Job وحده لا يعتبر محتوى مولدًا.</Notice>:<div style={{display:'grid',gap:9}}>{candidates.map(candidate=><div key={candidate.id} style={{padding:12,border:'1px solid #e7ebf1',borderRadius:12}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong>Candidate #{candidate.id} · {candidate.version_label}</strong><StatusPill tone={candidate.status.includes('REJECT')?'bad':'info'}>{candidate.status}</StatusPill></div>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:8}}><StatusPill tone={candidate.schema_valid?'good':'bad'}>Schema {candidate.schema_valid?'PASS':'FAIL'}</StatusPill><StatusPill tone={candidate.provenance_score===100?'good':'warn'}>Provenance {candidate.provenance_score}%</StatusPill></div>
      </div>)}</div>}
    </Card>

    <Card style={{position:'sticky',bottom:10,zIndex:2}}>
      <SectionHeader title="تنقل سريع" description="ارجع خطوة للخلف أو انتقل إلى QA بعد إنشاء Candidate."/>
      <ButtonRow>
        <ActionLink href={lesson?`/admin/generation-readiness?lesson_id=${lesson.id}`:'/admin/generation-readiness'}>Generation Readiness</ActionLink>
        <ActionLink href={lesson?`/admin/skill-mapping?lesson_id=${lesson.id}`:'/admin/skill-mapping'} tone="secondary">Skill Mapping</ActionLink>
        <ActionLink href={lesson?`/admin/source-link-review?lesson_id=${lesson.id}`:'/admin/source-link-review'} tone="secondary">Source Review</ActionLink>
        <ActionLink href="/admin/current-semester" tone="secondary">الفصل الحالي</ActionLink>
        <ActionLink href="/admin/staging" tone="secondary">QA / Staging</ActionLink>
      </ButtonRow>
    </Card>
  </AdminShell>;
}
