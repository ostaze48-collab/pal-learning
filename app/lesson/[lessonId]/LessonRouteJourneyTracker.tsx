'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {recordChildJourneyEvent} from '../../../lib/childJourneyTelemetry';

export default function LessonRouteJourneyTracker({student,lessonId}:{student:string;lessonId:string}){
 const pathname=usePathname();
 useEffect(()=>{
  if(pathname!==`/lesson/${lessonId}`)return;
  recordChildJourneyEvent(student,'lesson_view',{lessonId});
  function check(){if(localStorage.getItem(`lesson:${lessonId}`)==='done')recordChildJourneyEvent(student,'lesson_complete',{lessonId})}
  check();const timer=window.setInterval(check,1000);return()=>window.clearInterval(timer);
 },[pathname,student,lessonId]);
 return null;
}
