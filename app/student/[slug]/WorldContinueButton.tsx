'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {findMostRecentActiveLesson} from '../../../lib/activeLessonSession';

export default function WorldContinueButton({lessons}:{lessons:Lesson[]}){
 const [next,setNext]=useState<Lesson|null>(null);const [resuming,setResuming]=useState(false);const [ready,setReady]=useState(false);
 useEffect(()=>{
  const resumed=findMostRecentActiveLesson(lessons);
  const first=lessons.find(lesson=>localStorage.getItem(`lesson:${lesson.id}`)!=='done')||null;
  setNext(resumed||first);setResuming(Boolean(resumed));setReady(true);
 },[lessons]);
 if(!ready)return <div className="worldContinueButton worldContinueLoading" aria-hidden="true">✨ أجهز محطتك…</div>;
 if(!next)return <div className="worldContinueButton worldContinueDone"><span>🎉</span><strong>أنجزتِ هذا العالم</strong></div>;
 const label=resuming?'نكمل من حيث توقفتِ':next.kind==='assessment'?'تحديك التالي':'أكملي من هنا';
 return <Link className="worldContinueButton" href={`/lesson/${next.id}`}><span>{resuming?'↩️':next.kind==='assessment'?'🏆':'▶️'}</span><div><small>{label}</small><strong>{next.title}</strong></div><b>←</b></Link>;
}
