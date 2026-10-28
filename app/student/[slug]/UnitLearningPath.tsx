'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';

type State='done'|'current'|'next';
export default function UnitLearningPath({lessons}:{lessons:Lesson[]}){
 const [doneIds,setDoneIds]=useState<string[]>([]);
 useEffect(()=>{setDoneIds(lessons.filter(l=>localStorage.getItem(`lesson:${l.id}`)==='done').map(l=>l.id))},[lessons]);
 const states=useMemo(()=>{const done=new Set(doneIds);const firstIncomplete=lessons.find(l=>!done.has(l.id))?.id;return lessons.map(l=>({lesson:l,state:(done.has(l.id)?'done':l.id===firstIncomplete?'current':'next') as State}))},[lessons,doneIds]);
 return <div className="unitLearningPath gameLearningPath">{states.map(({lesson,state},index)=>{
   const regularNumber=lessons.slice(0,index+1).filter(x=>x.kind!=='assessment').length;const isAssessment=lesson.kind==='assessment';const label=isAssessment?'تحدي الوحدة':state==='done'?'أنجزتِها':state==='current'?'خطوتك الآن':'بعدها';
   return <div className={`pathStop ${state} ${isAssessment?'assessment':''} ${index%2?'offsetLeft':'offsetRight'}`} key={lesson.id}>
     {index<states.length-1&&<span className="pathTrail"/>}
     <Link href={`/lesson/${lesson.id}`} className="pathOrb" aria-label={`${label}: ${lesson.title}`}><span>{state==='done'?'✓':isAssessment?'★':regularNumber}</span></Link>
     <div className="pathStopCopy"><small>{label}</small><strong>{lesson.title}</strong>{state==='current'&&<Link href={`/lesson/${lesson.id}`} className="pathGo">ابدئي الآن ←</Link>}</div>
   </div>
 })}</div>
}
