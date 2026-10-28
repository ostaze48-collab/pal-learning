'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';

type State='done'|'current'|'next';
export default function UnitLearningPath({lessons}:{lessons:Lesson[]}){
 const [doneIds,setDoneIds]=useState<string[]>([]);
 useEffect(()=>{setDoneIds(lessons.filter(l=>localStorage.getItem(`lesson:${l.id}`)==='done').map(l=>l.id))},[lessons]);
 const states=useMemo(()=>{const done=new Set(doneIds);const firstIncomplete=lessons.find(l=>!done.has(l.id))?.id;return lessons.map(l=>({lesson:l,state:(done.has(l.id)?'done':l.id===firstIncomplete?'current':'next') as State}))},[lessons,doneIds]);
 return <div className="unitLearningPath">{states.map(({lesson,state},index)=>{
   const regularNumber=lessons.slice(0,index+1).filter(x=>x.kind!=='assessment').length;
   const label=lesson.kind==='assessment'?'تحدي الوحدة':state==='done'?'مكتمل':state==='current'?'خطوتك التالية':'بعدها';
   return <div className={`pathLesson ${state} ${lesson.kind==='assessment'?'assessment':''}`} key={lesson.id}>
     {index<states.length-1&&<span className="pathConnector"/>}
     <div className="pathNode">{state==='done'?'✓':lesson.kind==='assessment'?'★':regularNumber}</div>
     <div className="pathLessonCard">
       <div className="pathLessonMeta"><span>{label}</span><small>{lesson.minutes} دقيقة تقريبًا</small></div>
       <h3>{lesson.title}</h3><p>{lesson.summary}</p>
       <Link href={`/lesson/${lesson.id}`} className="pathLessonAction">{state==='done'?'راجعي':lesson.kind==='assessment'?'ابدئي التحدي':state==='current'?'كمّلي المسار':'افتحي الدرس'} <b>←</b></Link>
     </div>
   </div>
 })}</div>
}
