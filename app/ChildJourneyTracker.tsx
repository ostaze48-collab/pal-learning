'use client';
import {useEffect} from 'react';
import {recordChildJourneyEvent,type ChildJourneyEventName} from '../lib/childJourneyTelemetry';

export default function ChildJourneyTracker({student,event,lessonId,subjectKey,watchCompletion=false}:{student:string;event:ChildJourneyEventName;lessonId?:string;subjectKey?:string;watchCompletion?:boolean}){
 useEffect(()=>{
  recordChildJourneyEvent(student,event,{lessonId,subjectKey});
  if(!watchCompletion||!lessonId)return;
  function check(){if(localStorage.getItem(`lesson:${lessonId}`)==='done')recordChildJourneyEvent(student,'lesson_complete',{lessonId})}
  check();const timer=window.setInterval(check,1000);return()=>window.clearInterval(timer);
 },[student,event,lessonId,subjectKey,watchCompletion]);
 return null;
}
