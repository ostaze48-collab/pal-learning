'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {detectLikelyGap,type GapSkill} from '../../../lib/skillGraph';
import {readCreativeOutcome} from '../../../lib/creativeLearningProfile';
import {combineMasteryEvidence,type UnderstandingOutcome} from '../../../lib/masteryEvidence';
import {recordFoundationSignal} from '../../../lib/foundationSignals';
import InteractiveActivity,{hasInteractiveActivity} from './InteractiveActivity';
import LessonVisual from './LessonVisual';
import GapCoach from './GapCoach';
import AITutor from './AITutor';
import AITeacherLesson from './AITeacherLesson';
import AIAnswerCoach from './AIAnswerCoach';
import AILessonSummary from './AILessonSummary';

type Phase='learn'|'activity'|'quiz'|'gap'|'remediate'|'retest';
type Report={diagnosticCorrect:boolean;firstPassScore:number;finalScore:number;quizMastery?:number;understandingScore?:number|null;conceptScore?:number|null;evidenceReason?:string;mastery:number;wrongQuestionIds:string[];status:'mastered'|'review_needed';completedAt:string;reviewDue?:string;timeSeconds?:number;gapId?:string|null};
type ReviewMeta={level:number;dueAt:string};
type GapReturn='remediate';

function starsForMastery(mastery:number){return mastery>=90?3:mastery>=80?2:1}
function StarRow({count=0,total=3}:{count?:number;total?:number}){
 return <div className="kidStarRow" aria-label={`${count} من ${total} نجوم`}>{Array.from({length:total},(_,i)=><span className={i<count?'earned':''} key={i}>★</span>)}</div>
}
function QuestionProgress({current,total,score}:{current:number;total:number;score:number}){
 const percent=Math.max(0,Math.min(100,Math.round((current/Math.max(total,1))*100)));
 return <div className="kidQuestionProgress"><div className="kidQuestionProgressTop"><span>خطوتك الآن</span><strong>{current} من {total}</strong><span className="kidScorePill">⭐ {score}</span></div><div className="kidProgressTrack"><span style={{width:`${percent}%`}}/></div></div>
}

