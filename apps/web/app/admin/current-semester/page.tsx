'use client';

import {useEffect,useMemo,useState} from 'react';
import {ActionButton,ActionLink,AdminShell,ButtonRow,Card,MetricCard,Notice,SectionHeader,StatusPill,StepRow} from '../_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_number:number;lesson_code:string;title:string;status:string};
type Unit={id:number;unit_number:number;title:string;lessons:Lesson[]};
type Source={id:number;source_type:string;source_url?:string;status:string;reliability_score:number;edition_match_score:number};
type Readiness={queue_ready:boolean;execution_ready:boolean;blockers:string[];next_actions:string[];skills_count:number;authorized_factual_source_chunks:number;scope_evidence_count:number;provider:{provider:string;execution_ready:boolean}};
type Payload={semester:number;book:{id:number;book_code:string;title:string;status:string;edition?:string};package:{id:number;package_code:string;status:string;source_count:number};units:Unit[];sources:Source[];backlog:{semester_2_book_code:string;note:string}};
type PipelineStage={key:string;label:string;status:'DONE'|'READY'|'BLOCKED';detail:string;action?:string|null};
type Pipeline={package_id:number;package_code:string;lesson?:{id:number;lesson_code:string;title:string}|null;source?:{id:number;source_type:string;status:string;page_count?:number;edition_match_score:number}|null;stages:PipelineStage[];next_stage?:PipelineStage|null;counts:{candidate_source_links:number;verified_source_links:number;linked_skills:number};generation_readiness?:Readiness|null;latest_skill_mapping_job?:{id:number;status:string}|null;latest_generation_job?:{id:number;status:string}|null};

function sourceTone(status:string):'good'|'warn'|'bad'|'neutral'{
  if(['EXTRACTED','ANALYZED'].includes(status)) return 'good';
  if(status==='REJECTED'||status==='SCOPE_REJECTED') return 'bad';
  if(status.includes('CANDIDATE')||status==='REGISTERED'||status==='SCOPE_UNVERIFIED') return 'warn';
  return 'neutral';
}

