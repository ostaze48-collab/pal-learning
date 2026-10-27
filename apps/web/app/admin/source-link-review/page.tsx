'use client';

import {useEffect,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_code:string;title:string};
type Current={units:Array<{lessons:Lesson[]}>};
type Link={id:number;lesson_id:number;relation:string;confidence:number;source_method:string;status:string;source_chunk_id?:number;page_number?:number;text_preview?:string;source_file_id?:number;source_type?:string;source_edition?:string;factual_grounding_authorized:boolean};
type Payload={lesson_id:number;lesson_code:string;lesson_title:string;links:Link[]};

export default function SourceLinkReview(){
  const [lessonId,setLessonId]=useState<number|null>(null);
  const [data,setData]=useState<Payload|null>(null);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState<number|null>(null);
  function headers(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`};}
  async function load(){
    setError('');
    try{
      const r1=await fetch(`${API}/admin/current-semester`,{headers:headers()});
      const current:Current=await r1.json();
      if(!r1.ok) throw new Error((current as any).detail||'تعذر تحميل الفصل الحالي');
      const lessons=current.units.flatMap(unit=>unit.lessons||[]);
      const requested=Number(new URLSearchParams(window.location.search).get('lesson_id')||0);
      const selected=lessons.find(item=>item.id===requested)||lessons[0];
      if(!selected) throw new Error('لا توجد دروس في الفصل الحالي');
      setLessonId(selected.id);
      const r2=await fetch(`${API}/importer/lessons/${selected.id}/source-links`,{headers:headers()});
      const body=await r2.json();
      if(!r2.ok) throw new Error(body.detail||'تعذر تحميل روابط المصادر');
      setData(body);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل روابط المصادر');}
  }
  useEffect(()=>{void load();},[]);

  async function act(linkId:number,action:'verify'|'reject'){
    setBusy(linkId);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/importer/lesson-source-links/${linkId}/${action}`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تحديث الرابط');
      setMessage(action==='verify'?`تم Verify للرابط #${linkId}. أصبح صالحًا لمرحلة Skill Mapping مع بقاء بوابات الطبعة والنطاق.`:`تم رفض الرابط #${linkId}.`);
      await load();
    }catch(e){setError(e instanceof Error?e.message:'فشل تحديث الرابط');}
    finally{setBusy(null);}
  }

  return <main style={{maxWidth:980,margin:'30px auto',padding:20}}>
    <div style={{fontSize:14,opacity:.65}}>الإدارة ← الفصل الحالي ← مراجعة مصدر الدرس</div>
    <h1>Lesson Source Review</h1>
    <p>{data?`${data.lesson_code} · ${data.lesson_title}`:`Lesson ID ${lessonId||'—'}`}</p>
    <p>الربط الآلي يقترح فقط. لا يدخل أي Chunk إلى Skill Mapping حتى يراجعه Admin ويصبح <strong>VERIFIED</strong>.</p>
    {message&&<div style={{padding:12,borderRadius:10,background:'#eefbf3',marginBottom:12}}>{message}</div>}
    {error&&<div style={{padding:12,borderRadius:10,background:'#ffecec',marginBottom:12}}>{error}</div>}
    {!data&&!error&&<p>جارٍ التحميل…</p>}
    {data&&data.links.length===0&&<div style={{padding:14,borderRadius:12,background:'#fff4e5'}}>لا توجد روابط مرشحة بعد. ارجع إلى شاشة الفصل الحالي وشغّل «اقتراح ربط الدروس بالمصدر» بعد استخراج المصدر.</div>}
    {data&&<div style={{display:'grid',gap:12}}>{data.links.map(link=><section key={link.id} style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><strong>Link #{link.id} · Chunk #{link.source_chunk_id}</strong><span>{link.status}</span></div>
      <div style={{fontSize:13,marginTop:5}}>Source #{link.source_file_id} · {link.source_type} · page {link.page_number||'—'} · confidence {Math.round((link.confidence||0)*100)}%</div>
      <div style={{fontSize:12,opacity:.65}}>Method: {link.source_method} · Factual authority: {String(link.factual_grounding_authorized)} · Edition: {link.source_edition||'—'}</div>
      <div style={{marginTop:10,padding:12,borderRadius:9,background:'#f8fafc',whiteSpace:'pre-wrap'}}>{link.text_preview||'لا يوجد نص'}</div>
      <div style={{display:'flex',gap:8,marginTop:10}}>
        <button disabled={busy===link.id||link.status==='VERIFIED'||!link.factual_grounding_authorized} onClick={()=>act(link.id,'verify')} style={{padding:'8px 12px',border:0,borderRadius:8,background:'#176b3a',color:'white'}}>Verify</button>
        <button disabled={busy===link.id||link.status==='REJECTED'} onClick={()=>act(link.id,'reject')} style={{padding:'8px 12px',border:'1px solid #d5a3a3',borderRadius:8,background:'white',color:'#9b2222'}}>Reject</button>
      </div>
    </section>)}</div>}
    <div style={{display:'flex',gap:12,marginTop:18,flexWrap:'wrap'}}><a href="/admin/current-semester/matrix">مصفوفة الفصل</a><a href={lessonId?`/admin/skill-mapping?lesson_id=${lessonId}`:'/admin/skill-mapping'}>Skill Mapping</a><a href="/admin/current-semester">الفصل الحالي</a><a href="/admin">لوحة الإدارة</a></div>
  </main>;
}
