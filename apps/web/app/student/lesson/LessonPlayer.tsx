'use client';

import {useEffect,useMemo,useState} from 'react';
import {apiJson,studentHeaders} from '../../../lib/api';
import {BottomNav,Notice,Pill,PrimaryButton,PrimaryLink,ProgressBar,StudentCard,StudentShell} from '../_components/StudentUI';
import {LessonBlock,LessonBlockData,lessonBlockText} from './LessonContentBlocks';
import {ConceptMapSpec,getScienceLessonTemplate,PredictionSpec} from './scienceLessonTemplates';

type Section={id:number;section_number:number;title:string;blocks:LessonBlockData[]};
type LessonPayload={experimental:boolean;tutor_supported?:boolean;book:{id?:number;title:string;book_code:string};unit:{id?:number;title:string;unit_number:number};lesson:{id:number;title:string;lesson_code:string;estimated_minutes:number};sections:Section[]};
type Question={id:number;question_code:string;question_type:string;prompt:string;options:string[];difficulty:number;purpose:string};
type Progress={progress_percent:number;mastered_skills:number;skills:Array<{skill_id:number;name_ar:string;mastery_score:number;status:string}>};
type Feedback={correct:boolean;message:string;attempt:number;restored?:boolean};
type SessionState={answered_questions:number;total_questions:number;remaining_questions:number;completed_questions:boolean;completion_percent:number;questions:Array<{question_id:number;answered:boolean;latest_attempt:null|{attempt_number:number;answer:number|string;correct:boolean}}>};
type CachePayload={lesson:LessonPayload;questions:Question[]};
type Step={kind:'section';key:string;title:string;section:Section}|{kind:'prediction'|'concept'|'challenge'|'achievement';key:string;title:string};

const OPTION_LABELS=['أ','ب','ج','د','هـ','و'];
const buttonStyle={padding:'9px 12px',borderRadius:10,border:'1px solid #d7dde6',background:'#fff',fontWeight:800,cursor:'pointer'} as const;

