'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import DailyPlan from './DailyPlan';

type ActiveSession={lesson:Lesson;updatedAt:number};

function subjectIcon(subject:string){return subject==='الرياضيات'?'➗':subject==='العلوم والحياة'?'🔬':subject==='اللغة العربية'?'📚':'🌍'}
function subjectTone(subject:string){return subject==='الرياضيات'?'focusMath':subject==='العلوم والحياة'?'focusScience':subject==='اللغة العربية'?'focusArabic':'focusEnglish'}

export default function DailyPlanWithResume({lessons}:{lessons:Lesson[]}){
 const [active,setActive]=useState<Lesson|null>(null);const [ready,setReady]=useState(false);
 useEffect(()=>{
  const candidates:ActiveSession[]=[];
  for(const lesson of lessons){
   if(localStorage.getItem(`lesson:${lesson.id}`)==='done')continue;
   try{
    const raw=localStorage.getItem(`lesson:${lesson.id}:session`);if(!raw)continue;
    const saved=JSON.parse(raw);const updatedAt=Date.parse(String(saved?.updatedAt||''));
    if(Number.isFinite(updatedAt))candidates.push({lesson,updatedAt});
   }catch{}
  }
  candidates.sort((a,b)=>b.updatedAt-a.updatedAt);setActive(candidates[0]?.lesson||null);setReady(true);
 },[lessons]);
 if(!ready)return <section className="dailyPlan"><div className="muted">✨ أجهز لكِ مهمتك…</div></section>;
 if(!active)return <DailyPlan lessons={lessons}/>;
 return <section className="dailyPlan focusPlan">
   <div className="dailyPlanHead focusPlanHead"><div><span className="tag">⭐ مهمتك الآن</span><h2>نكمل من حيث توقفتِ</h2><p>مكانك محفوظ. نعود لنفس الخطوة بدون إعادة ما أنجزتِه.</p></div></div>
   <div className={`focusTask new ${subjectTone(active.subject)}`}>
     <div className="focusTaskIcon">{subjectIcon(active.subject)}</div>
     <div className="focusTaskCopy"><small>{active.subject}</small><h3>{active.title}</h3><p>اضغطي “أكمل” وسنرجع لنفس مكانك في الدرس.</p></div>
     <Link className="focusTaskAction" href={`/lesson/${active.id}`}>أكمل <b>←</b></Link>
   </div>
 </section>;
}
