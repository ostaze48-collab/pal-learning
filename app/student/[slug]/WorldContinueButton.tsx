'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';

export default function WorldContinueButton({lessons}:{lessons:Lesson[]}){
 const [next,setNext]=useState<Lesson|null>(null);const [ready,setReady]=useState(false);
 useEffect(()=>{
  const first=lessons.find(lesson=>localStorage.getItem(`lesson:${lesson.id}`)!=='done')||null;
  setNext(first);setReady(true);
 },[lessons]);
 if(!ready)return <div className="worldContinueButton worldContinueLoading" aria-hidden="true">✨ أجهز محطتك…</div>;
 if(!next)return <div className="worldContinueButton worldContinueDone"><span>🎉</span><strong>أنجزتِ هذا العالم</strong></div>;
 return <Link className="worldContinueButton" href={`/lesson/${next.id}`}><span>{next.kind==='assessment'?'🏆':'▶️'}</span><div><small>{next.kind==='assessment'?'تحديك التالي':'أكملي من هنا'}</small><strong>{next.title}</strong></div><b>←</b></Link>;
}
