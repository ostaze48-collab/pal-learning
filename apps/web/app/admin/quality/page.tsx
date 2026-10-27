'use client';

import {useEffect,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';
const adminHeaders=()=>({Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`});

type RefRow={
  question_id:number;question_code:string;prompt:string;question_status:string;
  reference_answer?:string|null;validation_status:string;confidence:number;
  source_file_id?:number|null;source_type?:string|null;source_filename?:string|null;
  source_edition?:string|null;source_authorized_for_answer_validation:boolean;
};
type RefData={lesson_id:number;lesson_code:string;lesson_title:string;questions:number;status_counts:Record<string,number>;reference_answers:RefRow[];publication_authorized:boolean;note:string};
type QA={source_alignment_score:number;skill_coverage_score:number;question_quality_score:number;answer_validation_score:number;overall_score:number;status:string;details:Record<string,number>};

export default function Quality(){
  const [lessonId,setLessonId]=useState(1);
  const [packageId,setPackageId]=useState(1);
  const [refs,setRefs]=useState<RefData|null>(null);
  const [qa,setQa]=useState<QA|null>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  async function loadRefs(id=lessonId){
    setBusy(true);setMessage('');
    try{
      const r=await fetch(`${API}/qa/lessons/${id}/reference-answers`,{headers:adminHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر تحميل الإجابات المرجعية');
      setRefs(b);
    }catch(e){setMessage(e instanceof Error?e.message:'حدث خطأ');}
    finally{setBusy(false);}
  }

  async function alignSolutions(){
    setBusy(true);setMessage('');
    try{
      const r=await fetch(`${API}/qa/source-packages/${packageId}/align-solutions`,{method:'POST',headers:adminHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشلت مطابقة الحلول');
      setMessage(`تم فحص ${b.questions_checked} سؤال · اكتُشف ${b.solution_items_detected} زوج سؤال/جواب · سياسة Answer Validation مفعّلة.`);
      await loadRefs();
    }catch(e){setMessage(e instanceof Error?e.message:'حدث خطأ');setBusy(false);}
  }

  async function runQA(){
    setBusy(true);setMessage('');
    try{
      const r=await fetch(`${API}/qa/lessons/${lessonId}/run`,{method:'POST',headers:adminHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل QA');
      setQa(b);
      setMessage(`QA ${b.status} · Overall ${b.overall_score}% · Answer Validation ${b.answer_validation_score}%`);
    }catch(e){setMessage(e instanceof Error?e.message:'حدث خطأ');}
    finally{setBusy(false);}
  }

  useEffect(()=>{loadRefs(1)},[]);

  const statusColor=(s:string)=>s==='VERIFIED_MATCH'?'#e9f9ef':s==='SEMANTIC_MATCH'?'#eef6ff':s==='CONFLICT'?'#ffecec':'#fff7e8';

  return <main style={{maxWidth:1100,margin:'28px auto',padding:18}}>
    <div style={{fontSize:14,opacity:.6}}>الإدارة ← الجودة ← Answer Validation</div>
    <h1>بوابة الجودة والإجابات المرجعية</h1>
    <p>ملفات <strong>SOLUTIONS</strong> تستخدم للتحقق من مفاتيح الإجابة فقط. لا تدخل أبدًا في factual grounding للشرح، والنشر المباشر ما زال معطلًا.</p>

    <section style={{background:'white',padding:16,borderRadius:14,border:'1px solid #e8edf5',display:'flex',gap:10,flexWrap:'wrap',alignItems:'end'}}>
      <label>Lesson ID<input type="number" min="1" value={lessonId} onChange={e=>setLessonId(Number(e.target.value)||1)} style={{display:'block',padding:8,width:100,marginTop:4}}/></label>
      <label>Package ID<input type="number" min="1" value={packageId} onChange={e=>setPackageId(Number(e.target.value)||1)} style={{display:'block',padding:8,width:100,marginTop:4}}/></label>
      <button disabled={busy} onClick={()=>loadRefs()} style={{padding:'10px 13px'}}>تحميل الإجابات المرجعية</button>
      <button disabled={busy} onClick={alignSolutions} style={{padding:'10px 13px',background:'#1f6feb',color:'white',border:0,borderRadius:9}}>مطابقة الحلول</button>
      <button disabled={busy} onClick={runQA} style={{padding:'10px 13px',background:'#14213d',color:'white',border:0,borderRadius:9}}>تشغيل Lesson QA</button>
    </section>

    {message&&<div style={{marginTop:12,padding:13,borderRadius:10,background:'#eef6ff'}}>{message}</div>}

    {qa&&<section style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
      {[['Source',qa.source_alignment_score],['Skills',qa.skill_coverage_score],['Questions',qa.question_quality_score],['Answers',qa.answer_validation_score],['Overall',qa.overall_score]].map(([k,v])=><div key={String(k)} style={{background:'white',padding:15,borderRadius:12,border:'1px solid #e8edf5'}}><div>{k}</div><strong style={{fontSize:25}}>{v}%</strong></div>)}
      <div style={{background:qa.status==='PASS'?'#e9f9ef':'#fff4e5',padding:15,borderRadius:12}}><div>Status</div><strong>{qa.status}</strong></div>
    </section>}

    {refs&&<section style={{marginTop:18}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'center'}}><div><h2 style={{marginBottom:4}}>{refs.lesson_title}</h2><div style={{opacity:.65}}>{refs.lesson_code} · {refs.questions} أسئلة</div></div><div style={{padding:'8px 12px',borderRadius:99,background:'#fff4e5'}}>Publication authorized: {refs.publication_authorized?'YES':'NO'}</div></div>
      <div style={{margin:'10px 0',fontSize:13,opacity:.7}}>{refs.note}</div>
      <div style={{display:'grid',gap:10}}>{refs.reference_answers.map(r=><article key={r.question_id} style={{background:'white',padding:16,borderRadius:14,border:'1px solid #e8edf5'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><strong>{r.question_code}</strong><span style={{padding:'5px 9px',borderRadius:99,background:statusColor(r.validation_status)}}>{r.validation_status}</span></div>
        <p style={{marginBottom:8}}>{r.prompt}</p>
        <div><strong>الإجابة المرجعية:</strong> {r.reference_answer||'—'}</div>
        <div style={{fontSize:13,opacity:.75,marginTop:7}}>Confidence: {Math.round((r.confidence||0)*100)}% · Source #{r.source_file_id||'—'} · {r.source_type||'—'} · {r.source_edition||'—'}</div>
        <div style={{fontSize:13,marginTop:5,color:r.source_authorized_for_answer_validation?'#176b3a':'#a32929'}}>{r.source_authorized_for_answer_validation?'✓ المصدر مسموح للتحقق من الإجابة':'✗ المصدر غير مسموح للتحقق من الإجابة'}</div>
      </article>)}</div>
    </section>}

    <section style={{marginTop:18,padding:16,borderRadius:14,background:'#fff4e5'}}><strong>النشر محظور عمدًا.</strong><p style={{marginBottom:0}}>حتى QA PASS لا يغير Lesson إلى PUBLISHED. المسار الوحيد المستقبلي هو Candidate → Staging → Academic QA → Final Release Gate → Audited Release Transaction، والأخيرة لم تُنفّذ بعد.</p></section>
  </main>
}
