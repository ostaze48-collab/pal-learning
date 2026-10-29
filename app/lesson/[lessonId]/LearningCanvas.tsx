'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {getTeachingScenes,type TeachingScene} from '../../../lib/teachingBlueprints';
import {getTeachingVisual} from '../../../lib/teachingVisuals';
import TeachingSceneVisual from './TeachingSceneVisual';
import CurriculumConceptVisual from './CurriculumConceptVisual';
import styles from './LearningCanvas.module.css';

type CanvasStep=TeachingScene;

function evidenceText(lesson:Lesson,index=0){const q=lesson.questions[index%Math.max(1,lesson.questions.length)];return q?.explanation||lesson.example||lesson.summary}
function scienceSteps(lesson:Lesson,focus:number):CanvasStep[]{return [
 {icon:'👀',label:'ألاحظ',title:'شاهدي ما يحدث',body:focus===0?(lesson.example||lesson.summary):evidenceText(lesson,focus),prompt:'ماذا تلاحظين أولًا؟'},
 {icon:'💭',label:'أتوقع',title:'ماذا تتوقعين؟',body:'توقعي النتيجة قبل أن تكملي، ثم شاهدي هل كان توقعك قريبًا.',prompt:'ما الذي جعلك تختارين هذا التوقع؟'},
 {icon:'🔎',label:'أكتشف',title:'ابحثي عن الدليل',body:evidenceText(lesson,focus),prompt:'ما الشيء الذي كشف لك الإجابة؟'},
 {icon:'🧠',label:'أربط',title:'اربطي ما شاهدته',body:'الآن اربطي ما حدث بالسبب بطريقتك.',prompt:'كيف تشرحين ما حدث بجملة بسيطة؟'}
]}
function mathSteps(lesson:Lesson,focus:number):CanvasStep[]{return [
 {icon:'🧱',label:'أتخيل',title:'تخيلي الفكرة أولًا',body:focus===0?(lesson.example||lesson.summary):evidenceText(lesson,focus),prompt:'ما العلاقة التي ترينها قبل كتابة الرموز؟'},
 {icon:'🖼️',label:'أشاهد',title:'شاهديها بصورة',body:'استخدمي الرسم أو النموذج حتى يصبح مكان كل عدد أو جزء واضحًا.',prompt:'ما الذي تغير في الصورة؟'},
 {icon:'✏️',label:'أبني',title:'حوّليها إلى طريقة',body:evidenceText(lesson,focus),prompt:'أي عملية أو رمز يمثل ما شاهدته؟'},
 {icon:'🚀',label:'أجرب',title:'جربيها في مثال جديد',body:'غيّري الأرقام أو الموقف، لكن احتفظي بالفكرة نفسها.',prompt:'ما الشيء الذي بقي كما هو؟'}
]}
function arabicSteps(lesson:Lesson,focus:number):CanvasStep[]{return [
 {icon:'📖',label:'أفهم',title:'ابدئي من المعنى',body:focus===0?(lesson.example||lesson.summary):evidenceText(lesson,focus),prompt:'ماذا فهمتِ من الجملة؟'},
 {icon:'🔍',label:'ألاحظ',title:'ابحثي عما يتكرر',body:'راقبي الكلمات والتراكيب، ثم اكتشفي ما يتغير وما يبقى.',prompt:'ما الشيء المشترك بين الأمثلة؟'},
 {icon:'🧩',label:'أكتشف',title:'اكتشفي الفكرة',body:evidenceText(lesson,focus),prompt:'كيف تقولين الفكرة بطريقتك؟'},
 {icon:'✍️',label:'أستخدم',title:'اصنعي مثالًا من عندك',body:'استخدمي ما اكتشفته في جملة جديدة.',prompt:'هل بقي المعنى صحيحًا؟'}
]}
function englishSteps(lesson:Lesson,focus:number):CanvasStep[]{return [
 {icon:'🎬',label:'Meaning',title:'Start with the situation',body:focus===0?(lesson.example||lesson.summary):evidenceText(lesson,focus),prompt:'What is happening here?'},
 {icon:'👀',label:'Notice',title:'Notice the pattern',body:'Look at what changes and what stays the same.',prompt:'Which words are doing the important job?'},
 {icon:'🧩',label:'Build',title:'Build it yourself',body:evidenceText(lesson,focus),prompt:'How would you explain the pattern simply?'},
 {icon:'💬',label:'Use',title:'Try a new situation',body:'Make a new sentence with the same idea.',prompt:'What changed and what stayed the same?'}
]}
function getSteps(lesson:Lesson,focus:number){const explicit=getTeachingScenes(lesson,focus);if(explicit?.length)return explicit;if(lesson.subject==='العلوم والحياة')return scienceSteps(lesson,focus);if(lesson.subject==='الرياضيات')return mathSteps(lesson,focus);if(lesson.subject==='اللغة العربية')return arabicSteps(lesson,focus);if(lesson.subject==='English')return englishSteps(lesson,focus);return mathSteps(lesson,focus)}
function appendUx(lessonId:string,event:Record<string,unknown>){try{const key=`lessonUx:${lessonId}`;const raw=localStorage.getItem(key);const old=raw?JSON.parse(raw):[];const next=Array.isArray(old)?old.slice(-199):[];next.push({at:new Date().toISOString(),...event});localStorage.setItem(key,JSON.stringify(next))}catch{}}

