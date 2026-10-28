'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';

type BankQuestion={id:string;lessonId:string;lessonTitle:string;subject:string;text:string;options:string[];correct:number;explanation:string};

type Props={slug:string;bank:BankQuestion[]};

type Phase='setup'|'quiz'|'done';

function shuffle<T>(items:T[]){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}

export default function PracticeLab({slug,bank}:Props){
 const subjects=useMemo(()=>[...new Set(bank.map(q=>q.subject))],[bank]);
 const [subject,setSubject]=useState(subjects[0]||'الرياضيات');
 const [count,setCount]=useState(10);
 const [phase,setPhase]=useState<Phase>('setup');
 const [questions,setQuestions]=useState<BankQuestion[]>([]);
 const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [score,setScore]=useState(0);const [mistakes,setMistakes]=useState<BankQuestion[]>([]);

 function start(){const pool=bank.filter(q=>q.subject===subject);setQuestions(shuffle(pool).slice(0,Math.min(count,pool.length)));setStep(0);setSelected(null);setScore(0);setMistakes([]);setPhase('quiz')}
 function answer(i:number){if(selected!==null)return;setSelected(i)}
 function next(){const q=questions[step];const good=selected===q.correct;const nextScore=score+(good?1:0);const nextMistakes=good?mistakes:[...mistakes,q];if(step===questions.length-1){setScore(nextScore);setMistakes(nextMistakes);const pct=Math.round(nextScore/questions.length*100);localStorage.setItem(`practice:${slug}:last`,JSON.stringify({subject,score:nextScore,total:questions.length,percent:pct,date:new Date().toISOString(),mistakes:nextMistakes.map(x=>({lessonId:x.lessonId,lessonTitle:x.lessonTitle,questionId:x.id}))}));setPhase('done');return}setScore(nextScore);setMistakes(nextMistakes);setStep(v=>v+1);setSelected(null)}

 if(phase==='setup')return <section className="practiceSetup card"><div className="subjectHeader"><div><span className="subjectIcon">🎯</span><div><h2 style={{margin:0}}>أنشئ تدريبًا قصيرًا</h2><div className="muted">من أسئلة الصف الحالي الموجودة داخل المنصة</div></div></div></div><div className="practiceControls"><label><span>المادة</span><select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select></label><label><span>عدد الأسئلة</span><select value={count} onChange={e=>setCount(Number(e.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={15}>15</option></select></label></div><div className="practiceBankInfo"><strong>{bank.filter(q=>q.subject===subject).length}</strong><span>سؤالًا متاحًا حاليًا في {subject}</span></div><button className="btn" onClick={start} disabled={!bank.some(q=>q.subject===subject)}>ابدأ التدريب</button></section>;

 if(phase==='done'){
   const pct=questions.length?Math.round(score/questions.length*100):0;
   return <section className="card"><span className="tag">نتيجة التدريب</span><h1>{pct>=80?'أحسنتِ 🌟':'وجدنا نقاطًا تحتاج مراجعة'}</h1><div className="masteryGrid"><div><strong>{score}/{questions.length}</strong><span>إجابات صحيحة</span></div><div><strong>{pct}%</strong><span>النتيجة</span></div><div><strong>{mistakes.length}</strong><span>نقاط للمراجعة</span></div></div>{mistakes.length>0&&<div className="reviewBox"><strong>راجعي هذه الدروس</strong>{[...new Map(mistakes.map(q=>[q.lessonId,q])).values()].map(q=><div className="reviewItem" key={q.lessonId}><span>{q.lessonTitle}</span><Link href={`/lesson/${q.lessonId}`}>فتح الدرس</Link></div>)}</div>}<div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:18}}><button className="btn" onClick={()=>setPhase('setup')}>تدريب جديد</button><Link className="btn secondary" href={`/student/${slug}/recovery`}>فحص الفجوات السابقة</Link></div></section>;
 }

 const q=questions[step];
 return <section className="card"><div className="subjectStatTop"><span className="tag">{subject}</span><strong>{step+1}/{questions.length}</strong></div><div className="progress" style={{margin:'12px 0 20px'}}><span style={{width:`${((step+1)/questions.length)*100}%`}}/></div><div className="muted" style={{fontSize:12}}>من درس: {q.lessonTitle}</div><h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button className={cls} key={o} onClick={()=>answer(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:16}}><div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'صحيح ✅':'نراجعها معًا'}</strong><p>{q.explanation}</p></div><button className="btn" onClick={next}>{step===questions.length-1?'عرض النتيجة':'السؤال التالي'}</button></div>}</section>;
}
