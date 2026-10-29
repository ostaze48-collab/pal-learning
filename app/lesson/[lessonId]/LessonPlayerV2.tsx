'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {detectLikelyGap,type GapSkill} from '../../../lib/skillGraph';
import {readCreativeOutcome} from '../../../lib/creativeLearningProfile';
import {combineMasteryEvidence} from '../../../lib/masteryEvidence';
import {recordFoundationSignal} from '../../../lib/foundationSignals';
import InteractiveActivity,{hasInteractiveActivity} from './InteractiveActivity';
import LessonVisual from './LessonVisual';
import LearningCanvas from './LearningCanvas';
import GapCoach from './GapCoach';
import styles from './LessonPlayerV2.module.css';

type Phase='discover'|'build'|'practice'|'quiz'|'gap'|'remediate'|'retest'|'done';
type Report={diagnosticCorrect:boolean;firstPassScore:number;finalScore:number;quizMastery?:number;understandingScore?:number|null;conceptScore?:number|null;objectiveEvidenceScore?:number|null;transferScore?:number|null;masteryConfidence?:number;evidenceReason?:string;mastery:number;wrongQuestionIds:string[];status:'mastered'|'review_needed';completedAt:string;reviewDue?:string;timeSeconds?:number;gapId?:string|null};
type ReviewMeta={level:number;dueAt:string};
type CanvasCompleteDetail={lessonId:string;objectiveId:number};
type SavedEvidenceResult={scope?:'objective'|'transfer';correct?:boolean|null};
type LessonSession={version:1;questionCount:number;objectiveCount:number;phase:Exclude<Phase,'done'>;conceptStep:number;practiceReveal:boolean;step:number;score:number;wrong:number[];retestStep:number;retestCorrect:number;retestMissed:number[];updatedAt:string};

const phaseIndex:Record<Phase,number>={discover:0,build:1,practice:2,quiz:3,gap:3,remediate:3,retest:3,done:4};
const phaseLabels=[['✨','اكتشف'],['🧩','ابنِ الفكرة'],['🎮','جرّب'],['🎯','تحدي']];
const resumablePhases:Exclude<Phase,'done'>[]=['discover','build','practice','quiz','gap','remediate','retest'];

function hookFor(lesson:Lesson){
 if(lesson.subject==='العلوم والحياة')return 'شاهدي الظاهرة أولًا، كوّني توقعًا، ثم ابحثي عن دليل يفسر ما حدث.';
 if(lesson.subject==='الرياضيات')return 'ابدئي من العلاقة والمعنى، ثم مثليها بصريًا قبل استخدام الرموز.';
 if(lesson.subject==='اللغة العربية')return 'ابدئي من المعنى والسياق، ثم اكتشفي النمط من الأمثلة واستخدميه.';
 if(lesson.subject==='English')return 'Start with the situation and meaning, notice the pattern, then use it yourself.';
 return 'ابدئي بالملاحظة والاكتشاف، ثم جربي الفكرة حتى تصبح قابلة للاستخدام.';
}

function learningMovesFor(lesson:Lesson){
 if(lesson.subject==='العلوم والحياة')return ['شاهدي شيئًا حقيقيًا أو نموذجًا','توقعي ثم قارني بالدليل','فسري ما حدث بطريقتك'];
 if(lesson.subject==='الرياضيات')return ['ابدئي بمثال يمكن تخيله','شاهدي العلاقة بصريًا','حوّليها إلى طريقة تستخدمينها وحدك'];
 if(lesson.subject==='اللغة العربية')return ['افهمي المعنى أولًا','اكتشفي النمط من الأمثلة','استخدميه في جملة جديدة'];
 if(lesson.subject==='English')return ['Understand the situation','Notice the pattern','Use it in a new sentence'];
 return ['اكتشفي','جربي','طبقي'];
}

function practiceHintFor(lesson:Lesson){
 if(lesson.subject==='العلوم والحياة')return 'ابدئي بالملاحظة ثم اسألي: ما الدليل الذي يفسر ما أراه؟';
 if(lesson.subject==='الرياضيات')return 'ارسمي العلاقة أو مثليها أولًا، ثم اختاري العملية أو الرمز.';
 if(lesson.subject==='اللغة العربية')return 'ابدئي من المعنى، ثم ابحثي عن النمط في الكلمات أو التركيب.';
 if(lesson.subject==='English')return 'Start from the meaning, then reuse the same pattern.';
 return 'ابدئي من المثال ثم انتقلي إلى التطبيق.';
}

