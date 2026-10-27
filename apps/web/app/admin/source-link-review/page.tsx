'use client';

import {useEffect,useMemo,useState} from 'react';
import {ActionButton,ActionLink,AdminShell,ButtonRow,Card,MetricCard,Notice,SectionHeader,StatusPill} from '../_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_code:string;title:string};
type Current={units:Array<{lessons:Lesson[]}>};
type Link={id:number;lesson_id:number;relation:string;confidence:number;source_method:string;status:string;source_chunk_id?:number;page_number?:number;text_preview?:string;source_file_id?:number;source_type?:string;source_edition?:string;factual_grounding_authorized:boolean};
type Payload={lesson_id:number;lesson_code:string;lesson_title:string;links:Link[]};

function statusTone(status:string):'good'|'warn'|'bad'|'neutral'{
  if(status==='VERIFIED') return 'good';
  if(status==='REJECTED') return 'bad';
  if(status.includes('CANDIDATE')) return 'warn';
  return 'neutral';
}

export default function SourceLinkReview(){
  const [lessons,setLessons]=useState<Lesson[]>([]);
  const [lessonId,setLessonId]=useState<number|null>(null);
  const [data,setData]=useState<Payload|null>(null);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState<number|null>(null);
  function headers(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`};}

  async function load(targetLessonId?:number){
    setError('');
    try{
      const r1=await fetch(`${API}/admin/current-semester`,{headers:headers()});
      const current:Current=await r1.json();
      if(!r1.ok) throw new Error((current as any).detail||'تعذر تحميل الفصل الحالي');
      const all=current.units.flatMap(unit=>unit.lessons||[]);
      setLessons(all);
      const requested=targetLessonId||Number(new URLSearchParams(window.location.search).get('lesson_id')||0);
      const selected=all.find(item=>item.id===requested)||all[0];
      if(!selected) throw new Error('لا توجد دروس في الفصل الحالي');
      setLessonId(selected.id);
      const r2=await fetch(`${API}/importer/lessons/${selected.id}/source-links`,{headers:headers()});
      const body=await r2.json();
      if(!r2.ok) throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'تعذر تحميل روابط المصادر');
      setData(body);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل روابط المصادر');}
  }
  useEffect(()=>{void load();},[]);

  const counts=useMemo(()=>({
    verified:data?.links.filter(x=>x.status==='VERIFIED').length||0,
    pending:data?.links.filter(x=>x.status!=='VERIFIED'&&x.status!=='REJECTED').length||0,
    rejected:data?.links.filter(x=>x.status==='REJECTED').length||0,
  }),[data]);

  async function chooseLesson(id:number){
    const url=new URL(window.location.href);url.searchParams.set('lesson_id',String(id));window.history.replaceState({},'',url);
    setData(null);setMessage('');await load(id);
  }

  async function act(linkId:number,action:'verify'|'reject'){
    setBusy(linkId);setError('');setMessage('');
    try{
      const r=await fetch(`${API}/importer/lesson-source-links/${linkId}/${action}`,{method:'POST',headers:headers()});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل تحديث الرابط');
      setMessage(action==='verify'?`تم اعتماد Chunk #${b.source_chunk_id||linkId} كمصدر factual للدرس. لم يتم تجاوز بوابات الطبعة أو نطاق الفصل.`:`تم رفض الرابط #${linkId}.`);
      await load(lessonId||undefined);
    }catch(e){setError(e instanceof Error?e.message:'فشل تحديث الرابط');}
    finally{setBusy(null);}
  }

  async function verifyNext(){
    const next=data?.links.find(x=>x.status!=='VERIFIED'&&x.status!=='REJECTED'&&x.factual_grounding_authorized);
    if(next) await act(next.id,'verify');
  }

  return <AdminShell eyebrow="الإدارة ← الفصل الحالي ← مراجعة المصدر" title="مراجعة مصدر الدرس" description="الربط الآلي مجرد اقتراح. لا يدخل أي نص إلى Skill Mapping أو Lesson Generation حتى يتحول الرابط إلى VERIFIED بمراجعة الإدارة.">
    <Card style={{marginBottom:14}}>
      <SectionHeader title="الدرس" description={data?`${data.lesson_code} · ${data.lesson_title}`:'اختر درسًا من الفصل الأول'} aside={data?.links.length?<StatusPill tone={counts.pending?'warn':'good'}>{counts.pending?`${counts.pending} تنتظر المراجعة`:'تمت المراجعة'}</StatusPill>:undefined}/>
      <select value={lessonId||''} onChange={e=>void chooseLesson(Number(e.target.value))} style={{width:'100%',minHeight:46,border:'1px solid #cfd6df',borderRadius:11,padding:'0 12px',background:'#fff',fontSize:15}}>
        {lessons.map(item=><option key={item.id} value={item.id}>{item.lesson_code} · {item.title}</option>)}
      </select>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:14}}>
      <MetricCard label="VERIFIED" value={counts.verified} tone={counts.verified?'good':'neutral'} detail="مصادر وافق عليها Admin"/>
      <MetricCard label="تنتظر المراجعة" value={counts.pending} tone={counts.pending?'warn':'good'} detail="لن تدخل إلى التوليد قبل الاعتماد"/>
      <MetricCard label="مرفوضة" value={counts.rejected} tone={counts.rejected?'bad':'neutral'} detail="مستبعدة من هذا الدرس"/>
    </div>

    {message&&<div style={{marginBottom:12}}><Notice tone="good">{message}</Notice></div>}
    {error&&<div style={{marginBottom:12}}><Notice tone="bad">{error}</Notice></div>}
    {!data&&!error&&<Notice>جارٍ تحميل روابط الدرس…</Notice>}

    {data&&data.links.length===0&&<Notice tone="warn">لا توجد روابط مرشحة. ارجع إلى «الفصل الحالي» واضغط <strong>اقتراح ربط الدروس بالمصدر</strong> بعد جلب المصدر واستخراجه.</Notice>}

    {data&&data.links.length>0&&<Card>
      <SectionHeader title="Source Chunks" description="راجع النص والصفحة ونوع المصدر قبل الاعتماد." aside={counts.pending?<ActionButton onClick={()=>void verifyNext()} disabled={busy!==null}>اعتماد أول مرشح صالح</ActionButton>:undefined}/>
      <div style={{display:'grid',gap:12}}>{data.links.map(link=><article key={link.id} style={{border:'1px solid #e7ebf1',borderRadius:14,padding:14,background:link.status==='VERIFIED'?'#f7fcf9':link.status==='REJECTED'?'#fff8f8':'#fff'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <div><strong>Chunk #{link.source_chunk_id||'—'}</strong><div style={{fontSize:12,color:'#667085',marginTop:3}}>Link #{link.id} · Source #{link.source_file_id||'—'} · page {link.page_number||'—'}</div></div>
          <StatusPill tone={statusTone(link.status)}>{link.status}</StatusPill>
        </div>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:9}}>
          <StatusPill tone={link.factual_grounding_authorized?'good':'bad'}>{link.factual_grounding_authorized?'Factual source allowed':'Factual source blocked'}</StatusPill>
          <StatusPill>{link.source_type||'UNKNOWN'}</StatusPill>
          <StatusPill tone="info">ثقة {Math.round((link.confidence||0)*100)}%</StatusPill>
          <StatusPill>{link.source_edition||'طبعة غير محددة'}</StatusPill>
        </div>
        <div style={{marginTop:11,padding:12,borderRadius:10,background:'#f8fafc',whiteSpace:'pre-wrap',lineHeight:1.75,fontSize:14,maxHeight:260,overflow:'auto'}}>{link.text_preview||'لا يوجد نص مستخرج'}</div>
        <div style={{fontSize:12,color:'#667085',marginTop:8}}>طريقة الربط: {link.source_method}</div>
        <div style={{marginTop:11}}><ButtonRow>
          <ActionButton disabled={busy===link.id||link.status==='VERIFIED'||!link.factual_grounding_authorized} onClick={()=>void act(link.id,'verify')}>✓ اعتماد كمصدر للدرس</ActionButton>
          <ActionButton tone="danger" disabled={busy===link.id||link.status==='REJECTED'} onClick={()=>void act(link.id,'reject')}>رفض الرابط</ActionButton>
        </ButtonRow></div>
      </article>)}</div>
    </Card>}

    <Card style={{marginTop:14,position:'sticky',bottom:10,zIndex:2}}>
      <SectionHeader title="الخطوة التالية" description={counts.verified?'يوجد مصدر VERIFIED. يمكنك الانتقال إلى استخراج/مراجعة المهارات.':'اعتمد Chunk واحدًا صحيحًا على الأقل قبل Skill Mapping.'}/>
      <ButtonRow>
        <ActionLink href={lessonId?`/admin/skill-mapping?lesson_id=${lessonId}`:'/admin/skill-mapping'}>التالي: Skill Mapping</ActionLink>
        <ActionLink href="/admin/current-semester" tone="secondary">الفصل الحالي</ActionLink>
        <ActionLink href="/admin/current-semester/matrix" tone="secondary">مصفوفة الفصل</ActionLink>
      </ButtonRow>
    </Card>
  </AdminShell>;
}
