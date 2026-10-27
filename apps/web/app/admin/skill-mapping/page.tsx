'use client';

import {useEffect,useMemo,useState} from 'react';
import {ActionButton,ActionLink,AdminShell,ButtonRow,Card,MetricCard,Notice,SectionHeader,StatusPill} from '../_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_code:string;title:string};
type Current={units:Array<{lessons:Lesson[]}>};
type Proposal={name_ar:string;domain:string;measurable_outcome_ar:string;description_ar?:string;mastery_threshold:number;importance:number;source_chunk_ids:number[]};
type Candidate={status:string;proposals:Proposal[];approved_indices:number[]};
type MappingJob={job_id:number;status:string;progress:number;candidate?:Candidate|null};
type MappingStatus={lesson_id:number;linked_skills:Array<{skill_id:number;skill_code:string;name_ar:string;domain:string;relationship:string}>;jobs:MappingJob[]};

function jobTone(status:string):'good'|'warn'|'bad'|'info'|'neutral'{
  if(['COMPLETED','OUTPUT_VALIDATED'].includes(status)) return 'good';
  if(['FAILED','OUTPUT_REJECTED','OUTPUT_SCHEMA_INVALID'].includes(status)) return 'bad';
  if(['QUEUED','WAITING_PROVIDER'].includes(status)) return 'warn';
  return 'info';
}