function speakArabic(text:string){
  if(typeof window==='undefined'||!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='ar';utterance.rate=.9;
  window.speechSynthesis.speak(utterance);
}

function AudioButton({text}:{text:string}){
  return <button onClick={()=>speakArabic(text)} aria-label="استمع إلى المحتوى" style={{...buttonStyle,padding:'7px 10px',fontSize:12}}>🔊 استمع</button>;
}

function PredictionCard({spec}:{spec:PredictionSpec}){
  const [selected,setSelected]=useState<number|null>(null);
  const [revealed,setRevealed]=useState(false);
  const correct=selected===spec.correctIndex;
  return <StudentCard style={{background:'linear-gradient(135deg,#fffbea,#fff7d6)',borderColor:'#efd67c'}}>
    <Pill tone="warn">{spec.label}</Pill><h2 style={{margin:'10px 0 6px'}}>{spec.question}</h2><p style={{margin:'0 0 12px',color:'#667085',lineHeight:1.8}}>{spec.intro}</p>
    <div style={{display:'grid',gap:8}}>{spec.options.map((option,i)=><button key={option} onClick={()=>!revealed&&setSelected(i)} style={{textAlign:'right',padding:12,borderRadius:12,border:selected===i?'2px solid #b98700':'1px solid #e1d39e',background:selected===i?'#fff4bf':'#fff',fontSize:15,fontWeight:800}}>{OPTION_LABELS[i]} · {option}</button>)}</div>
    {!revealed?<div style={{marginTop:12}}><PrimaryButton disabled={selected===null} onClick={()=>setRevealed(true)}>اكشف النتيجة</PrimaryButton></div>:<div style={{marginTop:12}}><Notice tone={correct?'good':'info'}><strong>{correct?spec.successTitle:spec.retryTitle}</strong><div style={{marginTop:4}}>{spec.explanation}</div></Notice></div>}
  </StudentCard>;
}

function ConceptMap({spec}:{spec:ConceptMapSpec}){
  return <StudentCard style={{background:'linear-gradient(135deg,#f8fbff,#f4fbf6)'}}><Pill tone="info">خريطة المفهوم</Pill><h2 style={{margin:'10px 0 14px'}}>{spec.title}</h2><div style={{display:'grid',gap:7,maxWidth:520,margin:'0 auto'}}>{spec.nodes.map((node,i)=><div key={`${node.label}-${i}`} style={{textAlign:'center'}}><div style={{padding:'11px 14px',borderRadius:14,border:'1px solid #cfdbe8',background:i===spec.nodes.length-1?'#eaf8ee':'#fff',fontWeight:900}}>{node.icon?`${node.icon} `:''}{node.label}</div>{i<spec.nodes.length-1&&<div style={{fontSize:20,color:'#667085'}}>↓</div>}</div>)}</div><div style={{marginTop:14}}><AudioButton text={spec.narration}/></div></StudentCard>;
}

function QuestionCard({q,index,selected,feedback,busy,onSelect,onSubmit}:{q:Question;index:number;selected:number|undefined;feedback:Feedback|undefined;busy:boolean;onSelect:(value:number)=>void;onSubmit:()=>void}){
  return <StudentCard><div style={{display:'flex',justifyContent:'space-between',gap:8}}><Pill tone="info">سؤال {index+1}</Pill><Pill>{q.purpose}</Pill></div><h3 style={{fontSize:19,lineHeight:1.7,margin:'12px 0'}}>{q.prompt}</h3><div style={{marginBottom:10}}><AudioButton text={q.prompt}/></div><div style={{display:'grid',gap:8}}>{q.options.map((option,i)=><button key={i} onClick={()=>!feedback&&onSelect(i)} disabled={!!feedback} style={{textAlign:'right',padding:'12px 13px',borderRadius:12,border:selected===i?'2px solid #176b3a':'1px solid #d7dde6',background:selected===i?'#f1faf4':'#fff',fontSize:15}}><span style={{display:'inline-grid',placeItems:'center',width:25,height:25,borderRadius:99,background:selected===i?'#176b3a':'#f2f4f7',color:selected===i?'#fff':'#344054',fontWeight:900,marginInlineEnd:8}}>{OPTION_LABELS[i]||String(i+1)}</span>{option}</button>)}</div>{!feedback&&<div style={{marginTop:12}}><PrimaryButton disabled={selected===undefined||busy} onClick={onSubmit}>{busy?'جارٍ الحفظ…':'تحقق من إجابتي'}</PrimaryButton></div>}{feedback&&<div style={{marginTop:12}}><Notice tone={feedback.correct?'good':'warn'}><strong>{feedback.correct?'إجابة صحيحة ✓':'تحتاج مراجعة'}</strong><div style={{marginTop:4}}>{feedback.message}</div></Notice></div>}</StudentCard>;
}

export default function LessonPlayer(){
  const [lesson,setLesson]=useState<LessonPayload|null>(null);const [questions,setQuestions]=useState<Question[]>([]);const [progress,setProgress]=useState<Progress|null>(null);const [session,setSession]=useState<SessionState|null>(null);
  const [selected,setSelected]=useState<Record<number,number>>({});const [feedback,setFeedback]=useState<Record<number,Feedback>>({});const [busyQuestion,setBusyQuestion]=useState<number|null>(null);const [error,setError]=useState('');
  const [stepIndex,setStepIndex]=useState(0);const [questionIndex,setQuestionIndex]=useState(0);const [tutorOpen,setTutorOpen]=useState(false);const [tutorAnswer,setTutorAnswer]=useState('');const [tutorQuestion,setTutorQuestion]=useState('');const [tutorBusy,setTutorBusy]=useState(false);
  const [online,setOnline]=useState(true);const [offlineCopy,setOfflineCopy]=useState(false);const [lowData,setLowData]=useState(false);const [requestedLessonId,setRequestedLessonId]=useState<number|null>(null);
  const template=useMemo(()=>getScienceLessonTemplate(lesson?.lesson.lesson_code),[lesson?.lesson.lesson_code]);
  const isPublishedRuntime=requestedLessonId!==null;
  const tutorSupported=!isPublishedRuntime&&(lesson?.tutor_supported??true);
  const resultHref=isPublishedRuntime?'/student/progress':'/student/result';
  const recoveryHref=isPublishedRuntime?'/student/progress':'/student/recovery';

  function endpoints(lessonId:number|null){return lessonId===null?{lesson:'/demo/lesson',questions:'/demo/questions',progress:'/demo/progress',session:'/demo/session-state'}:{lesson:`/learning/lessons/${lessonId}/runtime`,questions:`/learning/lessons/${lessonId}/questions`,progress:`/learning/lessons/${lessonId}/progress`,session:`/learning/lessons/${lessonId}/session-state`};}

  async function load(lessonId:number|null){
    try{
      const ep=endpoints(lessonId);const [l,q,p,s]=await Promise.all([apiJson<LessonPayload>(ep.lesson,{},true),apiJson<Question[]>(ep.questions,{},true),apiJson<Progress>(ep.progress,{},true),apiJson<SessionState>(ep.session,{},true)]);
      const restoredFeedback:Record<number,Feedback>={};const restoredSelected:Record<number,number>={};
      for(const row of s.questions){const a=row.latest_attempt;if(!a)continue;if(typeof a.answer==='number')restoredSelected[row.question_id]=a.answer;restoredFeedback[row.question_id]={correct:a.correct,attempt:a.attempt_number,restored:true,message:'تم استعادة محاولتك السابقة من سجل التعلم.'};}
      setLesson(l);setQuestions(q);setProgress(p);setSession(s);setSelected(restoredSelected);setFeedback(restoredFeedback);setOfflineCopy(false);setError('');
      window.localStorage.setItem(`pal-learning:${l.lesson.lesson_code}:cache`,JSON.stringify({lesson:l,questions:q} satisfies CachePayload));
      window.localStorage.setItem(`pal-learning:lesson-id:${l.lesson.id}:code`,l.lesson.lesson_code);
      const firstUnanswered=q.findIndex(item=>!restoredFeedback[item.id]);if(firstUnanswered>=0)setQuestionIndex(firstUnanswered);
      const saved=window.localStorage.getItem(`pal-learning:${l.lesson.lesson_code}:step`);if(saved!==null){const n=Number(saved);if(Number.isFinite(n))setStepIndex(Math.max(0,n));}
    }catch(e:any){
      const code=lessonId!==null?window.localStorage.getItem(`pal-learning:lesson-id:${lessonId}:code`):null;
      const cacheKey=code?`pal-learning:${code}:cache`:Object.keys(window.localStorage).find(k=>k.startsWith('pal-learning:')&&k.endsWith(':cache'));
      const cached=cacheKey?window.localStorage.getItem(cacheKey):null;
      if(cached){try{const data=JSON.parse(cached) as CachePayload;setLesson(data.lesson);setQuestions(data.questions);setOfflineCopy(true);setError('');return;}catch{}}
      setError(e.message==='Authentication required'?'يجب تسجيل الدخول كطالب قبل فتح الدرس':e.message||'تعذر تحميل الدرس');
    }
  }

  useEffect(()=>{
    setOnline(navigator.onLine);setLowData(window.localStorage.getItem('pal-learning:low-data')==='1');
    const raw=new URLSearchParams(window.location.search).get('lessonId');const parsed=raw?Number(raw):NaN;const id=Number.isInteger(parsed)&&parsed>0?parsed:null;setRequestedLessonId(id);
    const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener('online',on);window.addEventListener('offline',off);void load(id);
    return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);};
  },[]);

  const steps=useMemo<Step[]>(()=>{
    if(!lesson)return[];const base:Step[]=[];
    lesson.sections.forEach(section=>{base.push({kind:'section',key:`section-${section.id}`,title:section.title,section});if(template.prediction&&section.section_number===template.prediction.afterSection)base.push({kind:'prediction',key:`prediction-${section.id}`,title:template.prediction.question});});
    if(template.conceptMap)base.push({kind:'concept',key:'concept-map',title:template.conceptMap.title});if(questions.length)base.push({kind:'challenge',key:'challenge',title:'تحدي الدرس'});base.push({kind:'achievement',key:'achievement',title:template.achievement.title});return base;
  },[lesson,template,questions.length]);
  const activeStep=steps[Math.min(stepIndex,Math.max(0,steps.length-1))];const answered=Object.keys(feedback).length;const completedQuestions=questions.length===0||answered>=questions.length;const stepProgress=steps.length?Math.round(((Math.min(stepIndex,steps.length-1)+1)/steps.length)*100):0;const currentQuestion=questions[questionIndex];

  useEffect(()=>{if(!lesson||!steps.length)return;const safe=Math.min(stepIndex,steps.length-1);if(safe!==stepIndex){setStepIndex(safe);return;}window.localStorage.setItem(`pal-learning:${lesson.lesson.lesson_code}:step`,String(stepIndex));window.scrollTo({top:0,behavior:lowData?'auto':'smooth'});},[lesson,stepIndex,steps.length,lowData]);
  function toggleLowData(){setLowData(v=>{const next=!v;window.localStorage.setItem('pal-learning:low-data',next?'1':'0');return next;});}

  async function refreshLearningState(){if(!lesson)return;const ep=endpoints(requestedLessonId);const [p,s]=await Promise.all([apiJson<Progress>(ep.progress,{},true),apiJson<SessionState>(ep.session,{},true)]);setProgress(p);setSession(s);}
  async function submit(q:Question){
    if(!online){setError('أنت دون اتصال. يمكنك متابعة الدرس، لكن حفظ إجابات التحدي يحتاج اتصالًا بالإنترنت.');return;}const answer=selected[q.id];if(answer===undefined)return;setBusyQuestion(q.id);
    try{const path=isPublishedRuntime?`/learning/questions/${q.id}/attempt`:`/demo/questions/${q.id}/attempt`;const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000'}${path}`,{method:'POST',headers:studentHeaders(true),body:JSON.stringify({answer,response_time_ms:9000,used_hint:false,used_ai_help:false})});const body=await response.json();if(!response.ok)throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'تعذر حفظ المحاولة');setFeedback(x=>({...x,[q.id]:{correct:body.correct,message:body.explanation||'',attempt:body.attempt_number}}));await refreshLearningState();}catch(e:any){setError(e.message||'تعذر حفظ المحاولة');}finally{setBusyQuestion(null);}
  }

  async function tutor(action:string,freeQuestion?:string){
    if(!tutorSupported){setTutorOpen(true);setTutorAnswer('مساعد AI لهذا الدرس سيُفعّل بعد اعتماد سياقه التعليمي. يمكنك الآن استخدام القراءة الصوتية والأنشطة والتحدي.');return;}if(!online){setTutorOpen(true);setTutorAnswer('مساعد الذكاء الاصطناعي يحتاج اتصالًا بالإنترنت.');return;}
    setTutorOpen(true);setTutorBusy(true);setTutorAnswer('');try{const body=await apiJson<{answer:string}>('/demo/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,question:freeQuestion||null})},true);setTutorAnswer(body.answer);}catch(e:any){setTutorAnswer(e.message||'تعذر تشغيل مساعد الدرس');}finally{setTutorBusy(false);}
  }

  function nextStep(){if(activeStep?.kind==='challenge'&&!completedQuestions)return;setStepIndex(i=>Math.min(steps.length-1,i+1));}function previousStep(){setStepIndex(i=>Math.max(0,i-1));}
  const sectionAudio=activeStep?.kind==='section'?activeStep.section.blocks.map(lessonBlockText).join('. '):'';

  return <StudentShell title={lesson?.lesson.title||'الدرس التفاعلي'} subtitle={lesson?`${lesson.book.title} ← الوحدة ${lesson.unit.unit_number}: ${lesson.unit.title}`:'جارٍ تحميل الدرس…'} backHref="/student">
    {error&&<div style={{marginBottom:14}}><Notice tone="bad">{error}{error.includes('تسجيل الدخول')&&<div style={{marginTop:9}}><PrimaryLink href="/student/login">تسجيل الدخول</PrimaryLink></div>}</Notice></div>}{!lesson&&!error&&<Notice>جارٍ تحميل الدرس التفاعلي…</Notice>}
    {lesson&&activeStep&&<>{(!online||offlineCopy)&&<div style={{marginBottom:12}}><Notice tone="info"><strong>وضع دون اتصال</strong><div style={{marginTop:4}}>يمكنك قراءة المحتوى وتشغيل الأنشطة المحلية. الحفظ السحابي يعود عند توفر الإنترنت.</div></Notice></div>}
      <StudentCard style={{marginBottom:14,background:'linear-gradient(135deg,#f1fbf4,#f4f8ff)',position:'sticky',top:8,zIndex:8}}><div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}><div><Pill tone="good">{template.subjectLabel} · {template.gradeLabel}</Pill><div style={{fontSize:12,color:'#667085',marginTop:6}}>{lesson.lesson.estimated_minutes} دقيقة · {template.internalName}{isPublishedRuntime?' · درس منشور':''}</div></div><div style={{display:'flex',gap:8,alignItems:'center'}}><button onClick={toggleLowData} style={{...buttonStyle,fontSize:11,background:lowData?'#eef8f1':'#fff'}}>{lowData?'✓ توفير البيانات':'توفير البيانات'}</button><div style={{fontSize:38}}>🔬</div></div></div><div style={{marginTop:12}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}}><strong>المرحلة {Math.min(stepIndex+1,steps.length)} من {steps.length}</strong><span>{stepProgress}%</span></div><ProgressBar value={stepProgress}/></div></StudentCard>
      {activeStep.kind==='section'&&<StudentCard><div style={{display:'flex',justifyContent:'space-between',gap:10,marginBottom:14,flexWrap:'wrap'}}><div style={{display:'flex',gap:10,alignItems:'center'}}><span style={{display:'grid',placeItems:'center',width:38,height:38,borderRadius:99,background:'#176b3a',color:'#fff',fontWeight:900}}>{activeStep.section.section_number}</span><div><div style={{fontSize:11,color:'#667085',fontWeight:900}}>محطة تعلم</div><h2 style={{margin:'2px 0 0',fontSize:22}}>{activeStep.title}</h2></div></div><AudioButton text={sectionAudio}/></div><div style={{display:'grid',gap:13}}>{activeStep.section.blocks.map(block=><LessonBlock key={block.id} block={block} lowData={lowData}/>)}</div></StudentCard>}
      {activeStep.kind==='prediction'&&template.prediction&&<PredictionCard spec={template.prediction}/>} {activeStep.kind==='concept'&&template.conceptMap&&<ConceptMap spec={template.conceptMap}/>} 
      {activeStep.kind==='challenge'&&<div style={{display:'grid',gap:12}}><StudentCard style={{background:'#fffdf7',borderColor:'#eadca8'}}><div style={{display:'flex',justifyContent:'space-between'}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>تحدي الدرس</div><h2 style={{margin:'3px 0 0'}}>اختبر فهمك خطوة بخطوة</h2></div><Pill tone={completedQuestions?'good':'warn'}>{answered}/{questions.length}</Pill></div></StudentCard>{currentQuestion&&<QuestionCard q={currentQuestion} index={questionIndex} selected={selected[currentQuestion.id]} feedback={feedback[currentQuestion.id]} busy={busyQuestion===currentQuestion.id} onSelect={value=>setSelected(s=>({...s,[currentQuestion.id]:value}))} onSubmit={()=>void submit(currentQuestion)}/>}<StudentCard><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}><button onClick={()=>setQuestionIndex(i=>Math.max(0,i-1))} disabled={questionIndex===0} style={buttonStyle}>السؤال السابق</button><span style={{fontSize:12,color:'#667085'}}>{questionIndex+1} / {questions.length}</span><button onClick={()=>setQuestionIndex(i=>Math.min(questions.length-1,i+1))} disabled={questionIndex>=questions.length-1||!feedback[currentQuestion?.id]} style={buttonStyle}>السؤال التالي</button></div></StudentCard></div>}
      {activeStep.kind==='achievement'&&<StudentCard style={{textAlign:'center',background:'linear-gradient(135deg,#f1fbf4,#fff9e8)'}}><div style={{fontSize:62}}>{template.achievement.emoji}</div><Pill tone={completedQuestions?'good':'warn'}>{completedQuestions?'تم الإنجاز':'بانتظار إكمال التحدي'}</Pill><h1 style={{fontSize:28,margin:'10px 0 5px'}}>{template.achievement.title}</h1><p style={{margin:'0 auto',maxWidth:560,lineHeight:1.9,color:'#526071'}}>{completedQuestions?template.achievement.completedText:template.achievement.lockedText}</p>{completedQuestions&&<div style={{marginTop:14,fontSize:34,fontWeight:900,color:'#176b3a'}}>{progress?.progress_percent||0}% إتقان</div>}<div style={{marginTop:16,display:'flex',justifyContent:'center',gap:8}}><PrimaryLink href={resultHref}>عرض التقدم</PrimaryLink><PrimaryLink href={recoveryHref} secondary>مراجعة</PrimaryLink></div></StudentCard>}
      <StudentCard style={{marginTop:14}}><div style={{display:'flex',justifyContent:'space-between'}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>الإتقان</div><strong>تقدمك حسب المهارة</strong></div><strong style={{fontSize:26}}>{progress?.progress_percent||0}%</strong></div><div style={{marginTop:9}}><ProgressBar value={progress?.progress_percent||0}/></div></StudentCard>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginTop:14,paddingBottom:92}}><button onClick={previousStep} disabled={stepIndex===0} style={{minHeight:48,borderRadius:13,border:'1px solid #d5dce5',background:'#fff',fontWeight:900}}>السابق</button>{stepIndex<steps.length-1?<button onClick={nextStep} disabled={activeStep.kind==='challenge'&&!completedQuestions} style={{minHeight:48,borderRadius:13,border:0,background:activeStep.kind==='challenge'&&!completedQuestions?'#aab2bd':'#176b3a',color:'#fff',fontWeight:900}}>التالي</button>:<PrimaryLink href={resultHref}>التقدم</PrimaryLink>}</div>
      <button onClick={()=>setTutorOpen(x=>!x)} aria-label="مساعد الدرس" style={{position:'fixed',left:16,bottom:84,zIndex:30,width:58,height:58,borderRadius:99,border:0,background:tutorSupported&&online?'#14213d':'#667085',color:'#fff',fontSize:24}}>✦</button>
      {tutorOpen&&<div style={{position:'fixed',left:12,right:12,bottom:150,zIndex:29,maxWidth:540,margin:'0 auto',background:'#fff',border:'1px solid #dce2ea',borderRadius:18,padding:14,boxShadow:'0 18px 60px rgba(20,33,61,.22)'}}><div style={{display:'flex',justifyContent:'space-between'}}><div><strong>مساعد الدرس</strong><div style={{fontSize:11,color:'#667085'}}>{tutorSupported?'مقيد بمحتوى الدرس الحالي':'سيُفعّل بعد اعتماد سياق هذا الدرس'}</div></div><button onClick={()=>setTutorOpen(false)} style={{border:0,background:'transparent',fontSize:22}}>×</button></div>{tutorSupported&&<><div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>{[['explain_simple','اشرح أبسط'],['example','مثال'],['hint','تلميح'],['quiz','اختبرني']].map(([action,label])=><button key={action} onClick={()=>void tutor(action)} disabled={tutorBusy} style={buttonStyle}>{label}</button>)}</div><div style={{display:'flex',gap:7,marginTop:10}}><input value={tutorQuestion} onChange={e=>setTutorQuestion(e.target.value)} placeholder="اسأل عن الدرس…" style={{flex:1,minWidth:0,padding:10,border:'1px solid #ccd5df',borderRadius:10}}/><button onClick={()=>void tutor('free',tutorQuestion)} disabled={!tutorQuestion.trim()||tutorBusy} style={{padding:'0 13px',border:0,borderRadius:10,background:'#176b3a',color:'#fff',fontWeight:800}}>إرسال</button></div></>}<div style={{marginTop:10,minHeight:48,padding:10,borderRadius:11,background:'#f8fafc',lineHeight:1.7,fontSize:14}}>{tutorBusy?'يفكر داخل محتوى الدرس…':tutorAnswer||(!tutorSupported?'مساعد AI غير مفعّل لهذا الدرس بعد.':'اختر أمرًا سريعًا أو اكتب سؤالك.')}</div></div>}
      <BottomNav active="lesson"/>
    </>}
  </StudentShell>;
}
