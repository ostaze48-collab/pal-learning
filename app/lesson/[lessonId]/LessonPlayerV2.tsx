'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {detectLikelyGap,type GapSkill} from '../../../lib/skillGraph';
import {readCreativeOutcome} from '../../../lib/creativeLearningProfile';
import {combineMasteryEvidence} from '../../../lib/masteryEvidence';
import {recordFoundationSignal} from '../../../lib/foundationSignals';
import AdaptiveLessonExperience from './AdaptiveLessonExperience';
import InteractiveActivity,{hasInteractiveActivity} from './InteractiveActivity';
import LessonVisual from './LessonVisual';
import GapCoach from './GapCoach';
import styles from './LessonPlayerV2.module.css';

type Phase='discover'|'build'|'practice'|'quiz'|'gap'|'remediate'|'retest'|'done';
type Report={diagnosticCorrect:boolean;firstPassScore:number;finalScore:number;quizMastery?:number;conceptScore?:number|null;evidenceReason?:string;mastery:number;wrongQuestionIds:string[];status:'mastered'|'review_needed';completedAt:string;reviewDue?:string;timeSeconds?:number;gapId?:string|null};
type ReviewMeta={level:number;dueAt:string};

const phaseIndex:Record<Phase,number>={discover:0,build:1,practice:2,quiz:3,gap:3,remediate:3,retest:3,done:4};
const phaseLabels=[['✨','اكتشف'],['🧩','ابنِ الفكرة'],['🎮','جرّب'],['🎯','تحقق']];

function hookFor(lesson:Lesson){
 if(lesson.subject==='العلوم والحياة')return 'ابدئي بسؤال فضولي: ماذا تلاحظين؟ ماذا تتوقعين؟ ثم قارني توقعك بما ستكتشفينه داخل الدرس.';
 if(lesson.subject==='الرياضيات')return 'ابحثي عن النمط أو العلاقة أولًا، ثم سنحوّل ما اكتشفته إلى طريقة تستطيعين استخدامها وحدك.';
 if(lesson.subject==='اللغة العربية')return 'ابدئي من المعنى والسياق، ثم اكتشفي النمط أو القاعدة من الأمثلة بدل حفظها وحدها.';
 if(lesson.subject==='English')return 'ابدئي من الموقف والمعنى، ثم لاحظي الشكل المستخدم وجرّبيه في مثال جديد.';
 return 'ابدئي بالملاحظة والاكتشاف، ثم ابنِ الفكرة خطوة خطوة حتى تصبح واضحة وقابلة للاستخدام.';
}

function helpFor(lesson:Lesson,index:number){
 const point=lesson.learningPoints[Math.min(index,Math.max(0,lesson.learningPoints.length-1))];
 if(lesson.subject==='العلوم والحياة')return `ركزي على الدليل: ما الذي رأيتِه فعلًا؟ ثم اربطيه بالفكرة: ${point||lesson.summary}`;
 if(lesson.subject==='الرياضيات')return `حوّلي الفكرة إلى مثال صغير أو رسم قبل الرموز. الفكرة التي نريد تثبيتها: ${point||lesson.summary}`;
 if(lesson.subject==='اللغة العربية')return `ارجعي إلى الجملة أو السياق، ثم اسألي: ما المعنى أو النمط الذي يتكرر؟ ${point||''}`;
 if(lesson.subject==='English')return `ابدئي بالمعنى أولًا ثم لاحظي الكلمات التي تغيّرت في المثال. ${point||''}`;
 return point||lesson.summary;
}

