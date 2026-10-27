'use client';

import {useEffect,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Candidate={
 id:number;version_label:string;status:string;schema_valid:boolean;provenance_score:number;
 validation?:{candidate_qa?:any;staging_approval?:any};created_at?:string;
};
type Staged={id:number;lesson_id:number;candidate_id:number;version_label:string;status:string;release_readiness:string;approved_by_user_id:number;created_at?:string};
type CurrentSemester={units:Array<{lessons:Array<{id:number;lesson_code:string;title:string}>}>};

async function api(path:string,init:RequestInit={}){
 const headers=new Headers(init.headers);
 const token=typeof window!=='undefined'?localStorage.getItem('pal_admin_token')||'':'';
 headers.set('Authorization',`Bearer ${token}`);
 const res=await fetch(`${API}${path}`,{...init,headers});
 let body:any=null;try{body=await res.json();}catch{body=null;}
 if(!res.ok){const detail=body?.detail;throw new Error(typeof detail==='string'?detail:detail?.message||`HTTP ${res.status}`);}
 return body;
}

export default function StagingConsole(){
 const [lessonId,setLessonId]=useState(0);
 const [currentLessonLabel,setCurrentLessonLabel]=useState('');
 const [rows,setRows]=useState<Candidate[]>([]);
 const [staged,setStaged]=useState<Staged[]>([]);
 const [preview,setPreview]=useState<any>(null);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState('');

 async function load(targetLessonId?:number){
  const id=targetLessonId||lessonId;
  if(!id) return;
  setBusy('load');setMessage('');
  try{
   const [candidates,versions]=await Promise.all([
    api(`/factory/lessons/${id}/candidates`),
    api(`/factory/lessons/${id}/staged-versions`),
   ]);
   setRows(candidates);setStaged(versions);
  }
  catch(e){setMessage(e instanceof Error?e.message:'تعذر تحميل المرشحين');}
  finally{setBusy('');}
 }

 useEffect(()=>{
  let cancelled=false;
  async function init(){
   try{
    const current:CurrentSemester=await api('/admin/current-semester');
    const lessons=current.units.flatMap(unit=>unit.lessons||[]);
    const requested=Number(new URLSearchParams(window.location.search).get('lesson_id')||0);
    const selected=lessons.find(item=>item.id===requested)||lessons[0];
    if(!selected) throw new Error('لا توجد دروس في الفصل الحالي.');
    if(cancelled) return;
    setLessonId(selected.id);
    setCurrentLessonLabel(`${selected.lesson_code} · ${selected.title}`);
    await load(selected.id);
   }catch(e){if(!cancelled)setMessage(e instanceof Error?e.message:'تعذر تحديد درس الفصل الحالي');}
  }
  void init();
  return()=>{cancelled=true;};
 },[]);

 async function act(label:string,fn:()=>Promise<any>){
  setBusy(label);setMessage('');
  try{const result=await fn();setMessage(`${label} ✓`);await load();return result;}
  catch(e){setMessage(e instanceof Error?e.message:`فشل ${label}`);}
  finally{setBusy('');}
 }
 async function runAcademicQa(stage:Staged){
  setBusy(`academic-${stage.id}`);setMessage('');
  try{
   const queued=await api(`/factory/staged-versions/${stage.id}/academic-qa/queue`,{method:'POST'});
   const executed=await api(`/factory/jobs/${queued.job_id}/execute`,{method:'POST'});
   if(executed.status==='COMPLETED'){
    const validated=await api(`/factory/academic-qa/jobs/${queued.job_id}/ingest-provider-output`,{method:'POST'});
    setMessage(`Academic QA ✓ · ${validated.status} · ${validated.effective_recommendation}`);
   }else if(executed.status==='WAITING_PROVIDER'){
    setMessage(`Academic QA Job #${queued.job_id} جاهز لكنه ينتظر مزود AI حقيقي. AI_PROVIDER الحالي ما زال LOCAL_MOCK أو غير مكتمل.`);
   }else{
    setMessage(`Academic QA Job #${queued.job_id} · ${executed.status}${executed.error?` · ${executed.error}`:''}`);
   }
   await load();
  }catch(e){setMessage(e instanceof Error?e.message:'فشل Academic QA');}
  finally{setBusy('');}
 }
 async function openMobilePreview(stage:Staged){
  setBusy(`mobile-preview-${stage.id}`);setMessage('');
  try{
   const issued=await api(`/factory/staged-versions/${stage.id}/preview-token`,{method:'POST'});
   const url=`${window.location.origin}${issued.web_preview_fragment}`;
   const opened=window.open(url,'_blank','noopener,noreferrer');
   if(!opened){
    await navigator.clipboard?.writeText(url);
    setMessage(`تعذر فتح تبويب جديد؛ تم نسخ رابط المعاينة إن سمح المتصفح. الصلاحية ${issued.expires_in_seconds} ثانية.`);
   }else{
    setMessage(`تم فتح معاينة الهاتف لـ Snapshot #${stage.id}. الرابط قصير العمر (${issued.expires_in_seconds} ثانية) ولا ينشر المحتوى.`);
   }
  }catch(e){setMessage(e instanceof Error?e.message:'فشل إنشاء رابط المعاينة');}
  finally{setBusy('');}
 }

 return <main style={{maxWidth:1000,margin:'28px auto',padding:18}}>
  <div style={{fontSize:13,opacity:.55}}>الإدارة ← Staging</div>
  <h1>Candidate QA & Staging</h1>
  <p>هذه الشاشة لا تنشر أي محتوى. تفصل التحقق البنيوي والمصدر، snapshot الـstaging، ثم Academic AI QA المستقل.</p>
  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',background:'white',padding:14,borderRadius:14,border:'1px solid #e8edf5'}}>
   <label>Lesson ID <input type="number" min="1" value={lessonId||''} onChange={e=>setLessonId(Number(e.target.value)||0)} style={{width:80,padding:8,marginInlineStart:6}}/></label>
   <button onClick={()=>load()} disabled={!!busy||!lessonId}>تحميل المرشحين وStaging</button>
   <a href="/admin/current-semester/matrix">مصفوفة الفصل</a>
   <a href="/admin/current-semester">الفصل الحالي</a>
   <a href="/admin/curriculum">مصنع المنهاج</a>
  </div>
  {currentLessonLabel&&<div style={{marginTop:8,fontSize:13,opacity:.65}}>الدرس المحدد: {currentLessonLabel}</div>}
  {message&&<div style={{marginTop:12,padding:12,borderRadius:10,background:message.includes('✓')||message.includes('تم فتح')?'#ecfdf3':'#fff4e5'}}>{message}</div>}

  <section style={{marginTop:16,display:'grid',gap:12}}>
   {!rows.length&&<div style={panel}>لا توجد Candidates محملة لهذا الدرس.</div>}
   {rows.map(c=>{
    const qa=(c.validation as any)?.candidate_qa;
    const approval=(c.validation as any)?.staging_approval;
    return <article key={c.id} style={panel}>
     <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div><strong>{c.version_label}</strong> · Candidate #{c.id}</div><b>{c.status}</b>
     </div>
     <div style={{marginTop:8}}>Schema: {c.schema_valid?'✓':'✗'} · Provenance: {c.provenance_score}%</div>
     {qa?<div style={{marginTop:10,padding:12,borderRadius:10,background:'#f7f9fc'}}>
      <div>Preflight: <strong>{qa.preflight_status}</strong> · Release: <strong>{qa.release_readiness}</strong></div>
      <div style={{fontSize:13,marginTop:5}}>Structure {qa.structure?.score??0}% · Source Evidence {qa.source_evidence?.score??0}%</div>
      {qa.blocking_reasons?.length>0&&<div style={{fontSize:12,color:'#8a4b00',marginTop:5}}>Blocking: {qa.blocking_reasons.join(', ')}</div>}
     </div>:<div style={{marginTop:8,opacity:.6}}>لم يُشغّل Candidate QA بعد.</div>}
     {approval&&<div style={{marginTop:8,fontSize:13}}>Staging approved · Snapshot #{approval.staged_version_id||'—'} · Release at approval: {approval.release_readiness}</div>}
     <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
      <button disabled={!!busy} onClick={()=>act(`QA Candidate #${c.id}`,()=>api(`/factory/candidates/${c.id}/qa`,{method:'POST'}))}>Run Preflight QA</button>
      <button disabled={!!busy||c.status==='REJECTED'} onClick={()=>act(`Staging Candidate #${c.id}`,()=>api(`/factory/candidates/${c.id}/approve-staging`,{method:'POST'}))}>Approve for Staging</button>
      <button disabled={!!busy} onClick={async()=>{setBusy('preview');try{setPreview(await api(`/factory/candidates/${c.id}`));}catch(e){setMessage(e instanceof Error?e.message:'فشل المعاينة');}finally{setBusy('');}}}>Preview Candidate</button>
     </div>
    </article>
   })}
  </section>

  <section style={{...panel,marginTop:16}}>
   <h2>Immutable Staged Versions</h2>
   {!staged.length&&<p style={{opacity:.6}}>لا توجد نسخة staging محفوظة لهذا الدرس.</p>}
   {staged.map(s=><div key={s.id} style={{borderTop:'1px solid #edf0f5',padding:'12px 0'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
     <div><strong>Snapshot #{s.id}</strong> · {s.version_label} · <b>{s.status}</b> · Release <strong>{s.release_readiness}</strong></div>
     <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      <button disabled={!!busy} onClick={async()=>{setBusy('preview-stage');try{setPreview(await api(`/factory/staged-versions/${s.id}`));}catch(e){setMessage(e instanceof Error?e.message:'فشل معاينة staging');}finally{setBusy('');}}}>Preview Snapshot JSON</button>
      <button disabled={!!busy} onClick={()=>openMobilePreview(s)}>فتح معاينة الهاتف</button>
      <button disabled={!!busy||s.release_readiness!=='READY'} onClick={()=>runAcademicQa(s)}>Run Academic AI QA</button>
      <a href={`/admin/release?lesson_id=${lessonId}`} style={{padding:'6px 9px'}}>Final Release Gate</a>
     </div>
    </div>
    {s.release_readiness!=='READY'&&<div style={{fontSize:12,color:'#8a4b00',marginTop:6}}>Academic QA محظورة حتى تصبح Source Evidence عند عتبة الإصدار.</div>}
   </div>)}
  </section>

  {preview&&<section style={{...panel,marginTop:16}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>{preview.version_label||`Snapshot #${preview.id}`} · {preview.status}</strong><button onClick={()=>setPreview(null)}>إغلاق</button></div>
   {preview.output&&<div style={{marginTop:8}}>الأهداف {preview.output?.learning_objectives?.length||0} · الأقسام {preview.output?.sections?.length||0} · الأسئلة {preview.output?.questions?.length||0}</div>}
   {preview.snapshot&&<div style={{marginTop:8}}>Snapshot: الأقسام {preview.snapshot?.sections?.length||0} · الأسئلة {preview.snapshot?.questions?.length||0}</div>}
   <details style={{marginTop:10}} open={Boolean(preview.qa_snapshot?.academic_qa)}><summary>QA / Validation</summary><pre style={pre}>{JSON.stringify(preview.validation||preview.qa_snapshot,null,2)}</pre></details>
   <details><summary>Content</summary><pre style={pre}>{JSON.stringify(preview.output||preview.snapshot,null,2)}</pre></details>
  </section>}

  <section style={{...panel,marginTop:16,background:'#fffaf0'}}>
   <strong>مهم:</strong> STAGING ولا Academic QA يعنيان PUBLISHED. حتى نتيجة Academic QA = PASS لا تجعل النسخة مرئية للطالب؛ النشر يتم فقط عبر Audited Release Transaction بعد نجاح Final Release Gate، وهي fail-closed على SQLite.
  </section>
 </main>
}

const panel:React.CSSProperties={background:'white',padding:16,borderRadius:14,border:'1px solid #e8edf5'};
const pre:React.CSSProperties={whiteSpace:'pre-wrap',direction:'ltr',textAlign:'left',overflow:'auto',fontSize:11,background:'#f6f8fa',padding:10,borderRadius:8};
