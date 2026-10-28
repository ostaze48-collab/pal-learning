'use client';
import {useMemo,useState} from 'react';
import type {RecoverySkill} from '../../../../../lib/recoverySkills';
import {getDeepDiagnostic} from '../../../../../lib/deepDiagnostics';

export default function RecoveryPractice({slug,skill,focusId}:{slug:string;skill:RecoverySkill;focusId?:string}){
 const diagnostic=getDeepDiagnostic(skill.id);
 const focus=focusId?diagnostic?.subskills.find(s=>s.id===focusId):undefined;
 const questions=focus?.questions??skill.screening;
 const title=focus?.title??skill.title;
 const explanation=focus?.miniLesson??skill.explanation;
 const treatmentSteps=focus?.treatmentSteps??[];
 const [phase,setPhase]=useState<'learn'|'quiz'|'done'>('learn');
 const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [score,setScore]=useState(0);
 const [finalPct,setFinalPct]=useState<number|null>(null);
 const q=questions[step];
 const deepKey=focus?`recoveryDeep:${slug}:${skill.id}:${focus.id}`:null;
 const previousDeep=useMemo(()=>focus&&deepKey?Number(globalThis?.localStorage?.getItem?.(deepKey)??NaN):NaN,[deepKey,focus]);

 function persistFocusedResult(pct:number){
   if(!focus||!diagnostic)return;
   localStorage.setItem(`recoveryDeep:${slug}:${skill.id}:${focus.id}`,String(pct));
   const scored=diagnostic.subskills.map(sub=>({sub,raw:localStorage.getItem(`recoveryDeep:${slug}:${skill.id}:${sub.id}`)})).filter(x=>x.raw!==null).map(x=>({sub:x.sub,score:Number(x.raw)}));
   if(scored.length){
     const average=Math.round(scored.reduce((sum,x)=>sum+x.score,0)/scored.length);
     localStorage.setItem(`recovery:${slug}:${skill.id}`,String(average));
     const weak=scored.filter(x=>x.score<80).sort((a,b)=>a.score-b.score).map(x=>({id:x.sub.id,title:x.sub.title,gradeAnchor:x.sub.gradeAnchor,score:x.score,treatmentSteps:x.sub.treatmentSteps}));
     localStorage.setItem(`recoveryPlan:${slug}:${skill.id}`,JSON.stringify({skillId:skill.id,updatedAt:new Date().toISOString(),average,weak}));
   }
 }

 if(phase==='done')return <div className="card result"><h1>تمت جلسة الاستدراك ✅</h1><p>تدربنا على <strong>{title}</strong>. النتيجة الحالية: {finalPct??Math.round(score/questions.length*100)}%.</p>{focus&&<p className="muted">كان هذا علاجًا مركزًا لجزء محدد من مهارة {skill.title}، وليس إعادة المجال كاملًا.</p>}<p className="muted">سيستخدم النظام هذه النتيجة في خطة اليوم وفي شرح المعلم الذكي.</p><button className="btn" onClick={()=>history.back()}>العودة</button></div>;
 if(phase==='learn')return <div className="card"><span className="tag">{focus?'علاج دقيق':'شرح علاجي قصير'}</span><h1>{title}</h1>{focus&&<div className="muted" style={{marginBottom:10}}>المرجع المتوقع: {focus.gradeAnchor}{Number.isFinite(previousDeep)?` · نتيجتك السابقة ${previousDeep}%`:''}</div>}<p style={{lineHeight:1.9}}>{explanation}</p>{treatmentSteps.length>0&&<div className="gapExplanation"><strong>خطة هذه الجلسة</strong><ol>{treatmentSteps.map(x=><li key={x}>{x}</li>)}</ol></div>}<div className="exampleChips">{questions.map(x=><span key={x.id}>{x.explanation}</span>)}</div><button className="btn" style={{marginTop:18}} onClick={()=>setPhase('quiz')}>ابدأ التدريب</button></div>;
 function choose(i:number){if(selected!==null)return;setSelected(i)}
 function next(){const gained=score+(selected===q.correct?1:0);if(step===questions.length-1){const pct=Math.round(gained/questions.length*100);if(focus)persistFocusedResult(pct);else localStorage.setItem(`recovery:${slug}:${skill.id}`,String(pct));setScore(gained);setFinalPct(pct);setPhase('done');return}setScore(gained);setStep(v=>v+1);setSelected(null)}
 return <div className="card"><span className="tag">تدريب استدراكي · {step+1}/{questions.length}</span><h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:16}}><div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'ممتاز ✅':'نراجع الفكرة'}</strong><p>{q.explanation}</p></div><button className="btn" onClick={next}>{step===questions.length-1?'إنهاء الجلسة':'التالي'}</button></div>}</div>;
}
