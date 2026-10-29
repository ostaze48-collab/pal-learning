'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {recoverySkills} from '../../../../lib/recoverySkills';
import {getDeepDiagnostic} from '../../../../lib/deepDiagnostics';

type Subject='الرياضيات'|'اللغة العربية'|'English'|'العلوم والحياة';
const subjects:Subject[]=['الرياضيات','اللغة العربية','English','العلوم والحياة'];
const icon=(s:Subject)=>s==='الرياضيات'?'➗':s==='اللغة العربية'?'📚':s==='English'?'🌍':'🔬';

export default function RecoveryScreening({slug}:{slug:string}){
 const [subject,setSubject]=useState<Subject>('الرياضيات');
 const [step,setStep]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);
 const [answers,setAnswers]=useState<Record<string,boolean>>({});
 const [scores,setScores]=useState<Record<string,number>>({});
 const [ready,setReady]=useState(false);
 const subjectSkills=useMemo(()=>recoverySkills.filter(s=>s.subject===subject),[subject]);
 const questions=useMemo(()=>subjectSkills.flatMap(skill=>skill.screening.map(q=>({skill,q}))),[subjectSkills]);

 useEffect(()=>{
   const saved:Record<string,number>={};
   for(const skill of recoverySkills){const raw=localStorage.getItem(`recovery:${slug}:${skill.id}`);if(raw!==null)saved[skill.id]=Number(raw)}
   setScores(saved);setReady(true);
 },[slug]);

 function choose(i:number){if(selected!==null)return;setSelected(i)}
 function next(){
   const item=questions[step];if(!item||selected===null)return;
   const correct=selected===item.q.correct;
   const nextAnswers={...answers,[item.q.id]:correct};setAnswers(nextAnswers);
   if(step===questions.length-1){
     const nextScores={...scores};
     for(const skill of subjectSkills){const qs=skill.screening;const correctCount=qs.filter(q=>nextAnswers[q.id]).length;const pct=Math.round(correctCount/qs.length*100);nextScores[skill.id]=pct;localStorage.setItem(`recovery:${slug}:${skill.id}`,String(pct))}
     localStorage.setItem(`recovery:${slug}:screened:${subject}`,'1');setScores(nextScores);setStep(0);setSelected(null);setAnswers({});return;
   }
   setStep(v=>v+1);setSelected(null);
 }
 function startSubject(s:Subject){setSubject(s);setStep(0);setSelected(null);setAnswers({})}
 const screened=(s:Subject)=>recoverySkills.filter(x=>x.subject===s).every(x=>scores[x.id]!==undefined);
 const currentDone=screened(subject);
 const current=questions[step];

 if(!ready)return <section className="dailyPlan"><div className="muted">✨ أجهز اللعبة…</div></section>;
 return <div className="recoveryPlayground">
   <div className="recoveryWorlds">{subjects.map(s=><button key={s} className={`recoveryWorld ${s===subject?'active':''}`} onClick={()=>startSubject(s)}><span>{icon(s)}</span><strong>{s}</strong><small>{screened(s)?'✓ لعبناها':'اختاري'}</small></button>)}</div>
   <section className="recoveryGame">
     <div className="recoveryGameTop"><div><span className="questEyebrow">{icon(subject)} {subject}</span><h2>{currentDone?'أحسنتِ في هذه الجولة!':'سؤال واحد الآن'}</h2></div>{!currentDone&&questions.length>0&&<div className="recoveryDots" aria-label={`السؤال ${step+1} من ${questions.length}`}>{questions.map((_,i)=><i key={i} className={i<step?'done':i===step?'active':''}/>)}</div>}</div>
     {currentDone?<RecoveryResults subject={subject} slug={slug} scores={scores}/>:current&&<>
       <h2 className="recoveryQuestion">{current.q.text}</h2>
       <div className="choice recoveryChoices">{current.q.options.map((o,i)=>{const cls=selected===null?'option':i===current.q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>
       {selected!==null&&<div className="recoveryFeedback"><div className={selected===current.q.correct?'activitySuccess':'activityHint'}><strong>{selected===current.q.correct?'رائعة! ⭐':'قريبة — شاهدي الفكرة 💡'}</strong><p>{current.q.explanation}</p></div><button className="btn kidPrimaryAction" onClick={next}>{step===questions.length-1?'أنهي الجولة ✨':'السؤال التالي ←'}</button></div>}
     </>}
   </section>
 </div>;
}

function RecoveryResults({subject,slug,scores}:{subject:Subject;slug:string;scores:Record<string,number>}){
 const skills=recoverySkills.filter(s=>s.subject===subject);
 const nextSkill=[...skills].filter(s=>(scores[s.id]??100)<80).sort((a,b)=>(scores[a.id]??100)-(scores[b.id]??100))[0];
 const hasDeep=nextSkill?Boolean(getDeepDiagnostic(nextSkill.id)):false;
 if(!nextSkill)return <div className="recoveryFinish"><div className="recoveryFinishIcon">🌟</div><h3>هذه الجولة أصبحت سهلة!</h3><p>يمكنك العودة إلى رحلتك أو اختيار عالم آخر للعب فيه.</p><Link className="btn kidPrimaryAction" href={`/student/${slug}`}>أكمل رحلتي ←</Link></div>;
 const href=hasDeep?`/student/${slug}/recovery/${nextSkill.id}/deep`:`/student/${slug}/recovery/${nextSkill.id}`;
 return <div className="recoveryFinish"><div className="recoveryFinishIcon">🧩</div><h3>وجدت لكِ لعبة قصيرة بعدها</h3><p>سنجرّب الفكرة بطريقة أبسط، ثم نعود مباشرة إلى رحلتك.</p><Link className="btn kidPrimaryAction" href={href}>ابدئي اللعبة التالية ←</Link><Link className="recoveryBackLink" href={`/student/${slug}`}>أعود لرحلتي الآن</Link></div>;
}
