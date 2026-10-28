'use client';
import {useState} from 'react';
import type {GapSkill} from '../../../lib/skillGraph';

export default function GapCoach({gap,onComplete}:{gap:GapSkill;onComplete:()=>void}){
 const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [score,setScore]=useState(0);const [started,setStarted]=useState(false);
 const q=gap.check[step];
 if(!started)return <div className="gapCoach"><span className="tag">جسر صغير يساعدنا في درس اليوم</span><h2>نثبت هذه الخطوة: {gap.title}</h2><p>سنأخذها بسرعة لأنها ستجعل فكرة الدرس الحالي أسهل وأوضح.</p><div className="gapExplanation"><strong>الفكرة ببساطة</strong><p>{gap.explanation}</p><div className="exampleChips">{gap.examples.map(x=><span key={x}>{x}</span>)}</div></div><button className="btn" onClick={()=>setStarted(true)}>أجرب خطوتين ثم أعود للدرس</button></div>;
 function choose(i:number){if(selected!==null)return;setSelected(i);if(i===q.correct)setScore(v=>v+1)}
 function next(){const gained=score+(selected===q.correct?1:0);if(step===gap.check.length-1){onComplete();return}setScore(gained);setStep(v=>v+1);setSelected(null)}
 return <div className="gapCoach"><span className="tag">تثبيت سريع · {step+1}/{gap.check.length}</span><h2>{q.question}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>{selected!==null&&<div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'ممتاز ✅':'نغيّر الطريقة ونثبتها'}</strong><p>{q.explanation}</p><button className="btn" onClick={next}>{step===gap.check.length-1?'العودة لفكرة الدرس':'الخطوة التالية'}</button></div>}</div>;
}
