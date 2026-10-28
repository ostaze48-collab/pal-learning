'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {detectLikelyGap,type GapSkill} from '../../../lib/skillGraph';
import InteractiveActivity,{hasInteractiveActivity} from './InteractiveActivity';
import LessonVisual from './LessonVisual';
import GapCoach from './GapCoach';
import AITutor from './AITutor';

type Phase='diagnostic'|'gap'|'learn'|'activity'|'quiz'|'remediate'|'retest';
type Report={diagnosticCorrect:boolean;firstPassScore:number;finalScore:number;mastery:number;wrongQuestionIds:string[];status:'mastered'|'review_needed';completedAt:string;reviewDue?:string;timeSeconds?:number;gapId?:string|null};
type ReviewMeta={level:number;dueAt:string};

type GapReturn='learn'|'remediate';

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
 const [helpOpen,setHelpOpen]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [currentGap,setCurrentGap]=useState<GapSkill|null>(null);
 const [gapReturn,setGapReturn]=useState<GapReturn>('learn');
 const [startedAt]=useState(()=>Date.now());

 useEffect(()=>{
   const raw=localStorage.getItem(`lesson:${lesson.id}:report`);
   if(raw){try{setReport(JSON.parse(raw))}catch{}}
   const reviewMode=localStorage.getItem(`lesson:${lesson.id}:reviewMode`)==='1';
   if(reviewMode){localStorage.removeItem(`lesson:${lesson.id}:reviewMode`);setDone(false);setPhase('quiz');return}
   if(localStorage.getItem(`lesson:${lesson.id}`)==='done')setDone(true);
   return()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel()};
 },[lesson.id]);

 function speakLesson(){
   if(!('speechSynthesis' in window))return;
   if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return}
   const text=[lesson.title,...lesson.learningPoints,`مثال: ${lesson.example}`].join('. ');
   const utterance=new SpeechSynthesisUtterance(text);
   utterance.lang=lesson.subject==='English'?'en-US':'ar-SA';
   utterance.rate=0.9;
   utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>setSpeaking(false);
   setSpeaking(true);window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);
 }

 function reset(){
   if('speechSynthesis' in window)window.speechSynthesis.cancel();
   localStorage.removeItem(`lesson:${lesson.id}`);localStorage.removeItem(`lesson:${lesson.id}:score`);localStorage.removeItem(`lesson:${lesson.id}:report`);
   setDone(false);setReport(null);setPhase('diagnostic');setStep(0);setSelected(null);setScore(0);setWrong([]);setDiagnosticSelected(null);setDiagnosticCorrect(false);setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setHelpOpen(false);setSpeaking(false);setCurrentGap(null);setGapReturn('learn');
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

 if(done)return <><div className="card result"><h2>{report?.status==='review_needed'?'📌 أُنجز الدرس ويحتاج مراجعة':'🌟 أحسنتِ!'}</h2><p>{report?`مستوى الإتقان: ${report.mastery}%`:'أكملتِ هذا الدرس على هذا الجهاز.'}</p>{report&&<div className="masteryGrid"><div><strong>{report.diagnosticCorrect?'✓':'○'}</strong><span>التشخيص</span></div><div><strong>{report.firstPassScore}/{lesson.questions.length}</strong><span>المحاولة الأولى</span></div><div><strong>{report.mastery}%</strong><span>الإتقان النهائي</span></div></div>}{report?.gapId&&<div className="gapAlert"><strong>فجوة سابقة تستحق مراجعة</strong><p>النظام رصد أن جزءًا من الصعوبة قد يرتبط بمهارة سابقة. افتحي المعلم الذكي أدناه لشرحها وربطها بهذا الدرس.</p></div>}{report?.timeSeconds&&<p className="muted">وقت هذه الجلسة: نحو {Math.max(1,Math.round(report.timeSeconds/60))} دقيقة.</p>}<p className="muted">{report?.reviewDue?`المراجعة القادمة: ${new Date(report.reviewDue).toLocaleDateString('ar')}`:report?.status==='review_needed'?'سيظهر هذا الدرس في لوحة الأب كدرس يحتاج مراجعة قصيرة.':'يمكنك الانتقال للدرس التالي أو إعادة التدريب لاحقًا.'}</p><button className="btn secondary" onClick={reset}>إعادة الدرس</button></div>{tutor}</>;

 const diagnostic=lesson.questions[0];
 if(phase==='diagnostic')return <><div className="card"><span className="tag">فحص سريع · لا يدخل في الدرجة</span><h2 style={{marginTop:12}}>قبل أن نبدأ</h2><p className="muted">السؤال الأول لاختبار نقطة البداية. إذا كشف ضعفًا في مهارة أقدم، سنعالجها قبل الدرس.</p><h3>{diagnostic.text}</h3><div className="choice">{diagnostic.options.map((o,i)=>{const cls=diagnosticSelected===null?'option':i===diagnostic.correct?'option ok':i===diagnosticSelected?'option bad':'option';return <button key={o} className={cls} onClick={()=>{if(diagnosticSelected!==null)return;setDiagnosticSelected(i);setDiagnosticCorrect(i===diagnostic.correct)}}>{o}</button>})}</div>{diagnosticSelected!==null&&<div style={{marginTop:16}}><div className="result"><strong>{diagnosticSelected===diagnostic.correct?'ممتاز، لديكِ أساس جيد ✅':'وجدنا نقطة تستحق التثبيت قبل الدرس'}</strong><p>{diagnostic.explanation}</p></div><button className="btn" style={{marginTop:12}} onClick={()=>{const gap=detectLikelyGap(lesson.id,[],diagnosticSelected===diagnostic.correct);if(gap&&diagnosticSelected!==diagnostic.correct){setCurrentGap(gap);setGapReturn('learn');setPhase('gap')}else setPhase('learn')}}>{diagnosticSelected===diagnostic.correct?'ابدئي التعلم':'عالج الأساس ثم ابدئي'}</button></div>}</div>{tutor}</>;

 if(phase==='gap'&&currentGap)return <><GapCoach gap={currentGap} onComplete={()=>{localStorage.setItem(`gap:${lesson.student}:${currentGap.id}`,'practiced');setCurrentGap(null);setPhase(gapReturn)}}/>{tutor}</>;

 if(phase==='learn')return <><div className="card"><div className="muted">تعلم بصري + شرح</div><h2 style={{marginTop:6}}>الفكرة الأساسية</h2><LessonVisual lesson={lesson}/><div className="lessonTools"><button className="btn secondary" onClick={speakLesson}>{speaking?'⏹ إيقاف الصوت':'🔊 استمعي للشرح'}</button><button className="btn secondary" onClick={()=>setHelpOpen(v=>!v)}>لم أفهم</button></div><div style={{display:'grid',gap:10,margin:'14px 0'}}>{lesson.learningPoints.map((point,i)=><div key={point} className="lesson"><strong>{i+1}</strong><div>{point}</div></div>)}</div><div className="result"><strong>مثال محلول</strong><p style={{lineHeight:1.9,marginBottom:0}}>{lesson.example}</p></div>{helpOpen&&<div className="helpBox"><strong>شرح أبسط</strong><p>{lesson.learningPoints[0]}</p><p className="muted">ركزي على الصورة والمثال. ويمكنك أيضًا فتح المعلم الذكي لشرح مختلف أو مثال إضافي.</p></div>}<button className="btn" style={{marginTop:16}} onClick={()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();setSpeaking(false);setPhase(hasInteractiveActivity(lesson.id)?'activity':'quiz')}}>{hasInteractiveActivity(lesson.id)?'ابدئي النشاط التفاعلي':'ابدئي التدريب'}</button></div>{tutor}</>;

 if(phase==='activity')return <><InteractiveActivity lesson={lesson} onComplete={()=>setPhase('quiz')}/>{tutor}</>;

 if(phase==='remediate')return <><div className="card"><span className="tag">علاج مخصص</span><h2>سنراجع فقط ما أخطأتِ فيه</h2><p className="muted">لا حاجة لإعادة الدرس كاملًا.</p><div style={{display:'grid',gap:10}}>{wrong.map((idx,n)=>{const q=lesson.questions[idx];const point=lesson.learningPoints[Math.min(idx,lesson.learningPoints.length-1)];return <div className="remediation" key={q.id}><strong>{n+1}. {q.text}</strong><p>{q.explanation}</p><div className="muted">تذكري: {point}</div></div>})}</div><button className="btn" style={{marginTop:16}} onClick={()=>{setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setSelected(null);setPhase('retest')}}>اختبار قصير من جديد</button></div>{tutor}</>;

 if(phase==='retest'){
   const idx=wrong[retestStep];const q=lesson.questions[idx];
   function answerRetest(i:number){if(selected!==null)return;setSelected(i);if(i===q.correct)setRetestCorrect(v=>v+1)}
   function nextRetest(){const currentCorrect=selected===q.correct;const gained=retestCorrect+(currentCorrect?1:0);const missedNow=currentCorrect?retestMissed:[...retestMissed,idx];if(retestStep===wrong.length-1){complete(score+gained,missedNow.map(i=>lesson.questions[i].id));return}setRetestMissed(missedNow);setRetestStep(v=>v+1);setSelected(null)}
   return <><div className="card"><span className="tag">إعادة اختبار · {retestStep+1} من {wrong.length}</span><h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>answerRetest(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:16}}><div className="result"><strong>{selected===q.correct?'تم إتقان هذه النقطة ✅':'ما زالت تحتاج مراجعة صغيرة'}</strong><p>{q.explanation}</p></div><button className="btn" style={{marginTop:12}} onClick={nextRetest}>{retestStep===wrong.length-1?'عرض النتيجة':'السؤال التالي'}</button></div>}</div>{tutor}</>;
 }

 const q=lesson.questions[step];
 function answer(i:number){if(selected!==null)return;setSelected(i);if(i===q.correct)setScore(v=>v+1);else setWrong(v=>[...v,step])}
 function next(){const finalFirstPass=score+(selected===q.correct?1:0);if(step===lesson.questions.length-1){const percent=Math.round(finalFirstPass/lesson.questions.length*100);if(percent>=80){complete(finalFirstPass,[])}else{const wrongIds=wrong.map(i=>lesson.questions[i]?.id).filter(Boolean);const gap=detectLikelyGap(lesson.id,wrongIds,diagnosticCorrect);setScore(finalFirstPass);if(gap){setCurrentGap(gap);setGapReturn('remediate');setPhase('gap')}else setPhase('remediate')}return}setStep(v=>v+1);setSelected(null)}
 return <><div className="card"><div className="muted">تدريب · سؤال {step+1} من {lesson.questions.length}</div><div className="progress" style={{margin:'10px 0 20px'}}><span style={{width:`${((step+1)/lesson.questions.length)*100}%`}}/></div><h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>answer(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:16}}><div className="result"><strong>{selected===q.correct?'إجابة صحيحة ✅':'نراجعها معًا'}</strong><p>{q.explanation}</p></div><button className="btn" style={{marginTop:12}} onClick={next}>{step===lesson.questions.length-1?'تحليل النتيجة':'السؤال التالي'}</button></div>}<div className="muted" style={{marginTop:16,fontSize:12}}>الإجابات الصحيحة حتى الآن: {score}</div></div>{tutor}</>;
}
