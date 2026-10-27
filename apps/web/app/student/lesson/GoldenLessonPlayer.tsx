'use client';

import {useEffect,useMemo,useState} from 'react';
import {apiJson,studentHeaders} from '../../../lib/api';
import {BottomNav,Notice,Pill,PrimaryButton,PrimaryLink,ProgressBar,StudentCard,StudentShell} from '../_components/StudentUI';

type Block={id:number;block_type:string;content:any;order_no:number};
type Section={id:number;section_number:number;title:string;blocks:Block[]};
type LessonPayload={experimental:boolean;book:{title:string;book_code:string};unit:{title:string;unit_number:number};lesson:{id:number;title:string;lesson_code:string;estimated_minutes:number};sections:Section[]};
type Question={id:number;question_code:string;question_type:string;prompt:string;options:string[];difficulty:number;purpose:string};
type Progress={progress_percent:number;mastered_skills:number;skills:Array<{skill_id:number;name_ar:string;mastery_score:number;status:string}>};
type Feedback={correct:boolean;message:string;attempt:number;restored?:boolean};
type SessionState={answered_questions:number;total_questions:number;remaining_questions:number;completed_questions:boolean;completion_percent:number;questions:Array<{question_id:number;answered:boolean;latest_attempt:null|{attempt_number:number;answer:number|string;correct:boolean}}>};

type Step=
  |{kind:'section';key:string;title:string;section:Section}
  |{kind:'challenge';key:string;title:string};

const OPTION_LABELS=['أ','ب','ج','د','هـ','و'];

function Timeline({items}:{items:Array<{year:string;name:string;text:string}>}){
  return <div style={{display:'grid',gap:10}}>{items.map((item,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'72px 1fr',gap:10,alignItems:'stretch'}}><div style={{display:'grid',placeItems:'center',borderRadius:14,background:'#eef8f1',color:'#176b3a',fontWeight:900,padding:8,textAlign:'center'}}>{item.year}</div><div style={{padding:12,border:'1px solid #e7ebf1',borderRadius:14,background:'#fff'}}><strong>{item.name}</strong><div style={{marginTop:4,lineHeight:1.8,color:'#475467'}}>{item.text}</div></div></div>)}</div>;
}

