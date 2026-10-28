'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {getTeachingScenes,type TeachingScene} from '../../../lib/teachingBlueprints';
import styles from './LearningCanvas.module.css';

type CanvasStep=TeachingScene;

function evidenceText(lesson:Lesson,index=0){
 const q=lesson.questions[index%Math.max(1,lesson.questions.length)];
 return q?.explanation||lesson.example||lesson.summary;
}

function scienceSteps(lesson:Lesson,focus:number):CanvasStep[]{return [
 {icon:'👀',label:'ألاحظ',title:'ابدئي بما ترينه',body:focus===0?(lesson.example||lesson.summary):evidenceText(lesson,focus),prompt:'ما الشيء الذي تستطيعين ملاحظته مباشرة قبل أن نذكر أي قاعدة؟'},
 {icon:'💭',label:'أتوقع',title:'كوّني توقعًا',body:'قبل أن تعرفي النتيجة، اختاري توقعًا منطقيًا بناءً على ما رأيته.',prompt:'ما السبب الذي جعلك تميلين لهذا التوقع؟'},
 {icon:'🔎',label:'أبحث عن دليل',title:'قارني توقعك بالدليل',body:evidenceText(lesson,focus),prompt:'أي جزء من الدليل أكد توقعك أو غيّره؟'},
 {icon:'🧠',label:'أفسر',title:'حوّلي المشاهدة إلى تفسير',body:'اربطي ما شاهدته بما حدث، ثم حاولي تفسير السبب بلغتك.',prompt:'هل تستطيعين شرح العلاقة من دون حفظ جملة جاهزة؟'}
]}
function mathSteps(lesson:Lesson,focus:number):CanvasStep[]{return [
 {icon:'🧱',label:'محسوس',title:'ابدئي بشيء يمكن تخيله',body:focus===0?(lesson.example||lesson.summary):evidenceText(lesson,focus),prompt:'ما الكميات أو العلاقات التي ترينها قبل كتابة أي رمز؟'},
 {icon:'🖼️',label:'بصري',title:'حوّلي العلاقة إلى صورة',body:'مثلي ما يحدث بخط، مجموعات، أجزاء، ترتيب أو شكل يناسب المسألة.',prompt:'أي جزء في الرسم يمثل كل كمية أو خطوة؟'},
 {icon:'✏️',label:'رمزي',title:'الآن اكتبيها رياضيًا',body:evidenceText(lesson,focus),prompt:'أي رمز أو عملية تمثل العلاقة التي رأيتها بصريًا؟'},
 {icon:'🚀',label:'تطبيق',title:'انقلي الطريقة إلى موقف جديد',body:'غيّري الأرقام أو السياق، لكن حافظي على نفس العلاقة التي اكتشفتها.',prompt:'ما الذي بقي ثابتًا رغم أن المثال تغيّر؟'}
]}
function arabicSteps(lesson:Lesson,focus:number):CanvasStep[]{return [
 {icon:'📖',label:'سياق',title:'ابدئي من المعنى',body:focus===0?(lesson.example||lesson.summary):evidenceText(lesson,focus),prompt:'ما المعنى الذي فهمته من الجملة أو النص؟'},
 {icon:'🔍',label:'ألاحظ',title:'ابحثي عن النمط',body:'راقبي الكلمات أو التراكيب: ما الذي يتكرر؟ وما الذي يتغير؟',prompt:'ما الشيء المشترك بين الأمثلة؟'},
 {icon:'🧩',label:'أبني الفكرة',title:'استخرجي القاعدة من الاستخدام',body:evidenceText(lesson,focus),prompt:'كيف تشرحين ما لاحظته بكلماتك؟'},
 {icon:'✍️',label:'أستخدم',title:'اصنعي مثالًا جديدًا',body:'استخدمي ما اكتشفته في جملة أو موقف جديد من عندك.',prompt:'هل مثالك الجديد يحافظ على نفس المعنى أو النمط؟'}
]}
function englishSteps(lesson:Lesson,focus:number):CanvasStep[]{return [
 {icon:'🎬',label:'Situation',title:'Start with meaning',body:focus===0?(lesson.example||lesson.summary):evidenceText(lesson,focus),prompt:'What is happening in this situation?'},
 {icon:'👀',label:'Notice',title:'Notice what changes',body:'Look at the words that change and the words that stay the same.',prompt:'Which part carries the meaning we are learning?'},
 {icon:'🧩',label:'Build',title:'Build the pattern from examples',body:evidenceText(lesson,focus),prompt:'How would you explain the pattern simply?'},
 {icon:'💬',label:'Use',title:'Use it in a new situation',body:'Create a new sentence for a different situation using the same pattern.',prompt:'Did the meaning stay correct in the new example?'}
]}
function getSteps(lesson:Lesson,focus:number){const explicit=getTeachingScenes(lesson,focus);if(explicit?.length)return explicit;if(lesson.subject==='العلوم والحياة')return scienceSteps(lesson,focus);if(lesson.subject==='الرياضيات')return mathSteps(lesson,focus);if(lesson.subject==='اللغة العربية')return arabicSteps(lesson,focus);if(lesson.subject==='English')return englishSteps(lesson,focus);return mathSteps(lesson,focus)}
function appendUx(lessonId:string,event:Record<string,unknown>){try{const key=`lessonUx:${lessonId}`;const raw=localStorage.getItem(key);const old=raw?JSON.parse(raw):[];const next=Array.isArray(old)?old.slice(-179):[];next.push({at:new Date().toISOString(),...event});localStorage.setItem(key,JSON.stringify(next))}catch{}}

