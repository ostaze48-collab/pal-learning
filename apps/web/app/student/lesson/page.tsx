'use client';
import {useEffect,useState} from 'react';
import {apiJson,findFirstPublishedLesson,studentHeaders} from '../../../lib/api';

type Question={id:number;prompt:string;options:any[];skills:any[]};

function Block({block}:{block:any}){
  const c=block.content||{};
  if(block.block_type==='SUMMARY') return <div><strong>الخلاصة</strong><ul>{(c.items||[]).map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div>;
  if(block.block_type==='MATCHING') return <div><strong>{c.prompt}</strong><ul>{(c.pairs||[]).map((p:any[],i:number)=><li key={i}>{p[0]} ← {p[1]}</li>)}</ul></div>;
  if(block.block_type==='DRAG_DROP') return <div><strong>{c.prompt}</strong><p>{(c.items||[]).join(' · ')}</p></div>;
  return <div><strong>{c.title||c.label||''}</strong>{c.body&&<p style={{lineHeight:1.9}}>{c.body}</p>}</div>;
}

export default function LessonPage(){
  const [lesson,setLesson]=useState<any>(null);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [selected,setSelected]=useState<Record<number,number>>({});
  const [feedback,setFeedback]=useState<Record<number,string>>({});
  const [error,setError]=useState('');

  useEffect(()=>{
    (async()=>{
      try{
        const first=await findFirstPublishedLesson();
        if(!first) throw new Error('لا يوجد درس منشور بعد');
        const [l,q]=await Promise.all([
          apiJson<any>(`/curriculum/lessons/${first.lesson.id}`),
          apiJson<Question[]>(`/curriculum/lessons/${first.lesson.id}/questions`)
        ]);
        setLesson({...l,book:first.book,unit:first.unit});setQuestions(q);
      }catch(e:any){setError(e.message||'تعذر تحميل الدرس')}
    })();
  },[]);

  async function submit(q:Question){
    const answer=selected[q.id];
    if(answer===undefined)return;
    setFeedback(x=>({...x,[q.id]:'جارٍ حفظ المحاولة…'}));
    try{
      const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000'}/learning/questions/${q.id}/attempt`,{
        method:'POST',headers:studentHeaders(true),body:JSON.stringify({answer,response_time_ms:9000,used_hint:false,used_ai_help:false})
      });
      const body=await response.json();
      if(!response.ok) throw new Error(body.detail||'تعذر الحفظ');
      setFeedback(x=>({...x,[q.id]:(body.correct?'إجابة صحيحة. ':'تحتاج مراجعة. ')+(body.explanation||'')}));
    }catch(e:any){setFeedback(x=>({...x,[q.id]:e.message||'تعذر حفظ المحاولة'}));}
  }

  return <main style={{maxWidth:860,margin:'28px auto',padding:18}}>
    {error&&<div style={{padding:14,background:'#ffecec',borderRadius:12}}>{error}</div>}
    <div style={{fontSize:14,opacity:.7}}>{lesson?`${lesson.book.title} ← ${lesson.unit.title}`:'جارٍ التحميل…'}</div>
    <h1>{lesson?.title||'الدرس'}</h1><p style={{opacity:.75}}>{lesson?.estimated_minutes?`${lesson.estimated_minutes} دقيقة`:''}</p>
    <div style={{display:'grid',gap:14}}>{lesson?.sections?.map((section:any)=><article key={section.id} style={{background:'white',padding:20,borderRadius:18,border:'1px solid #e8edf5'}}><div style={{display:'flex',gap:12,alignItems:'center'}}><span style={{display:'grid',placeItems:'center',width:34,height:34,borderRadius:99,background:'#1f6feb',color:'white',fontWeight:700}}>{section.section_number}</span><h2 style={{margin:0,fontSize:20}}>{section.title}</h2></div><div style={{marginTop:12,display:'grid',gap:10}}>{section.blocks.map((b:any)=><Block key={b.id} block={b}/>)}</div></article>)}</div>
    {questions.map(q=><section key={q.id} style={{marginTop:18,background:'white',padding:20,borderRadius:18,border:'1px solid #e8edf5'}}><h2>تحقق من فهمك</h2><p>{q.prompt}</p>{(q.options||[]).map((x:any,i:number)=><button key={i} onClick={()=>setSelected(s=>({...s,[q.id]:i}))} style={{margin:5,padding:'10px 14px',borderRadius:10,border:selected[q.id]===i?'2px solid #1f6feb':'1px solid #ccd5e3',background:'white'}}>{String(x)}</button>)}<div><button onClick={()=>submit(q)} style={{marginTop:10,padding:'10px 14px',border:0,borderRadius:10,background:'#14213d',color:'white'}}>تحقق واحفظ التقدم</button></div>{feedback[q.id]&&<p>{feedback[q.id]}</p>}</section>)}
  </main>
}