function VirtualMicroscope({content}:{content:any}){
  const levels:Array<{label:string;caption:string;magnification:string}>=content.levels||[];
  const [level,setLevel]=useState(0);
  const [lightOn,setLightOn]=useState(false);
  const [focus,setFocus]=useState(30);
  const current=levels[level]||{label:'',caption:'',magnification:''};
  const isMicroscope=level===2;
  const focused=!isMicroscope||focus>=82;
  const cells=isMicroscope?30:level===1?9:1;
  const blur=isMicroscope?Math.max(0,(82-focus)/12):0;
  const success=isMicroscope&&lightOn&&focused;

  return <div style={{padding:14,borderRadius:18,border:'1px solid #d7e4dc',background:'linear-gradient(135deg,#f8fcf9,#f7f9ff)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start',flexWrap:'wrap'}}>
      <div><div style={{fontSize:11,color:'#667085',fontWeight:900}}>مختبر افتراضي</div><h3 style={{margin:'4px 0 5px',fontSize:20}}>{content.title||'جرّب التكبير بنفسك'}</h3><p style={{margin:0,color:'#526071',lineHeight:1.8}}>{content.prompt}</p></div>
      <Pill tone={success?'good':'info'}>{success?'تم الضبط ✓':current.magnification}</Pill>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:7,marginTop:14}}>{levels.map((row,i)=><button key={row.label} onClick={()=>setLevel(i)} style={{padding:'10px 6px',borderRadius:12,border:i===level?'2px solid #176b3a':'1px solid #d7dde6',background:i===level?'#eef9f1':'#fff',fontWeight:800,fontSize:12,cursor:'pointer'}}>{i===0?'👁️ ':i===1?'🔍 ':'🔬 '}{row.label}</button>)}</div>

    {isMicroscope&&<div style={{display:'grid',gap:10,marginTop:12,padding:12,borderRadius:14,background:'#fff',border:'1px solid #e5e9ef'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><div><strong>1. شغّل مصدر الضوء</strong><div style={{fontSize:12,color:'#667085',marginTop:2}}>بدون الضوء لن تظهر العينة بوضوح.</div></div><button onClick={()=>setLightOn(v=>!v)} style={{minWidth:80,padding:'9px 12px',borderRadius:999,border:'1px solid #ccd5df',background:lightOn?'#176b3a':'#f2f4f7',color:lightOn?'#fff':'#344054',fontWeight:900}}>{lightOn?'مضاء':'تشغيل'}</button></div>
      <div><div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:800}}><span>2. اضبط التركيز</span><span>{focus}%</span></div><input aria-label="ضبط التركيز" type="range" min="0" max="100" value={focus} onChange={e=>setFocus(Number(e.target.value))} style={{width:'100%',marginTop:8}}/><div style={{fontSize:12,color:'#667085'}}>حرّك الضابط حتى تصبح الصورة حادة وواضحة.</div></div>
    </div>}

    <div style={{marginTop:12,minHeight:210,borderRadius:16,border:'1px solid #dbc9aa',background:lightOn||!isMicroscope?'#b98555':'#3d342f',padding:level===0?22:12,display:'grid',gridTemplateColumns:level===0?'1fr':`repeat(${level===1?3:6},1fr)`,gap:level===2?3:7,alignItems:'stretch',overflow:'hidden',transition:'all .2s',filter:`blur(${blur}px)`,opacity:isMicroscope&&!lightOn?.35:1}}>
      {Array.from({length:cells}).map((_,i)=><div key={i} style={{minHeight:level===0?158:level===1?52:27,borderRadius:level===0?13:5,border:level===0?'0':'2px solid rgba(78,48,25,.55)',background:level===0?'linear-gradient(135deg,#c8935e,#9e683d)':i%3===0?'rgba(242,213,170,.72)':'rgba(221,180,128,.72)',boxShadow:level===2?'inset 0 0 0 1px rgba(255,255,255,.22)':'none'}}>{level===0&&<div style={{display:'grid',height:'100%',placeItems:'center',color:'#fff7ec',fontWeight:900,fontSize:20}}>قطعة فلين</div>}</div>)}
    </div>

    <div style={{marginTop:11,padding:11,borderRadius:12,background:'#fff',border:'1px solid #e6eaf0',lineHeight:1.8}}><strong>{current.label}:</strong> {current.caption}</div>
    {success&&<div style={{marginTop:9}}><Notice tone="good"><strong>أحسنت!</strong> شغّلت الضوء وضبطت التركيز، فأصبحت الحجرات الصغيرة في الفلين واضحة. هذه هي لحظة الاكتشاف التي نريد أن يتذكرها الطالب.</Notice></div>}
  </div>;
}

