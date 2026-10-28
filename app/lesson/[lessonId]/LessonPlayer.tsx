'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';

type Phase='diagnostic'|'learn'|'quiz'|'remediate'|'retest';
type Report={
 diagnosticCorrect:boolean;
 firstPassScore:number;
 finalScore:number;
 mastery:number;
 wrongQuestionIds:string[];
 status:'mastered'|'review_needed';
 completedAt:string;
};

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

 useEffect(()=>{
   const raw=localStorage.getItem(`lesson:${lesson.id}:report`);
   if(raw){try{setReport(JSON.parse(raw))}catch{}}
   if(localStorage.getItem(`lesson:${lesson.id}`)==='done')setDone(true);
 },[lesson.id]);

 function reset(){
   localStorage.removeItem(`lesson:${lesson.id}`);
   localStorage.removeItem(`lesson:${lesson.id}:score`);
   localStorage.removeItem(`lesson:${lesson.id}:report`);
   setDone(false);setReport(null);setPhase('diagnostic');setStep(0);setSelected(null);setScore(0);setWrong([]);setDiagnosticSelected(null);setDiagnosticCorrect(false);setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setHelpOpen(false);
 }

 function complete(finalCorrect:number,wrongIds:string[]){
   const mastery=lesson.questions.length?Math.round(finalCorrect/lesson.questions.length*100):100;
   const data:Report={diagnosticCorrect,firstPassScore:score,finalScore:finalCorrect,mastery,wrongQuestionIds:wrongIds,status:mastery>=80?'mastered':'review_needed',completedAt:new Date().toISOString()};
   localStorage.setItem(`lesson:${lesson.id}`,'done');
   localStorage.setItem(`lesson:${lesson.id}:score`,String(finalCorrect));
   localStorage.setItem(`lesson:${lesson.id}:report`,JSON.stringify(data));
   setReport(data);setDone(true);
 }

 if(done)return <div className="card result"><h2>{report?.status==='review_needed'?'📌 أُنجز الدرس ويحتاج مراجعة':'🌟 أحسنتِ!'}</h2><p>{report?`مستوى الإتقان: ${report.mastery}%`:'أكملتِ هذا الدرس على هذا الجهاز.'}</p>{report&&<div className="masteryGrid"><div><strong>{report.diagnosticCorrect?'✓':'○'}</strong><span>التشخيص</span></div><div><strong>{report.firstPassScore}/{lesson.questions.length}</strong><span>المحاولة الأولى</span></div><div><strong>{report.mastery}%</strong><span>الإتقان النهائي</span></div></div>}<p className="muted">{report?.status==='review_needed'?'سيظهر هذا الدرس في لوحة الأب كدرس يحتاج مراجعة قصيرة.':'يمكنك الانتقال للدرس التالي أو إعادة التدريب لاحقًا.'}</p><button className="btn secondary" onClick={reset}>إعادة الدرس</button></div>;

 const diagnostic=lesson.questions[0];
 if(phase==='diagnostic')return <div className="card"><span className="tag">فحص سريع · لا يدخل في الدرجة</span><h2 style={{marginTop:12}}>قبل أن نبدأ</h2><p className="muted">سؤال واحد يساعدنا على معرفة نقطة البداية المناسبة.</p><h3>{diagnostic.text}</h3><div className="choice">{diagnostic.options.map((o,i)=>{const cls=diagnosticSelected===null?'option':i===diagnostic.correct?'option ok':i===diagnosticSelected?'option bad':'option';return <button key={o} className={cls} onClick={()=>{if(diagnosticSelected!==null)return;setDiagnosticSelected(i);setDiagnosticCorrect(i===diagnostic.correct)}}>{o}</button>})}</div>{diagnosticSelected!==null&&<div style={{marginTop:16}}><div className="result"><strong>{diagnosticSelected===diagnostic.correct?'ممتاز، لديكِ أساس جيد ✅':'جيد، سنبني الفكرة خطوة خطوة'}</strong><p>{diagnostic.explanation}</p></div><button className="btn" style={{marginTop:12}} onClick={()=>setPhase('learn')}>ابدئي التعلم</button></div>}</div>;

 if(phase==='learn')return <div className="card"><div className="muted">تعلم أولًا</div><h2 style={{marginTop:6}}>الفكرة الأساسية</h2><div style={{display:'grid',gap:10,margin:'14px 0'}}>{lesson.learningPoints.map((point,i)=><div key={point} className="lesson"><strong>{i+1}</strong><div>{point}</div></div>)}</div><div className="result"><strong>مثال محلول</strong><p style={{lineHeight:1.9,marginBottom:0}}>{lesson.example}</p></div><button className="btn secondary" style={{marginTop:12,marginInlineStart:8}} onClick={()=>setHelpOpen(v=>!v)}>لم أفهم</button>{helpOpen&&<div className="helpBox"><strong>شرح أبسط</strong><p>{lesson.learningPoints[0]}</p><p className="muted">ركزي على المثال المحلول، ثم جربي التدريب. إذا أخطأتِ سيعيد لك النظام فقط النقطة التي تحتاجينها.</p></div>}<button className="btn" style={{marginTop:16}} onClick={()=>setPhase('quiz')}>ابدئي التدريب</button></div>;

 if(phase==='remediate')return <div className="card"><span className="tag">علاج مخصص</span><h2>سنراجع فقط ما أخطأتِ فيه</h2><p className="muted">لا حاجة لإعادة الدرس كاملًا.</p><div style={{display:'grid',gap:10}}>{wrong.map((idx,n)=>{const q=lesson.questions[idx];const point=lesson.learningPoints[Math.min(idx,lesson.learningPoints.length-1)];return <div className="remediation" key={q.id}><strong>{n+1}. {q.text}</strong><p>{q.explanation}</p><div className="muted">تذكري: {point}</div></div>})}</div><button className="btn" style={{marginTop:16}} onClick={()=>{setRetestStep(0);setRetestCorrect(0);setRetestMissed([]);setSelected(null);setPhase('retest')}}>اختبار قصير من جديد</button></div>;

 if(phase==='retest'){
   const idx=wrong[retestStep];
   const q=lesson.questions[idx];
   function answerRetest(i:number){if(selected!==null)return;setSelected(i);if(i===q.correct)setRetestCorrect(v=>v+1)}
   function nextRetest(){
     const currentCorrect=selected===q.correct;
     const gained=retestCorrect+(currentCorrect?1:0);
     const missedNow=currentCorrect?retestMissed:[...retestMissed,idx];
     if(retestStep===wrong.length-1){
       const finalCorrect=score+gained;
       complete(finalCorrect,missedNow.map(i=>lesson.questions[i].id));return;
     }
     setRetestMissed(missedNow);setRetestStep(v=>v+1);setSelected(null);
   }
   return <div className="card"><span className="tag">إعادة اختبار · {retestStep+1} من {wrong.length}</span><h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>answerRetest(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:16}}><div className="result"><strong>{selected===q.correct?'تم إتقان هذه النقطة ✅':'ما زالت تحتاج مراجعة صغيرة'}</strong><p>{q.explanation}</p></div><button className="btn" style={{marginTop:12}} onClick={nextRetest}>{retestStep===wrong.length-1?'عرض النتيجة':'السؤال التالي'}</button></div>}</div>;
 }

 const q=lesson.questions[step];
 function answer(i:number){if(selected!==null)return;setSelected(i);if(i===q.correct)setScore(v=>v+1);else setWrong(v=>[...v,step])}
 function next(){
   const finalFirstPass=score+(selected===q.correct?1:0);
   if(step===lesson.questions.length-1){
     const percent=Math.round(finalFirstPass/lesson.questions.length*100);
     if(percent>=80){complete(finalFirstPass,[])}else{setScore(finalFirstPass);setPhase('remediate')}
     return;
   }
   setStep(v=>v+1);setSelected(null);
 }
 return <div className="card"><div className="muted">تدريب · سؤال {step+1} من {lesson.questions.length}</div><div className="progress" style={{margin:'10px 0 20px'}}><span style={{width:`${((step+1)/lesson.questions.length)*100}%`}}/></div><h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>answer(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:16}}><div className="result"><strong>{selected===q.correct?'إجابة صحيحة ✅':'نراجعها معًا'}</strong><p>{q.explanation}</p></div><button className="btn" style={{marginTop:12}} onClick={next}>{step===lesson.questions.length-1?'تحليل النتيجة':'السؤال التالي'}</button></div>}<div className="muted" style={{marginTop:16,fontSize:12}}>الإجابات الصحيحة حتى الآن: {score}</div></div>;
}
