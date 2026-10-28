'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {recoverySkills} from '../../../../lib/recoverySkills';

type Subject='الرياضيات'|'اللغة العربية'|'English'|'العلوم والحياة';
const subjects:Subject[]=['الرياضيات','اللغة العربية','English','العلوم والحياة'];
const icon=(s:Subject)=>s==='الرياضيات'?'📘':s==='اللغة العربية'?'📕':s==='English'?'🔤':'🔬';

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

 if(!ready)return <div className="card" style={{marginTop:18}}>نجهز فحص الفجوات…</div>;
 return <div className="recoveryLayout">
   <aside className="recoverySubjects card">{subjects.map(s=><button key={s} className={`recoverySubjectBtn ${s===subject?'active':''}`} onClick={()=>startSubject(s)}><span>{icon(s)}</span><span>{s}</span><small>{screened(s)?'✓ تم الفحص':'ابدأ'}</small></button>)}</aside>
   <section className="recoveryMain">
     <div className="card">
       <div className="subjectHeader"><div><span className="subjectIcon">{icon(subject)}</span><div><h2 style={{margin:0}}>{subject}</h2><div className="muted" style={{fontSize:13}}>فحص قصير للمهارات الأساسية السابقة</div></div></div><span className="tag">{questions.length} أسئلة</span></div>
       {currentDone?<RecoveryResults subject={subject} slug={slug} scores={scores}/>:current&&<>
         <div className="progress" style={{margin:'8px 0 22px'}}><span style={{width:`${((step+1)/questions.length)*100}%`}}/></div>
         <div className="muted" style={{fontSize:12}}>المهارة: {current.skill.title} · سؤال {step+1} من {questions.length}</div>
         <h2>{current.q.text}</h2>
         <div className="choice">{current.q.options.map((o,i)=>{const cls=selected===null?'option':i===current.q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>
         {selected!==null&&<div style={{marginTop:16}}><div className={selected===current.q.correct?'activitySuccess':'activityHint'}><strong>{selected===current.q.correct?'إجابة صحيحة ✅':'لا بأس — هذا بالضبط سبب الفحص'}</strong><p>{current.q.explanation}</p></div><button className="btn" onClick={next}>{step===questions.length-1?'احفظ النتيجة':'السؤال التالي'}</button></div>}
       </>}
     </div>
   </section>
 </div>;
}

function RecoveryResults({subject,slug,scores}:{subject:Subject;slug:string;scores:Record<string,number>}){
 const skills=recoverySkills.filter(s=>s.subject===subject);
 return <div><div className="recoveryResultHead"><div><strong>نتيجة الفحص الأولي</strong><p className="muted">نركز فقط على المهارات الأقل من 80%، ونبقي الصف الحالي هو المسار الرئيس.</p></div></div><div className="recoverySkillGrid">{skills.map(skill=>{const score=scores[skill.id]??0;return <div className={`recoverySkill ${score>=80?'good':score>=50?'mid':'weak'}`} key={skill.id}><div className="subjectStatTop"><strong>{skill.title}</strong><span>{score}%</span></div><div className="progress"><span style={{width:`${score}%`}}/></div><p>{skill.whyItMatters}</p>{score<80?<Link className="btn secondary" href={`/student/${slug}/recovery/${skill.id}`}>عالج هذه المهارة</Link>:<span className="tag">الأساس جيد</span>}</div>})}</div><button className="btn secondary" style={{marginTop:14}} onClick={()=>{for(const skill of skills){localStorage.removeItem(`recovery:${slug}:${skill.id}`)}localStorage.removeItem(`recovery:${slug}:screened:${subject}`);location.reload()}}>إعادة فحص المادة</button></div>
}
