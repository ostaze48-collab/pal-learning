'use client';

import {useEffect,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Staged={
 id:number;lesson_id:number;candidate_id:number;version_label:string;status:string;
 release_readiness:string;approved_by_user_id:number;created_at?:string;
};

type ReleaseManifest={
 manifest_version:string;
 identity:{staged_version_id?:number;lesson_id?:number;candidate_id?:number;version_label?:string};
 snapshot_sha256:string;manifest_sha256:string;snapshot_bytes:number;
};
type Gate={
 staged_version_id:number;decision:string;checks:Record<string,boolean>;blockers:string[];
 database_backend:string;release_readiness:string;academic_recommendation?:string;
 academic_confidence:number;publication_authorized:boolean;release_transaction_available:boolean;
 next_action:string;note:string;release_manifest:ReleaseManifest;
 release_policy:{direct_legacy_publish_enabled:boolean;direct_legacy_publish_disabled:boolean;audited_release_transaction_implemented:boolean;publication_authorized:boolean};
};
type ReleaseResult={release_transaction_id:number;staged_version_id:number;lesson_id:number;content_version_id:number;status:string;snapshot_sha256:string;manifest_sha256:string;released_at?:string;idempotent_replay:boolean;publication_authorized:boolean};

async function api(path:string,init:RequestInit={}){
 const headers=new Headers(init.headers);
 const token=typeof window!=='undefined'?localStorage.getItem('pal_admin_token')||'':'';
 headers.set('Authorization',`Bearer ${token}`);
 const res=await fetch(`${API}${path}`,{...init,headers});
 let body:any=null;try{body=await res.json();}catch{body=null;}
 if(!res.ok){const detail=body?.detail;throw new Error(typeof detail==='string'?detail:detail?.message||`HTTP ${res.status}`);}
 return body;
}

const labels:Record<string,string>={
 deterministic_release_ready:'المصدر والـDeterministic QA جاهزان',
 academic_qa_present:'Academic QA موجودة',
 academic_qa_passed:'Academic QA نجحت',
 academic_effective_recommendation_pass:'التوصية الأكاديمية الفعلية PASS',
 academic_confidence_at_least_85:'ثقة المراجعة الأكاديمية ≥ 85%',
 no_critical_findings:'لا توجد Critical findings',
 no_unsupported_claims:'لا توجد Unsupported claims',
 persistent_production_database:'قاعدة بيانات إنتاج دائمة (PostgreSQL)',
 immutable_staging_snapshot_present:'Staging snapshot موجودة ومستقلة',
 release_manifest_present:'Release Manifest + SHA-256 موجودة',
 legacy_direct_publish_disabled:'مسار النشر المباشر القديم معطّل',
};
const actionLabels:Record<string,string>={
 BUILD_OR_ENABLE_AUDITED_RELEASE_TRANSACTION:'معاملة الإصدار المدققة مطبقة؛ راجع سبب عدم توفرها في هذه البيئة.',
 RUN_AUDITED_RELEASE_TRANSACTION:'المحتوى جاهز لتنفيذ معاملة الإصدار الذرّية المدققة.',
 RESOLVE_RELEASE_GATE_BLOCKERS:'يجب معالجة Release Gate blockers قبل أي معاملة إصدار.',
};

export default function ReleaseConsole(){
 const [lessonId,setLessonId]=useState(1);
 const [rows,setRows]=useState<Staged[]>([]);
 const [gates,setGates]=useState<Record<number,Gate>>({});
 const [releaseResults,setReleaseResults]=useState<Record<number,ReleaseResult>>({});
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');

 async function load(targetLessonId?:number){
  const id=targetLessonId||lessonId;
  setBusy('load');setMessage('');
  try{setRows(await api(`/factory/lessons/${id}/staged-versions`));}
  catch(e){setMessage(e instanceof Error?e.message:'تعذر تحميل نسخ staging');}
  finally{setBusy('');}
 }
 useEffect(()=>{
  const requested=Number(new URLSearchParams(window.location.search).get('lesson_id')||0);
  if(requested>0){setLessonId(requested);void load(requested);}
 },[]);
 async function runGate(id:number){
  setBusy(`gate-${id}`);setMessage('');
  try{
   const result:Gate=await api(`/factory/staged-versions/${id}/release-gate`,{method:'POST'});
   setGates(old=>({...old,[id]:result}));
   setMessage(`Release Gate #${id}: ${result.decision}`);
  }catch(e){setMessage(e instanceof Error?e.message:'فشل Release Gate');}
  finally{setBusy('');}
 }
 async function release(id:number){
  setBusy(`release-${id}`);setMessage('');
  try{
   const result:ReleaseResult=await api(`/factory/staged-versions/${id}/release`,{method:'POST'});
   setReleaseResults(old=>({...old,[id]:result}));
   setMessage(`Audited Release Transaction #${result.release_transaction_id} · ${result.status}${result.idempotent_replay?' · idempotent replay':''}`);
   await load();
  }catch(e){setMessage(e instanceof Error?e.message:'فشلت معاملة الإصدار');}
  finally{setBusy('');}
 }

 return <main style={{maxWidth:1000,margin:'28px auto',padding:18}}>
  <div style={{fontSize:13,opacity:.55}}>الإدارة ← Release Readiness</div>
  <h1>Final Release Gate & Audited Release</h1>
  <p>Final Gate لا تنشر شيئًا. إذا أصبحت READY_FOR_RELEASE_TRANSACTION فقط، يمكن تشغيل معاملة الإصدار المدققة؛ والخادم يفرض PostgreSQL ويعيد التحقق من المصدر والمهارات لحظة الإصدار.</p>
  <div style={panel}>
   <label>Lesson ID <input type="number" min="1" value={lessonId} onChange={e=>setLessonId(Number(e.target.value)||1)} style={{width:80,padding:8,marginInlineStart:6}}/></label>
   <button style={{marginInlineStart:8}} onClick={()=>load()} disabled={!!busy}>تحميل Staged Versions</button>
   <a style={{marginInlineStart:12}} href={`/admin/staging?lesson_id=${lessonId}`}>العودة إلى Staging</a>
   <a style={{marginInlineStart:12}} href="/admin/current-semester/matrix">مصفوفة الفصل</a>
  </div>
  {message&&<div style={{marginTop:12,padding:12,borderRadius:10,background:'#eef6ff'}}>{message}</div>}

  <section style={{display:'grid',gap:12,marginTop:16}}>
   {!rows.length&&<div style={panel}>لا توجد Staged Versions محملة لهذا الدرس.</div>}
   {rows.map(row=>{
    const gate=gates[row.id];
    const released=releaseResults[row.id];
    return <article key={row.id} style={panel}>
     <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div><strong>Snapshot #{row.id}</strong> · {row.version_label}</div><b>{row.status}</b>
     </div>
     <div style={{marginTop:8}}>Deterministic Release: <strong>{row.release_readiness}</strong></div>
     <button style={{marginTop:10}} disabled={!!busy} onClick={()=>runGate(row.id)}>Run Final Release Gate</button>
     {gate&&<div style={{marginTop:14,padding:13,borderRadius:12,background:gate.decision==='READY_FOR_RELEASE_TRANSACTION'?'#ecfdf3':'#fff4e5'}}>
      <div style={{fontSize:18,fontWeight:800}}>{gate.decision}</div>
      <div style={{marginTop:5}}>Database: <strong>{gate.database_backend}</strong> · Academic confidence: <strong>{gate.academic_confidence}%</strong></div>
      <div style={{display:'grid',gap:5,marginTop:12}}>{Object.entries(gate.checks).map(([key,passed])=><div key={key}>{passed?'✅':'⛔'} {labels[key]||key}</div>)}</div>
      {gate.blockers.length>0&&<div style={{marginTop:12}}><strong>Blockers:</strong> {gate.blockers.join(' · ')}</div>}
      <div style={{marginTop:12,padding:11,borderRadius:10,background:'rgba(255,255,255,.75)'}}>
       <div><strong>Release Manifest</strong> · {gate.release_manifest.manifest_version} · {gate.release_manifest.snapshot_bytes} bytes</div>
       <div style={{marginTop:6,fontFamily:'monospace',fontSize:12,overflowWrap:'anywhere'}}>Snapshot SHA-256: {gate.release_manifest.snapshot_sha256}</div>
       <div style={{marginTop:4,fontFamily:'monospace',fontSize:12,overflowWrap:'anywhere'}}>Manifest SHA-256: {gate.release_manifest.manifest_sha256}</div>
      </div>
      <div style={{marginTop:10,padding:11,borderRadius:10,background:'rgba(255,255,255,.75)'}}>
       <div>Release Transaction available: <strong>{String(gate.release_transaction_available)}</strong></div>
       <div>Direct legacy publish disabled: <strong>{String(gate.release_policy.direct_legacy_publish_disabled)}</strong></div>
       <div>publication_authorized: <strong>{String(gate.publication_authorized)}</strong></div>
       <div style={{marginTop:7}}><strong>الخطوة التالية:</strong> {actionLabels[gate.next_action]||gate.next_action}</div>
       {gate.decision==='READY_FOR_RELEASE_TRANSACTION'&&<button style={{marginTop:10,padding:'9px 13px',fontWeight:800}} disabled={!!busy} onClick={()=>release(row.id)}>تنفيذ Audited Release Transaction</button>}
      </div>
     </div>}
     {released&&<div style={{marginTop:12,padding:12,borderRadius:10,background:'#ecfdf3'}}><strong>{released.status} ✓</strong><div>Transaction #{released.release_transaction_id} · Content Version #{released.content_version_id}</div><div style={{fontSize:12,marginTop:5}}>Manifest {released.manifest_sha256}</div></div>}
    </article>
   })}
  </section>
  <section style={{...panel,marginTop:16,background:'#fffaf0'}}><strong>قاعدة ثابتة:</strong> READY_FOR_RELEASE_TRANSACTION لا تعني أن الدرس نُشر. النشر يحدث فقط عند نجاح endpoint معاملة الإصدار المدققة، التي تتطلب PostgreSQL وتعيد التحقق من Evidence وSkill Codes داخل transaction واحدة.</section>
 </main>
}

const panel:React.CSSProperties={background:'white',padding:16,borderRadius:14,border:'1px solid #e8edf5'};