export default function CurrentSemesterPage(){
  const [data,setData]=useState<Payload|null>(null);
  const [pipeline,setPipeline]=useState<Pipeline|null>(null);
  const [selectedLessonId,setSelectedLessonId]=useState<number|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState<number|null>(null);
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const allLessons=useMemo(()=>data?.units.flatMap(u=>u.lessons)||[],[data]);
  const selectedLesson=useMemo(()=>allLessons.find(x=>x.id===selectedLessonId)||null,[allLessons,selectedLessonId]);
  const doneStages=pipeline?.stages.filter(s=>s.status==='DONE').length||0;
  const progress=pipeline?.stages.length?Math.round((doneStages/pipeline.stages.length)*100):0;
  function authHeaders(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`};}

  async function load(preferredLessonId?:number|null){
    setError('');
    try{
      const currentResponse=await fetch(`${API}/admin/current-semester`,{headers:authHeaders()});
      const current=await currentResponse.json();
      if(!currentResponse.ok) throw new Error(typeof current.detail==='string'?current.detail:current.detail?.message||'تعذر تحميل الفصل الحالي');
      const lessons:Lesson[]=current.units.flatMap((u:Unit)=>u.lessons);
      const fallback=lessons[0]?.id??null;
      const requested=preferredLessonId??selectedLessonId;
      const target=requested&&lessons.some(x=>x.id===requested)?requested:fallback;
      setData(current);setSelectedLessonId(target);
      if(!target){setPipeline(null);setReadiness(null);return;}
      const pipelineResponse=await fetch(`${API}/admin/current-semester/pipeline?lesson_id=${target}`,{headers:authHeaders()});
      const flow=await pipelineResponse.json();
      if(!pipelineResponse.ok) throw new Error(typeof flow.detail==='string'?flow.detail:flow.detail?.message||'تعذر تحميل مسار الإنتاج');
      setPipeline(flow);setReadiness(flow.generation_readiness||null);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل الفصل الحالي');}
  }
  useEffect(()=>{void load(null);},[]);

  async function chooseLesson(id:number){
    setSelectedLessonId(id);setPipeline(null);setReadiness(null);setMessage('');
    await load(id);
  }

  async function syncOfficial(){
    if(!data) return;setBusy(-20);setMessage('');setError('');
    try{const r=await fetch(`${API}/importer/catalog/source-packages/${data.package.id}/sync`,{method:'POST',headers:authHeaders()});const b=await r.json();if(!r.ok)throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تسجيل المصدر الرسمي');setMessage(`تمت مزامنة كتالوج الوزارة. أُنشئ ${b.created||0} مصدر جديد.`);await load(selectedLessonId);}
    catch(e){setError(e instanceof Error?e.message:'فشل تسجيل المصدر الرسمي');}finally{setBusy(null);}
  }

  async function fetchOfficial(sourceId:number){
    setBusy(sourceId);setMessage('');setError('');
    try{const r=await fetch(`${API}/importer/source-files/${sourceId}/fetch-registered`,{method:'POST',headers:authHeaders()});const b=await r.json();if(!r.ok)throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل جلب المصدر الرسمي');setMessage(`تم جلب المصدر #${sourceId} واستخراج ${b.page_count||0} صفحة. Edition Match ${b.edition_match_score||0}%.`);await load(selectedLessonId);}
    catch(e){setError(e instanceof Error?e.message:'فشل جلب المصدر الرسمي');}finally{setBusy(null);}
  }

  async function verifyScope(sourceId:number){
    setBusy(sourceId);setMessage('');setError('');
    try{const r=await fetch(`${API}/importer/catalog/source-files/${sourceId}/verify-scope`,{method:'POST',headers:authHeaders()});const b=await r.json();if(!r.ok)throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تحقق النطاق');setMessage(b.scope_verified?'Scope PASS ✓ · المصدر يغطي الخلية + خصائص المادة + الطاقة في حياتنا.':`Scope BLOCKED · المفقود: ${(b.missing_terms||[]).join('، ')||'—'}.`);await load(selectedLessonId);}
    catch(e){setError(e instanceof Error?e.message:'فشل تحقق النطاق');}finally{setBusy(null);}
  }

  async function linkLessons(){
    if(!data||!selectedLesson)return;setBusy(-10);setMessage('');setError('');
    try{const r=await fetch(`${API}/importer/source-packages/${data.package.id}/link-lessons`,{method:'POST',headers:authHeaders()});const b=await r.json();if(!r.ok)throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل اقتراح روابط الدروس');const matches=(b.candidates||[]).filter((x:{lesson_id:number;linked:boolean})=>x.lesson_id===selectedLesson.id&&x.linked).length;setMessage(`تم إنشاء ${b.created_links||0} رابط مرشح في الحزمة. للدرس «${selectedLesson.title}»: ${matches} مرشح يحتاج Admin Verify.`);await load(selectedLesson.id);}
    catch(e){setError(e instanceof Error?e.message:'فشل اقتراح روابط الدروس');}finally{setBusy(null);}
  }

  async function checkReadiness(){
    if(!selectedLesson)return;setBusy(selectedLesson.id);setError('');setMessage('');
    try{const r=await fetch(`${API}/factory/lessons/${selectedLesson.id}/generation-readiness`,{headers:authHeaders()});const b=await r.json();if(!r.ok)throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر فحص جاهزية التوليد');setReadiness(b);setMessage(b.queue_ready?'Generation Readiness PASS ✓':'Generation Readiness BLOCKED · اتبع المرحلة التالية في الـPipeline.');await load(selectedLesson.id);}
    catch(e){setError(e instanceof Error?e.message:'تعذر فحص جاهزية التوليد');}finally{setBusy(null);}
  }

  async function queueGeneration(){
    if(!selectedLesson)return;setBusy(selectedLesson.id);setError('');setMessage('');
    try{const r=await fetch(`${API}/factory/lessons/${selectedLesson.id}/generate`,{method:'POST',headers:authHeaders()});const b=await r.json();if(!r.ok){const detail=b.detail||{};setReadiness(detail.generation_readiness||null);throw new Error(detail.message||'الدرس غير جاهز للتوليد');}setMessage(`تم إنشاء Generation Job #${b.job_id} بحالة ${b.status}.`);await load(selectedLesson.id);}
    catch(e){setError(e instanceof Error?e.message:'فشل إنشاء Generation Job');}finally{setBusy(null);}
  }

  function nextActionControl(){
    const action=pipeline?.next_stage?.action;
    if(!pipeline?.next_stage)return <Notice tone="good"><strong>اكتملت بوابات التوليد ووصل خرج الدرس المحدد إلى OUTPUT_VALIDATED ✓</strong></Notice>;
    if(!action)return <Notice tone="bad">المرحلة الحالية محجوبة. راجع التفاصيل أعلاه قبل المتابعة.</Notice>;
    if(action==='SYNC_OR_REGISTER_OFFICIAL_SOURCE')return <ActionButton disabled={busy===-20} onClick={()=>void syncOfficial()}>1 · تسجيل مصدر الوزارة</ActionButton>;
    if(action==='FETCH_OFFICIAL_SOURCE')return pipeline.source?.id?<ActionButton disabled={busy===pipeline.source.id} onClick={()=>void fetchOfficial(pipeline.source!.id)}>2 · جلب واستخراج المصدر</ActionButton>:null;
    if(action==='VERIFY_SEMESTER_SCOPE')return pipeline.source?.id?<ActionButton disabled={busy===pipeline.source.id} onClick={()=>void verifyScope(pipeline.source!.id)}>3 · تحقق من نطاق الفصل الأول</ActionButton>:null;
    if(action==='AUTO_LINK_LESSONS')return <ActionButton disabled={busy===-10} onClick={()=>void linkLessons()}>4 · اقتراح ربط الدروس بالمصدر</ActionButton>;
    if(action==='REVIEW_SOURCE_LINKS')return <ActionLink href={selectedLesson?`/admin/source-link-review?lesson_id=${selectedLesson.id}`:'/admin/source-link-review'}>5 · راجع Source Chunks واعتمد الصحيح</ActionLink>;
    if(action==='OPEN_SKILL_MAPPING')return <ActionLink href={selectedLesson?`/admin/skill-mapping?lesson_id=${selectedLesson.id}`:'/admin/skill-mapping'}>6 · افتح Skill Mapping</ActionLink>;
    if(action==='QUEUE_GENERATION')return <ActionButton disabled={busy===selectedLesson?.id} onClick={()=>void queueGeneration()}>7 · إنشاء Generation Job</ActionButton>;
    if(action==='OPEN_LESSON_GENERATION')return <ActionLink href={selectedLesson?`/admin/lesson-generation?lesson_id=${selectedLesson.id}`:'/admin/lesson-generation'}>8 · افتح Lesson Generation</ActionLink>;
    return <Notice tone="warn">الإجراء التالي: {action}</Notice>;
  }

  return <AdminShell eyebrow="الإدارة ← المسار الإنتاجي الحالي" title="علوم خامس — الفصل الأول" description="اختر أي درس من الفصل الأول ثم تابع بوابات المصدر والمهارات والتوليد الخاصة به؛ الفصل الثاني يبقى Prototype/Backlog.">
    {message&&<div style={{marginBottom:12}}><Notice tone="good">{message}</Notice></div>}
    {error&&<div style={{marginBottom:12}}><Notice tone="bad">{error}</Notice></div>}
    {!data&&!error&&<Notice>جارٍ تحميل سجل الفصل ومسار الإنتاج…</Notice>}

    {data&&<>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10,marginBottom:14}}>
        <MetricCard label="Book" value={data.book.book_code} detail={`${data.book.status} · ${data.book.edition||'الطبعة قيد التحقق'}`}/>
        <MetricCard label="Current Package" value={`#${data.package.id}`} detail={`${data.package.package_code} · ${data.package.source_count} مصدر`}/>
        <MetricCard label="الدروس" value={allLessons.length} detail={`${data.units.length} وحدات في الفصل الأول`}/>
        <MetricCard label="Pipeline" value={`${progress}%`} tone={progress===100?'good':progress>0?'warn':'neutral'} detail={`${doneStages}/${pipeline?.stages.length||0} مراحل مكتملة`}/>
      </div>

      <Card style={{marginBottom:14,background:'linear-gradient(135deg,#f5fbf7,#f5f8ff)',borderColor:'#cddfed'}}>
        <SectionHeader title="الدرس الإنتاجي المحدد" description="كل الأرقام والإجراءات أدناه ستتغير حسب هذا الاختيار." aside={selectedLesson?<StatusPill tone={selectedLesson.status==='PUBLISHED'?'good':'warn'}>{selectedLesson.status}</StatusPill>:null}/>
        <select value={selectedLessonId??''} onChange={e=>void chooseLesson(Number(e.target.value))} style={{width:'100%',padding:'12px 13px',borderRadius:12,border:'1px solid #ccd5df',background:'#fff',fontSize:15,fontWeight:800}}>
          {data.units.map(unit=><optgroup key={unit.id} label={`الوحدة ${unit.unit_number}: ${unit.title}`}>{unit.lessons.map(lesson=><option key={lesson.id} value={lesson.id}>{lesson.lesson_number}. {lesson.title} — {lesson.status}</option>)}</optgroup>)}
        </select>
        {selectedLesson&&<div style={{marginTop:9,fontSize:12,color:'#667085'}}>{selectedLesson.lesson_code}</div>}
      </Card>

      {pipeline&&<Card style={{marginBottom:14}}>
        <SectionHeader title={`Production Pipeline — ${pipeline.lesson?.title||'الدرس'}`} description="Source Review وSkill Approval بوابتان إلزاميتان. لا يمكن للتوليد تجاوزهما." aside={pipeline.next_stage?<StatusPill tone={pipeline.next_stage.status==='READY'?'info':'bad'}>التالي: {pipeline.next_stage.label}</StatusPill>:<StatusPill tone="good">OUTPUT VALIDATED</StatusPill>}/>
        <div style={{height:9,background:'#edf0f4',borderRadius:99,overflow:'hidden',marginBottom:12}}><div style={{height:'100%',width:`${progress}%`,background:'#176b3a',transition:'width .2s'}}/></div>
        <div>{pipeline.stages.map((stage,index)=><StepRow key={stage.key} index={index+1} title={stage.label} status={stage.status} detail={stage.detail}/>)}</div>
        <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid #edf0f5'}}><div style={{fontSize:12,color:'#667085',fontWeight:800,marginBottom:8}}>الإجراء المقترح الآن</div>{nextActionControl()}</div>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:12}}><StatusPill tone={pipeline.counts.verified_source_links?'good':'warn'}>{pipeline.counts.verified_source_links} Verified sources</StatusPill><StatusPill tone={pipeline.counts.candidate_source_links?'warn':'neutral'}>{pipeline.counts.candidate_source_links} Candidates</StatusPill><StatusPill tone={pipeline.counts.linked_skills?'good':'warn'}>{pipeline.counts.linked_skills} Skills</StatusPill></div>
      </Card>}

      {selectedLesson&&<Card style={{marginBottom:14,background:'#fffdf7',borderColor:'#eadca8'}}>
        <SectionHeader title={`الدرس: ${selectedLesson.title}`} description={`${selectedLesson.lesson_code} · يبقى DRAFT حتى يمر بجميع بوابات QA والإصدار.`} aside={<StatusPill tone={selectedLesson.status==='PUBLISHED'?'good':'warn'}>{selectedLesson.status}</StatusPill>}/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:9,marginBottom:12}}><MetricCard label="Verified Source Links" value={pipeline?.counts.verified_source_links||0} tone={pipeline?.counts.verified_source_links?'good':'warn'}/><MetricCard label="Approved Skills" value={pipeline?.counts.linked_skills||0} tone={pipeline?.counts.linked_skills?'good':'warn'}/><MetricCard label="Factual Chunks" value={readiness?.authorized_factual_source_chunks??0} tone={readiness?.authorized_factual_source_chunks?'good':'warn'}/><MetricCard label="Queue Ready" value={readiness?.queue_ready?'YES':'NO'} tone={readiness?.queue_ready?'good':'bad'}/></div>
        {!!readiness?.blockers?.length&&<Notice tone="bad"><strong>Blockers:</strong> {readiness.blockers.join(' · ')}</Notice>}
        <div style={{marginTop:12}}><ButtonRow><ActionLink href={`/admin/source-link-review?lesson_id=${selectedLesson.id}`}>Source Review</ActionLink><ActionLink href={`/admin/skill-mapping?lesson_id=${selectedLesson.id}`} tone="secondary">Skill Mapping</ActionLink><ActionLink href={`/admin/generation-readiness?lesson_id=${selectedLesson.id}`} tone="secondary">Generation Readiness</ActionLink><ActionLink href={`/admin/lesson-generation?lesson_id=${selectedLesson.id}`} tone="secondary">Lesson Generation</ActionLink><ActionButton tone="secondary" disabled={busy===selectedLesson.id} onClick={()=>void checkReadiness()}>تحديث Readiness</ActionButton></ButtonRow></div>
      </Card>}

      <Card style={{marginBottom:14}}>
        <SectionHeader title="الوحدات والدروس" description="اضغط «حدد للإنتاج» للانتقال فورًا إلى Pipeline أي درس." aside={<ActionLink href="/admin/current-semester/matrix" tone="secondary">فتح المصفوفة</ActionLink>}/>
        <div style={{display:'grid',gap:11}}>{data.units.map(unit=><div key={unit.id} style={{border:'1px solid #edf0f5',borderRadius:13,padding:13}}><div style={{fontWeight:900}}>الوحدة {unit.unit_number}: {unit.title}</div><div style={{display:'grid',gap:7,marginTop:9}}>{unit.lessons.map(lesson=><div key={lesson.id} style={{display:'flex',justifyContent:'space-between',gap:9,alignItems:'center',flexWrap:'wrap',padding:'8px 0',borderTop:'1px solid #f1f3f6',background:lesson.id===selectedLessonId?'#f6fbf7':'transparent'}}><div><strong>{lesson.lesson_number}. {lesson.title}</strong><code style={{display:'block',fontSize:11,color:'#667085',marginTop:3}}>{lesson.lesson_code}</code></div><div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}><StatusPill tone={lesson.status==='PUBLISHED'?'good':'warn'}>{lesson.status}</StatusPill><button onClick={()=>void chooseLesson(lesson.id)} style={{border:'1px solid #ccd5df',background:'#fff',borderRadius:8,padding:'6px 9px',fontWeight:800,cursor:'pointer'}}>حدد للإنتاج</button><a href={`/admin/source-link-review?lesson_id=${lesson.id}`} style={{fontSize:13}}>Source</a></div></div>)}</div></div>)}</div>
      </Card>

      <Card style={{marginBottom:14}}>
        <SectionHeader title="المصادر المسجلة" description="وجود المصدر لا يعني أنه مخوّل للحقائق؛ Source Authority وScope/Edition gates تبقى مستقلة." aside={<ActionLink href="/admin/importer" tone="secondary">المستورد المتقدم</ActionLink>}/>
        {!data.sources.length?<Notice tone="warn">لا توجد مصادر بعد.</Notice>:<div style={{display:'grid',gap:9}}>{data.sources.map(source=><div key={source.id} style={{padding:12,border:'1px solid #e7ebf1',borderRadius:12}}><div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong>#{source.id} · {source.source_type}</strong><StatusPill tone={sourceTone(source.status)}>{source.status}</StatusPill></div><div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:7}}><StatusPill tone={source.reliability_score>=90?'good':'warn'}>Reliability {source.reliability_score}%</StatusPill><StatusPill tone={source.edition_match_score>=90?'good':source.edition_match_score>0?'warn':'neutral'}>Edition Match {source.edition_match_score}%</StatusPill></div>{source.source_url&&<div style={{fontSize:11,color:'#667085',overflowWrap:'anywhere',marginTop:7}}>{source.source_url}</div>}</div>)}</div>}
      </Card>

      <Notice tone="info"><strong>Backlog:</strong> {data.backlog.semester_2_book_code} — {data.backlog.note}</Notice>
      <Card style={{marginTop:14,position:'sticky',bottom:10,zIndex:2}}><SectionHeader title="أدوات الإدارة" description="العمليات المتقدمة موجودة هنا، لكن المسار أعلاه يبقى المرجع الأساسي."/><ButtonRow><ActionLink href="/admin/current-semester/matrix">مصفوفة الفصل</ActionLink><ActionLink href="/admin/source-discovery" tone="secondary">اكتشاف المصادر</ActionLink><ActionLink href="/admin/source-policy" tone="secondary">صلاحيات المصادر</ActionLink><ActionLink href="/admin/curriculum" tone="secondary">مصنع المنهاج</ActionLink><ActionLink href="/admin" tone="secondary">لوحة الإدارة</ActionLink></ButtonRow></Card>
    </>}
  </AdminShell>;
}