function readStructuredEvidence(lessonId:string){
 try{
   const raw=localStorage.getItem(`lessonEvidence:${lessonId}`);if(!raw)return {objectiveEvidencePercent:null as number|null,objectiveEvidenceCount:0,transferSuccess:null as boolean|null};
   const saved=JSON.parse(raw);const results:Array<SavedEvidenceResult>=Array.isArray(saved?.results)?saved.results:[];
   const objective=results.filter(x=>x?.scope==='objective'&&typeof x?.correct==='boolean');
   const objectiveEvidenceCount=objective.length;
   const objectiveEvidencePercent=objectiveEvidenceCount?Math.round(objective.filter(x=>x.correct===true).length/objectiveEvidenceCount*100):null;
   const transfer=saved?.transfer||results.find(x=>x?.scope==='transfer');
   const transferSuccess=typeof transfer?.correct==='boolean'?Boolean(transfer.correct):null;
   return {objectiveEvidencePercent,objectiveEvidenceCount,transferSuccess};
 }catch{return {objectiveEvidencePercent:null as number|null,objectiveEvidenceCount:0,transferSuccess:null as boolean|null}}
}

export default function LessonPlayerV2({lesson}:{lesson:Lesson}){
 const [phase,setPhase]=useState<Phase>('discover');
 const [conceptStep,setConceptStep]=useState(0);
 const [practiceReveal,setPracticeReveal]=useState(false);
 const [step,setStep]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);
 const [score,setScore]=useState(0);
 const [wrong,setWrong]=useState<number[]>([]);
 const [retestStep,setRetestStep]=useState(0);
 const [retestCorrect,setRetestCorrect]=useState(0);
 const [retestMissed,setRetestMissed]=useState<number[]>([]);
 const [currentGap,setCurrentGap]=useState<GapSkill|null>(null);
 const [report,setReport]=useState<Report|null>(null);
 const [sessionReady,setSessionReady]=useState(false);
 const [startedAt]=useState(()=>Date.now());
 const internalObjectives=lesson.learningPoints.length?lesson.learningPoints:[lesson.summary];
 const journeyStep=phaseIndex[phase];

 function track(event:string,meta:Record<string,unknown>={}){
   try{const key=`lessonUx:${lesson.id}`;const raw=localStorage.getItem(key);const old=raw?JSON.parse(raw):[];const next=Array.isArray(old)?old.slice(-179):[];next.push({event,phase,at:new Date().toISOString(),...meta});localStorage.setItem(key,JSON.stringify(next))}catch{}
 }

 useEffect(()=>{
   setSessionReady(false);setSelected(null);setCurrentGap(null);
   const raw=localStorage.getItem(`lesson:${lesson.id}:report`);
   if(raw){try{setReport(JSON.parse(raw))}catch{}}
   const reviewMode=localStorage.getItem(`lesson:${lesson.id}:reviewMode`)==='1';
   if(reviewMode){localStorage.removeItem(`lesson:${lesson.id}:reviewMode`);localStorage.removeItem(`lesson:${lesson.id}:session`);localStorage.removeItem(`lesson:${lesson.id}:canvasSession`);setConceptStep(0);setStep(0);setScore(0);setWrong([]);setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setPhase('quiz');setSessionReady(true);return}
   if(localStorage.getItem(`lesson:${lesson.id}`)==='done'){localStorage.removeItem(`lesson:${lesson.id}:session`);localStorage.removeItem(`lesson:${lesson.id}:canvasSession`);setPhase('done');setSessionReady(true);return}
   try{
     const rawSession=localStorage.getItem(`lesson:${lesson.id}:session`);
     if(rawSession){
       const saved=JSON.parse(rawSession) as LessonSession;
       const compatible=saved?.version===1&&saved.questionCount===lesson.questions.length&&saved.objectiveCount===internalObjectives.length&&resumablePhases.includes(saved.phase);
       if(compatible){
         const validWrong=Array.isArray(saved.wrong)?Array.from(new Set(saved.wrong.filter(i=>Number.isInteger(i)&&i>=0&&i<lesson.questions.length))):[];
         const validRetestMissed=Array.isArray(saved.retestMissed)?Array.from(new Set(saved.retestMissed.filter(i=>Number.isInteger(i)&&validWrong.includes(i)))):[];
         const safeConcept=Math.min(Math.max(0,Number(saved.conceptStep)||0),Math.max(0,internalObjectives.length-1));
         const safeStep=Math.min(Math.max(0,Number(saved.step)||0),Math.max(0,lesson.questions.length-1));
         const safeRetest=Math.min(Math.max(0,Number(saved.retestStep)||0),Math.max(0,validWrong.length-1));
         let resumePhase:Exclude<Phase,'done'>=saved.phase;
         setConceptStep(safeConcept);setPracticeReveal(Boolean(saved.practiceReveal));setStep(safeStep);setScore(Math.min(Math.max(0,Number(saved.score)||0),lesson.questions.length));setWrong(validWrong);setRetestStep(safeRetest);setRetestCorrect(Math.min(Math.max(0,Number(saved.retestCorrect)||0),validWrong.length));setRetestMissed(validRetestMissed);
         if(resumePhase==='gap'){
           const ids=validWrong.map(i=>lesson.questions[i]?.id).filter(Boolean);const gap=detectLikelyGap(lesson.id,ids,true);
           if(gap)setCurrentGap(gap);else resumePhase=validWrong.length?'remediate':'quiz';
         }
         if((resumePhase==='remediate'||resumePhase==='retest')&&!validWrong.length)resumePhase='quiz';
         setPhase(resumePhase);setSessionReady(true);return;
       }
     }
   }catch{}
   localStorage.removeItem(`lesson:${lesson.id}:session`);localStorage.removeItem(`lesson:${lesson.id}:canvasSession`);setPhase('discover');setConceptStep(0);setPracticeReveal(false);setStep(0);setScore(0);setWrong([]);setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setSessionReady(true);
 },[lesson.id,lesson.questions.length,internalObjectives.length]);

 useEffect(()=>{
   if(!sessionReady||phase==='done')return;
   try{const data:LessonSession={version:1,questionCount:lesson.questions.length,objectiveCount:internalObjectives.length,phase,conceptStep,practiceReveal,step,score,wrong,retestStep,retestCorrect,retestMissed,updatedAt:new Date().toISOString()};localStorage.setItem(`lesson:${lesson.id}:session`,JSON.stringify(data))}catch{}
 },[sessionReady,phase,conceptStep,practiceReveal,step,score,wrong,retestStep,retestCorrect,retestMissed,lesson.id,lesson.questions.length,internalObjectives.length]);

 useEffect(()=>{if(sessionReady)track('phase_view',{phase})},[phase,sessionReady]);

 useEffect(()=>{
   function onCanvasComplete(event:Event){
     if(phase!=='build')return;
     const detail=(event as CustomEvent<CanvasCompleteDetail>).detail;
     if(!detail||detail.lessonId!==lesson.id||detail.objectiveId!==conceptStep+1)return;
     if(conceptStep<internalObjectives.length-1){track('internal_target_taught',{target:conceptStep+1});setConceptStep(v=>v+1);return}
     saveCoverageTaught();track('teaching_coverage_complete',{total:internalObjectives.length});setPhase('practice');
   }
   window.addEventListener('learning-canvas-complete',onCanvasComplete as EventListener);
   return()=>window.removeEventListener('learning-canvas-complete',onCanvasComplete as EventListener);
 },[phase,lesson.id,conceptStep,internalObjectives.length]);

 function saveCoverageTaught(){
   try{const objectives=internalObjectives.map((text,i)=>({id:i+1,text,taught:true,verified:null as boolean|null,evidenceQuestionId:lesson.questions[i%Math.max(1,lesson.questions.length)]?.id||null}));localStorage.setItem(`lessonCoverage:${lesson.id}`,JSON.stringify({lessonId:lesson.id,student:lesson.student,objectives,taughtCount:objectives.length,verifiedCount:0,status:'taught_waiting_for_evidence',updatedAt:new Date().toISOString()}))}catch{}
 }

 function saveCoverageVerified(wrongIds:string[]){
   try{const objectives=internalObjectives.map((text,i)=>{const mappedQuestion=lesson.questions[i%Math.max(1,lesson.questions.length)];const evidenceQuestionId=mappedQuestion?.id||null;const verified=evidenceQuestionId?!wrongIds.includes(evidenceQuestionId):null;return {id:i+1,text,taught:true,verified,evidenceQuestionId}});const verifiedCount=objectives.filter(x=>x.verified===true).length;const needsMoreEvidence=objectives.filter(x=>x.verified!==true).map(x=>x.id);localStorage.setItem(`lessonCoverage:${lesson.id}`,JSON.stringify({lessonId:lesson.id,student:lesson.student,objectives,taughtCount:objectives.length,verifiedCount,needsMoreEvidence,status:needsMoreEvidence.length?'partial_evidence':'verified',updatedAt:new Date().toISOString()}))}catch{}
 }

 function reset(){
   localStorage.removeItem(`lesson:${lesson.id}`);localStorage.removeItem(`lesson:${lesson.id}:score`);localStorage.removeItem(`lesson:${lesson.id}:report`);localStorage.removeItem(`lesson:${lesson.id}:review`);localStorage.removeItem(`lesson:${lesson.id}:session`);localStorage.removeItem(`lesson:${lesson.id}:canvasSession`);localStorage.removeItem(`lessonCoverage:${lesson.id}`);localStorage.removeItem(`lessonEvidence:${lesson.id}`);localStorage.removeItem(`lessonUx:${lesson.id}`);
   setReport(null);setPhase('discover');setConceptStep(0);setPracticeReveal(false);setStep(0);setSelected(null);setScore(0);setWrong([]);setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setCurrentGap(null);
 }

 function saveFoundationSignal(wrongIds:string[]){if(!wrongIds.length)return null;const likely=detectLikelyGap(lesson.id,wrongIds,true);if(likely)recordFoundationSignal(lesson.student,likely.id,lesson.id,wrongIds);return likely}

 function complete(finalCorrect:number,wrongIds:string[],firstPassCorrect:number){
   const quizMastery=lesson.questions.length?Math.round(finalCorrect/lesson.questions.length*100):100;
   const concept=readCreativeOutcome(lesson.student,lesson.id);
   const structured=readStructuredEvidence(lesson.id);
   const evidence=combineMasteryEvidence({quizPercent:quizMastery,understanding:null,conceptSuccess:concept?.successRate??null,conceptAttempts:concept?.attempts??0,objectiveEvidencePercent:structured.objectiveEvidencePercent,objectiveEvidenceCount:structured.objectiveEvidenceCount,transferSuccess:structured.transferSuccess});
   const mastery=evidence.mastery;const status:Report['status']=evidence.status;
   let oldReview:ReviewMeta|undefined;const rawReview=localStorage.getItem(`lesson:${lesson.id}:review`);if(rawReview){try{oldReview=JSON.parse(rawReview)}catch{}}
   const level=Math.min((oldReview?.level??0)+1,5);const intervals=[1,3,7,14,30];const days=status==='review_needed'?1:intervals[level-1];const due=new Date(Date.now()+days*86400000).toISOString();
   const elapsed=Math.max(1,Math.round((Date.now()-startedAt)/1000));const oldTime=Number(localStorage.getItem(`lesson:${lesson.id}:timeSeconds`)||0);localStorage.setItem(`lesson:${lesson.id}:timeSeconds`,String(oldTime+elapsed));
   const gap=saveFoundationSignal(wrongIds);saveCoverageVerified(wrongIds);
   const data:Report={diagnosticCorrect:true,firstPassScore:firstPassCorrect,finalScore:finalCorrect,quizMastery:evidence.quizScore,understandingScore:evidence.understandingScore,conceptScore:evidence.conceptScore,objectiveEvidenceScore:evidence.objectiveEvidenceScore,transferScore:evidence.transferScore,masteryConfidence:evidence.confidence,evidenceReason:evidence.reason,mastery,wrongQuestionIds:wrongIds,status,completedAt:new Date().toISOString(),reviewDue:due,timeSeconds:elapsed,gapId:gap?.id||null};
   localStorage.setItem(`lesson:${lesson.id}`,'done');localStorage.setItem(`lesson:${lesson.id}:score`,String(finalCorrect));localStorage.setItem(`lesson:${lesson.id}:report`,JSON.stringify(data));localStorage.setItem(`lesson:${lesson.id}:review`,JSON.stringify({level,dueAt:due}));localStorage.removeItem(`lesson:${lesson.id}:session`);localStorage.removeItem(`lesson:${lesson.id}:canvasSession`);setReport(data);setPhase('done');track('lesson_complete',{mastery,status,confidence:evidence.confidence,objectiveEvidence:evidence.objectiveEvidenceScore,transfer:evidence.transferScore});
 }

 const journey=<div className={styles.journey} aria-label="رحلة الدرس">{phaseLabels.map(([icon,label],i)=><div key={label} className={`${styles.journeyStep} ${journeyStep===i?styles.active:''} ${journeyStep>i?styles.done:''}`}><span>{journeyStep>i?'✓':icon}</span><div><strong>{label}</strong></div></div>)}</div>;

 if(phase==='done')return <div className={styles.shell}>{journey}<section className={`card ${styles.celebration}`}><div className={styles.celebrationIcon}>🏆</div><span className={styles.eyebrow}>أكملتِ الرحلة ✨</span><h2>{report?.status==='review_needed'?'أحسنتِ — سنلعب بهذه الفكرة مرة أخرى لاحقًا':'رائعة! استخدمتِ الفكرة بنجاح'}</h2><p>{report?'أنجزتِ الدرس خطوة خطوة، والآن يمكنكِ الانتقال للمهمة التالية.':'اكتملت المهمة.'}</p><div className={styles.actionRow}><Link className={`btn ${styles.primary}`} href={`/student/${lesson.student}`}>أكمل رحلتي ←</Link><button className="btn secondary" onClick={reset}>🔁 ألعب الدرس من جديد</button></div></section></div>;
 if(phase==='discover')return <div className={styles.shell}>{journey}<section className={`card ${styles.heroCard} ${styles.stage}`}><span className={styles.eyebrow}>✨ اكتشفي</span><h2>نبدأ بالفكرة، لا بالحفظ</h2><p className={styles.lead}>{lesson.summary}</p><div className={styles.hook}><div className={styles.hookIcon}>🔎</div><div><strong>ابدئي من هنا</strong><p>{hookFor(lesson)}</p></div></div><LessonVisual lesson={lesson}/><div className={styles.missionGrid}>{learningMovesFor(lesson).map((move,i)=><div className={styles.mission} key={move}><span>{['👀','🧩','🚀'][i]}</span><span>{move}</span></div>)}</div><div className={styles.actionRow}><button className={`btn ${styles.primary}`} onClick={()=>{track('discover_complete');setPhase('build')}}>ابدئي الاكتشاف ←</button></div></section></div>;
 if(phase==='build')return <div className={styles.shell}>{journey}<LearningCanvas lesson={lesson} objectiveIndex={conceptStep}/></div>;
 if(phase==='practice')return <div className={styles.shell}>{journey}<section className={`card ${styles.practiceCard}`}><span className={styles.eyebrow}>🎮 جربيها</span><h2>الآن دورك</h2><p className={styles.lead}>جربي ما شاهدتِه. لا توجد درجات هنا.</p>{hasInteractiveActivity(lesson.id)?<InteractiveActivity lesson={lesson} onComplete={()=>{track('practice_complete',{interactive:true});setPhase('quiz')}}/>:<><div className={styles.exampleBox}><strong>مثال نراه معًا</strong><div>{lesson.example}</div></div>{practiceReveal&&<div className={styles.helpCard}><strong>خطوة البداية</strong><div>{practiceHintFor(lesson)}</div></div>}<div className={styles.actionRow}><button className={styles.smartHelp} onClick={()=>{setPracticeReveal(v=>!v);track('practice_hint')}}>{practiceReveal?'أخفي التلميح':'💡 أرني خطوة البداية'}</button><button className={`btn ${styles.primary}`} onClick={()=>{track('practice_complete',{interactive:false});setPhase('quiz')}}>جربت — نكمل ←</button></div></>}</section></div>;
 if(phase==='gap'&&currentGap)return <div className={styles.shell}>{journey}<GapCoach gap={currentGap} onComplete={()=>{localStorage.setItem(`gap:${lesson.student}:${currentGap.id}`,'practiced');track('foundation_bridge_complete',{gap:currentGap.id});setCurrentGap(null);setPhase('remediate')}}/></div>;
 if(phase==='remediate')return <div className={styles.shell}>{journey}<section className={`card ${styles.stage}`}><span className={styles.eyebrow}>🧩 نجربها بطريقة ثانية</span><h2>ننظر فقط إلى الأسئلة التي تحتاج زاوية أخرى</h2><div className={styles.wrongStack}>{wrong.map((idx,n)=>{const q=lesson.questions[idx];return <div className={styles.wrongItem} key={q.id}><span>{n+1}</span><div><strong>شاهديها من هنا</strong><p>{q.explanation}</p></div></div>})}</div><div className={styles.actionRow}><button className={`btn ${styles.primary}`} onClick={()=>{setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setSelected(null);setPhase('retest')}}>✨ جرّبي مرة أخرى</button></div></section></div>;
 if(phase==='retest'){
   const idx=wrong[retestStep];const q=lesson.questions[idx];if(!q){complete(score,[],score);return null}const isCorrect=selected===q.correct;
   function nextRetest(){if(selected===null)return;const ok=selected===q.correct;const gained=retestCorrect+(ok?1:0);const missedNow=ok?retestMissed:[...retestMissed,idx];if(retestStep===wrong.length-1){complete(score+gained,missedNow.map(i=>lesson.questions[i].id),score);return}setRetestCorrect(gained);setRetestMissed(missedNow);setRetestStep(v=>v+1);setSelected(null)}
   return <div className={styles.shell}>{journey}<section className={`card ${styles.quizCard}`}><div className={styles.questionTop}><small>جولة قصيرة جديدة</small><strong>{retestStep+1} / {wrong.length}</strong></div><h2 className={styles.question}>{q.text}</h2><div className={styles.choices}>{q.options.map((o,i)=><button key={o} className={`${styles.choice} ${selected!==null&&i===q.correct?styles.correct:''} ${selected===i&&i!==q.correct?styles.wrong:''}`} disabled={selected!==null} onClick={()=>setSelected(i)}>{o}</button>)}</div>{selected!==null&&<div className={styles.feedback}><strong>{isCorrect?'⭐ الآن أصبحت أوضح':'💡 نشاهدها مرة أخرى'}</strong><div>{q.explanation}</div></div>}<div className={styles.actionRow}><button className={`btn ${styles.primary}`} disabled={selected===null} onClick={nextRetest}>{retestStep===wrong.length-1?'أنهي الجولة':'التالي ←'}</button></div></section></div>;
 }
 const q=lesson.questions[step];if(!q)return <div className={styles.shell}>{journey}<section className={`card ${styles.celebration}`}><h2>اكتملت تجربة هذا الدرس</h2><button className="btn" onClick={()=>complete(0,[],0)}>إنهاء الدرس</button></section></div>;
 const isCorrect=selected===q.correct;
 function nextQuestion(){if(selected===null)return;const ok=selected===q.correct;const gained=score+(ok?1:0);const allWrong=ok?wrong:[...wrong,step];if(step===lesson.questions.length-1){const percent=Math.round(gained/lesson.questions.length*100);setScore(gained);setWrong(allWrong);const wrongIds=allWrong.map(i=>lesson.questions[i]?.id).filter(Boolean);track('quiz_finished',{percent,wrong:wrongIds.length});if(percent>=80){complete(gained,wrongIds,gained)}else{const gap=detectLikelyGap(lesson.id,wrongIds,true);if(gap){recordFoundationSignal(lesson.student,gap.id,lesson.id,wrongIds);setCurrentGap(gap);setPhase('gap')}else setPhase('remediate')}return}setScore(gained);setWrong(allWrong);setStep(v=>v+1);setSelected(null)}
 const percent=Math.round((step/Math.max(1,lesson.questions.length))*100);
 return <div className={styles.shell}>{journey}<section className={`card ${styles.quizCard}`}><span className={styles.eyebrow}>🎯 تحدٍ قصير</span><div className={styles.questionTop}><small>السؤال {step+1} من {lesson.questions.length}</small><span>{step+1}/{lesson.questions.length}</span></div><div className={styles.progress}><span style={{width:`${percent}%`}}/></div><h2 className={styles.question}>{q.text}</h2><div className={styles.choices}>{q.options.map((o,i)=><button key={o} className={`${styles.choice} ${selected!==null&&i===q.correct?styles.correct:''} ${selected===i&&i!==q.correct?styles.wrong:''}`} disabled={selected!==null} onClick={()=>{setSelected(i);track('quiz_answer',{question:q.id,correct:i===q.correct})}}>{o}</button>)}</div>{selected!==null&&<div className={styles.feedback}><strong>{isCorrect?'⭐ استخدمتِ الفكرة بنجاح':'💡 نجربها بطريقة أخرى'}</strong><div>{q.explanation}</div></div>}<div className={styles.actionRow}><button className={`btn ${styles.primary}`} disabled={selected===null} onClick={nextQuestion}>{step===lesson.questions.length-1?'أنهي الجولة':'السؤال التالي ←'}</button></div></section></div>;
}