export default function SkillMappingPage(){
  const [lessons,setLessons]=useState<Lesson[]>([]);
  const [lesson,setLesson]=useState<Lesson|null>(null);
  const [mapping,setMapping]=useState<MappingStatus|null>(null);
  const [selected,setSelected]=useState<Record<number,boolean>>({});
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  function headers(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`,'Content-Type':'application/json'};}
  async function load(targetLessonId?:number){
    setError('');
    try{
      const currentRes=await fetch(`${API}/admin/current-semester`,{headers:headers()});
      const current:Current=await currentRes.json();
      if(!currentRes.ok) throw new Error((current as any).detail||'تعذر تحميل الفصل الحالي');
      const all=current.units.flatMap(unit=>unit.lessons||[]);setLessons(all);
      const requested=targetLessonId||Number(new URLSearchParams(window.location.search).get('lesson_id')||0);
      const chosen=all.find(item=>item.id===requested)||all[0];
      if(!chosen) throw new Error('لم يتم العثور على درس في الفصل الحالي');
      setLesson(chosen);
      const mapRes=await fetch(`${API}/factory/lessons/${chosen.id}/skill-mapping`,{headers:headers()});
      const map=await mapRes.json();
      if(!mapRes.ok) throw new Error(typeof map.detail==='string'?map.detail:map.detail?.message||'تعذر تحميل Skill Mapping');
      setMapping(map);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل Skill Mapping');}
  }
  useEffect(()=>{void load();},[]);

  const reviewJob=useMemo(()=>mapping?.jobs?.find(j=>j.candidate?.proposals?.length)||null,[mapping]);
  const selectedCount=Object.values(selected).filter(Boolean).length;
  const pendingProposals=reviewJob?.candidate?.proposals.filter((_,i)=>!reviewJob.candidate?.approved_indices?.includes(i)).length||0;

  async function chooseLesson(id:number){
    const url=new URL(window.location.href);url.searchParams.set('lesson_id',String(id));window.history.replaceState({},'',url);
    setMapping(null);setSelected({});setMessage('');await load(id);
  }

  async function queue(){
    if(!lesson) return;
    setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/lessons/${lesson.id}/skill-mapping/queue`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر إنشاء Skill Mapping Job');
      setMessage(`تم إنشاء Skill Mapping Job #${b.job_id}. لا توجد مهارات معتمدة حتى الآن.`);await load(lesson.id);
    }catch(e){setError(e instanceof Error?e.message:'تعذر إنشاء Skill Mapping Job');}
    finally{setBusy(false);}
  }

  async function execute(jobId:number){
    setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/jobs/${jobId}/execute`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تنفيذ Job');
      setMessage(b.status==='WAITING_PROVIDER'?'المشروع على LOCAL_MOCK؛ لم يتم اختلاق مهارات. جهّز مزود AI حقيقي للتنفيذ.':`Job #${jobId}: ${b.status}.`);
      await load(lesson?.id);
    }catch(e){setError(e instanceof Error?e.message:'فشل تنفيذ Job');}
    finally{setBusy(false);}
  }

  async function ingest(jobId:number){
    setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/skill-mapping/jobs/${jobId}/ingest-provider-output`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل التحقق من الاقتراحات');
      setMessage(`تم التحقق من ${b.proposal_count} اقتراح. جميعها ما زالت تنتظر موافقة Admin.`);await load(lesson?.id);
    }catch(e){setError(e instanceof Error?e.message:'فشل التحقق من الاقتراحات');}
    finally{setBusy(false);}
  }

  async function approve(jobId:number){
    const indices=Object.entries(selected).filter(([,v])=>v).map(([k])=>Number(k));
    if(!indices.length){setError('اختر مهارة واحدة على الأقل للموافقة.');return;}
    setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/skill-mapping/jobs/${jobId}/approve`,{method:'POST',headers:headers(),body:JSON.stringify({proposal_indices:indices})});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشلت الموافقة');
      setMessage(`تم اعتماد ${b.approved.length} مهارة. Skill Codes أُنشئت من الخادم وربطت بالدرس.`);setSelected({});await load(lesson?.id);
    }catch(e){setError(e instanceof Error?e.message:'فشلت الموافقة');}
    finally{setBusy(false);}
  }

  function selectAllPending(){
    if(!reviewJob?.candidate) return;
    const next:Record<number,boolean>={};
    reviewJob.candidate.proposals.forEach((_,i)=>{if(!reviewJob.candidate?.approved_indices?.includes(i)) next[i]=true;});setSelected(next);
  }

  return <AdminShell eyebrow="الإدارة ← الفصل الحالي ← Skill Mapping" title="مراجعة مهارات الدرس" description="الذكاء الاصطناعي يقترح مهارات قابلة للقياس من Source Chunks المعتمدة فقط. لا تدخل أي مهارة إلى Knowledge Graph إلا بعد موافقة الإدارة.">
    <Card style={{marginBottom:14}}>
      <SectionHeader title="الدرس الحالي" description={lesson?`${lesson.lesson_code} · ${lesson.title}`:'جارٍ تحميل الدرس'} aside={mapping?.linked_skills?.length?<StatusPill tone="good">{mapping.linked_skills.length} مهارات معتمدة</StatusPill>:<StatusPill tone="warn">بدون مهارات</StatusPill>}/>
      <select value={lesson?.id||''} onChange={e=>void chooseLesson(Number(e.target.value))} style={{width:'100%',minHeight:46,border:'1px solid #cfd6df',borderRadius:11,padding:'0 12px',background:'#fff',fontSize:15}}>
        {lessons.map(item=><option key={item.id} value={item.id}>{item.lesson_code} · {item.title}</option>)}
      </select>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:14}}>
      <MetricCard label="مهارات معتمدة" value={mapping?.linked_skills?.length||0} tone={mapping?.linked_skills?.length?'good':'warn'} detail="مرتبطة فعليًا بالدرس"/>
      <MetricCard label="اقتراحات تنتظر القرار" value={pendingProposals} tone={pendingProposals?'warn':'neutral'} detail="لا تدخل Knowledge Graph تلقائيًا"/>
      <MetricCard label="Skill Jobs" value={mapping?.jobs?.length||0} detail="سجل الاستخراج والتحقق"/>
    </div>

    {message&&<div style={{marginBottom:12}}><Notice tone="good">{message}</Notice></div>}
    {error&&<div style={{marginBottom:12}}><Notice tone="bad">{error}</Notice></div>}

    <Card style={{marginBottom:14}}>
      <SectionHeader title="المهارات المعتمدة" description="هذه فقط هي المهارات التي يستطيع Lesson Generation استخدامها." aside={<ActionButton onClick={()=>void queue()} disabled={busy||!lesson}>+ إنشاء Skill Mapping Job</ActionButton>}/>
      {!mapping?.linked_skills?.length?<Notice tone="warn">لا توجد مهارات معتمدة. Lesson Generation سيبقى BLOCKED حتى اعتماد مهارة واحدة على الأقل.</Notice>:<div style={{display:'grid',gap:8}}>{mapping.linked_skills.map(s=><div key={s.skill_id} style={{padding:12,borderRadius:11,background:'#f7faf8',border:'1px solid #dbece1'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong>{s.name_ar}</strong><StatusPill tone="good">{s.relationship}</StatusPill></div>
        <code style={{display:'block',fontSize:12,marginTop:5,overflowWrap:'anywhere'}}>{s.skill_code}</code><div style={{fontSize:12,color:'#667085',marginTop:4}}>Domain: {s.domain}</div>
      </div>)}</div>}
    </Card>

    <Card style={{marginBottom:14}}>
      <SectionHeader title="AI Jobs" description="يمكن إنشاء Job وتتبعه بدون أن تنشأ مهارات تلقائيًا."/>
      {!mapping?.jobs?.length?<Notice>لا توجد Jobs بعد.</Notice>:<div style={{display:'grid',gap:9}}>{mapping.jobs.map(job=><div key={job.job_id} style={{padding:12,border:'1px solid #e7ebf1',borderRadius:12}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong>Job #{job.job_id}</strong><StatusPill tone={jobTone(job.status)}>{job.status}</StatusPill></div>
        <div style={{height:7,background:'#eef1f5',borderRadius:99,overflow:'hidden',marginTop:9}}><div style={{height:'100%',width:`${Math.max(0,Math.min(100,job.progress||0))}%`,background:'#176b3a'}}/></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
          {job.status==='QUEUED'&&<ActionButton onClick={()=>void execute(job.job_id)} disabled={busy}>تشغيل AI</ActionButton>}
          {job.status==='COMPLETED'&&<ActionButton onClick={()=>void ingest(job.job_id)} disabled={busy}>تحقق من Output</ActionButton>}
        </div>
      </div>)}</div>}
    </Card>

    {reviewJob?.candidate&&<Card style={{marginBottom:14,background:'#fffdf7',borderColor:'#eadca8'}}>
      <SectionHeader title="اقتراحات تحتاج موافقة Admin" description="اقرأ المهارة ودليلها ثم اختر ما يطابق المنهاج فعلًا." aside={<StatusPill tone="warn">{pendingProposals} تنتظر</StatusPill>}/>
      <ButtonRow><ActionButton tone="secondary" onClick={selectAllPending}>اختيار كل غير المعتمد</ActionButton>{selectedCount>0&&<StatusPill tone="info">تم اختيار {selectedCount}</StatusPill>}</ButtonRow>
      <div style={{display:'grid',gap:10,marginTop:12}}>{reviewJob.candidate.proposals.map((p,index)=>{
        const approved=reviewJob.candidate?.approved_indices?.includes(index)||false;
        return <label key={index} style={{display:'block',padding:13,border:`1px solid ${approved?'#abefc6':'#eee3b7'}`,borderRadius:12,background:approved?'#f2fbf5':'#fff',cursor:approved?'default':'pointer'}}>
          <div style={{display:'flex',gap:9,alignItems:'flex-start'}}><input type="checkbox" style={{marginTop:4,width:18,height:18}} checked={approved||!!selected[index]} disabled={approved} onChange={e=>setSelected(v=>({...v,[index]:e.target.checked}))}/><div style={{flex:1}}>
            <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}><strong>{p.name_ar}</strong><StatusPill>{p.domain}</StatusPill>{approved&&<StatusPill tone="good">معتمدة</StatusPill>}</div>
            <div style={{marginTop:6,lineHeight:1.65}}>{p.measurable_outcome_ar}</div>
            {p.description_ar&&<div style={{fontSize:13,color:'#667085',marginTop:4}}>{p.description_ar}</div>}
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}><StatusPill tone="info">Mastery {Math.round(p.mastery_threshold*100)}%</StatusPill><StatusPill>Importance {p.importance}</StatusPill><StatusPill>Chunks {p.source_chunk_ids.join(', ')}</StatusPill></div>
          </div></div>
        </label>})}</div>
      <div style={{marginTop:12}}><ActionButton disabled={busy||selectedCount===0} onClick={()=>void approve(reviewJob.job_id)}>✓ اعتماد {selectedCount||''} مهارة</ActionButton></div>
    </Card>}

    <Card style={{position:'sticky',bottom:10,zIndex:2}}>
      <SectionHeader title="الخطوة التالية" description={mapping?.linked_skills?.length?'أصبحت هناك مهارات معتمدة. افحص Generation Readiness ثم انتقل إلى التوليد.':'أكمل اعتماد المهارات أولًا.'}/>
      <ButtonRow>
        <ActionLink href={lesson?`/admin/generation-readiness?lesson_id=${lesson.id}`:'/admin/generation-readiness'}>فحص Generation Readiness</ActionLink>
        <ActionLink href={lesson?`/admin/lesson-generation?lesson_id=${lesson.id}`:'/admin/lesson-generation'} tone="secondary">Lesson Generation</ActionLink>
        <ActionLink href={lesson?`/admin/source-link-review?lesson_id=${lesson.id}`:'/admin/source-link-review'} tone="secondary">العودة إلى Source Review</ActionLink>
        <ActionLink href="/admin/current-semester" tone="secondary">الفصل الحالي</ActionLink>
      </ButtonRow>
    </Card>
  </AdminShell>;
}
