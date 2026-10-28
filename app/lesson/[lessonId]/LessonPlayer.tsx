'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {detectLikelyGap,type GapSkill} from '../../../lib/skillGraph';
import InteractiveActivity,{hasInteractiveActivity} from './InteractiveActivity';
import LessonVisual from './LessonVisual';
import GapCoach from './GapCoach';
import AITutor from './AITutor';
import AITeacherLesson from './AITeacherLesson';
import AIAnswerCoach from './AIAnswerCoach';
import AILessonSummary from './AILessonSummary';

type Phase='diagnostic'|'gap'|'learn'|'activity'|'quiz'|'remediate'|'retest';
type Report={diagnosticCorrect:boolean;firstPassScore:number;finalScore:number;mastery:number;wrongQuestionIds:string[];status:'mastered'|'review_needed';completedAt:string;reviewDue?:string;timeSeconds?:number;gapId?:string|null};
type ReviewMeta={level:number;dueAt:string};
type GapReturn='learn'|'remediate';

function starsForMastery(mastery:number){return mastery>=90?3:mastery>=80?2:1}
function StarRow({count=0,total=3}:{count?:number;total?:number}){
 return <div className="kidStarRow" aria-label={`${count} من ${total} نجوم`}>{Array.from({length:total},(_,i)=><span className={i<count?'earned':''} key={i}>★</span>)}</div>
}
function QuestionProgress({current,total,score}:{current:number;total:number;score:number}){
 const percent=Math.max(0,Math.min(100,Math.round((current/Math.max(total,1))*100)));
 return <div className="kidQuestionProgress"><div className="kidQuestionProgressTop"><span>خطوتك الآن</span><strong>{current} من {total}</strong><span className="kidScorePill">⭐ {score}</span></div><div className="kidProgressTrack"><span style={{width:`${percent}%`}}/></div></div>
}

