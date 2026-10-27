'use client';

import {useEffect,useMemo,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const sourceLabels:Record<string,string>={
 OFFICIAL_PACKAGE:'الرزمة الرسمية الحالية', STUDENT_BOOK:'كتاب الطالب', SOLUTIONS:'الحلول',
 TEACHER_GUIDE:'دليل المعلم', WORKSHEET:'أوراق/مراجعات', EXAM:'اختبارات', REMEDIAL:'مواد علاجية',
 INTERACTIVE:'تفاعلي', VIDEO_REFERENCE:'فيديو'
};

type PackageFile={id:number;source_type:string;original_filename?:string;source_url?:string;reliability_score:number;edition_match_score:number;status:string;page_count?:number;chunk_count:number};
type PackageData={id:number;book_id:number;package_code:string;status:string;completeness_score:number;quality_score:number;files:PackageFile[]};
type Lesson={id:number;lesson_code:string;title:string;status:string};
type Job={id:number;job_type:string;status:string;progress:number;provider?:string;error?:string};
type Candidate={id:number;version_label:string;status:string;schema_valid:boolean;provenance_score:number;validation?:Record<string,unknown>};

async function api(path:string,init:RequestInit={}){
 const headers=new Headers(init.headers);
 const token=typeof window!=='undefined'?localStorage.getItem('pal_admin_token')||'':'';
 headers.set('Authorization',`Bearer ${token}`);
 const res=await fetch(`${API}${path}`,{...init,headers});
 let body:any=null; try{body=await res.json();}catch{body=null;}
 if(!res.ok){const detail=body?.detail;throw new Error(typeof detail==='string'?detail:detail?.message||`HTTP ${res.status}`);}
 return body;
}

export default function CurriculumAdmin(){
 const [packageId,setPackageId]=useState(1);
 const [pkg,setPkg]=useState<PackageData|null>(null);
 const [lessons,setLessons]=useState<Lesson[]>([]);
 const [lessonId,setLessonId]=useState<number|null>(null);
 const [jobs,setJobs]=useState<Job[]>([]);
 const [candidates,setCandidates]=useState<Candidate[]>([]);
 const [factory,setFactory]=useState<any>(null);
 const [preview,setPreview]=useState<any>(null);
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');
 const tokenPresent=typeof window!=='undefined'&&Boolean(localStorage.getItem('pal_admin_token'));

 async function refresh(){
  setMessage('');
  try{
   const p:PackageData=await api(`/curriculum/source-packages/${packageId}`); setPkg(p);
   const units:any[]=await api(`/curriculum/books/${p.book_id}/units`);
   const lessonGroups=await Promise.all(units.map(u=>api(`/curriculum/units/${u.id}/lessons`)));
   const all=lessonGroups.flat() as Lesson[]; setLessons(all);
   const selected=lessonId&&all.some(x=>x.id===lessonId)?lessonId:(all[0]?.id||null); setLessonId(selected);
   const status=await api('/factory/status'); setFactory(status);
   if(selected){
    const [j,c]=await Promise.all([api(`/factory/lessons/${selected}/jobs`),api(`/factory/lessons/${selected}/candidates`)]);
    setJobs(j);setCandidates(c);
   }else{setJobs([]);setCandidates([]);}
  }catch(e){setMessage(e instanceof Error?e.message:'تعذر تحميل مصنع المنهاج');}
 }

 useEffect(()=>{if(tokenPresent) refresh();},[packageId]);
 useEffect(()=>{if(!lessonId||!tokenPresent)return;(async()=>{try{setJobs(await api(`/factory/lessons/${lessonId}/jobs`));setCandidates(await api(`/factory/lessons/${lessonId}/candidates`));}catch(e){setMessage(e instanceof Error?e.message:'فشل تحميل الدرس');}})();},[lessonId]);

 async function action(label:string,fn:()=>Promise<any>){
  setBusy(label);setMessage('');
  try{const out=await fn();setMessage(`${label} ✓${out?.status?` · ${out.status}`:''}`);await refresh();return out;}
  catch(e){setMessage(e instanceof Error?e.message:`فشل ${label}`);}
  finally{setBusy('');}
 }

 const sourcesByType=useMemo(()=>{
  const map:Record<string,PackageFile[]>={}; for(const f of pkg?.files||[])(map[f.source_type]??=[]).push(f); return map;
 },[pkg]);

 async function fetchRegisteredSource(file:PackageFile){
  return action(`جلب ${sourceLabels[file.source_type]||file.source_type}`,()=>api(`/importer/source-files/${file.id}/fetch-registered`,{method:'POST'}));
 }

 async function preparePackage(){
  return action('تهيئة الرزمة تلقائيًا',async()=>{
   const current:PackageData=await api(`/curriculum/source-packages/${packageId}`);
   const official=current.files.find(f=>f.source_type==='OFFICIAL_PACKAGE'&&f.source_url);
   if(official&&official.chunk_count===0){
    await api(`/importer/source-files/${official.id}/fetch-registered`,{method:'POST'});
   }
   const processed=await api(`/importer/source-packages/${packageId}/process`,{method:'POST'});
   const linked=await api(`/importer/source-packages/${packageId}/link-lessons`,{method:'POST'});
   return {status:`${processed.package_status} · ${linked.created_links||0} روابط جديدة`};
  });
 }

 async function generateExecuteValidate(){
  if(!lessonId)return;
  return action('Generate → Execute → Validate',async()=>{
   const queued=await api(`/factory/lessons/${lessonId}/generate`,{method:'POST'});
   const executed=await api(`/factory/jobs/${queued.job_id}/execute`,{method:'POST'});
   if(executed.status==='WAITING_PROVIDER'){
    return {status:`WAITING_PROVIDER · Job #${queued.job_id}`};
   }
   if(executed.status==='FAILED')throw new Error(executed.error||'فشل تنفيذ AI Job');
   const candidate=await api(`/factory/jobs/${queued.job_id}/ingest-provider-output`,{method:'POST'});
   return {status:`${candidate.status} · ${candidate.version_label} · Provenance ${candidate.provenance_score}%`};
  });
 }

 if(!tokenPresent)return <main style={{maxWidth:700,margin:'60px auto',padding:20}}><h1>مصنع المنهاج</h1><p>يجب تسجيل الدخول كإدارة أولًا.</p><a href="/admin/login">الانتقال إلى تسجيل الدخول</a></main>;

 return <main style={{maxWidth:1180,margin:'24px auto',padding:16}}>
  <div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
   <div><div style={{opacity:.55,fontSize:13}}>الإدارة ← مصنع المنهاج</div><h1 style={{margin:'5px 0'}}>Curriculum Factory</h1><div style={{opacity:.7}}>{pkg?.package_code||'جارٍ التحميل…'}</div></div>
   <div style={{display:'flex',gap:8}}><input value={packageId} onChange={e=>setPackageId(Number(e.target.value)||1)} type="number" min="1" style={{width:80,padding:9}}/><button onClick={refresh}>تحديث</button></div>
  </div>

  {message&&<div style={{margin:'14px 0',padding:13,borderRadius:12,background:message.includes('✓')?'#ecfdf3':'#fff4e5'}}>{message}</div>}

  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,margin:'18px 0'}}>
   <Metric title="Coverage" value={`${pkg?.completeness_score??0}%`} sub="وجود أنواع المصادر"/>
   <Metric title="Verified Quality" value={`${pkg?.quality_score??0}%`} sub="موثوقية × تطابق الطبعة"/>
   <Metric title="Package" value={pkg?.status||'—'} sub={`${pkg?.files?.length||0} مصادر`}/>
   <Metric title="AI Provider" value={factory?.provider||'—'} sub={factory?.generation_ready?'جاهز لتوليد حقيقي':'Mock / غير مهيأ'}/>
  </div>

  <section style={panel}>
   <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><h2>المصادر</h2><button disabled={!!busy} onClick={preparePackage} style={primaryButton}>{busy==='تهيئة الرزمة تلقائيًا'?'جارٍ التهيئة…':'تهيئة الرزمة تلقائيًا'}</button></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:10}}>
    {Object.entries(sourceLabels).map(([code,label])=>{
     const files=sourcesByType[code]||[]; return <div key={code} style={{border:'1px solid #e8edf5',borderRadius:12,padding:13}}>
      <strong>{label}</strong><div style={{fontSize:11,opacity:.5}}>{code}</div>
      {files.length?files.map(f=><div key={f.id} style={{marginTop:9,fontSize:13,lineHeight:1.7}}>
       <div>{f.original_filename||`Source #${f.id}`}</div><div>Reliability {f.reliability_score}% · Edition {f.edition_match_score}%</div><div>{f.page_count||0} صفحة · {f.chunk_count} chunks · {f.status}</div>
       <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:7}}>
        {f.source_url&&f.chunk_count===0&&<button disabled={!!busy} onClick={()=>fetchRegisteredSource(f)}>جلب من الرابط</button>}
        {f.chunk_count>0&&<button disabled={!!busy} onClick={()=>action(`تحليل Source #${f.id}`,()=>api(`/importer/source-files/${f.id}/analyze`,{method:'POST'}))}>تحليل البنية</button>}
       </div>
      </div>):<div style={{marginTop:8,opacity:.5}}>غير موجود</div>}
     </div>
    })}
   </div>
   <p style={{marginBottom:0}}><a href="/admin/importer">رفع/استيراد مصدر جديد ←</a></p>
  </section>

  <section style={panel}>
   <h2>الدرس المستهدف</h2>
   <select value={lessonId||''} onChange={e=>setLessonId(Number(e.target.value))} style={{width:'100%',padding:11,borderRadius:9}}>
    {lessons.map(l=><option key={l.id} value={l.id}>{l.lesson_code} — {l.title} — {l.status}</option>)}
   </select>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>
    <Action disabled={!!busy} onClick={()=>action('معالجة الرزمة',()=>api(`/importer/source-packages/${packageId}/process`,{method:'POST'}))}>1. معالجة الرزمة</Action>
    <Action disabled={!!busy} onClick={()=>action('ربط الدروس بالمصدر',()=>api(`/importer/source-packages/${packageId}/link-lessons`,{method:'POST'}))}>2. ربط المصدر</Action>
    <Action disabled={!!busy} onClick={()=>action('مطابقة الحلول',()=>api(`/qa/source-packages/${packageId}/align-solutions`,{method:'POST'}))}>3. مطابقة الحلول</Action>
    <Action disabled={!!busy||!lessonId} onClick={()=>action('إنشاء AI Job',()=>api(`/factory/lessons/${lessonId}/generate`,{method:'POST'}))}>4. Generate Job</Action>
    <button disabled={!!busy||!lessonId} onClick={generateExecuteValidate} style={primaryButton}>تشغيل المسار AI كاملًا</button>
   </div>
   {factory&&!factory.generation_ready&&<div style={{marginTop:12,padding:11,borderRadius:10,background:'#fff7e6'}}>التوليد الحقيقي غير مفعّل بعد. جميع مراحل المصدر والربط والـQA تعمل، لكن Execute سيصل إلى WAITING_PROVIDER حتى يتم إعداد مزوّد AI في Render.</div>}
  </section>

  <section style={panel}>
   <h2>AI Jobs</h2>
   {!jobs.length&&<p style={{opacity:.55}}>لا توجد مهام لهذا الدرس بعد.</p>}
   {jobs.map(j=><div key={j.id} style={{borderTop:'1px solid #edf0f5',padding:'12px 0',display:'grid',gap:7}}>
    <div><strong>Job #{j.id}</strong> · {j.job_type} · <b>{j.status}</b> · {j.progress}% {j.provider?`· ${j.provider}`:''}</div>
    {j.error&&<div style={{color:'#a33'}}>{j.error}</div>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
     <button disabled={!!busy} onClick={()=>action(`تنفيذ Job #${j.id}`,()=>api(`/factory/jobs/${j.id}/execute`,{method:'POST'}))}>Execute</button>
     <button disabled={!!busy||['WAITING_PROVIDER','QUEUED','RUNNING','FAILED'].includes(j.status)} onClick={()=>action(`فحص خرج Job #${j.id}`,()=>api(`/factory/jobs/${j.id}/ingest-provider-output`,{method:'POST'}))}>Validate → Candidate</button>
    </div>
   </div>)}
  </section>

  <section style={panel}>
   <h2>Content Candidates</h2>
   {!candidates.length&&<p style={{opacity:.55}}>لا يوجد Candidate بعد. لا ينتقل خرج AI إلى المحتوى الحي تلقائيًا.</p>}
   {candidates.map(c=><div key={c.id} style={{borderTop:'1px solid #edf0f5',padding:'12px 0'}}>
    <div><strong>{c.version_label}</strong> · {c.status} · Provenance {c.provenance_score}%</div>
    <button style={{marginTop:8}} onClick={async()=>{setBusy('preview');try{setPreview(await api(`/factory/candidates/${c.id}`));}catch(e){setMessage(e instanceof Error?e.message:'فشل المعاينة');}finally{setBusy('');}}}>معاينة الناتج</button>
   </div>)}
   {preview&&<div style={{marginTop:16,padding:14,background:'#f7f9fc',borderRadius:12}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong>{preview.version_label} · {preview.status}</strong><button onClick={()=>setPreview(null)}>إغلاق</button></div>
    <div style={{marginTop:8}}>الأهداف: {preview.output?.learning_objectives?.length||0} · الأقسام: {preview.output?.sections?.length||0} · الأسئلة: {preview.output?.questions?.length||0}</div>
    <details style={{marginTop:10}}><summary>عرض JSON الكامل</summary><pre style={{whiteSpace:'pre-wrap',direction:'ltr',textAlign:'left',overflow:'auto',fontSize:11}}>{JSON.stringify(preview.output,null,2)}</pre></details>
   </div>}
  </section>

  <section style={{...panel,background:'#fffaf0'}}>
   <strong>قاعدة الأمان الحالية:</strong> Execute لا يعني Publish. خرج AI يجب أن يصبح Candidate صالحًا أولًا، وبعدها يمر QA قبل أي انتقال للمحتوى المنشور.
  </section>
 </main>
}

const panel:React.CSSProperties={background:'white',padding:18,borderRadius:16,border:'1px solid #e8edf5',marginTop:16};
const primaryButton:React.CSSProperties={border:0,borderRadius:10,padding:'10px 12px',background:'#14213d',color:'white',fontWeight:700};
function Metric({title,value,sub}:{title:string;value:string;sub:string}){return <div style={{background:'white',padding:16,borderRadius:14,border:'1px solid #e8edf5'}}><div style={{fontSize:12,opacity:.55}}>{title}</div><div style={{fontSize:21,fontWeight:800,margin:'5px 0'}}>{value}</div><div style={{fontSize:12,opacity:.65}}>{sub}</div></div>}
function Action({children,onClick,disabled}:{children:React.ReactNode;onClick:()=>void;disabled?:boolean}){return <button disabled={disabled} onClick={onClick} style={{border:0,borderRadius:10,padding:'10px 12px',background:'#1f6feb',color:'white',fontWeight:700,opacity:disabled?0.6:1}}>{children}</button>}