export default function LearningCanvas({lesson}:{lesson:Lesson}){
 const [active,setActive]=useState(false);const [focus,setFocus]=useState(0);const [index,setIndex]=useState(0);const [reflected,setReflected]=useState(false);
 const steps=useMemo(()=>getSteps(lesson,focus),[lesson,focus]);const current=steps[index];const internalCount=Math.max(1,lesson.learningPoints.length);const explicit=Boolean(getTeachingScenes(lesson,focus)?.length);
 useEffect(()=>{function sync(){try{const raw=localStorage.getItem(`lessonUx:${lesson.id}`);const events=raw?JSON.parse(raw):[];if(!Array.isArray(events))return;const phaseEvents=events.filter((e:any)=>e?.event==='phase_view');const currentPhase=phaseEvents.at(-1)?.phase;setActive(currentPhase==='build');const covered=events.filter((e:any)=>e?.event==='objective_covered').at(-1);const nextFocus=covered?Math.min(internalCount-1,Math.max(0,Number(covered.objective)||0)):0;setFocus(v=>{if(v!==nextFocus){setIndex(0);setReflected(false)}return nextFocus})}catch{}}sync();const timer=window.setInterval(sync,500);return()=>window.clearInterval(timer)},[lesson.id,internalCount]);
 useEffect(()=>{if(active&&current)appendUx(lesson.id,{event:'teaching_scene_view',objectiveId:focus+1,scene:index+1,explicit})},[active,focus,index,current?.title,lesson.id,explicit]);
 function move(next:number){const safe=Math.max(0,Math.min(steps.length-1,next));if(index===steps.length-1&&safe===index)appendUx(lesson.id,{event:'teaching_objective_experience_complete',objectiveId:focus+1,explicit});setIndex(safe);setReflected(false)}
 if(!active)return null;
 return <section className={styles.canvas} aria-label="مساحة بناء الفكرة">
  <div className={styles.head}><div className={styles.headCopy}><small>{explicit?'رحلة اكتشاف قصيرة · بلا درجات':'مساحة بناء الفكرة · بلا درجات'}</small><h3>{explicit?'اكتشفي الفكرة خطوة خطوة':'نرى هذا الجزء من أكثر من زاوية'}</h3></div><div className={styles.badge}>{lesson.subject==='العلوم والحياة'?'🔬':lesson.subject==='الرياضيات'?'➗':lesson.subject==='اللغة العربية'?'📚':'🌍'}</div></div>
  <div className={styles.steps}>{steps.map((s,i)=><button key={`${s.label}-${i}`} className={`${styles.step} ${i===index?styles.active:''} ${i<index?styles.done:''}`} onClick={()=>move(i)}><span>{i<index?'✓':s.icon}</span><strong>{s.label}</strong></button>)}</div>
  <div className={styles.panel}><h4>{current.title}</h4><p>{current.body}</p><div className={styles.prompt}>💡 {current.prompt}</div></div>
  {reflected&&<div className={styles.reflection}><strong>ممتاز — فكري قبل المتابعة</strong><div className={styles.micro}>لا نبحث عن جملة محفوظة. نريد أن يصبح المعنى واضحًا ويمكن استخدامه.</div></div>}
  <div className={styles.actions}><button className={styles.action} onClick={()=>{setReflected(v=>!v);appendUx(lesson.id,{event:'teaching_reflection',objectiveId:focus+1,scene:index+1})}}>🧠 أفكر قبل أن أكمل</button>{index>0&&<button className={styles.action} onClick={()=>move(index-1)}>→ السابق</button>}<button className={`${styles.action} ${styles.primary}`} onClick={()=>move(index<steps.length-1?index+1:index)}>{index<steps.length-1?'الخطوة التالية ←':'فهمت هذا الجزء ✓'}</button></div>
  <div className={styles.micro}>شاهدي الفكرة، اربطيها بالمثال، ثم جرّبي أن تفسريها لنفسك قبل الانتقال.</div>
 </section>;
}
