'use client';

import {useEffect,useMemo,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_number:number;lesson_code:string;title:string;status:string};
type Unit={id:number;unit_number:number;title:string;lessons:Lesson[]};
type Source={id:number;source_type:string;source_url?:string;status:string;reliability_score:number;edition_match_score:number};
type Readiness={queue_ready:boolean;execution_ready:boolean;blockers:string[];next_actions:string[];skills_count:number;authorized_factual_source_chunks:number;scope_evidence_count:number;provider:{provider:string;execution_ready:boolean}};
type Payload={
  semester:number;
  book:{id:number;book_code:string;title:string;status:string;edition?:string};
  package:{id:number;package_code:string;status:string;source_count:number};
  units:Unit[];
  sources:Source[];
  backlog:{semester_2_book_code:string;note:string};
};

export default function CurrentSemesterPage(){
  const [data,setData]=useState<Payload|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState<number|null>(null);
  const [readiness,setReadiness]=useState<Readiness|null>(null);

  const firstLesson=useMemo(()=>data?.units?.[0]?.lessons?.[0]||null,[data]);
  function authHeaders(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`};}
  async function load(){
    setError('');
    try{
      const r=await fetch(`${API}/admin/current-semester`,{headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(b.detail||'تعذر تحميل الفصل الحالي');
      setData(b);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل الفصل الحالي');}
  }
  useEffect(()=>{void load();},[]);

  async function fetchOfficial(source:Source){
    setBusy(source.id); setMessage(''); setError('');
    try{
      const r=await fetch(`${API}/importer/source-files/${source.id}/fetch-registered`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل جلب المصدر الرسمي');
      setMessage(`تم جلب المصدر #${source.id} واستخراج ${b.page_count||0} صفحة. Edition Match ${b.edition_match_score||0}%. الآن شغّل تحقق نطاق الفصل الأول.`);
      await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل جلب المصدر الرسمي');}
    finally{setBusy(null);}
  }

  async function verifyScope(source:Source){
    setBusy(source.id); setMessage(''); setError('');
    try{
      const r=await fetch(`${API}/importer/catalog/source-files/${source.id}/verify-scope`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تحقق النطاق');
      if(b.scope_verified){
        setMessage(`Scope PASS ✓ · المصدر #${source.id} يغطي الخلية + خصائص المادة + الطاقة في حياتنا، وتمت ترقيته إلى ${b.source_type}. مطابقة الطبعة تبقى بوابة مستقلة.`);
      }else{
        setMessage(`Scope BLOCKED · المفقود: ${(b.missing_terms||[]).join('، ')||'—'}. لن يدخل المصدر في factual grounding.`);
      }
      setReadiness(null);
      await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل تحقق النطاق');}
    finally{setBusy(null);}
  }

  async function checkReadiness(){
    if(!firstLesson) return;
    setBusy(firstLesson.id); setError(''); setMessage('');
    try{
      const r=await fetch(`${API}/factory/lessons/${firstLesson.id}/generation-readiness`,{headers:authHeaders()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر فحص جاهزية التوليد');
      setReadiness(b);
      setMessage(b.queue_ready?'Generation Readiness PASS ✓ · يمكن إنشاء Job.':'Generation Readiness BLOCKED · راجع العقبات أدناه؛ لن ننشئ Job قبل إغلاقها.');
    }catch(e){setError(e instanceof Error?e.message:'تعذر فحص جاهزية التوليد');}
    finally{setBusy(null);}
  }

  async function queueGeneration(){
    if(!firstLesson) return;
    setBusy(firstLesson.id); setError(''); setMessage('');
    try{
      const r=await fetch(`${API}/factory/lessons/${firstLesson.id}/generate`,{method:'POST',headers:authHeaders()});
      const b=await r.json();
      if(!r.ok){
        const detail=b.detail||{};
        setReadiness(detail.generation_readiness||null);
        throw new Error(detail.message||'الدرس غير جاهز للتوليد');
      }
      setMessage(`تم إنشاء Generation Job #${b.job_id} بحالة ${b.status}. التنفيذ الفعلي يعتمد على مزود AI.`);
      await checkReadiness();
    }catch(e){setError(e instanceof Error?e.message:'فشل إنشاء Generation Job');}
    finally{setBusy(null);}
  }

  return <main style={{maxWidth:1000,margin:'30px auto',padding:20}}>
    <div style={{fontSize:14,opacity:.65}}>الإدارة ← الفصل الحالي</div>
    <h1>علوم خامس — الفصل الأول</h1>
    <p>هذه هي أولوية الإنتاج الحالية. الفصل الثاني محفوظ كـPrototype/Backlog ولا يدخل مسار الإنتاج الحالي.</p>
    {message&&<div style={{padding:12,borderRadius:10,background:'#eefbf3',marginBottom:12}}>{message}</div>}
    {error&&<div style={{padding:12,borderRadius:10,background:'#ffecec',marginBottom:12}}>{error}</div>}
    {!data&&!error&&<p>جارٍ تحميل السجل الحالي…</p>}
    {data&&<>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
        <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><div style={{fontSize:13,opacity:.6}}>Book</div><strong>{data.book.book_code}</strong><div>{data.book.title}</div><small>{data.book.status} · {data.book.edition||'—'}</small></div>
        <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><div style={{fontSize:13,opacity:.6}}>Current Package</div><strong>{data.package.package_code}</strong><div>Package ID: {data.package.id}</div><small>{data.package.status} · {data.package.source_count} مصدر</small></div>
      </section>

      <section style={{marginTop:18,background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:18}}>
        <h2 style={{marginTop:0}}>الوحدات والدروس الحالية</h2>
        <div style={{display:'grid',gap:12}}>{data.units.map(unit=><div key={unit.id} style={{border:'1px solid #edf0f5',borderRadius:12,padding:14}}>
          <strong>الوحدة {unit.unit_number}: {unit.title}</strong>
          <div style={{marginTop:8,display:'grid',gap:6}}>{unit.lessons.map(lesson=><div key={lesson.id} style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><span>{lesson.lesson_number}. {lesson.title}</span><code>{lesson.lesson_code}</code></div>)}</div>
        </div>)}</div>
      </section>

      {firstLesson&&<section style={{marginTop:18,background:'#fffdf5',border:'1px solid #eadca8',borderRadius:14,padding:18}}>
        <h2 style={{marginTop:0}}>أول درس إنتاجي: {firstLesson.title}</h2>
        <p>الهيكل التعليمي موجود كـDraft فقط. لا يتم توليد محتوى factual قبل أن يمر المصدر والمهارات عبر بوابات الجاهزية.</p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button disabled={busy===firstLesson.id} onClick={checkReadiness} style={{padding:'9px 12px',borderRadius:9,border:'1px solid #b49c48',background:'white'}}>فحص Generation Readiness</button>
          <button disabled={busy===firstLesson.id||!readiness?.queue_ready} onClick={queueGeneration} style={{padding:'9px 12px',borderRadius:9,border:0,background:readiness?.queue_ready?'#176b3a':'#9aa3ad',color:'white'}}>إنشاء Generation Job</button>
        </div>
        {readiness&&<div style={{marginTop:12,display:'grid',gap:8}}>
          <div><strong>{readiness.queue_ready?'READY':'BLOCKED'}</strong> · Skills {readiness.skills_count} · Factual chunks {readiness.authorized_factual_source_chunks} · Scope evidence {readiness.scope_evidence_count}</div>
          {!!readiness.blockers?.length&&<div style={{padding:10,borderRadius:9,background:'#fff0f0'}}>Blockers: {readiness.blockers.join(' · ')}</div>}
          {!!readiness.next_actions?.length&&<div style={{padding:10,borderRadius:9,background:'#f7f8fa'}}>Next actions: {readiness.next_actions.join(' → ')}</div>}
          <small>AI Provider: {readiness.provider?.provider||'—'} · execution ready: {String(readiness.execution_ready)}</small>
        </div>}
      </section>}

      <section style={{marginTop:18,background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:18}}>
        <h2 style={{marginTop:0}}>المصادر المسجلة</h2>
        {data.sources.length===0?<p>لا توجد مصادر بعد.</p>:<div style={{display:'grid',gap:8}}>{data.sources.map(source=><div key={source.id} style={{padding:12,borderRadius:10,background:'#f8fafc'}}>
          <strong>#{source.id} · {source.source_type}</strong> · {source.status}<br/>
          <small>Reliability {source.reliability_score}% · Edition Match {source.edition_match_score}%</small>
          {source.source_url&&<div style={{fontSize:12,wordBreak:'break-all',marginTop:4}}>{source.source_url}</div>}
          {source.source_url==='https://moe.edu.ps/m/4070'&&<div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
            <button disabled={busy===source.id} onClick={()=>fetchOfficial(source)} style={{padding:'8px 10px',borderRadius:9,border:0,background:'#1f6feb',color:'white'}}>جلب المصدر الرسمي</button>
            <button disabled={busy===source.id} onClick={()=>verifyScope(source)} style={{padding:'8px 10px',borderRadius:9,border:'1px solid #8eacd5',background:'white'}}>تحقق من نطاق الفصل الأول</button>
          </div>}
        </div>)}</div>}
      </section>

      <section style={{marginTop:18,padding:14,borderRadius:12,background:'#f7f8fa'}}><strong>Backlog:</strong> {data.backlog.semester_2_book_code} — {data.backlog.note}</section>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:18}}>
        <a href="/admin/importer" style={{padding:'10px 14px',borderRadius:10,background:'#1f6feb',color:'white',textDecoration:'none'}}>مستورد المصادر المتقدم</a>
        <a href="/admin/curriculum" style={{padding:'10px 14px',borderRadius:10,background:'#eef4ff',color:'#124b9b',textDecoration:'none'}}>فتح مصنع المنهاج</a>
        <a href="/admin" style={{padding:'10px 14px',borderRadius:10,background:'white',border:'1px solid #ccd5e3',textDecoration:'none'}}>العودة للوحة الإدارة</a>
      </div>
    </>}
  </main>;
}
