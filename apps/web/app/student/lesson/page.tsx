'use client';

import {useEffect,useState} from 'react';
import {apiJson,studentHeaders} from '../../../lib/api';
import {BottomNav,Notice,Pill,PrimaryButton,PrimaryLink,ProgressBar,StudentCard,StudentShell} from '../_components/StudentUI';

type Block={id:number;block_type:string;content:any;order_no:number};
type Section={id:number;section_number:number;title:string;blocks:Block[]};
type LessonPayload={experimental:boolean;book:{title:string;book_code:string};unit:{title:string;unit_number:number};lesson:{id:number;title:string;lesson_code:string;estimated_minutes:number};sections:Section[]};
type Question={id:number;question_code:string;question_type:string;prompt:string;options:string[];difficulty:number;purpose:string};
type Progress={progress_percent:number;mastered_skills:number;skills:Array<{skill_id:number;name_ar:string;mastery_score:number;status:string}>};
type Feedback={correct:boolean;message:string;attempt:number};

const OPTION_LABELS=['أ','ب','ج','د','هـ','و'];

function Timeline({items}:{items:Array<{year:string;name:string;text:string}>}){
  return <div style={{display:'grid',gap:10}}>{items.map((item,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'62px 1fr',gap:10,alignItems:'stretch'}}><div style={{display:'grid',placeItems:'center',borderRadius:12,background:'#eef8f1',color:'#176b3a',fontWeight:900}}>{item.year}</div><div style={{padding:11,border:'1px solid #e7ebf1',borderRadius:12,background:'#fff'}}><strong>{item.name}</strong><div style={{marginTop:4,lineHeight:1.7,color:'#475467'}}>{item.text}</div></div></div>)}</div>;
}

function LessonBlock({block}:{block:Block}){
  const c=block.content||{};
  if(block.block_type==='INFO_CARD') return <div style={{padding:14,borderRadius:14,background:'#f4f9ff',border:'1px solid #d8e8fb'}}><div style={{display:'flex',gap:9,alignItems:'center'}}><span style={{fontSize:25}}>{c.icon||'💡'}</span><div><div style={{fontSize:11,color:'#667085',fontWeight:900}}>{c.label||'معلومة'}</div><strong style={{fontSize:18}}>{c.title||''}</strong></div></div>{c.body&&<p style={{margin:'9px 0 0',lineHeight:1.85}}>{c.body}</p>}</div>;
  if(block.block_type==='TIMELINE') return <div><h3 style={{margin:'0 0 10px'}}>{c.title||'خط زمني'}</h3><Timeline items={c.items||[]}/></div>;
  if(block.block_type==='MATCHING') return <div><h3 style={{margin:'0 0 6px'}}>{c.title||'مطابقة'}</h3><p style={{margin:'0 0 10px',color:'#667085'}}>{c.prompt}</p><div style={{display:'grid',gap:8}}>{(c.pairs||[]).map((p:string[],i:number)=><div key={i} style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,alignItems:'center',padding:10,borderRadius:11,background:'#fafbfc',border:'1px solid #edf0f5'}}><strong>{p[0]}</strong><span>←</span><span>{p[1]}</span></div>)}</div></div>;
  if(block.block_type==='SUMMARY') return <div style={{padding:14,borderRadius:14,background:'#f7fcf9',border:'1px solid #cfe7d7'}}><h3 style={{margin:'0 0 8px'}}>{c.title||'الخلاصة'}</h3><ul style={{margin:0,paddingInlineStart:20,lineHeight:1.9}}>{(c.items||[]).map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div>;
  return <div><h3 style={{margin:'0 0 7px'}}>{c.title||c.label||''}</h3>{c.body&&<p style={{margin:0,lineHeight:1.9,color:'#344054'}}>{c.body}</p>}</div>;
}

