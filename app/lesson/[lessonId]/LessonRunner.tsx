'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import LessonPlayerV2 from './LessonPlayerV2';

export default function LessonRunner({lesson}:{lesson:Lesson}){
 const [ready,setReady]=useState(lesson.kind!=='assessment');
 useEffect(()=>{
  if(lesson.kind!=='assessment')return;
  localStorage.setItem(`lesson:${lesson.id}:reviewMode`,'1');
  setReady(true);
 },[lesson.id,lesson.kind]);
 if(!ready)return <section className="card"><p>أجهز التحدي القصير…</p></section>;
 return <LessonPlayerV2 lesson={lesson}/>;
}
