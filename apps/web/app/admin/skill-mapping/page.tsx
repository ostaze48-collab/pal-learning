'use client';

import {useEffect,useMemo,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_code:string;title:string};
type Current={units:Array<{lessons:Lesson[]}>};
type Proposal={name_ar:string;domain:string;measurable_outcome_ar:string;description_ar?:string;mastery_threshold:number;importance:number;source_chunk_ids:number[]};
type Candidate={status:string;proposals:Proposal[];approved_indices:number[]};
type MappingJob={job_id:number;status:string;progress:number;candidate?:Candidate|null};
type MappingStatus={lesson_id:number;linked_skills:Array<{skill_id:number;skill_code:string;name_ar:string;domain:string;relationship:string}>;jobs:MappingJob[]};

export default function SkillMappingPage(){
  const [lesson,setLesson]=useState<Lesson|null>(null);
  const [mapping,setMapping]=useState<MappingStatus|null>(null);
  const [selected,setSelected]=useState<Record<number,boolean>>({});
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  function headers(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`,'Content-Type':'application/json'};}
  async function load(){
    setError('');
    try{
      const currentRes=await fetch(`${API}/admin/current-semester`,{headers:headers()});
      const current:Current=await currentRes.json();
      if(!currentRes.ok) throw new Error((current as any).detail||'تعذر تحميل الفصل الحالي');
      const lessons=current.units.flatMap(unit=>unit.lessons||[]);
      const requested=Number(new URLSearchParams(window.location.search).get('lesson_id')||0);
      const chosen=lessons.find(item=>item.id===requested)||lessons[0];
      if(!chosen) throw new Error('لم يتم العثور على درس في الفصل الحالي');
      setLesson(chosen);
      const mapRes=await fetch(`${API}/factory/lessons/${chosen.id}/skill-mapping`,{headers:headers()});
      const map=await mapRes.json();
      if(!mapRes.ok) throw new Error(map.detail||'تعذر تحميل Skill Mapping');
      setMapping(map);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل Skill Mapping');}
  }
  useEffect(()=>{void load();},[]);

  const reviewJob=useMemo(()=>mapping?.jobs?.find(j=>j.candidate?.proposals?.length)||null,[mapping]);

  async function queue(){
    if(!lesson) return;
    setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/lessons/${lesson.id}/skill-mapping/queue`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر إنشاء Skill Mapping Job');
      setMessage(`Skill Mapping Job #${b.job_id} تم إنشاؤه. الخطوة التالية: تنفيذ المزود.`);
      await load();
    }catch(e){setError(e instanceof Error?e.message:'تعذر إنشاء Skill Mapping Job');}
    finally{setBusy(false);}
  }

  async function execute(jobId:number){
    setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/jobs/${jobId}/execute`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(b.detail||'فشل تنفيذ Job');
      if(b.status==='WAITING_PROVIDER') setMessage('المشروع ما زال على LOCAL_MOCK؛ لا توجد اقتراحات مهارات حقيقية حتى يتم إعداد مزود AI.');
      else setMessage(`Job #${jobId}: ${b.status}. الآن تحقق من خرج المزود.`);
      await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل تنفيذ Job');}
    finally{setBusy(false);}
  }

  async function ingest(jobId:number){
    setBusy(true);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/skill-mapping/jobs/${jobId}/ingest-provider-output`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل التحقق من الاقتراحات');
      setMessage(`تم التحقق من ${b.proposal_count} اقتراح مهارة. لم تُعتمد أي مهارة بعد.`);
      await load();
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
      setMessage(`تم اعتماد ${b.approved.length} مهارة وإنشاء Skill Codes من الخادم فقط.`);
      setSelected({});
      await load();
    }catch(e){setError(e instanceof Error?e.message:'فشلت الموافقة');}
    finally{setBusy(false);}
  }

  return <main style={{maxWidth:1000,margin:'30px auto',padding:20}}>
    <div style={{fontSize:14,opacity:.65}}>الإدارة ← الفصل الحالي ← Skill Mapping</div>
    <h1>مراجعة مهارات الدرس</h1>
    <p>{lesson?`${lesson.lesson_code} · ${lesson.title}`:'جارٍ تحميل الدرس…'}</p>
    {message&&<div style={{padding:12,borderRadius:10,background:'#eefbf3',marginBottom:12}}>{message}</div>}
    {error&&<div style={{padding:12,borderRadius:10,background:'#ffecec',marginBottom:12}}>{error}</div>}

    <section style={{background:'white',border:'1px solid #e7ebf1',borderRadius:14,padding:18}}>
      <h2 style={{marginTop:0}}>المهارات المعتمدة حاليًا</h2>
      {!mapping?.linked_skills?.length?<p>لا توجد مهارات معتمدة بعد. هذا يمنع Lesson Generation عمدًا.</p>:<div style={{display:'grid',gap:8}}>{mapping.linked_skills.map(s=><div key={s.skill_id} style={{padding:10,borderRadius:9,background:'#f7f9fc'}}><strong>{s.name_ar}</strong><br/><code>{s.skill_code}</code> · {s.domain}</div>)}</div>}
      <button disabled={busy||!lesson} onClick={queue} style={{marginTop:12,padding:'9px 12px',border:0,borderRadius:9,background:'#1f6feb',color:'white'}}>إنشاء Skill Mapping Job</button>
    </section>

    <section style={{marginTop:16,background:'white',border:'1px solid #e7ebf1',borderRadius:14,padding:18}}>
      <h2 style={{marginTop:0}}>Jobs</h2>
      {!mapping?.jobs?.length?<p>لا توجد Jobs بعد.</p>:mapping.jobs.map(job=><div key={job.job_id} style={{padding:10,borderBottom:'1px solid #edf0f5'}}>
        <strong>#{job.job_id}</strong> · {job.status} · {job.progress}%
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:7}}>
          {job.status==='QUEUED'&&<button disabled={busy} onClick={()=>execute(job.job_id)}>تنفيذ AI</button>}
          {job.status==='COMPLETED'&&<button disabled={busy} onClick={()=>ingest(job.job_id)}>تحقق من Output</button>}
        </div>
      </div>)}
    </section>

    {reviewJob?.candidate&&<section style={{marginTop:16,background:'#fffdf5',border:'1px solid #eadca8',borderRadius:14,padding:18}}>
      <h2 style={{marginTop:0}}>اقتراحات تحتاج موافقة Admin</h2>
      <p>الـAI لا ينشئ Skill Code ولا يضيف المهارة للـKnowledge Graph. اختر فقط المهارات التي تطابق المصدر.</p>
      <div style={{display:'grid',gap:10}}>{reviewJob.candidate.proposals.map((p,index)=><label key={index} style={{display:'block',padding:12,border:'1px solid #eee3b7',borderRadius:10,background:'white'}}>
        <input type="checkbox" checked={!!selected[index]} disabled={reviewJob.candidate?.approved_indices?.includes(index)} onChange={e=>setSelected(v=>({...v,[index]:e.target.checked}))}/>{' '}
        <strong>{p.name_ar}</strong> · <code>{p.domain}</code>
        <div style={{marginTop:5}}>{p.measurable_outcome_ar}</div>
        <small>Mastery {Math.round(p.mastery_threshold*100)}% · Importance {p.importance} · Evidence chunks: {p.source_chunk_ids.join(', ')}</small>
        {reviewJob.candidate?.approved_indices?.includes(index)&&<div style={{color:'#176b3a',fontWeight:700}}>معتمدة ✓</div>}
      </label>)}</div>
      <button disabled={busy} onClick={()=>approve(reviewJob.job_id)} style={{marginTop:12,padding:'10px 14px',border:0,borderRadius:9,background:'#176b3a',color:'white',fontWeight:700}}>اعتماد المهارات المختارة</button>
    </section>}

    <div style={{display:'flex',gap:10,marginTop:18,flexWrap:'wrap'}}><a href="/admin/current-semester/matrix">مصفوفة الفصل</a><a href={lesson?`/admin/lesson-generation?lesson_id=${lesson.id}`:'/admin/lesson-generation'}>Lesson Generation</a><a href="/admin/current-semester">الفصل الحالي</a><a href="/admin">لوحة الإدارة</a></div>
  </main>;
}
