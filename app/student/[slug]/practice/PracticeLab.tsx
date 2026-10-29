'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';

type BankQuestion={id:string;lessonId:string;lessonTitle:string;subject:string;text:string;options:string[];correct:number;explanation:string};
type Props={slug:string;bank:BankQuestion[]};
type Phase='setup'|'quiz'|'done';

function shuffle<T>(items:T[]){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function subjectIcon(subject:string){return subject==='الرياضيات'?'➗':subject==='العلوم والحياة'?'🔬':subject==='اللغة العربية'?'📚':'🌍'}

export default function PracticeLab({slug,bank}:Props){
 const subjects=useMemo(()=>[...new Set(bank.map(q=>q.subject))],[bank]);
 const [subject,setSubject]=useState(subjects[0]||'الرياضيات');
 const [count,setCount]=useState(5);
 const [phase,setPhase]=useState<Phase>('setup');
 const [questions,setQuestions]=useState<BankQuestion[]>([]);
 const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [score,setScore]=useState(0);const [mistakes,setMistakes]=useState<BankQuestion[]>([]);

 function start(){const pool=bank.filter(q=>q.subject===subject);setQuestions(shuffle(pool).slice(0,Math.min(count,pool.length)));setStep(0);setSelected(null);setScore(0);setMistakes([]);setPhase('quiz')}
 function answer(i:number){if(selected!==null)return;setSelected(i)}
 function next(){const q=questions[step];const good=selected===q.correct;const nextScore=score+(good?1:0);const nextMistakes=good?mistakes:[...mistakes,q];if(step===questions.length-1){setScore(nextScore);setMistakes(nextMistakes);const pct=Math.round(nextScore/questions.length*100);localStorage.setItem(`practice:${slug}:last`,JSON.stringify({subject,score:nextScore,total:questions.length,percent:pct,date:new Date().toISOString(),mistakes:nextMistakes.map(x=>({lessonId:x.lessonId,lessonTitle:x.lessonTitle,questionId:x.id}))}));setPhase('done');return}setScore(nextScore);setMistakes(nextMistakes);setStep(v=>v+1);setSelected(null)}

 if(phase==='setup')return <section className="practiceGame practiceSetupGame">
   <div className="practiceWorlds">{subjects.map(s=><button key={s} className={`practiceWorld ${subject===s?'active':''}`} onClick={()=>setSubject(s)}><span>{subjectIcon(s)}</span><strong>{s}</strong></button>)}</div>
   <div className="practiceLength"><span>اختاري إيقاع الجولة</span><div>{[[5,'خفيفة','بضع دقائق'],[10,'ممتعة','وقت أكثر قليلًا'],[15,'مغامرة','جولة أطول']].map(([n,label,desc])=><button key={n} className={count===n?'active':''} onClick={()=>setCount(Number(n))}><strong>{label}</strong><small>{desc}</small></button>)}</div></div>
   <button className="practiceStart" onClick={start} disabled={!bank.some(q=>q.subject===subject)}>ابدئي الجولة <b>←</b></button>
 </section>;

 if(phase==='done'){
   const pct=questions.length?Math.round(score/questions.length*100):0;
   const suggestion=mistakes[0];
   return <section className="practiceGame practiceFinish">
     <div className="practiceFinishIcon">{pct>=80?'🌟':'🎈'}</div><span className="questEyebrow">انتهت الجولة</span><h2>{pct>=80?'رائعة! كانت جولة قوية':'أحسنتِ — كل محاولة تجعل الفكرة أوضح'}</h2><p>{suggestion?'إذا أحببتِ، نعود إلى فكرة واحدة فقط قبل الجولة التالية.':'يمكنك لعب جولة أخرى أو العودة إلى رحلتك.'}</p>
     {suggestion&&<Link className="practiceSuggestion" href={`/lesson/${suggestion.lessonId}`}><span>💡</span><div><small>فكرة يمكن أن تساعدك</small><strong>{suggestion.lessonTitle}</strong></div><b>←</b></Link>}
     <div className="practiceFinishActions"><button className="practiceStart" onClick={()=>setPhase('setup')}>جولة جديدة ↻</button><Link className="practiceBack" href={`/student/${slug}`}>أكمل رحلتي</Link></div>
   </section>;
 }

 const q=questions[step];
 return <section className="practiceGame practiceQuestionGame">
   <div className="practiceQuestionTop"><span className="questEyebrow">{subjectIcon(subject)} {subject}</span><div className="practiceDots">{questions.map((_,i)=><i key={i} className={i<step?'done':i===step?'active':''}/>)}</div></div>
   <h2>{q.text}</h2><div className="practiceChoices">{q.options.map((o,i)=>{const cls=selected===null?'':i===q.correct?'ok':i===selected?'bad':'';return <button className={cls} key={o} onClick={()=>answer(i)}>{o}</button>})}</div>
   {selected!==null&&<div className="practiceFeedback"><strong>{selected===q.correct?'رائعة! ⭐':'شاهدي الفكرة 💡'}</strong><p>{q.explanation}</p><button className="practiceStart" onClick={next}>{step===questions.length-1?'أنهي الجولة ✨':'السؤال التالي ←'}</button></div>}
 </section>;
}
