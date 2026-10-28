'use client';
import {useState} from 'react';
import type {RecoverySkill} from '../../../../../lib/recoverySkills';

export default function RecoveryPractice({slug,skill}:{slug:string;skill:RecoverySkill}){
 const [phase,setPhase]=useState<'learn'|'quiz'|'done'>('learn');
 const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [score,setScore]=useState(0);
 const q=skill.screening[step];
 if(phase==='done')return <div className="card result"><h1>تمت جلسة الاستدراك ✅</h1><p>ثبتنا مهارة <strong>{skill.title}</strong>. النتيجة الحالية: {Math.round(score/skill.screening.length*100)}%.</p><p className="muted">سيستخدم النظام هذه النتيجة عند ترتيب خطة اليوم وعند شرح المعلم الذكي.</p><button className="btn" onClick={()=>history.back()}>العودة</button></div>;
 if(phase==='learn')return <div className="card"><span className="tag">شرح علاجي قصير</span><h1>{skill.title}</h1><p style={{lineHeight:1.9}}>{skill.explanation}</p><div className="exampleChips">{skill.screening.map(x=><span key={x.id}>{x.explanation}</span>)}</div><button className="btn" style={{marginTop:18}} onClick={()=>setPhase('quiz')}>ابدأ التدريب</button></div>;
 function choose(i:number){if(selected!==null)return;setSelected(i)}
 function next(){const gained=score+(selected===q.correct?1:0);if(step===skill.screening.length-1){const pct=Math.round(gained/skill.screening.length*100);localStorage.setItem(`recovery:${slug}:${skill.id}`,String(pct));setScore(gained);setPhase('done');return}setScore(gained);setStep(v=>v+1);setSelected(null)}
 return <div className="card"><span className="tag">تدريب استدراكي · {step+1}/{skill.screening.length}</span><h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:16}}><div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'ممتاز ✅':'نراجع الفكرة'}</strong><p>{q.explanation}</p></div><button className="btn" onClick={next}>{step===skill.screening.length-1?'إنهاء الجلسة':'التالي'}</button></div>}</div>;
}
