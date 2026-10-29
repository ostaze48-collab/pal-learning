'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';

type ActiveSession={lesson:Lesson;updatedAt:number};

export default function WorldContinueButton({lessons}:{lessons:Lesson[]}){
 const [next,setNext]=useState<Lesson|null>(null);const [resuming,setResuming]=useState(false);const [ready,setReady]=useState(false);
 useEffect(()=>{
  const active:ActiveSession[]=[];
  for(const lesson of lessons){
   if(localStorage.getItem(`lesson:${lesson.id}`)==='done')continue;
   try{
    const raw=localStorage.getItem(`lesson:${lesson.id}:session`);if(!raw)continue;
    const saved=JSON.parse(raw);const updatedAt=Date.parse(String(saved?.updatedAt||''));
    if(Number.isFinite(updatedAt))active.push({lesson,updatedAt});
   }catch{}
  }
  active.sort((a,b)=>b.updatedAt-a.updatedAt);
  const resumed=active[0]?.lesson||null;
  const first=lessons.find(lesson=>localStorage.getItem(`lesson:${lesson.id}`)!=='done')||null;
  setNext(resumed||first);setResuming(Boolean(resumed));setReady(true);
 },[lessons]);
 if(!ready)return <div className="worldContinueButton worldContinueLoading" aria-hidden="true">✨ أجهز محطتك…</div>;
 if(!next)return <div className="worldContinueButton worldContinueDone"><span>🎉</span><strong>أنجزتِ هذا العالم</strong></div>;
 const label=resuming?'نكمل من حيث توقفتِ':next.kind==='assessment'?'تحديك التالي':'أكملي من هنا';
 return <Link className="worldContinueButton" href={`/lesson/${next.id}`}><span>{resuming?'↩️':next.kind==='assessment'?'🏆':'▶️'}</span><div><small>{label}</small><strong>{next.title}</strong></div><b>←</b></Link>;
}
