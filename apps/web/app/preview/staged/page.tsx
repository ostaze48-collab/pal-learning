'use client';

import {useEffect,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type PreviewPayload={
 preview:boolean;
 tracking_disabled:boolean;
 publication_authorized:boolean;
 lesson:{id:number;lesson_code:string;title:string;live_status:string};
 staged_version:{id:number;candidate_id:number;version_label:string;status:string;release_readiness:string};
 snapshot:any;
 qa_snapshot:any;
};

function blockView(block:any,index:number){
 const type=String(block?.block_type||block?.type||'CONTENT').toUpperCase();
 const title=block?.title||'';
 const body=block?.body||block?.text||block?.content?.text||'';
 if(type==='IMAGE') return <div key={index} style={card}><strong>{title||'صورة تعليمية'}</strong><div style={placeholder}>IMAGE PREVIEW</div>{body&&<p>{body}</p>}</div>;
 if(type==='VIDEO') return <div key={index} style={card}><strong>{title||'فيديو/مشهد تعليمي'}</strong><div style={placeholder}>VIDEO PREVIEW</div>{body&&<p>{body}</p>}</div>;
 if(type==='QUESTION') return <div key={index} style={{...card,background:'#fffdf4'}}><small>تحقق من فهمك</small><h3>{title||body||'سؤال'}</h3></div>;
 return <div key={index} style={card}>{title&&<h3>{title}</h3>}{body&&<p style={{lineHeight:1.9}}>{body}</p>}{!body&&block?.content&&<pre style={jsonStyle}>{JSON.stringify(block.content,null,2)}</pre>}</div>;
}

export default function StagedPreviewPage(){
 const [data,setData]=useState<PreviewPayload|null>(null);
 const [error,setError]=useState('');

 useEffect(()=>{
  let cancelled=false;
  async function resolve(){
   try{
    const hash=new URLSearchParams(window.location.hash.replace(/^#/,''));
    const token=hash.get('token')||'';
    window.history.replaceState(null,'',window.location.pathname);
    if(!token) throw new Error('رابط المعاينة لا يحتوي رمزًا صالحًا.');
    const r=await fetch(`${API}/factory/staged-preview/resolve`,{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     cache:'no-store',
     body:JSON.stringify({token}),
    });
    const b=await r.json();
    if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:'انتهت صلاحية رابط المعاينة أو لم يعد متاحًا.');
    if(!cancelled) setData(b);
   }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'تعذر فتح المعاينة');}
  }
  void resolve();
  return()=>{cancelled=true;};
 },[]);

 if(error) return <main style={shell}><div style={warning}><h2>تعذر فتح المعاينة</h2><p>{error}</p><p>اطلب رابط Preview جديدًا من لوحة الإدارة.</p></div></main>;
 if(!data) return <main style={shell}><div style={card}>جارٍ فتح نسخة المعاينة…</div></main>;

 const snapshot=data.snapshot||{};
 const sections=snapshot.sections||[];
 const questions=snapshot.questions||[];
 const summary=snapshot.summary||[];
 const flashcards=snapshot.flashcards||[];

 return <main style={shell}>
  <div style={previewBanner}>معاينة داخلية فقط · لا تحفظ تقدمًا · ليست نسخة منشورة</div>
  <header style={{padding:'18px 4px 10px'}}>
   <div style={{fontSize:13,opacity:.6}}>{data.lesson.lesson_code} · Snapshot #{data.staged_version.id}</div>
   <h1 style={{margin:'6px 0'}}>{data.lesson.title}</h1>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',fontSize:12}}>
    <span style={pill}>STAGING</span><span style={pill}>Release: {data.staged_version.release_readiness}</span><span style={pill}>Live: {data.lesson.live_status}</span>
   </div>
  </header>

  {snapshot.learning_objectives?.length>0&&<section style={card}><h2>أهداف التعلم</h2><ul>{snapshot.learning_objectives.map((x:string,i:number)=><li key={i} style={{marginBottom:7}}>{x}</li>)}</ul></section>}

  {sections.map((section:any,sectionIndex:number)=><section key={sectionIndex} style={{marginTop:18}}>
   <div style={{fontSize:13,opacity:.55}}>القسم {sectionIndex+1}</div>
   <h2 style={{margin:'4px 0 10px'}}>{section.title||`قسم ${sectionIndex+1}`}</h2>
   <div style={{display:'grid',gap:10}}>{(section.blocks||[]).map((block:any,i:number)=>blockView(block,i))}</div>
  </section>)}

  {questions.length>0&&<section style={{...card,marginTop:18}}><h2>اختبر نفسك</h2><div style={{display:'grid',gap:12}}>{questions.map((q:any,i:number)=><div key={i} style={{padding:12,border:'1px solid #e7ebf0',borderRadius:12}}><strong>{i+1}. {q.prompt}</strong>{q.options?.length>0&&<div style={{display:'grid',gap:7,marginTop:10}}>{q.options.map((o:string,j:number)=><div key={j} style={{padding:9,borderRadius:9,background:'#f6f8fb'}}>{o}</div>)}</div>}<small style={{display:'block',marginTop:8,opacity:.55}}>Preview: الإجابة غير مسجلة.</small></div>)}</div></section>}

  {summary.length>0&&<section style={{...card,marginTop:18,background:'#f5fbf7'}}><h2>الملخص</h2>{summary.map((x:any,i:number)=><p key={i}>{typeof x==='string'?x:x.text}</p>)}</section>}

  {flashcards.length>0&&<section style={{marginTop:18}}><h2>بطاقات مراجعة</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>{flashcards.map((x:any,i:number)=><div key={i} style={card}><strong>{x.front}</strong><div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #edf0f4'}}>{x.back}</div></div>)}</div></section>}

  <footer style={{margin:'24px 0 10px',padding:14,borderRadius:12,background:'#fff4e5',fontSize:13}}>
   هذه الصفحة تعرض Snapshot معتمدًا للـStaging فقط. لا يمكن منها النشر، ولا تنشئ Learning Events أو Mastery أو Question Attempts.
  </footer>
 </main>;
}

const shell:React.CSSProperties={maxWidth:760,margin:'0 auto',padding:'14px 14px 32px',direction:'rtl'};
const card:React.CSSProperties={background:'white',border:'1px solid #e6ebf2',borderRadius:16,padding:16,boxShadow:'0 2px 10px rgba(20,35,55,.04)'};
const warning:React.CSSProperties={...card,marginTop:40,background:'#fff4e5'};
const previewBanner:React.CSSProperties={position:'sticky',top:0,zIndex:10,padding:'10px 12px',borderRadius:12,background:'#3c2f7a',color:'white',fontWeight:800,textAlign:'center'};
const pill:React.CSSProperties={padding:'5px 8px',borderRadius:99,background:'#f0f3f7'};
const placeholder:React.CSSProperties={marginTop:10,minHeight:120,borderRadius:12,display:'grid',placeItems:'center',background:'#f4f6f9',fontSize:12,opacity:.6};
const jsonStyle:React.CSSProperties={whiteSpace:'pre-wrap',direction:'ltr',textAlign:'left',fontSize:10,background:'#f6f8fa',padding:8,borderRadius:8};