export default function LessonPlayer({lesson}:{lesson:Lesson}){
 const [phase,setPhase]=useState<Phase>('learn');
 const [step,setStep]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);
 const [score,setScore]=useState(0);
 const [wrong,setWrong]=useState<number[]>([]);
 const [diagnosticCorrect]=useState(true);
 const [retestStep,setRetestStep]=useState(0);
 const [retestCorrect,setRetestCorrect]=useState(0);
 const [retestMissed,setRetestMissed]=useState<number[]>([]);
 const [done,setDone]=useState(false);
 const [report,setReport]=useState<Report|null>(null);
 const [currentGap,setCurrentGap]=useState<GapSkill|null>(null);
 const [gapReturn]=useState<GapReturn>('remediate');
 const [startedAt]=useState(()=>Date.now());

 useEffect(()=>{
   const raw=localStorage.getItem(`lesson:${lesson.id}:report`);
   if(raw){try{setReport(JSON.parse(raw))}catch{}}
   const reviewMode=localStorage.getItem(`lesson:${lesson.id}:reviewMode`)==='1';
   if(reviewMode){localStorage.removeItem(`lesson:${lesson.id}:reviewMode`);setDone(false);setPhase('quiz');return}
   if(localStorage.getItem(`lesson:${lesson.id}`)==='done')setDone(true);
 },[lesson.id]);

 function reset(){
   localStorage.removeItem(`lesson:${lesson.id}`);localStorage.removeItem(`lesson:${lesson.id}:score`);localStorage.removeItem(`lesson:${lesson.id}:report`);
   setDone(false);setReport(null);setPhase('learn');setStep(0);setSelected(null);setScore(0);setWrong([]);setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setCurrentGap(null);
 }

 function saveFoundationSignal(wrongIds:string[]){
   if(!wrongIds.length)return null;
   const likely=detectLikelyGap(lesson.id,wrongIds,true);
   if(likely)recordFoundationSignal(lesson.student,likely.id,lesson.id,wrongIds);
   return likely;
 }

 function complete(finalCorrect:number,wrongIds:string[],firstPassCorrect:number){
   const quizMastery=lesson.questions.length?Math.round(finalCorrect/lesson.questions.length*100):100;
   let understanding:UnderstandingOutcome|null=null;const understandingRaw=localStorage.getItem(`aiUnderstanding:${lesson.id}`);if(understandingRaw){try{const x=JSON.parse(understandingRaw);if(['understood','partial','misconception'].includes(x?.outcome))understanding=x.outcome}catch{}}
   const concept=readCreativeOutcome(lesson.student,lesson.id);
   const evidence=combineMasteryEvidence({quizPercent:quizMastery,understanding,conceptSuccess:concept?.successRate??null,conceptAttempts:concept?.attempts??0});
   const mastery=evidence.mastery;const status:Report['status']=evidence.status;
   let oldReview:ReviewMeta|undefined;const rawReview=localStorage.getItem(`lesson:${lesson.id}:review`);if(rawReview){try{oldReview=JSON.parse(rawReview)}catch{}}
   const level=Math.min((oldReview?.level??0)+1,5);const intervals=[1,3,7,14,30];const days=status==='review_needed'?1:intervals[level-1];const due=new Date(Date.now()+days*24*60*60*1000).toISOString();
   const elapsed=Math.max(1,Math.round((Date.now()-startedAt)/1000));
   const oldTime=Number(localStorage.getItem(`lesson:${lesson.id}:timeSeconds`)||0);localStorage.setItem(`lesson:${lesson.id}:timeSeconds`,String(oldTime+elapsed));
   const gap=saveFoundationSignal(wrongIds);
   const data:Report={diagnosticCorrect:true,firstPassScore:firstPassCorrect,finalScore:finalCorrect,quizMastery:evidence.quizScore,understandingScore:evidence.understandingScore,conceptScore:evidence.conceptScore,evidenceReason:evidence.reason,mastery,wrongQuestionIds:wrongIds,status,completedAt:new Date().toISOString(),reviewDue:due,timeSeconds:elapsed,gapId:gap?.id||null};
   localStorage.setItem(`lesson:${lesson.id}`,'done');localStorage.setItem(`lesson:${lesson.id}:score`,String(finalCorrect));localStorage.setItem(`lesson:${lesson.id}:report`,JSON.stringify(data));localStorage.setItem(`lesson:${lesson.id}:review`,JSON.stringify({level,dueAt:due}));setReport(data);setDone(true);
 }

 const tutor=<AITutor lesson={lesson}/>;

 if(done){
   const stars=starsForMastery(report?.mastery??80);
   return <><div className="card result lessonCelebration"><div className="celebrationIcon">🏆</div><span className="celebrationEyebrow">أنهيتِ المهمة</span><h2>{report?.status==='review_needed'?'أحسنتِ، سنثبت نقطة صغيرة لاحقًا':'رائعة! تقدمتِ خطوة جديدة'}</h2><StarRow count={stars}/><p>{report?`وصل إتقانك إلى ${report.mastery}%`:'أكملتِ هذا الدرس على هذا الجهاز.'}</p>{report&&<div className="masteryGrid"><div><strong>{report.quizMastery??Math.round(report.finalScore/lesson.questions.length*100)}%</strong><span>التمارين</span></div><div><strong>{report.understandingScore===null||report.understandingScore===undefined?'—':`${report.understandingScore}%`}</strong><span>تفسير الفكرة</span></div><div><strong>{report.mastery}%</strong><span>الإتقان الكلي</span></div></div>}{report?.evidenceReason&&<p className="muted">{report.evidenceReason}</p>}{report?.timeSeconds&&<p className="muted">استغرقت هذه المهمة نحو {Math.max(1,Math.round(report.timeSeconds/60))} دقيقة.</p>}<p className="muted">{report?.reviewDue?`سنعود لهذه الفكرة بمراجعة قصيرة يوم ${new Date(report.reviewDue).toLocaleDateString('ar')}.`:report?.status==='review_needed'?'سيظهر هذا الدرس مرة أخرى في خطة المراجعة.':'يمكنك الآن الانتقال للمهمة التالية.'}</p><button className="btn secondary" onClick={reset}>🔁 أريد أن أجرب مرة أخرى</button></div>{report&&<AILessonSummary lesson={lesson} mastery={report.mastery} wrongQuestionIds={report.wrongQuestionIds} gapTitle={report.gapId}/>} {tutor}</>;
 }

 if(phase==='learn')return <><div className="card aiFirstLessonShell teacherMissionCard"><div className="kidPhaseBadge">🧠 أولًا نفهم الدرس</div><h2>هيا نكتشف الفكرة كاملة</h2><p className="kidShortLead">سيشرح لكِ المعلم الدرس بطريقة مبدعة، وستجربين أفكارًا صغيرة أثناء الشرح. بعد أن تتضح الصورة ننتقل للتدريب.</p><LessonVisual lesson={lesson}/><AITeacherLesson lesson={lesson} diagnosticCorrect={diagnosticCorrect}/><button className="btn kidPrimaryAction" onClick={()=>setPhase(hasInteractiveActivity(lesson.id)?'activity':'quiz')}>{hasInteractiveActivity(lesson.id)?'🎮 جرّبت وفهمت — نشاط أخير قبل التدريب':'🎯 فهمت الفكرة — ابدأ التدريب'}</button></div>{tutor}</>;

 if(phase==='activity')return <><InteractiveActivity lesson={lesson} onComplete={()=>setPhase('quiz')}/>{tutor}</>;

 if(phase==='gap'&&currentGap)return <><GapCoach gap={currentGap} onComplete={()=>{localStorage.setItem(`gap:${lesson.student}:${currentGap.id}`,'practiced');setCurrentGap(null);setPhase(gapReturn)}}/>{tutor}</>;

 if(phase==='remediate')return <><div className="card kidRemediationCard"><div className="kidPhaseBadge">💪 نثبت ما لم يصل بعد</div><h2>نراجع فقط النقاط التي ظهرت في التدريب</h2><p className="kidShortLead">لن نعيد الدرس كاملًا. نغيّر طريقة الشرح في النقطة الصعبة ثم نجرب بسؤال جديد.</p><div className="kidRemediationStack">{wrong.map((idx,n)=>{const q=lesson.questions[idx];const point=lesson.learningPoints[Math.min(idx,lesson.learningPoints.length-1)];return <div className="remediation" key={q.id}><span className="remediationNumber">{n+1}</span><div><strong>{q.text}</strong><p>{q.explanation}</p><small>الفكرة التي نثبتها: {point}</small></div></div>})}</div><button className="btn kidPrimaryAction" onClick={()=>{setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setSelected(null);setPhase('retest')}}>✨ أجرب بطريقة جديدة</button></div>{tutor}</>;

 if(phase==='retest'){
   const idx=wrong[retestStep];const q=lesson.questions[idx];
   function answerRetest(i:number){if(selected!==null)return;setSelected(i)}
   function nextRetest(){const currentCorrect=selected===q.correct;const gained=retestCorrect+(currentCorrect?1:0);const missedNow=currentCorrect?retestMissed:[...retestMissed,idx];if(retestStep===wrong.length-1){complete(score+gained,missedNow.map(i=>lesson.questions[i].id),score);return}setRetestCorrect(gained);setRetestMissed(missedNow);setRetestStep(v=>v+1);setSelected(null)}
   const isCorrect=selected===q.correct;
   return <><div className="card childQuestionCard"><QuestionProgress current={retestStep+1} total={wrong.length} score={retestCorrect}/><div className="kidPhaseBadge">🔁 محاولة تثبيت</div><h2 className="kidQuestionTitle">{q.text}</h2><div className="choice kidChoices">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>answerRetest(i)}>{o}</button>})}</div>{selected!==null&&<div className="kidAnswerReveal"><div className={isCorrect?'kidMiniCelebration success':'kidMiniCelebration learn'}><span>{isCorrect?'⭐':'💡'}</span><strong>{isCorrect?'أحسنتِ! ثبتت الفكرة':'هذه المحاولة تخبر المعلم كيف يغيّر الشرح'}</strong></div><AIAnswerCoach lessonId={lesson.id} questionId={q.id} selectedIndex={selected} fallback={q.explanation}/><button className="btn kidPrimaryAction" onClick={nextRetest}>{retestStep===wrong.length-1?'🏁 شاهد النتيجة':'السؤال التالي ←'}</button></div>}</div>{tutor}</>;
 }

 const q=lesson.questions[step];
 function answer(i:number){if(selected!==null)return;setSelected(i)}
 function next(){const currentCorrect=selected===q.correct;const gained=score+(currentCorrect?1:0);const allWrong=currentCorrect?wrong:[...wrong,step];if(step===lesson.questions.length-1){const percent=Math.round(gained/lesson.questions.length*100);setScore(gained);setWrong(allWrong);const wrongIds=allWrong.map(i=>lesson.questions[i]?.id).filter(Boolean);if(percent>=80){complete(gained,wrongIds,gained)}else{const gap=detectLikelyGap(lesson.id,wrongIds,true);if(gap){recordFoundationSignal(lesson.student,gap.id,lesson.id,wrongIds);setCurrentGap(gap);setPhase('gap')}else setPhase('remediate')}return}setScore(gained);setWrong(allWrong);setStep(v=>v+1);setSelected(null)}
 const isCorrect=selected===q.correct;
 return <><div className="card childQuestionCard"><QuestionProgress current={step+1} total={lesson.questions.length} score={score}/><div className="kidPhaseBadge">🎯 الآن نتأكد أن الفكرة ثبتت</div><h2 className="kidQuestionTitle">{q.text}</h2><div className="choice kidChoices">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>answer(i)}>{o}</button>})}</div>{selected!==null&&<div className="kidAnswerReveal"><div className={isCorrect?'kidMiniCelebration success':'kidMiniCelebration learn'}><span>{isCorrect?'⭐':'💡'}</span><div><strong>{isCorrect?'رائعة! الفكرة ثابتة هنا':'ممتاز أنك جربتِ'}</strong><p>{isCorrect?'إجابتك صحيحة. لنأخذ الخطوة التالية.':'هذه الإجابة تساعد المعلم أن يعرف أي جزء يحتاج طريقة شرح مختلفة.'}</p></div></div><AIAnswerCoach lessonId={lesson.id} questionId={q.id} selectedIndex={selected} fallback={q.explanation}/><button className="btn kidPrimaryAction" onClick={next}>{step===lesson.questions.length-1?'🏁 قياس ما تعلمتِه':'السؤال التالي ←'}</button></div>}</div>{tutor}</>;
}