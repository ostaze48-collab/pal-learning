'use client';

import {useEffect,useMemo,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_number:number;lesson_code:string;title:string;status:string};
type Unit={id:number;unit_number:number;title:string;lessons:Lesson[]};
type Source={id:number;source_type:string;source_url?:string;status:string;reliability_score:number;edition_match_score:number};
type Readiness={queue_ready:boolean;execution_ready:boolean;blockers:string[];next_actions:string[];skills_count:number;authorized_factual_source_chunks:number;scope_evidence_count:number;provider:{provider:string;execution_ready:boolean}};
type Payload={semester:number;book:{id:number;book_code:string;title:string;status:string;edition?:string};package:{id:number;package_code:string;status:string;source_count:number};units:Unit[];sources:Source[];backlog:{semester_2_book_code:string;note:string}};
type PipelineStage={key:string;label:string;status:'DONE'|'READY'|'BLOCKED';detail:string;action?:string|null};
type Pipeline={
  package_id:number;
  package_code:string;
  lesson?:{id:number;lesson_code:string;title:string}|null;
  source?:{id:number;source_type:string;status:string;page_count?:number;edition_match_score:number}|null;
  stages:PipelineStage[];
  next_stage?:PipelineStage|null;
  counts:{candidate_source_links:number;verified_source_links:number;linked_skills:number};
  generation_readiness?:Readiness|null;
  latest_skill_mapping_job?:{id:number;status:string}|null;
  latest_generation_job?:{id:number;status:string}|null;
};

const stageBg:Record<string,string>={DONE:'#edf9f1',READY:'#eef6ff',BLOCKED:'#fff1f1'};
const stageMark:Record<string,string>={DONE:'✓',READY:'→',BLOCKED:'×'};
const primaryStyle={padding:'11px 16px',borderRadius:10,border:0,background:'#176b3a',color:'white',fontWeight:800,cursor:'pointer'} as const;
const linkStyle={padding:'11px 16px',borderRadius:10,background:'#176b3a',color:'white',fontWeight:800,textDecoration:'none'} as const;

