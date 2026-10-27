'use client';

import {useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Candidate={
 id:number;version_label:string;status:string;schema_valid:boolean;provenance_score:number;
 validation?:{candidate_qa?:any;staging_approval?:any};created_at?:string;
};

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
 const [lessonId,setLessonId]=useState(1);
 const [rows,setRows]=useState<Candidate[]>([]);
 const [preview,setPreview]=useState<any>(null);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState('');

 async function load(){
  setBusy('load');setMessage('');
  try{setRows(await api(`/factory/lessons/${lessonId}/candidates`));}
  catch(e){setMessage(e instanceof Error?e.message:'تعذر تحميل المرشحين');}
  finally{setBusy('');}
 }
 async function act(label:string,fn:()=>Promise<any>){
  setBusy(label);setMessage('');
  try{const result=await fn();setMessage(`${label} ✓`);await load();return result;}
  catch(e){setMessage(e instanceof Error?e.message:`فشل ${label}`);}
  finally{setBusy('');}
 }

 return <main style={{maxWidth:1000,margin:'28px auto',padding:18}}>
  <div style={{fontSize:13,opacity:.55}}>الإدارة ← Staging</div>
  <h1>Candidate QA & Staging</h1>
  <p>هذه الشاشة لا تنشر أي محتوى. وظيفتها فصل التحقق البنيوي والمصدر عن الموافقة الداخلية على staging.</p>
  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',background:'white',padding:14,borderRadius:14,border:'1px solid #e8edf5'}}>
   <label>Lesson ID <input type="number" min="1" value={lessonId} onChange={e=>setLessonId(Number(e.target.value)||1)} style={{width:80,padding:8,marginInlineStart:6}}/></label>
   <button onClick={load} disabled={!!busy}>تحميل المرشحين</button>
   <a href="/admin/curriculum">العودة لمصنع المنهاج</a>
  </div>
  {message&&<div style={{marginTop:12,padding:12,borderRadius:10,background:message.includes('✓')?'#ecfdf3':'#fff4e5'}}>{message}</div>}

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
     {approval&&<div style={{marginTop:8,fontSize:13}}>Staging approved · Release at approval: {approval.release_readiness}</div>}
     <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
      <button disabled={!!busy} onClick={()=>act(`QA Candidate #${c.id}`,()=>api(`/factory/candidates/${c.id}/qa`,{method:'POST'}))}>Run Preflight QA</button>
      <button disabled={!!busy||c.status==='REJECTED'} onClick={()=>act(`Staging Candidate #${c.id}`,()=>api(`/factory/candidates/${c.id}/approve-staging`,{method:'POST'}))}>Approve for Staging</button>
      <button disabled={!!busy} onClick={async()=>{setBusy('preview');try{setPreview(await api(`/factory/candidates/${c.id}`));}catch(e){setMessage(e instanceof Error?e.message:'فشل المعاينة');}finally{setBusy('');}}}>Preview</button>
     </div>
    </article>
   })}
  </section>

  {preview&&<section style={{...panel,marginTop:16}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>{preview.version_label} · {preview.status}</strong><button onClick={()=>setPreview(null)}>إغلاق</button></div>
   <div style={{marginTop:8}}>الأهداف {preview.output?.learning_objectives?.length||0} · الأقسام {preview.output?.sections?.length||0} · الأسئلة {preview.output?.questions?.length||0}</div>
   <details style={{marginTop:10}}><summary>Validation</summary><pre style={pre}>{JSON.stringify(preview.validation,null,2)}</pre></details>
   <details><summary>Generated output</summary><pre style={pre}>{JSON.stringify(preview.output,null,2)}</pre></details>
  </section>}

  <section style={{...panel,marginTop:16,background:'#fffaf0'}}>
   <strong>مهم:</strong> APPROVED_FOR_STAGING لا يعني PUBLISHED. Release Readiness يمكن أن يبقى BLOCKED حتى لو سمحنا بالمعاينة الداخلية.
  </section>
 </main>
}

const panel:React.CSSProperties={background:'white',padding:16,borderRadius:14,border:'1px solid #e8edf5'};
const pre:React.CSSProperties={whiteSpace:'pre-wrap',direction:'ltr',textAlign:'left',overflow:'auto',fontSize:11,background:'#f6f8fa',padding:10,borderRadius:8};
