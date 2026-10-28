'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {buildLearnerModel} from '../../../lib/learnerModel';
import {chooseLessonExperience,type ExperienceKind,type ExperiencePlan} from '../../../lib/lessonExperience';

function modeMeta(kind:ExperienceKind){
 const all:Record<ExperienceKind,{label:string;icon:string}>={slides:{label:'عرض مصور',icon:'🖼️'},puzzle:{label:'لغز',icon:'🧩'},game:{label:'لعبة',icon:'🎮'},experiment:{label:'تجربة وتوقع',icon:'🧪'},story:{label:'موقف وقصة',icon:'📚'},challenge:{label:'تحدي',icon:'🏁'},sort:{label:'رتّبي وصنّفي',icon:'🧲'}};return all[kind];
}

export default function AdaptiveLessonExperience({lesson,diagnosticCorrect}:{lesson:Lesson;diagnosticCorrect:boolean}){
 const [mastery,setMastery]=useState<number|null>(null);
 const localPlan=useMemo(()=>chooseLessonExperience(lesson,diagnosticCorrect,mastery),[lesson,diagnosticCorrect,mastery]);
 const [plan,setPlan]=useState<ExperiencePlan>(localPlan);
 const [mode,setMode]=useState<ExperienceKind>(localPlan.primary);
 useEffect(()=>{setMastery(buildLearnerModel(lesson.student,lesson.subject).subjectMastery??null)},[lesson.id,lesson.student,lesson.subject]);
 useEffect(()=>{let alive=true;const fallback=chooseLessonExperience(lesson,diagnosticCorrect,mastery);setPlan(fallback);setMode(fallback.primary);fetch('/api/ai-teacher/experience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,diagnosticCorrect,subjectMastery:mastery})}).then(r=>r.json()).then(data=>{if(!alive||!data?.primary)return;const next:ExperiencePlan={primary:data.primary,secondary:data.secondary,label:String(data.label||fallback.label),icon:String(data.icon||fallback.icon),reason:String(data.reason||fallback.reason),intensity:data.intensity||fallback.intensity,visualLabel:String(data.visualLabel||fallback.visualLabel)};setPlan(next);setMode(next.primary)}).catch(()=>{});return()=>{alive=false}},[lesson.id,diagnosticCorrect,mastery]);
 const meta=modeMeta(mode);
 return <section className="creativeLessonLab">
   <div className="creativeLabHead"><div className="creativeLabIcon">{meta.icon}</div><div><span>معلمتك اختارت طريقة التعلم هذه</span><h3>{meta.label}</h3><p>{plan.reason} <b>التمثيل المناسب:</b> {plan.visualLabel}.</p></div><span className={`creativeLevel ${plan.intensity}`}>{plan.intensity==='guided'?'موجّه':plan.intensity==='challenge'?'تحدٍ أعلى':'متوازن'}</span></div>
   <div className="creativeModeSwitch"><button className={mode===plan.primary?'active':''} onClick={()=>setMode(plan.primary)}>{modeMeta(plan.primary).icon} {modeMeta(plan.primary).label}</button>{plan.secondary!==plan.primary&&<button className={mode===plan.secondary?'active':''} onClick={()=>setMode(plan.secondary)}>{modeMeta(plan.secondary).icon} {modeMeta(plan.secondary).label}</button>}</div>
   {mode==='slides'&&<MiniSlides lesson={lesson}/>} 
   {(mode==='puzzle'||mode==='challenge')&&<TryBeforeTell lesson={lesson} challenge={mode==='challenge'}/>} 
   {mode==='game'&&<QuickGame lesson={lesson}/>} 
   {mode==='experiment'&&<PredictionLab lesson={lesson}/>} 
   {mode==='story'&&<StoryMoment lesson={lesson}/>} 
   {mode==='sort'&&<OrderPuzzle lesson={lesson}/>} 
 </section>;
}

function MiniSlides({lesson}:{lesson:Lesson}){
 const slides=[{title:'الفكرة الكبيرة',text:lesson.summary,icon:'💡'},...lesson.learningPoints.map((x,i)=>({title:`الفكرة ${i+1}`,text:x,icon:'🔹'})),{title:'مثال نراه معًا',text:lesson.example,icon:'✨'}];
 const [i,setI]=useState(0);const s=slides[i];return <div className="miniSlides"><article><span>{s.icon}</span><small>{i+1} / {slides.length}</small><h4>{s.title}</h4><p>{s.text}</p></article><div className="slideNav"><button disabled={i===0} onClick={()=>setI(v=>v-1)}>→ السابق</button><div>{slides.map((_,n)=><span key={n} className={n===i?'active':n<i?'done':''}/>)}</div><button disabled={i===slides.length-1} onClick={()=>setI(v=>v+1)}>التالي ←</button></div></div>
}

function TryBeforeTell({lesson,challenge}:{lesson:Lesson;challenge:boolean}){
 const q=lesson.questions[Math.min(challenge?Math.max(1,lesson.questions.length-1):0,lesson.questions.length-1)];
 const [pick,setPick]=useState<number|null>(null);if(!q)return null;return <div className="creativeTry"><div className="tryBanner"><span>{challenge?'🏁':'🧩'}</span><div><strong>{challenge?'تحدي قبل أن أساعدك':'حاولي اكتشاف الفكرة أولًا'}</strong><small>لا مشكلة إن أخطأتِ؛ المحاولة جزء من الشرح.</small></div></div><h4>{q.text}</h4><div className="creativeChoices">{q.options.map((x,n)=><button key={x} disabled={pick!==null} onClick={()=>setPick(n)}>{x}</button>)}</div>{pick!==null&&<div className={pick===q.correct?'creativeReveal ok':'creativeReveal learn'}><strong>{pick===q.correct?'⭐ اكتشفتِها!':'💡 هذه المحاولة كشفت لنا أين نركز'}</strong><p>{q.explanation}</p></div>}</div>
}

function QuickGame({lesson}:{lesson:Lesson}){
 const qs=lesson.questions.slice(0,Math.min(3,lesson.questions.length));const [step,setStep]=useState(0);const [score,setScore]=useState(0);const [pick,setPick]=useState<number|null>(null);const q=qs[step];if(!q)return null;function next(){if(step>=qs.length-1){setStep(0);setScore(0);setPick(null)}else{setStep(v=>v+1);setPick(null)}}return <div className="quickLearningGame"><div className="gameHud"><span>🎮 جولة {step+1}/{qs.length}</span><strong>⭐ {score}</strong></div><h4>{q.text}</h4><div className="creativeChoices">{q.options.map((x,n)=><button key={x} disabled={pick!==null} onClick={()=>{setPick(n);if(n===q.correct)setScore(v=>v+1)}}>{x}</button>)}</div>{pick!==null&&<div className={pick===q.correct?'creativeReveal ok':'creativeReveal learn'}><strong>{pick===q.correct?'إصابة صحيحة!':'تعلمنا شيئًا جديدًا'}</strong><p>{q.explanation}</p><button onClick={next}>{step===qs.length-1?'أعيد الجولة':'الجولة التالية ←'}</button></div>}</div>
}

function PredictionLab({lesson}:{lesson:Lesson}){
 const q=lesson.questions[0];const [prediction,setPrediction]=useState<number|null>(null);if(!q)return null;return <div className="predictionLab"><div className="labSteps"><span className="active">1 توقّعي</span><span className={prediction!==null?'active':''}>2 شاهدي الدليل</span><span className={prediction!==null?'active':''}>3 فسّري</span></div><h4>قبل أن نكشف الفكرة: {q.text}</h4><div className="creativeChoices">{q.options.map((x,n)=><button key={x} disabled={prediction!==null} onClick={()=>setPrediction(n)}>{x}</button>)}</div>{prediction!==null&&<div className="scienceEvidence"><strong>🔎 الدليل والتفسير</strong><p>{q.explanation}</p><small>{prediction===q.correct?'توقعك وافق الفكرة. الآن اسألي نفسك: لماذا؟':'اختلاف التوقع مفيد؛ قارني بين ما توقعتِه والدليل.'}</small></div>}</div>
}

function StoryMoment({lesson}:{lesson:Lesson}){
 const [reveal,setReveal]=useState(false);return <div className="storyMoment"><div className="storyScene"><span>📚</span><div><strong>ضعي الفكرة في موقف</strong><p>{lesson.example}</p></div></div><button onClick={()=>setReveal(v=>!v)}>{reveal?'أخفي الفكرة':'ما القاعدة أو الفكرة هنا؟'}</button>{reveal&&<div className="creativeReveal ok"><strong>الفكرة التي نبحث عنها</strong><p>{lesson.learningPoints[0]||lesson.summary}</p></div>}</div>
}

function OrderPuzzle({lesson}:{lesson:Lesson}){
 const source=lesson.learningPoints.slice(0,Math.min(4,lesson.learningPoints.length));const shuffled=useMemo(()=>source.map((x,i)=>({x,i})).sort((a,b)=>((a.i*7+3)%5)-((b.i*7+3)%5)),[lesson.id]);const [picked,setPicked]=useState<number[]>([]);if(source.length<2)return <MiniSlides lesson={lesson}/>;const done=picked.length===source.length;const correct=done&&picked.every((idx,pos)=>idx===pos);return <div className="orderPuzzle"><h4>🧲 رتّبي الأفكار بالترتيب الذي يبني الفهم</h4><div className="orderBank">{shuffled.map(item=><button key={item.i} disabled={picked.includes(item.i)} onClick={()=>setPicked(v=>[...v,item.i])}>{item.x}</button>)}</div><div className="orderTrack">{picked.map((idx,n)=><div key={`${idx}-${n}`}><span>{n+1}</span>{source[idx]}</div>)}</div>{picked.length>0&&!done&&<button className="resetMini" onClick={()=>setPicked([])}>ابدئي من جديد</button>}{done&&<div className={correct?'creativeReveal ok':'creativeReveal learn'}><strong>{correct?'⭐ ترتيب ممتاز':'💡 جرّبي ترتيبًا آخر'}</strong><p>{correct?'بنيتِ الفكرة من الأساس إلى التطبيق.':'راجعي تسلسل الشرح ثم حاولي مرة أخرى.'}</p><button onClick={()=>setPicked([])}>إعادة المحاولة</button></div>}</div>
}