export default function LessonPage(){
  const [lesson,setLesson]=useState<LessonPayload|null>(null);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [progress,setProgress]=useState<Progress|null>(null);
  const [selected,setSelected]=useState<Record<number,number>>({});
  const [feedback,setFeedback]=useState<Record<number,Feedback>>({});
  const [busyQuestion,setBusyQuestion]=useState<number|null>(null);
  const [error,setError]=useState('');
  const [tutorOpen,setTutorOpen]=useState(false);
  const [tutorAnswer,setTutorAnswer]=useState('');
  const [tutorQuestion,setTutorQuestion]=useState('');
  const [tutorBusy,setTutorBusy]=useState(false);

  async function load(){
    try{
      const [l,q,p]=await Promise.all([
        apiJson<LessonPayload>('/demo/lesson',{},true),
        apiJson<Question[]>('/demo/questions',{},true),
        apiJson<Progress>('/demo/progress',{},true),
      ]);
      setLesson(l);setQuestions(q);setProgress(p);
    }catch(e:any){setError(e.message==='Authentication required'?'يجب تسجيل الدخول كطالب قبل فتح النسخة التجريبية':e.message||'تعذر تحميل الدرس');}
  }
  useEffect(()=>{void load();},[]);

  const answered=Object.keys(feedback).length;
  const lessonUiProgress=lesson?.sections.length?Math.round(((lesson.sections.length+(questions.length?answered/questions.length:0))/(lesson.sections.length+1))*100):0;

  async function submit(q:Question){
    const answer=selected[q.id];if(answer===undefined)return;
    setBusyQuestion(q.id);
    try{
      const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000'}/demo/questions/${q.id}/attempt`,{method:'POST',headers:studentHeaders(true),body:JSON.stringify({answer,response_time_ms:9000,used_hint:false,used_ai_help:false})});
      const body=await response.json();if(!response.ok)throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'تعذر حفظ المحاولة');
      setFeedback(x=>({...x,[q.id]:{correct:body.correct,message:body.explanation||'',attempt:body.attempt_number}}));
      const p=await apiJson<Progress>('/demo/progress',{},true);setProgress(p);
    }catch(e:any){setError(e.message||'تعذر حفظ المحاولة');}
    finally{setBusyQuestion(null);}
  }

  async function tutor(action:string,freeQuestion?:string){
    setTutorOpen(true);setTutorBusy(true);setTutorAnswer('');
    try{
      const body=await apiJson<{answer:string;notice:string}>('/demo/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,question:freeQuestion||null})},true);
      setTutorAnswer(body.answer);
    }catch(e:any){setTutorAnswer(e.message||'تعذر تشغيل مساعد الدرس');}
    finally{setTutorBusy(false);}
  }

  return <StudentShell title={lesson?.lesson.title||'المجهر واكتشاف الخلية'} subtitle={lesson?`${lesson.book.title} ← الوحدة ${lesson.unit.unit_number}: ${lesson.unit.title}`:'جارٍ تحميل الدرس…'} backHref="/student">
    {error&&<div style={{marginBottom:14}}><Notice tone="bad">{error}{error.includes('تسجيل الدخول')&&<div style={{marginTop:9}}><PrimaryLink href="/student/login">تسجيل الدخول</PrimaryLink></div>}</Notice></div>}
    {!lesson&&!error&&<Notice>جارٍ تحميل الدرس التفاعلي…</Notice>}

    {lesson&&<>
      <StudentCard style={{marginBottom:14,background:'linear-gradient(135deg,#f1fbf4,#f4f8ff)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start',flexWrap:'wrap'}}><div><Pill tone="good">علوم · صف خامس</Pill><div style={{fontSize:13,color:'#667085',marginTop:8}}>{lesson.lesson.estimated_minutes} دقيقة · {lesson.sections.length} محطات تعلم · {questions.length} أسئلة</div></div><div style={{fontSize:42}}>🔬</div></div>
        <div style={{marginTop:14}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}}><strong>تقدم الجلسة</strong><span>{Math.min(100,lessonUiProgress)}%</span></div><ProgressBar value={lessonUiProgress}/></div>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:12}}>{lesson.sections.map(s=><a key={s.id} href={`#section-${s.section_number}`} style={{padding:'6px 9px',borderRadius:999,background:'#fff',border:'1px solid #dce3eb',fontSize:11,textDecoration:'none',color:'#344054',fontWeight:700}}>{s.section_number}. {s.title.split(':')[0]}</a>)}</div>
      </StudentCard>

      <div style={{display:'grid',gap:14}}>{lesson.sections.map(section=><StudentCard key={section.id} style={{scrollMarginTop:12}}>
        <div id={`section-${section.section_number}`} style={{scrollMarginTop:15}}/>
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:13}}><span style={{display:'grid',placeItems:'center',width:36,height:36,borderRadius:99,background:'#176b3a',color:'#fff',fontWeight:900}}>{section.section_number}</span><h2 style={{margin:0,fontSize:21}}>{section.title}</h2></div>
        <div style={{display:'grid',gap:12}}>{section.blocks.map(block=><LessonBlock key={block.id} block={block}/>)}</div>
      </StudentCard>)}</div>

      <div id="questions" style={{scrollMarginTop:12}}/>
      <StudentCard style={{marginTop:14,background:'#fffdf7',borderColor:'#eadca8'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'center'}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>تحقق من فهمك</div><h2 style={{margin:'3px 0 0'}}>أسئلة الدرس</h2></div><Pill tone={answered===questions.length&&questions.length?'good':'warn'}>{answered}/{questions.length} مجاب</Pill></div>
      </StudentCard>

      <div style={{display:'grid',gap:12,marginTop:12}}>{questions.map((q,index)=>{
        const f=feedback[q.id];
        return <StudentCard key={q.id}>
          <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}><Pill tone="info">سؤال {index+1}</Pill><Pill>{q.purpose}</Pill></div>
          <h3 style={{fontSize:18,lineHeight:1.6,margin:'12px 0'}}>{q.prompt}</h3>
          <div style={{display:'grid',gap:8}}>{q.options.map((option,i)=><button key={i} onClick={()=>!f&&setSelected(s=>({...s,[q.id]:i}))} disabled={!!f} style={{textAlign:'right',padding:'12px 13px',borderRadius:12,border:selected[q.id]===i?'2px solid #176b3a':'1px solid #d7dde6',background:selected[q.id]===i?'#f1faf4':'#fff',fontSize:15,cursor:f?'default':'pointer'}}><span style={{display:'inline-grid',placeItems:'center',width:24,height:24,borderRadius:99,background:selected[q.id]===i?'#176b3a':'#f2f4f7',color:selected[q.id]===i?'#fff':'#344054',fontWeight:900,marginInlineEnd:8}}>{OPTION_LABELS[i]||String(i+1)}</span>{option}</button>)}</div>
          {!f&&<div style={{marginTop:11}}><PrimaryButton disabled={selected[q.id]===undefined||busyQuestion===q.id} onClick={()=>void submit(q)}>{busyQuestion===q.id?'جارٍ الحفظ…':'تحقق واحفظ التقدم'}</PrimaryButton></div>}
          {f&&<div style={{marginTop:12}}><Notice tone={f.correct?'good':'warn'}><strong>{f.correct?'إجابة صحيحة ✓':'تحتاج مراجعة'}</strong><div style={{marginTop:4}}>{f.message}</div><div style={{fontSize:11,marginTop:5}}>المحاولة رقم {f.attempt}</div></Notice></div>}
        </StudentCard>})}</div>

      <StudentCard style={{marginTop:14}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>Mastery</div><h2 style={{margin:'3px 0 0'}}>تقدمك حسب المهارة</h2></div><strong style={{fontSize:26}}>{progress?.progress_percent||0}%</strong></div>
        <div style={{marginTop:9}}><ProgressBar value={progress?.progress_percent||0}/></div>
        <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}><PrimaryLink href="/student/progress">تفاصيل المهارات</PrimaryLink><PrimaryLink href="/student/recovery" secondary>مراجعة ذكية</PrimaryLink></div>
      </StudentCard>

      <button onClick={()=>setTutorOpen(x=>!x)} aria-label="مساعد الدرس" style={{position:'fixed',left:16,bottom:84,zIndex:30,width:58,height:58,borderRadius:99,border:0,background:'#14213d',color:'#fff',fontSize:24,boxShadow:'0 10px 30px rgba(20,33,61,.25)',cursor:'pointer'}}>✦</button>
      {tutorOpen&&<div style={{position:'fixed',left:12,right:12,bottom:150,zIndex:29,maxWidth:540,margin:'0 auto',background:'#fff',border:'1px solid #dce2ea',borderRadius:18,padding:14,boxShadow:'0 18px 60px rgba(20,33,61,.22)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}><div><strong>مساعد الدرس</strong><div style={{fontSize:11,color:'#667085'}}>مقيد بالمجهر واكتشاف الخلية</div></div><button onClick={()=>setTutorOpen(false)} aria-label="إغلاق" style={{border:0,background:'transparent',fontSize:22}}>×</button></div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>{[['explain_simple','اشرح أبسط'],['example','أعطني مثالًا'],['hint','أعطني تلميحًا'],['compare','قارن العلماء'],['quiz','اختبرني']].map(([action,label])=><button key={action} onClick={()=>void tutor(action)} disabled={tutorBusy} style={{padding:'7px 9px',borderRadius:999,border:'1px solid #d8dee7',background:'#fff',fontSize:12}}>{label}</button>)}</div>
        <div style={{display:'flex',gap:7,marginTop:10}}><input value={tutorQuestion} onChange={e=>setTutorQuestion(e.target.value)} placeholder="اسأل عن الدرس…" style={{flex:1,minWidth:0,padding:'10px 11px',border:'1px solid #ccd5df',borderRadius:10}}/><button onClick={()=>void tutor('free',tutorQuestion)} disabled={!tutorQuestion.trim()||tutorBusy} style={{padding:'0 13px',border:0,borderRadius:10,background:'#176b3a',color:'#fff',fontWeight:800}}>إرسال</button></div>
        <div style={{marginTop:10,minHeight:48,padding:10,borderRadius:11,background:'#f8fafc',lineHeight:1.7,fontSize:14}}>{tutorBusy?'يفكر داخل محتوى الدرس…':tutorAnswer||'اختر أمرًا سريعًا أو اكتب سؤالك.'}</div>
      </div>}
      <BottomNav active="lesson"/>
    </>}
  </StudentShell>;
}