export default function CurrentSemesterPage(){
  const [data,setData]=useState<Payload|null>(null);
  const [pipeline,setPipeline]=useState<Pipeline|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState<number|null>(null);
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const firstLesson=useMemo(()=>data?.units?.[0]?.lessons?.[0]||null,[data]);
  function authHeaders(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`};}

  async function load(){
    setError('');
    try{
      const [currentResponse,pipelineResponse]=await Promise.all([
        fetch(`${API}/admin/current-semester`,{headers:authHeaders()}),
        fetch(`${API}/admin/current-semester/pipeline`,{headers:authHeaders()}),
      ]);
      const current=await currentResponse.json();
      const flow=await pipelineResponse.json();
      if(!currentResponse.ok) throw new Error(current.detail||'تعذر تحميل الفصل الحالي');
      if(!pipelineResponse.ok) throw new Error(flow.detail||'تعذر تحميل مسار الإنتاج');
      setData(current);setPipeline(flow);setReadiness(flow.generation_readiness||null);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل الفصل الحالي');}
  }
  useEffect(()=>{void load();},[]);

  async function syncOfficial(){
    if(!data) return;
    setBusy(-20);setMessage('');setError('');
    try{
      const r=await fetch(`${API}/importer/catalog/source-packages/${data.package.id}/sync`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تسجيل المصدر الرسمي');
      setMessage(`تمت مزامنة كتالوج الوزارة. أُنشئ ${b.created||0} مصدر جديد.`);await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل تسجيل المصدر الرسمي');}
    finally{setBusy(null);}
  }

  async function fetchOfficial(sourceId:number){
    setBusy(sourceId);setMessage('');setError('');
    try{
      const r=await fetch(`${API}/importer/source-files/${sourceId}/fetch-registered`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل جلب المصدر الرسمي');
      setMessage(`تم جلب المصدر #${sourceId} واستخراج ${b.page_count||0} صفحة. Edition Match ${b.edition_match_score||0}%.`);await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل جلب المصدر الرسمي');}
    finally{setBusy(null);}
  }

  async function verifyScope(sourceId:number){
    setBusy(sourceId);setMessage('');setError('');
    try{
      const r=await fetch(`${API}/importer/catalog/source-files/${sourceId}/verify-scope`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تحقق النطاق');
      if(b.scope_verified) setMessage('Scope PASS ✓ · المصدر يغطي الخلية + خصائص المادة + الطاقة في حياتنا.');
      else setMessage(`Scope BLOCKED · المفقود: ${(b.missing_terms||[]).join('، ')||'—'}.`);
      await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل تحقق النطاق');}
    finally{setBusy(null);}
  }

  async function linkLessons(){
    if(!data) return;
    setBusy(-10);setMessage('');setError('');
    try{
      const r=await fetch(`${API}/importer/source-packages/${data.package.id}/link-lessons`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل اقتراح روابط الدروس');
      const firstMatches=(b.candidates||[]).filter((x:{lesson_id:number;linked:boolean})=>x.lesson_id===firstLesson?.id&&x.linked).length;
      setMessage(`تم إنشاء ${b.created_links||0} رابط مرشح. للدرس الأول: ${firstMatches} مرشح ينتظر مراجعة.`);await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل اقتراح روابط الدروس');}
    finally{setBusy(null);}
  }

  async function checkReadiness(){
    if(!firstLesson) return;
    setBusy(firstLesson.id);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/lessons/${firstLesson.id}/generation-readiness`,{headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر فحص جاهزية التوليد');
      setReadiness(b);setMessage(b.queue_ready?'Generation Readiness PASS ✓':'Generation Readiness BLOCKED · راجع المسار أعلاه.');await load();
    }catch(e){setError(e instanceof Error?e.message:'تعذر فحص جاهزية التوليد');}
    finally{setBusy(null);}
  }

  async function queueGeneration(){
    if(!firstLesson) return;
    setBusy(firstLesson.id);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/factory/lessons/${firstLesson.id}/generate`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok){const detail=b.detail||{};setReadiness(detail.generation_readiness||null);throw new Error(detail.message||'الدرس غير جاهز للتوليد');}
      setMessage(`تم إنشاء Generation Job #${b.job_id} بحالة ${b.status}.`);await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل إنشاء Generation Job');}
    finally{setBusy(null);}
  }

  function nextActionControl(){
    const action=pipeline?.next_stage?.action;
    if(!pipeline?.next_stage) return <div style={{padding:12,borderRadius:10,background:'#edf9f1',fontWeight:800}}>اكتملت بوابات التوليد ووصل خرج الدرس إلى OUTPUT_VALIDATED ✓</div>;
    if(!action) return <div style={{padding:12,borderRadius:10,background:'#fff1f1'}}>المرحلة الحالية محجوبة. راجع تفاصيلها قبل المتابعة.</div>;
    if(action==='SYNC_OR_REGISTER_OFFICIAL_SOURCE') return <button disabled={busy===-20} onClick={syncOfficial} style={primaryStyle}>تسجيل مصدر الوزارة</button>;
    if(action==='FETCH_OFFICIAL_SOURCE') return pipeline.source?.id?<button disabled={busy===pipeline.source.id} onClick={()=>fetchOfficial(pipeline.source!.id)} style={primaryStyle}>جلب المصدر الرسمي الآن</button>:null;
    if(action==='VERIFY_SEMESTER_SCOPE') return pipeline.source?.id?<button disabled={busy===pipeline.source.id} onClick={()=>verifyScope(pipeline.source!.id)} style={primaryStyle}>تحقق من نطاق الفصل الأول</button>:null;
    if(action==='AUTO_LINK_LESSONS') return <button disabled={busy===-10} onClick={linkLessons} style={primaryStyle}>اقتراح ربط الدروس بالمصدر</button>;
    if(action==='REVIEW_SOURCE_LINKS') return <a href="/admin/source-link-review" style={linkStyle}>راجع Source Chunks واعتمد الصحيح</a>;
    if(action==='OPEN_SKILL_MAPPING') return <a href="/admin/skill-mapping" style={linkStyle}>افتح Skill Mapping واعتمد المهارات</a>;
    if(action==='QUEUE_GENERATION') return <button disabled={busy===firstLesson?.id} onClick={queueGeneration} style={primaryStyle}>إنشاء Generation Job</button>;
    if(action==='OPEN_LESSON_GENERATION') return <a href="/admin/lesson-generation" style={linkStyle}>افتح Lesson Generation Console</a>;
    return <div style={{padding:12,borderRadius:10,background:'#fff4e5'}}>الإجراء التالي: {action}</div>;
  }

  return <main style={{maxWidth:1050,margin:'30px auto',padding:20}}>
    <div style={{fontSize:14,opacity:.65}}>الإدارة ← الفصل الحالي</div>
    <h1>علوم خامس — الفصل الأول</h1>
    <p>المسار الإنتاجي الحالي فقط. الفصل الثاني محفوظ كـPrototype/Backlog ولا يدخل المصنع الحالي.</p>
    {message&&<div style={{padding:12,borderRadius:10,background:'#eefbf3',marginBottom:12}}>{message}</div>}
    {error&&<div style={{padding:12,borderRadius:10,background:'#ffecec',marginBottom:12}}>{error}</div>}
    {!data&&!error&&<p>جارٍ تحميل السجل الحالي…</p>}
    {data&&<>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
        <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><div style={{fontSize:13,opacity:.6}}>Book</div><strong>{data.book.book_code}</strong><div>{data.book.title}</div><small>{data.book.status} · {data.book.edition||'—'}</small></div>
        <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><div style={{fontSize:13,opacity:.6}}>Current Package</div><strong>{data.package.package_code}</strong><div>Package ID: {data.package.id}</div><small>{data.package.status} · {data.package.source_count} مصدر</small></div>
      </section>

      {pipeline&&<section style={{marginTop:18,background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:18}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'center'}}><h2 style={{margin:0}}>Production Pipeline</h2><strong>{pipeline.next_stage?`التالي: ${pipeline.next_stage.label}`:'وصل الدرس إلى OUTPUT_VALIDATED ✓'}</strong></div>
        <p>كل مرحلة لا تصبح متاحة إلا بعد نجاح السابقة؛ Source Review وSkill Approval بوابتان إلزاميتان.</p>
        <div style={{display:'grid',gap:8}}>{pipeline.stages.map((stage,index)=><div key={stage.key} style={{display:'grid',gridTemplateColumns:'42px minmax(170px,230px) 1fr',gap:10,alignItems:'center',padding:11,borderRadius:11,background:stageBg[stage.status]||'#f7f8fa'}}>
          <div style={{width:30,height:30,borderRadius:99,display:'grid',placeItems:'center',background:'white',fontWeight:800}}>{stageMark[stage.status]||index+1}</div>
          <div><strong>{stage.label}</strong><div style={{fontSize:12,opacity:.65}}>{stage.status}</div></div>
          <div style={{fontSize:13}}>{stage.detail}</div>
        </div>)}</div>
        <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid #edf0f5'}}>{nextActionControl()}</div>
        <div style={{marginTop:10,fontSize:13}}>Source links: {pipeline.counts.verified_source_links} verified / {pipeline.counts.candidate_source_links} candidates · Skills: {pipeline.counts.linked_skills}</div>
      </section>}

      <section style={{marginTop:18,background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:18}}><h2 style={{marginTop:0}}>الوحدات والدروس الحالية</h2><div style={{display:'grid',gap:12}}>{data.units.map(unit=><div key={unit.id} style={{border:'1px solid #edf0f5',borderRadius:12,padding:14}}><strong>الوحدة {unit.unit_number}: {unit.title}</strong><div style={{marginTop:8,display:'grid',gap:6}}>{unit.lessons.map(lesson=><div key={lesson.id} style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><span>{lesson.lesson_number}. {lesson.title}</span><code>{lesson.lesson_code}</code></div>)}</div></div>)}</div></section>

      {firstLesson&&<section style={{marginTop:18,background:'#fffdf5',border:'1px solid #eadca8',borderRadius:14,padding:18}}><h2 style={{marginTop:0}}>أول درس إنتاجي: {firstLesson.title}</h2><p>التحكم الأساسي أصبح من زر «الخطوة التالية» في الـPipeline. الروابط التالية مخصصة للفحص المتقدم فقط.</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><a href="/admin/source-link-review">Source Review</a><a href="/admin/skill-mapping">Skill Mapping</a><a href="/admin/lesson-generation">Lesson Generation</a><button disabled={busy===firstLesson.id} onClick={checkReadiness} style={{padding:'7px 10px'}}>إعادة فحص Readiness</button></div>{readiness&&!!readiness.blockers?.length&&<div style={{marginTop:10,padding:10,borderRadius:9,background:'#fff0f0'}}>Blockers: {readiness.blockers.join(' · ')}</div>}</section>}

      <section style={{marginTop:18,background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:18}}><h2 style={{marginTop:0}}>المصادر المسجلة</h2>{data.sources.length===0?<p>لا توجد مصادر بعد.</p>:<div style={{display:'grid',gap:8}}>{data.sources.map(source=><div key={source.id} style={{padding:12,borderRadius:10,background:'#f8fafc'}}><strong>#{source.id} · {source.source_type}</strong> · {source.status}<br/><small>Reliability {source.reliability_score}% · Edition Match {source.edition_match_score}%</small>{source.source_url&&<div style={{fontSize:12,wordBreak:'break-all',marginTop:4}}>{source.source_url}</div>}</div>)}</div>}</section>
      <section style={{marginTop:18,padding:14,borderRadius:12,background:'#f7f8fa'}}><strong>Backlog:</strong> {data.backlog.semester_2_book_code} — {data.backlog.note}</section>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:18}}><a href="/admin/importer" style={{padding:'10px 14px',borderRadius:10,background:'#1f6feb',color:'white',textDecoration:'none'}}>مستورد المصادر المتقدم</a><a href="/admin/curriculum" style={{padding:'10px 14px',borderRadius:10,background:'#eef4ff',color:'#124b9b',textDecoration:'none'}}>فتح مصنع المنهاج</a><a href="/admin" style={{padding:'10px 14px',borderRadius:10,background:'white',border:'1px solid #ccd5e3',textDecoration:'none'}}>العودة للوحة الإدارة</a></div>
    </>}
  </main>;
}