export default function LessonPlayer({lesson}:{lesson:Lesson}){
 const [phase,setPhase]=useState<Phase>('diagnostic');
 const [step,setStep]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);
 const [score,setScore]=useState(0);
 const [wrong,setWrong]=useState<number[]>([]);
 const [diagnosticCorrect,setDiagnosticCorrect]=useState(false);
 const [diagnosticSelected,setDiagnosticSelected]=useState<number|null>(null);
 const [retestStep,setRetestStep]=useState(0);
 const [retestCorrect,setRetestCorrect]=useState(0);
 const [retestMissed,setRetestMissed]=useState<number[]>([]);
 const [done,setDone]=useState(false);
 const [report,setReport]=useState<Report|null>(null);
 const [currentGap,setCurrentGap]=useState<GapSkill|null>(null);
 const [gapReturn,setGapReturn]=useState<GapReturn>('learn');
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
   setDone(false);setReport(null);setPhase('diagnostic');setStep(0);setSelected(null);setScore(0);setWrong([]);setDiagnosticSelected(null);setDiagnosticCorrect(false);setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setCurrentGap(null);setGapReturn('learn');
 }

 function complete(finalCorrect:number,wrongIds:string[]){
   const mastery=lesson.questions.length?Math.round(finalCorrect/lesson.questions.length*100):100;
   const status:Report['status']=mastery>=80?'mastered':'review_needed';
   let oldReview:ReviewMeta|undefined;const rawReview=localStorage.getItem(`lesson:${lesson.id}:review`);if(rawReview){try{oldReview=JSON.parse(rawReview)}catch{}}
   const level=Math.min((oldReview?.level??0)+1,5);const intervals=[1,3,7,14,30];const days=status==='review_needed'?1:intervals[level-1];const due=new Date(Date.now()+days*24*60*60*1000).toISOString();
   const elapsed=Math.max(1,Math.round((Date.now()-startedAt)/1000));
   const oldTime=Number(localStorage.getItem(`lesson:${lesson.id}:timeSeconds`)||0);localStorage.setItem(`lesson:${lesson.id}:timeSeconds`,String(oldTime+elapsed));
   const gap=detectLikelyGap(lesson.id,wrongIds,diagnosticCorrect);
   const data:Report={diagnosticCorrect,firstPassScore:score,finalScore:finalCorrect,mastery,wrongQuestionIds:wrongIds,status,completedAt:new Date().toISOString(),reviewDue:due,timeSeconds:elapsed,gapId:gap?.id||null};
   localStorage.setItem(`lesson:${lesson.id}`,'done');localStorage.setItem(`lesson:${lesson.id}:score`,String(finalCorrect));localStorage.setItem(`lesson:${lesson.id}:report`,JSON.stringify(data));localStorage.setItem(`lesson:${lesson.id}:review`,JSON.stringify({level,dueAt:due}));setReport(data);setDone(true);
 }

 const tutor=<AITutor lesson={lesson}/>;

 if(done){
   const stars=starsForMastery(report?.mastery??80);
   return <><div className="card result lessonCelebration"><div className="celebrationIcon">🏆</div><span className="celebrationEyebrow">أنهيتِ المهمة</span><h2>{report?.status==='review_needed'?'أحسنتِ، بقي تثبيت صغير':'رائعة! تقدمتِ خطوة جديدة'}</h2><StarRow count={stars}/><p>{report?`وصل إتقانك إلى ${report.mastery}%`:'أكملتِ هذا الدرس على هذا الجهاز.'}</p>{report&&<div className="masteryGrid"><div><strong>{report.diagnosticCorrect?'✓':'○'}</strong><span>البداية</span></div><div><strong>{report.firstPassScore}/{lesson.questions.length}</strong><span>المحاولة الأولى</span></div><div><strong>{report.mastery}%</strong><span>الإتقان</span></div></div>}{report?.gapId&&<div className="gapAlert"><strong>💪 وجدنا مهارة يمكن تقويتها</strong><p>سيأخذها المعلم في الاعتبار في خطتك القادمة حتى يصبح الدرس أسهل عليكِ.</p></div>}{report?.timeSeconds&&<p className="muted">استغرقت هذه المهمة نحو {Math.max(1,Math.round(report.timeSeconds/60))} دقيقة.</p>}<p className="muted">{report?.reviewDue?`سنذكّرك بمراجعة قصيرة يوم ${new Date(report.reviewDue).toLocaleDateString('ar')}.`:report?.status==='review_needed'?'سيظهر هذا الدرس مرة أخرى في خطة المراجعة.':'يمكنك الآن الانتقال للمهمة التالية.'}</p><button className="btn secondary" onClick={reset}>🔁 أريد أن أجرب مرة أخرى</button></div>{report&&<AILessonSummary lesson={lesson} mastery={report.mastery} wrongQuestionIds={report.wrongQuestionIds} gapTitle={report.gapId}/>} {tutor}</>;
 }

 const diagnostic=lesson.questions[0];
 if(phase==='diagnostic')return <><div className="card childQuestionCard diagnosticCard"><div className="kidPhaseBadge">🌱 خطوة صغيرة قبل الدرس</div><h2>لنرَ من أين نبدأ</h2><p className="kidShortLead">سؤال واحد فقط يساعد المعلم أن يختار الشرح الأنسب لكِ.</p><h3 className="kidQuestionTitle">{diagnostic.text}</h3><div className="choice kidChoices">{diagnostic.options.map((o,i)=>{const cls=diagnosticSelected===null?'option':i===diagnostic.correct?'option ok':i===diagnosticSelected?'option bad':'option';return <button key={o} className={cls} onClick={()=>{if(diagnosticSelected!==null)return;setDiagnosticSelected(i);setDiagnosticCorrect(i===diagnostic.correct)}}>{o}</button>})}</div>{diagnosticSelected!==null&&<div className="kidAnswerReveal"><div className={diagnosticSelected===diagnostic.correct?'kidMiniCelebration success':'kidMiniCelebration learn'}><span>{diagnosticSelected===diagnostic.correct?'⭐':'💡'}</span><div><strong>{diagnosticSelected===diagnostic.correct?'بداية ممتازة!':'جميل، عرفنا ما سنقويه'}</strong><p>{diagnostic.explanation}</p></div></div><button className="btn kidPrimaryAction" onClick={()=>{const gap=detectLikelyGap(lesson.id,[],diagnosticSelected===diagnostic.correct);if(gap&&diagnosticSelected!==diagnostic.correct){setCurrentGap(gap);setGapReturn('learn');setPhase('gap')}else setPhase('learn')}}>{diagnosticSelected===diagnostic.correct?'هيا نتعلم ←':'نقوّي الأساس ثم نكمل ←'}</button></div>}</div>{tutor}</>;

 if(phase==='gap'&&currentGap)return <><GapCoach gap={currentGap} onComplete={()=>{localStorage.setItem(`gap:${lesson.student}:${currentGap.id}`,'practiced');setCurrentGap(null);setPhase(gapReturn)}}/>{tutor}</>;

 if(phase==='learn')return <><div className="card aiFirstLessonShell teacherMissionCard"><div className="kidPhaseBadge">🧠 نتعلم الآن</div><h2>هيا نفهم الفكرة معًا</h2><p className="kidShortLead">شاهدي الفكرة أولًا، ثم اطلبي من المعلم أن يبسط أو يغيّر المثال متى احتجتِ.</p><LessonVisual lesson={lesson}/><AITeacherLesson lesson={lesson} diagnosticCorrect={diagnosticCorrect}/><button className="btn kidPrimaryAction" onClick={()=>setPhase(hasInteractiveActivity(lesson.id)?'activity':'quiz')}>{hasInteractiveActivity(lesson.id)?'🎮 جاهزة للنشاط':'🎯 جاهزة للتدريب'}</button></div>{tutor}</>;

 if(phase==='activity')return <><InteractiveActivity lesson={lesson} onComplete={()=>setPhase('quiz')}/>{tutor}</>;

 if(phase==='remediate')return <><div className="card kidRemediationCard"><div className="kidPhaseBadge">💪 نقوّي نقطة واحدة</div><h2>قريب جدًا! سنراجع فقط ما احتاج تثبيتًا</h2><p className="kidShortLead">لن نعيد الدرس كاملًا. نصلح النقطة الصعبة ثم نجرب من جديد.</p><div className="kidRemediationStack">{wrong.map((idx,n)=>{const q=lesson.questions[idx];const point=lesson.learningPoints[Math.min(idx,lesson.learningPoints.length-1)];return <div className="remediation" key={q.id}><span className="remediationNumber">{n+1}</span><div><strong>{q.text}</strong><p>{q.explanation}</p><small>تذكري: {point}</small></div></div>})}</div><button className="btn kidPrimaryAction" onClick={()=>{setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setSelected(null);setPhase('retest')}}>✨ أجرب مرة أخرى</button></div>{tutor}</>;

 if(phase==='retest'){
   const idx=wrong[retestStep];const q=lesson.questions[idx];
   function answerRetest(i:number){if(selected!==null)return;setSelected(i);if(i===q.correct)setRetestCorrect(v=>v+1)}
   function nextRetest(){const currentCorrect=selected===q.correct;const gained=retestCorrect+(currentCorrect?1:0);const missedNow=currentCorrect?retestMissed:[...retestMissed,idx];if(retestStep===wrong.length-1){complete(score+gained,missedNow.map(i=>lesson.questions[i].id));return}setRetestMissed(missedNow);setRetestStep(v=>v+1);setSelected(null)}
   const isCorrect=selected===q.correct;
   return <><div className="card childQuestionCard"><QuestionProgress current={retestStep+1} total={wrong.length} score={retestCorrect}/><div className="kidPhaseBadge">🔁 محاولة تثبيت</div><h2 className="kidQuestionTitle">{q.text}</h2><div className="choice kidChoices">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>answerRetest(i)}>{o}</button>})}</div>{selected!==null&&<div className="kidAnswerReveal"><div className={isCorrect?'kidMiniCelebration success':'kidMiniCelebration learn'}><span>{isCorrect?'⭐':'💡'}</span><strong>{isCorrect?'أحسنتِ! ثبتت الفكرة':'لا بأس، هذه المحاولة تساعدنا'}</strong></div><AIAnswerCoach lessonId={lesson.id} questionId={q.id} selectedIndex={selected} fallback={q.explanation}/><button className="btn kidPrimaryAction" onClick={nextRetest}>{retestStep===wrong.length-1?'🏁 شاهد النتيجة':'السؤال التالي ←'}</button></div>}</div>{tutor}</>;
 }

 const q=lesson.questions[step];
 function answer(i:number){if(selected!==null)return;setSelected(i);if(i===q.correct)setScore(v=>v+1);else setWrong(v=>[...v,step])}
 function next(){const finalFirstPass=score+(selected===q.correct?1:0);if(step===lesson.questions.length-1){const percent=Math.round(finalFirstPass/lesson.questions.length*100);if(percent>=80){complete(finalFirstPass,[])}else{const wrongIds=wrong.map(i=>lesson.questions[i]?.id).filter(Boolean);const gap=detectLikelyGap(lesson.id,wrongIds,diagnosticCorrect);setScore(finalFirstPass);if(gap){setCurrentGap(gap);setGapReturn('remediate');setPhase('gap')}else setPhase('remediate')}return}setStep(v=>v+1);setSelected(null)}
 const isCorrect=selected===q.correct;
 return <><div className="card childQuestionCard"><QuestionProgress current={step+1} total={lesson.questions.length} score={score}/><div className="kidPhaseBadge">🎯 تدريب قصير</div><h2 className="kidQuestionTitle">{q.text}</h2><div className="choice kidChoices">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>answer(i)}>{o}</button>})}</div>{selected!==null&&<div className="kidAnswerReveal"><div className={isCorrect?'kidMiniCelebration success':'kidMiniCelebration learn'}><span>{isCorrect?'⭐':'💡'}</span><div><strong>{isCorrect?'رائعة! نجمة جديدة':'ممتاز أنك جربتِ'}</strong><p>{isCorrect?'إجابتك صحيحة. لنأخذ الخطوة التالية.':'الخطأ هنا يساعد المعلم أن يعرف ماذا يشرح لكِ.'}</p></div></div><AIAnswerCoach lessonId={lesson.id} questionId={q.id} selectedIndex={selected} fallback={q.explanation}/><button className="btn kidPrimaryAction" onClick={next}>{step===lesson.questions.length-1?'🏁 شاهد النتيجة':'السؤال التالي ←'}</button></div>}</div>{tutor}</>;
}
