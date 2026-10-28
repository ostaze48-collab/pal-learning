'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';

export default function LessonPlayer({lesson}:{lesson:Lesson}){
 const [phase,setPhase]=useState<'learn'|'quiz'>('learn');
 const [step,setStep]=useState(0); const [selected,setSelected]=useState<number|null>(null); const [score,setScore]=useState(0); const [done,setDone]=useState(false);
 useEffect(()=>{if(localStorage.getItem(`lesson:${lesson.id}`)==='done')setDone(true)},[lesson.id]);
 if(done)return <div className="card result"><h2>🌟 أحسنتِ!</h2><p>أكملتِ هذا الدرس على هذا الجهاز.</p><button className="btn secondary" onClick={()=>{localStorage.removeItem(`lesson:${lesson.id}`);setDone(false);setPhase('learn');setStep(0);setScore(0);setSelected(null)}}>إعادة الدرس</button></div>;
 if(phase==='learn')return <div className="card"><div className="muted">تعلم أولًا</div><h2 style={{marginTop:6}}>الفكرة الأساسية</h2><div style={{display:'grid',gap:10,margin:'14px 0'}}>{lesson.learningPoints.map((point,i)=><div key={point} className="lesson"><strong>{i+1}</strong><div>{point}</div></div>)}</div><div className="result"><strong>مثال محلول</strong><p style={{lineHeight:1.9,marginBottom:0}}>{lesson.example}</p></div><button className="btn" style={{marginTop:16}} onClick={()=>setPhase('quiz')}>ابدئي التدريب</button></div>;
 const q=lesson.questions[step];
 function answer(i:number){if(selected!==null)return;setSelected(i);if(i===q.correct)setScore(v=>v+1)}
 function next(){if(step===lesson.questions.length-1){localStorage.setItem(`lesson:${lesson.id}`,'done');localStorage.setItem(`lesson:${lesson.id}:score`,String(score+(selected===q.correct?1:0)));setDone(true);return}setStep(v=>v+1);setSelected(null)}
 return <div className="card"><div className="muted">تدريب · سؤال {step+1} من {lesson.questions.length}</div><div className="progress" style={{margin:'10px 0 20px'}}><span style={{width:`${((step+1)/lesson.questions.length)*100}%`}}/></div><h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>answer(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:16}}><div className="result"><strong>{selected===q.correct?'إجابة صحيحة ✅':'نراجعها معًا'}</strong><p>{q.explanation}</p></div><button className="btn" style={{marginTop:12}} onClick={next}>{step===lesson.questions.length-1?'إنهاء الدرس':'السؤال التالي'}</button></div>}<div className="muted" style={{marginTop:16,fontSize:12}}>الإجابات الصحيحة حتى الآن: {score}</div></div>
}
