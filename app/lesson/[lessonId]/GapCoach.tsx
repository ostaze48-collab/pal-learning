'use client';
import {useState} from 'react';
import type {GapSkill} from '../../../lib/skillGraph';

export default function GapCoach({gap,onComplete}:{gap:GapSkill;onComplete:()=>void}){
 const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [score,setScore]=useState(0);const [started,setStarted]=useState(false);const q=gap.check[step];
 if(!started)return <div className="gapCoach"><span className="tag">⚡ تحدٍ سريع</span><h2>جربي هذه الفكرة الصغيرة</h2><p>شاهدي المثال، ثم جربيه بنفسك قبل أن نكمل.</p><div className="gapExplanation"><strong>شاهدي المثال</strong><p>{gap.explanation}</p><div className="exampleChips">{gap.examples.slice(0,3).map(x=><span key={x}>{x}</span>)}</div></div><button className="btn" onClick={()=>setStarted(true)}>هيا نجرب ←</button></div>;
 function choose(i:number){if(selected!==null)return;setSelected(i);if(i===q.correct)setScore(v=>v+1)}
 function next(){const gained=score+(selected===q.correct?1:0);if(step===gap.check.length-1){onComplete();return}setScore(gained);setStep(v=>v+1);setSelected(null)}
 return <div className="gapCoach"><span className="tag">⚡ جولة سريعة · {step+1}/{gap.check.length}</span><h2>{q.question}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>{selected!==null&&<div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'رائعة! ✨':'قريبة — شاهديها بهذه الطريقة 💡'}</strong><p>{q.explanation}</p><button className="btn" onClick={next}>{step===gap.check.length-1?'نكمل الدرس ←':'نجرب التالية ←'}</button></div>}</div>;
}