export default function LessonPlayerV2({lesson}:{lesson:Lesson}){
 const [phase,setPhase]=useState<Phase>('discover');
 const [conceptStep,setConceptStep]=useState(0);
 const [helpOpen,setHelpOpen]=useState(false);
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
 const [startedAt]=useState(()=>Date.now());
 const objectives=lesson.learningPoints.length?lesson.learningPoints:[lesson.summary];
 const currentPoint=objectives[Math.min(conceptStep,objectives.length-1)];
 const journeyStep=phaseIndex[phase];

 function track(event:string,meta:Record<string,unknown>={}){
   try{const key=`lessonUx:${lesson.id}`;const raw=localStorage.getItem(key);const old=raw?JSON.parse(raw):[];const next=Array.isArray(old)?old.slice(-119):[];next.push({event,phase,at:new Date().toISOString(),...meta});localStorage.setItem(key,JSON.stringify(next))}catch{}
 }

 useEffect(()=>{
   const raw=localStorage.getItem(`lesson:${lesson.id}:report`);
   if(raw){try{const parsed=JSON.parse(raw);setReport(parsed)}catch{}}
   const reviewMode=localStorage.getItem(`lesson:${lesson.id}:reviewMode`)==='1';
   if(reviewMode){localStorage.removeItem(`lesson:${lesson.id}:reviewMode`);setPhase('quiz');return}
   if(localStorage.getItem(`lesson:${lesson.id}`)==='done')setPhase('done');
 },[lesson.id]);

 useEffect(()=>{track('phase_view',{phase})},[phase]);

 function markCoverage(){
   try{localStorage.setItem(`lessonCoverage:${lesson.id}`,JSON.stringify({lessonId:lesson.id,student:lesson.student,objectives:objectives.map((text,i)=>({id:i+1,text,covered:true})),coveredCount:objectives.length,total:objectives.length,completedAt:new Date().toISOString()}))}catch{}
 }

 function reset(){
   localStorage.removeItem(`lesson:${lesson.id}`);localStorage.removeItem(`lesson:${lesson.id}:score`);localStorage.removeItem(`lesson:${lesson.id}:report`);localStorage.removeItem(`lessonCoverage:${lesson.id}`);
   setReport(null);setPhase('discover');setConceptStep(0);setHelpOpen(false);setPracticeReveal(false);setStep(0);setSelected(null);setScore(0);setWrong([]);setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setCurrentGap(null);
 }

 function saveFoundationSignal(wrongIds:string[]){
   if(!wrongIds.length)return null;
   const likely=detectLikelyGap(lesson.id,wrongIds,true);
   if(likely)recordFoundationSignal(lesson.student,likely.id,lesson.id,wrongIds);
   return likely;
 }

 function complete(finalCorrect:number,wrongIds:string[],firstPassCorrect:number){
   const quizMastery=lesson.questions.length?Math.round(finalCorrect/lesson.questions.length*100):100;
   const concept=readCreativeOutcome(lesson.student,lesson.id);
   const evidence=combineMasteryEvidence({quizPercent:quizMastery,understanding:null,conceptSuccess:concept?.successRate??null,conceptAttempts:concept?.attempts??0});
   const mastery=evidence.mastery;const status:Report['status']=evidence.status;
   let oldReview:ReviewMeta|undefined;const rawReview=localStorage.getItem(`lesson:${lesson.id}:review`);if(rawReview){try{oldReview=JSON.parse(rawReview)}catch{}}
   const level=Math.min((oldReview?.level??0)+1,5);const intervals=[1,3,7,14,30];const days=status==='review_needed'?1:intervals[level-1];const due=new Date(Date.now()+days*86400000).toISOString();
   const elapsed=Math.max(1,Math.round((Date.now()-startedAt)/1000));const oldTime=Number(localStorage.getItem(`lesson:${lesson.id}:timeSeconds`)||0);localStorage.setItem(`lesson:${lesson.id}:timeSeconds`,String(oldTime+elapsed));
   const gap=saveFoundationSignal(wrongIds);
   const data:Report={diagnosticCorrect:true,firstPassScore:firstPassCorrect,finalScore:finalCorrect,quizMastery:evidence.quizScore,conceptScore:evidence.conceptScore,evidenceReason:evidence.reason,mastery,wrongQuestionIds:wrongIds,status,completedAt:new Date().toISOString(),reviewDue:due,timeSeconds:elapsed,gapId:gap?.id||null};
   localStorage.setItem(`lesson:${lesson.id}`,'done');localStorage.setItem(`lesson:${lesson.id}:score`,String(finalCorrect));localStorage.setItem(`lesson:${lesson.id}:report`,JSON.stringify(data));localStorage.setItem(`lesson:${lesson.id}:review`,JSON.stringify({level,dueAt:due}));setReport(data);setPhase('done');track('lesson_complete',{mastery,status});
 }

 const journey=<div className={styles.journey} aria-label="رحلة الدرس">{phaseLabels.map(([icon,label],i)=><div key={label} className={`${styles.journeyStep} ${journeyStep===i?styles.active:''} ${journeyStep>i?styles.done:''}`}><span>{journeyStep>i?'✓':icon}</span><div><strong>{label}</strong></div></div>)}</div>;

 if(phase==='done')return <div className={styles.shell}>{journey}<section className={`card ${styles.celebration}`}><div className={styles.celebrationIcon}>🏆</div><span className={styles.eyebrow}>أنهيتِ رحلة الدرس</span><h2>{report?.status==='review_needed'?'أحسنتِ — بقي تثبيت صغير لاحقًا':'رائعة! الفكرة أصبحت أقوى'}</h2><p>{report?`إتقانك الحالي ${report.mastery}%`:'اكتملت المهمة على هذا الجهاز.'}</p>{report&&<div className={styles.resultGrid}><div><strong>{report.quizMastery??0}%</strong><small>التحقق النهائي</small></div><div><strong>{report.conceptScore===null||report.conceptScore===undefined?'—':`${report.conceptScore}%`}</strong><small>مختبر الفكرة</small></div><div><strong>{report.mastery}%</strong><small>الإتقان الكلي</small></div></div>}<p className={styles.quietNote}>{report?.reviewDue?`سنعود للفكرة بمراجعة قصيرة في ${new Date(report.reviewDue).toLocaleDateString('ar')}.`:'يمكنك الانتقال للمهمة التالية.'}</p><div className={styles.actionRow}><button className="btn secondary" onClick={reset}>🔁 أعيدي الرحلة</button></div></section></div>;

 if(phase==='discover')return <div className={styles.shell}>{journey}<section className={`card ${styles.heroCard} ${styles.stage}`}><span className={styles.eyebrow}>✨ المرحلة 1 · اكتشفي</span><h2>قبل أن نحفظ أي شيء، نريد أن نفهم لماذا هذه الفكرة مهمة</h2><p className={styles.lead}>{lesson.summary}</p><div className={styles.hook}><div className={styles.hookIcon}>🔎</div><div><strong>مهمتك الأولى</strong><p>{hookFor(lesson)}</p></div></div><LessonVisual lesson={lesson}/><div className={styles.missionGrid}>{objectives.slice(0,6).map((point,i)=><div className={styles.mission} key={`${i}-${point}`}><span>🎯</span><span>{point}</span></div>)}</div><div className={styles.actionRow}><button className={`btn ${styles.primary}`} onClick={()=>{track('discover_complete');setPhase('build')}}>ابدئي بناء الفكرة ←</button></div></section></div>;

 if(phase==='build')return <div className={styles.shell}>{journey}<section className={styles.stage}><div className={styles.coverage}><div><strong>تغطية أهداف الدرس</strong><div className={styles.quietNote}>لن ننتقل للاختبار قبل المرور على جميع الأفكار الأساسية.</div></div><div className={styles.coverageDots}>{objectives.map((_,i)=><span key={i} className={i<conceptStep?styles.covered:''}/>)}</div></div><AdaptiveLessonExperience lesson={lesson} diagnosticCorrect={true}/><article className={styles.conceptCard}><div className={styles.conceptTop}><div><span className={styles.eyebrow}>الفكرة {conceptStep+1} من {objectives.length}</span><h3>{currentPoint}</h3></div><div className={styles.conceptNumber}>{conceptStep+1}</div></div><div className={styles.conceptPrompt}>🧠 اربطي هذه الفكرة بما رأيته في النشاط أو الصورة، ثم ابحثي عن مثال لها في الدرس.</div>{helpOpen&&<div className={styles.helpCard}><strong>💡 مساعدة صغيرة</strong><div>{helpFor(lesson,conceptStep)}</div></div>}<div className={styles.actionRow}><button className={styles.smartHelp} onClick={()=>{setHelpOpen(v=>!v);track('smart_help',{conceptStep})}}>💡 ساعديني</button><button className={`btn ${styles.primary}`} onClick={()=>{setHelpOpen(false);if(conceptStep<objectives.length-1){setConceptStep(v=>v+1);track('objective_covered',{objective:conceptStep+1})}else{markCoverage();track('coverage_complete',{total:objectives.length});setPhase('practice')}}}>{conceptStep<objectives.length-1?'الفكرة التالية ←':'اكتملت الأفكار — نجربها الآن ←'}</button></div></article></section></div>;

 if(phase==='practice')return <div className={styles.shell}>{journey}<section className={`card ${styles.practiceCard}`}><span className={styles.eyebrow}>🎮 المرحلة 3 · جربي بلا درجات</span><h2>الآن استخدمي الفكرة قبل الاختبار</h2><p className={styles.lead}>هذه المحاولة جزء من التعلم وليست اختبارًا. الهدف أن تتأكدي أنك تستطيعين استخدام ما فهمته.</p>{hasInteractiveActivity(lesson.id)?<InteractiveActivity lesson={lesson} onComplete={()=>{track('practice_complete',{interactive:true});setPhase('quiz')}}/>:<><div className={styles.exampleBox}><strong>مثال نراه معًا</strong><div>{lesson.example}</div></div>{practiceReveal&&<div className={styles.helpCard}><strong>ما الذي استخدمناه هنا؟</strong><div>{objectives[0]}</div></div>}<div className={styles.actionRow}><button className={styles.smartHelp} onClick={()=>{setPracticeReveal(v=>!v);track('practice_hint')}}>{practiceReveal?'أخفي التلميح':'💡 أرني خطوة البداية'}</button><button className={`btn ${styles.primary}`} onClick={()=>{track('practice_complete',{interactive:false});setPhase('quiz')}}>جربت بنفسي — ابدأ التحقق ←</button></div></>}</section></div>;

 if(phase==='gap'&&currentGap)return <div className={styles.shell}>{journey}<GapCoach gap={currentGap} onComplete={()=>{localStorage.setItem(`gap:${lesson.student}:${currentGap.id}`,'practiced');track('foundation_bridge_complete',{gap:currentGap.id});setCurrentGap(null);setPhase('remediate')}}/></div>;

 if(phase==='remediate')return <div className={styles.shell}>{journey}<section className={`card ${styles.stage}`}><span className={styles.eyebrow}>🧩 تثبيت موجه</span><h2>لن نعيد الدرس كله — فقط النقاط التي لم تثبت بعد</h2><div className={styles.wrongStack}>{wrong.map((idx,n)=>{const q=lesson.questions[idx];const point=objectives[Math.min(idx,objectives.length-1)];return <div className={styles.wrongItem} key={q.id}><span>{n+1}</span><div><strong>{point}</strong><p>{q.explanation}</p></div></div>})}</div><div className={styles.actionRow}><button className={`btn ${styles.primary}`} onClick={()=>{setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setSelected(null);setPhase('retest')}}>✨ جرّبي من جديد</button></div></section></div>;

 if(phase==='retest'){
   const idx=wrong[retestStep];const q=lesson.questions[idx];
   if(!q){complete(score,[],score);return null}
   const isCorrect=selected===q.correct;
   function nextRetest(){if(selected===null)return;const ok=selected===q.correct;const gained=retestCorrect+(ok?1:0);const missedNow=ok?retestMissed:[...retestMissed,idx];if(retestStep===wrong.length-1){complete(score+gained,missedNow.map(i=>lesson.questions[i].id),score);return}setRetestCorrect(gained);setRetestMissed(missedNow);setRetestStep(v=>v+1);setSelected(null)}
   return <div className={styles.shell}>{journey}<section className={`card ${styles.quizCard}`}><div className={styles.questionTop}><small>إعادة قياس قصيرة</small><strong>{retestStep+1} / {wrong.length}</strong></div><h2 className={styles.question}>{q.text}</h2><div className={styles.choices}>{q.options.map((o,i)=><button key={o} className={`${styles.choice} ${selected!==null&&i===q.correct?styles.correct:''} ${selected===i&&i!==q.correct?styles.wrong:''}`} disabled={selected!==null} onClick={()=>setSelected(i)}>{o}</button>)}</div>{selected!==null&&<div className={styles.feedback}><strong>{isCorrect?'⭐ ثبتت الفكرة':'💡 ما زلنا نتعلم منها'}</strong><div>{q.explanation}</div></div>}<div className={styles.actionRow}><button className={`btn ${styles.primary}`} disabled={selected===null} onClick={nextRetest}>{retestStep===wrong.length-1?'شاهدي النتيجة':'التالي ←'}</button></div></section></div>;
 }

 const q=lesson.questions[step];
 if(!q)return <div className={styles.shell}>{journey}<section className={`card ${styles.celebration}`}><h2>اكتملت تجربة هذا الدرس</h2><button className="btn" onClick={()=>complete(0,[],0)}>إنهاء الدرس</button></section></div>;
 const isCorrect=selected===q.correct;
 function nextQuestion(){
   if(selected===null)return;const ok=selected===q.correct;const gained=score+(ok?1:0);const allWrong=ok?wrong:[...wrong,step];
   if(step===lesson.questions.length-1){const percent=Math.round(gained/lesson.questions.length*100);setScore(gained);setWrong(allWrong);const wrongIds=allWrong.map(i=>lesson.questions[i]?.id).filter(Boolean);track('quiz_finished',{percent,wrong:wrongIds.length});if(percent>=80){complete(gained,wrongIds,gained)}else{const gap=detectLikelyGap(lesson.id,wrongIds,true);if(gap){recordFoundationSignal(lesson.student,gap.id,lesson.id,wrongIds);setCurrentGap(gap);setPhase('gap')}else setPhase('remediate')}return}
   setScore(gained);setWrong(allWrong);setStep(v=>v+1);setSelected(null);
 }
 const percent=Math.round((step/Math.max(1,lesson.questions.length))*100);
 return <div className={styles.shell}>{journey}<section className={`card ${styles.quizCard}`}><span className={styles.eyebrow}>🎯 المرحلة 4 · الآن نتحقق من الفهم</span><div className={styles.questionTop}><small>السؤال {step+1} من {lesson.questions.length}</small><span>⭐ {score}</span></div><div className={styles.progress}><span style={{width:`${percent}%`}}/></div><h2 className={styles.question}>{q.text}</h2><div className={styles.choices}>{q.options.map((o,i)=><button key={o} className={`${styles.choice} ${selected!==null&&i===q.correct?styles.correct:''} ${selected===i&&i!==q.correct?styles.wrong:''}`} disabled={selected!==null} onClick={()=>{setSelected(i);track('quiz_answer',{question:q.id,correct:i===q.correct})}}>{o}</button>)}</div>{selected!==null&&<div className={styles.feedback}><strong>{isCorrect?'⭐ ممتاز — طبقتِ الفكرة':'💡 هذه المحاولة ستحدد ما نثبته لاحقًا'}</strong><div>{q.explanation}</div></div>}<div className={styles.actionRow}><button className={`btn ${styles.primary}`} disabled={selected===null} onClick={nextQuestion}>{step===lesson.questions.length-1?'إنهاء التحقق':'السؤال التالي ←'}</button></div></section></div>;
}
