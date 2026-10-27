'use client';

import {useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Readiness={
  lesson:{id:number;lesson_code:string;title:string};
  package_id?:number;package_code?:string;
  queue_ready:boolean;execution_ready:boolean;blockers:string[];next_actions:string[];
  skills_count:number;authorized_factual_source_chunks:number;scope_evidence_count:number;
  scope_gate:Record<string,unknown>;authority_gate:Record<string,unknown>;
  provider:{provider:string;execution_ready:boolean;key_configured:boolean;model_configured:boolean};
  discovery_candidates:Array<{source_code:string;title:string;academic_year:string;ingestion_mode:string;discovery_url:string;notes:string}>;
};

const blockerLabels:Record<string,string>={
  NO_SKILLS_LINKED:'لا توجد مهارات مربوطة بالدرس.',
  NO_AUTHORIZED_FACTUAL_SOURCE_LINKED:'لا يوجد مصدر حقائق مصرح ومربوط بالدرس.',
  FACTUAL_SOURCE_AUTHORITY_BLOCKED:'المصدر المربوط غير مصرح له بتأصيل الحقائق.',
  LEGACY_TEACHING_SOURCE_REQUIRES_CURRENT_SCOPE_EVIDENCE:'المصدر التعليمي قديم ويحتاج خطة منهاج حالية تثبت استمرار الدرس.',
};
const actionLabels:Record<string,string>={
  LINK_LESSON_SKILLS:'اربط مهارات الدرس.',
  IMPORT_AND_LINK_FACTUAL_SOURCE:'استورد واربط كتاب الطالب أو الرزمة الرسمية المتحققة.',
  REPLACE_OR_RECLASSIFY_UNAUTHORIZED_TEACHING_SOURCE:'استبدل المصدر أو صحح تصنيفه.',
  OBTAIN_CURRENT_CURRICULUM_PLAN:'احصل على ملف خطة المنهاج الحالية.',
  UPLOAD_CURRICULUM_PLAN:'ارفع الملف كـ CURRICULUM_PLAN.',
  VERIFY_CURRENT_PLAN_SCOPE:'تحقق من وجود الوحدة والدرس في الخطة الحالية.',
  CONFIGURE_REAL_AI_PROVIDER_FOR_EXECUTION:'أعد مزود AI حقيقي في بيئة التشغيل.',
  QUEUE_GENERATION_JOB:'أصبح الدرس جاهزًا لإنشاء AI Job.',
};

export default function GenerationReadinessPage(){
  const [lessonId,setLessonId]=useState(1);
  const [data,setData]=useState<Readiness|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  async function check(){
    setBusy(true);setMessage('');setData(null);
    const token=localStorage.getItem('pal_admin_token')||'';
    try{
      const r=await fetch(`${API}/factory/lessons/${lessonId}/generation-readiness`,{headers:{Authorization:`Bearer ${token}`}});
      const body=await r.json();
      if(!r.ok)throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'تعذر فحص الجاهزية');
      setData(body);
    }catch(e){setMessage(e instanceof Error?e.message:'تعذر فحص الجاهزية');}
    finally{setBusy(false);}
  }

  return <main style={{maxWidth:1000,margin:'30px auto',padding:18}}>
    <div style={{fontSize:14,opacity:.6}}>الإدارة ← Curriculum Factory ← Generation Readiness</div>
    <h1>جاهزية توليد الدرس</h1>
    <p>هذا الفحص تشخيصي فقط: لا ينشئ AI Job ولا ينشر محتوى. يوضح بالضبط ما الذي يمنع التوليد وما الخطوة التالية.</p>
    <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',background:'white',padding:16,border:'1px solid #e8edf5',borderRadius:14}}>
      <label>Lesson ID <input type="number" min="1" value={lessonId} onChange={e=>setLessonId(Number(e.target.value)||1)} style={{width:90,padding:8,marginInlineStart:6}}/></label>
      <button onClick={check} disabled={busy} style={{padding:'9px 14px'}}>{busy?'جارٍ الفحص…':'فحص الجاهزية'}</button>
      <a href="/admin/curriculum">مصنع المنهاج</a>
      <a href="/admin/source-discovery">المصادر المكتشفة</a>
    </div>
    {message&&<div style={{marginTop:12,padding:12,borderRadius:10,background:'#ffecec'}}>{message}</div>}
    {data&&<>
      <section style={{marginTop:16,padding:18,borderRadius:15,background:data.execution_ready?'#ecfdf3':data.queue_ready?'#eef6ff':'#fff4e5',border:'1px solid #dde5ef'}}>
        <h2 style={{marginTop:0}}>{data.lesson.lesson_code} — {data.lesson.title}</h2>
        <div>Package: <strong>{data.package_code||'—'}</strong></div>
        <div style={{marginTop:7}}>Queue ready: <strong>{String(data.queue_ready)}</strong> · Execute ready: <strong>{String(data.execution_ready)}</strong></div>
        <div style={{marginTop:7}}>Skills: <strong>{data.skills_count}</strong> · Factual chunks: <strong>{data.authorized_factual_source_chunks}</strong> · Scope evidence: <strong>{data.scope_evidence_count}</strong></div>
        <div style={{marginTop:7}}>AI Provider: <strong>{data.provider.provider}</strong> · Execution ready: <strong>{String(data.provider.execution_ready)}</strong></div>
      </section>

      <section style={panel}>
        <h2>Blockers</h2>
        {!data.blockers.length&&<p>لا توجد blockers تمنع إنشاء Generation Job.</p>}
        <div style={{display:'grid',gap:8}}>{data.blockers.map(x=><div key={x} style={{padding:11,borderRadius:10,background:'#fff4e5'}}>⛔ <strong>{x}</strong><div>{blockerLabels[x]||x}</div></div>)}</div>
      </section>

      <section style={panel}>
        <h2>الخطوات التالية</h2>
        <ol>{data.next_actions.map(x=><li key={x} style={{margin:'8px 0'}}><strong>{x}</strong> — {actionLabels[x]||x}</li>)}</ol>
      </section>

      <section style={panel}>
        <h2>Current Scope Gate</h2>
        <pre style={pre}>{JSON.stringify(data.scope_gate,null,2)}</pre>
      </section>

      <section style={panel}>
        <h2>Source Authority Gate</h2>
        <pre style={pre}>{JSON.stringify(data.authority_gate,null,2)}</pre>
      </section>

      <section style={panel}>
        <h2>مصادر مكتشفة قد تسد النقص</h2>
        {!data.discovery_candidates.length&&<p>لا توجد Discovery Candidates لهذه الرزمة.</p>}
        {data.discovery_candidates.map(item=><article key={item.source_code} style={{borderTop:'1px solid #edf0f5',padding:'12px 0'}}>
          <strong>{item.title}</strong>
          <div>{item.academic_year} · {item.ingestion_mode}</div>
          <div style={{marginTop:5}}><a href={item.discovery_url} target="_blank" rel="noreferrer">فتح صفحة المورد</a></div>
          <p style={{fontSize:13,opacity:.7}}>{item.notes}</p>
        </article>)}
      </section>
    </>}
  </main>;
}

const panel:React.CSSProperties={marginTop:16,background:'white',padding:18,borderRadius:14,border:'1px solid #e8edf5'};
const pre:React.CSSProperties={whiteSpace:'pre-wrap',overflowWrap:'anywhere',background:'#f7f9fc',padding:12,borderRadius:10,fontSize:12};