export default function LearningCanvas({lesson}:{lesson:Lesson}){
 const [active,setActive]=useState(false);const [focus,setFocus]=useState(0);const [index,setIndex]=useState(0);const [reflected,setReflected]=useState(false);const [visualTouched,setVisualTouched]=useState(false);const [speechAvailable,setSpeechAvailable]=useState(false);const [speaking,setSpeaking]=useState(false);
 const steps=useMemo(()=>getSteps(lesson,focus),[lesson,focus]);const current=steps[index];const internalCount=Math.max(1,lesson.learningPoints.length);const visual=getTeachingVisual(lesson.id,focus+1,index+1);const subjectIcon=lesson.subject==='العلوم والحياة'?'🔬':lesson.subject==='الرياضيات'?'➗':lesson.subject==='اللغة العربية'?'📚':'🌍';
 useEffect(()=>{function sync(){try{const raw=localStorage.getItem(`lessonUx:${lesson.id}`);const events=raw?JSON.parse(raw):[];if(!Array.isArray(events))return;const phaseEvents=events.filter((e:any)=>e?.event==='phase_view');const currentPhase=phaseEvents.at(-1)?.phase;setActive(currentPhase==='build');const progressed=events.filter((e:any)=>e?.event==='internal_target_taught'||e?.event==='objective_covered').at(-1);const rawFocus=progressed?Number(progressed.target??progressed.objective??0):0;const nextFocus=Math.min(internalCount-1,Math.max(0,rawFocus));setFocus(v=>{if(v!==nextFocus){setIndex(0);setReflected(false);setVisualTouched(false)}return nextFocus})}catch{}}sync();const timer=window.setInterval(sync,350);return()=>window.clearInterval(timer)},[lesson.id,internalCount]);
 useEffect(()=>{setSpeechAvailable(typeof window!=='undefined'&&'speechSynthesis'in window&&typeof SpeechSynthesisUtterance!=='undefined');return()=>{try{window.speechSynthesis?.cancel()}catch{}}},[]);
 useEffect(()=>{setVisualTouched(false);if(active&&current)appendUx(lesson.id,{event:'teaching_scene_view',objectiveId:focus+1,scene:index+1,hasVisual:Boolean(visual),visualKind:visual?.kind||null})},[active,focus,index,current?.title,lesson.id,visual?.kind]);
 function stopSpeech(){try{window.speechSynthesis?.cancel()}catch{}setSpeaking(false)}
 function speakCurrent(){if(!speechAvailable||!current)return;if(speaking){stopSpeech();return}try{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(`${current.title}. ${current.body}. ${current.prompt}`);utterance.lang=lesson.subject==='English'?'en-US':'ar';utterance.rate=lesson.subject==='English'?0.9:0.88;utterance.pitch=1;utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>setSpeaking(false);setSpeaking(true);appendUx(lesson.id,{event:'scene_read_aloud',objectiveId:focus+1,scene:index+1});window.speechSynthesis.speak(utterance)}catch{setSpeaking(false)}}
 function move(next:number){stopSpeech();const safe=Math.max(0,Math.min(steps.length-1,next));if(index===steps.length-1&&safe===index)appendUx(lesson.id,{event:'teaching_objective_experience_complete',objectiveId:focus+1});setIndex(safe);setReflected(false);setVisualTouched(false)}
 function visualInteraction(){if(!visual||visualTouched)return;setVisualTouched(true);appendUx(lesson.id,{event:'teaching_visual_interaction',objectiveId:focus+1,scene:index+1,visual:visual.kind})}
 if(!active||!current)return null;
 return <section className={styles.canvas} aria-label="جربي واكتشفي">
  <div className={styles.top}>
   <div className={styles.guide}><span className={styles.guideIcon}>{subjectIcon}</span><div><small>جربي واكتشفي</small><strong>{current.label}</strong></div></div>
   <div className={styles.progress} aria-label={`الخطوة ${index+1} من ${steps.length}`}>{steps.map((s,i)=><button type="button" aria-label={s.label} title={s.label} key={`${s.label}-${i}`} className={`${styles.dot} ${i===index?styles.active:''} ${i<index?styles.done:''}`} onClick={()=>move(i)}><span>{i<index?'✓':s.icon}</span></button>)}</div>
  </div>

  <div className={styles.scene}>
   <h3>{current.title}</h3>
   <p>{current.body}</p>
   {speechAvailable&&<button type="button" className={`${styles.listenButton} ${speaking?styles.speaking:''}`} onClick={speakCurrent} aria-pressed={speaking}>{speaking?'⏹ أوقفي الصوت':'🔊 اسمعي الفكرة'}</button>}
   {visual&&<div className={styles.visualStage} onClickCapture={visualInteraction}><TeachingSceneVisual spec={visual}/><CurriculumConceptVisual spec={visual}/></div>}
   <div className={styles.prompt}><span>💭</span><strong>{current.prompt}</strong></div>
  </div>

  {reflected&&<div className={styles.reflection}><span>✨</span><div><strong>خذي لحظة وفكري</strong><p>قولي الفكرة لنفسك بطريقتك، ثم كملي عندما تصبح واضحة.</p></div></div>}

  <div className={styles.actions}>
   <div className={styles.secondaryActions}>{index>0&&<button type="button" className={styles.secondary} onClick={()=>move(index-1)}>→ السابق</button>}<button type="button" className={styles.secondary} onClick={()=>{setReflected(v=>!v);appendUx(lesson.id,{event:'teaching_reflection',objectiveId:focus+1,scene:index+1})}}>💡 أفكر</button></div>
   <button type="button" className={styles.primary} onClick={()=>move(index<steps.length-1?index+1:index)}>{index<steps.length-1?'نكمل الاكتشاف ←':'فهمت الفكرة ✓'}</button>
  </div>
 </section>;
}