function LessonBlock({block}:{block:Block}){
  const c=block.content||{};
  if(block.block_type==='INFO_CARD') return <div style={{padding:14,borderRadius:15,background:'#f4f9ff',border:'1px solid #d8e8fb'}}><div style={{display:'flex',gap:9,alignItems:'center'}}><span style={{fontSize:27}}>{c.icon||'💡'}</span><div><div style={{fontSize:11,color:'#667085',fontWeight:900}}>{c.label||'معلومة'}</div><strong style={{fontSize:18}}>{c.title||''}</strong></div></div>{c.body&&<p style={{margin:'9px 0 0',lineHeight:1.9}}>{c.body}</p>}</div>;
  if(block.block_type==='MICROSCOPE_ZOOM') return <VirtualMicroscope content={c}/>;
  if(block.block_type==='TIMELINE') return <div><h3 style={{margin:'0 0 10px'}}>{c.title||'خط زمني'}</h3><Timeline items={c.items||[]}/></div>;
  if(block.block_type==='MATCHING') return <div><h3 style={{margin:'0 0 6px'}}>{c.title||'مطابقة'}</h3><p style={{margin:'0 0 10px',color:'#667085'}}>{c.prompt}</p><div style={{display:'grid',gap:8}}>{(c.pairs||[]).map((p:string[],i:number)=><div key={i} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto minmax(0,1fr)',gap:8,padding:10,borderRadius:12,background:'#fafbfc',border:'1px solid #edf0f5',alignItems:'center'}}><strong>{p[0]}</strong><span>←</span><span>{p[1]}</span></div>)}</div></div>;
  if(block.block_type==='SUMMARY') return <div style={{padding:14,borderRadius:15,background:'#f7fcf9',border:'1px solid #cfe7d7'}}><h3 style={{margin:'0 0 8px'}}>{c.title||'الخلاصة'}</h3><ul style={{margin:0,paddingInlineStart:20,lineHeight:2}}>{(c.items||[]).map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div>;
  return <div><h3 style={{margin:'0 0 7px'}}>{c.title||c.label||''}</h3>{c.body&&<p style={{margin:0,lineHeight:1.95,color:'#344054'}}>{c.body}</p>}</div>;
}

function QuestionCard({q,index,selected,feedback,busy,onSelect,onSubmit}:{q:Question;index:number;selected:number|undefined;feedback:Feedback|undefined;busy:boolean;onSelect:(value:number)=>void;onSubmit:()=>void}){
  return <StudentCard>
    <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}><Pill tone="info">سؤال {index+1}</Pill><Pill>{q.purpose}</Pill></div>
    <h3 style={{fontSize:19,lineHeight:1.7,margin:'12px 0'}}>{q.prompt}</h3>
    <div style={{display:'grid',gap:8}}>{q.options.map((option,i)=><button key={i} onClick={()=>!feedback&&onSelect(i)} disabled={!!feedback} style={{textAlign:'right',padding:'12px 13px',borderRadius:12,border:selected===i?'2px solid #176b3a':'1px solid #d7dde6',background:selected===i?'#f1faf4':'#fff',fontSize:15,cursor:feedback?'default':'pointer'}}><span style={{display:'inline-grid',placeItems:'center',width:25,height:25,borderRadius:99,background:selected===i?'#176b3a':'#f2f4f7',color:selected===i?'#fff':'#344054',fontWeight:900,marginInlineEnd:8}}>{OPTION_LABELS[i]||String(i+1)}</span>{option}</button>)}</div>
    {!feedback&&<div style={{marginTop:12}}><PrimaryButton disabled={selected===undefined||busy} onClick={onSubmit}>{busy?'جارٍ الحفظ…':'تحقق من إجابتي'}</PrimaryButton></div>}
    {feedback&&<div style={{marginTop:12}}><Notice tone={feedback.correct?'good':'warn'}><strong>{feedback.correct?'إجابة صحيحة ✓':'تحتاج مراجعة'}</strong><div style={{marginTop:4}}>{feedback.message}</div><div style={{fontSize:11,marginTop:5}}>{feedback.restored?'محاولة محفوظة · ':''}المحاولة رقم {feedback.attempt}</div></Notice></div>}
  </StudentCard>;
}

export default function GoldenLessonPlayer(){
  const [lesson,setLesson]=useState<LessonPayload|null>(null);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [progress,setProgress]=useState<Progress|null>(null);
  const [session,setSession]=useState<SessionState|null>(null);
  const [selected,setSelected]=useState<Record<number,number>>({});
  const [feedback,setFeedback]=useState<Record<number,Feedback>>({});
  const [busyQuestion,setBusyQuestion]=useState<number|null>(null);
  const [error,setError]=useState('');
  const [stepIndex,setStepIndex]=useState(0);
  const [questionIndex,setQuestionIndex]=useState(0);
  const [tutorOpen,setTutorOpen]=useState(false);
  const [tutorAnswer,setTutorAnswer]=useState('');
  const [tutorQuestion,setTutorQuestion]=useState('');
  const [tutorBusy,setTutorBusy]=useState(false);

  async function load(){
    try{
      const [l,q,p,s]=await Promise.all([
        apiJson<LessonPayload>('/demo/lesson',{},true),
        apiJson<Question[]>('/demo/questions',{},true),
        apiJson<Progress>('/demo/progress',{},true),
        apiJson<SessionState>('/demo/session-state',{},true),
      ]);
      const restoredFeedback:Record<number,Feedback>={};
      const restoredSelected:Record<number,number>={};
      for(const row of s.questions){
        const a=row.latest_attempt;
        if(!a)continue;
        if(typeof a.answer==='number')restoredSelected[row.question_id]=a.answer;
        restoredFeedback[row.question_id]={correct:a.correct,attempt:a.attempt_number,restored:true,message:'تم استعادة محاولتك السابقة من سجل التعلم.'};
      }
      setLesson(l);setQuestions(q);setProgress(p);setSession(s);setSelected(restoredSelected);setFeedback(restoredFeedback);
      const firstUnanswered=q.findIndex(item=>!restoredFeedback[item.id]);
      if(firstUnanswered>=0)setQuestionIndex(firstUnanswered);
      const saved=window.localStorage.getItem(`pal-learning:${l.lesson.lesson_code}:step`);
      if(saved!==null){const n=Number(saved);if(Number.isFinite(n))setStepIndex(Math.max(0,Math.min(l.sections.length,n)));}
    }catch(e:any){setError(e.message==='Authentication required'?'يجب تسجيل الدخول كطالب قبل فتح النسخة التجريبية':e.message||'تعذر تحميل الدرس');}
  }

  useEffect(()=>{void load();},[]);

  const steps=useMemo<Step[]>(()=>lesson?[...lesson.sections.map(section=>({kind:'section' as const,key:`section-${section.id}`,title:section.title,section})),{kind:'challenge' as const,key:'challenge',title:'تحدي المجهر'}]:[],[lesson]);
  const activeStep=steps[stepIndex];
  const answered=Object.keys(feedback).length;
  const completedQuestions=questions.length>0&&answered>=questions.length;
  const stepProgress=steps.length?Math.round(((stepIndex+1)/steps.length)*100):0;
  const currentQuestion=questions[questionIndex];

  useEffect(()=>{
    if(!lesson)return;
    window.localStorage.setItem(`pal-learning:${lesson.lesson.lesson_code}:step`,String(stepIndex));
    window.scrollTo({top:0,behavior:'smooth'});
  },[lesson,stepIndex]);

  async function submit(q:Question){
    const answer=selected[q.id];if(answer===undefined)return;
    setBusyQuestion(q.id);
    try{
      const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000'}/demo/questions/${q.id}/attempt`,{method:'POST',headers:studentHeaders(true),body:JSON.stringify({answer,response_time_ms:9000,used_hint:false,used_ai_help:false})});
      const body=await response.json();if(!response.ok)throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'تعذر حفظ المحاولة');
      setFeedback(x=>({...x,[q.id]:{correct:body.correct,message:body.explanation||'',attempt:body.attempt_number}}));
      const [p,s]=await Promise.all([apiJson<Progress>('/demo/progress',{},true),apiJson<SessionState>('/demo/session-state',{},true)]);setProgress(p);setSession(s);
    }catch(e:any){setError(e.message||'تعذر حفظ المحاولة');}
    finally{setBusyQuestion(null);}
  }

  async function tutor(action:string,freeQuestion?:string){
    setTutorOpen(true);setTutorBusy(true);setTutorAnswer('');
    try{
      const body=await apiJson<{answer:string}>('/demo/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,question:freeQuestion||null})},true);
      setTutorAnswer(body.answer);
    }catch(e:any){setTutorAnswer(e.message||'تعذر تشغيل مساعد الدرس');}
    finally{setTutorBusy(false);}
  }

  function nextStep(){setStepIndex(i=>Math.min(steps.length-1,i+1));}
  function previousStep(){setStepIndex(i=>Math.max(0,i-1));}

  return <StudentShell title={lesson?.lesson.title||'المجهر واكتشاف الخلية'} subtitle={lesson?`${lesson.book.title} ← الوحدة ${lesson.unit.unit_number}: ${lesson.unit.title}`:'جارٍ تحميل الدرس…'} backHref="/student">
    {error&&<div style={{marginBottom:14}}><Notice tone="bad">{error}{error.includes('تسجيل الدخول')&&<div style={{marginTop:9}}><PrimaryLink href="/student/login">تسجيل الدخول</PrimaryLink></div>}</Notice></div>}
    {!lesson&&!error&&<Notice>جارٍ تحميل الدرس التفاعلي…</Notice>}

    {lesson&&activeStep&&<>
      {session&&session.answered_questions>0&&!session.completed_questions&&stepIndex===0&&<div style={{marginBottom:12}}><Notice tone="info">تمت استعادة تقدمك السابق: {session.answered_questions}/{session.total_questions} أسئلة محفوظة.</Notice></div>}

      <StudentCard style={{marginBottom:14,background:'linear-gradient(135deg,#f1fbf4,#f4f8ff)',position:'sticky',top:8,zIndex:8,boxShadow:'0 8px 28px rgba(20,33,61,.08)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><div><Pill tone="good">علوم · صف خامس</Pill><div style={{fontSize:12,color:'#667085',marginTop:6}}>{lesson.lesson.estimated_minutes} دقيقة · Golden Lesson 001</div></div><div style={{fontSize:38}}>🔬</div></div>
        <div style={{marginTop:12}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}}><strong>المرحلة {stepIndex+1} من {steps.length}</strong><span>{stepProgress}%</span></div><ProgressBar value={stepProgress}/></div>
      </StudentCard>

      {activeStep.kind==='section'&&<StudentCard>
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:14}}><span style={{display:'grid',placeItems:'center',width:38,height:38,borderRadius:99,background:'#176b3a',color:'#fff',fontWeight:900}}>{activeStep.section.section_number}</span><div><div style={{fontSize:11,color:'#667085',fontWeight:900}}>محطة تعلم</div><h2 style={{margin:'2px 0 0',fontSize:22}}>{activeStep.title}</h2></div></div>
        <div style={{display:'grid',gap:13}}>{activeStep.section.blocks.map(block=><LessonBlock key={block.id} block={block}/>)}</div>
      </StudentCard>}

      {activeStep.kind==='challenge'&&<div style={{display:'grid',gap:12}}>
        <StudentCard style={{background:'#fffdf7',borderColor:'#eadca8'}}><div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'center'}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>تحدي الدرس</div><h2 style={{margin:'3px 0 0'}}>اختبر فهمك خطوة بخطوة</h2></div><Pill tone={completedQuestions?'good':'warn'}>{answered}/{questions.length}</Pill></div></StudentCard>
        {currentQuestion&&<QuestionCard q={currentQuestion} index={questionIndex} selected={selected[currentQuestion.id]} feedback={feedback[currentQuestion.id]} busy={busyQuestion===currentQuestion.id} onSelect={value=>setSelected(s=>({...s,[currentQuestion.id]:value}))} onSubmit={()=>void submit(currentQuestion)}/>} 
        <StudentCard><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}><button onClick={()=>setQuestionIndex(i=>Math.max(0,i-1))} disabled={questionIndex===0} style={{padding:'9px 12px',borderRadius:10,border:'1px solid #d7dde6',background:'#fff',fontWeight:800}}>السؤال السابق</button><span style={{fontSize:12,color:'#667085'}}>{Math.min(questionIndex+1,questions.length)} / {questions.length}</span><button onClick={()=>setQuestionIndex(i=>Math.min(questions.length-1,i+1))} disabled={questionIndex>=questions.length-1||!feedback[currentQuestion?.id]} style={{padding:'9px 12px',borderRadius:10,border:'1px solid #d7dde6',background:'#fff',fontWeight:800}}>السؤال التالي</button></div></StudentCard>
        {completedQuestions&&<StudentCard style={{background:'linear-gradient(135deg,#effaf2,#eef5ff)',borderColor:'#bfe0ca'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><Pill tone="good">أكملت التحدي ✓</Pill><h2 style={{margin:'8px 0 5px',fontSize:22}}>نتيجة الدرس جاهزة</h2><p style={{margin:0,color:'#526071',lineHeight:1.7}}>سيتم عرض الإتقان حسب المهارة ونقطة المراجعة المقترحة.</p></div><PrimaryLink href="/student/result">عرض النتيجة</PrimaryLink></div></StudentCard>}
      </div>}

      <StudentCard style={{marginTop:14}}><div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>الإتقان</div><strong style={{fontSize:16}}>تقدمك حسب المهارة</strong></div><strong style={{fontSize:26}}>{progress?.progress_percent||0}%</strong></div><div style={{marginTop:9}}><ProgressBar value={progress?.progress_percent||0}/></div></StudentCard>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginTop:14,paddingBottom:92}}><button onClick={previousStep} disabled={stepIndex===0} style={{minHeight:48,borderRadius:13,border:'1px solid #d5dce5',background:'#fff',fontWeight:900,fontSize:15}}>السابق</button>{stepIndex<steps.length-1?<button onClick={nextStep} style={{minHeight:48,borderRadius:13,border:0,background:'#176b3a',color:'#fff',fontWeight:900,fontSize:15}}>التالي</button>:<PrimaryLink href={completedQuestions?'/student/result':'/student/recovery'}>{completedQuestions?'النتيجة':'مراجعة ذكية'}</PrimaryLink>}</div>

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
