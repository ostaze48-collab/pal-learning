'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import UnitLearningPath from './UnitLearningPath';

type UnitEntry={name:string;lessons:Lesson[]};
export default function SubjectUnitJourney({units}:{units:UnitEntry[]}){
 const [openIndex,setOpenIndex]=useState(0);const [doneByUnit,setDoneByUnit]=useState<boolean[]>(()=>units.map(()=>false));const [ready,setReady]=useState(false);
 useEffect(()=>{
  const done=units.map(unit=>unit.lessons.every(l=>localStorage.getItem(`lesson:${l.id}`)==='done'));
  const current=done.findIndex(x=>!x);setDoneByUnit(done);setOpenIndex(current>=0?current:Math.max(0,units.length-1));setReady(true);
 },[units]);
 return <div className={`subjectUnitJourney ${ready?'ready':''}`}>{units.map((unit,index)=>{
  const complete=doneByUnit[index];const isOpen=openIndex===index;const lessonCount=unit.lessons.filter(x=>x.kind!=='assessment').length;
  return <section className={`kidUnit unitDisclosure ${complete?'complete':''} ${isOpen?'open':''}`} key={unit.name}>
   <button className="unitDisclosureHead" onClick={()=>setOpenIndex(index)} aria-expanded={isOpen}>
    <div className="unitDisclosureIdentity"><span className="unitNumber">{complete?'✓':index+1}</span><div><small>{complete?'وحدة مكتملة':isOpen?'وحدتك الآن':'وحدة قادمة'}</small><strong>{unit.name}</strong></div></div>
    <div className="unitDisclosureMeta"><span>{lessonCount} خطوات</span><b>{isOpen?'⌃':'⌄'}</b></div>
   </button>
   {isOpen&&<div className="unitDisclosureBody"><UnitLearningPath lessons={unit.lessons}/></div>}
  </section>
 })}</div>
}
