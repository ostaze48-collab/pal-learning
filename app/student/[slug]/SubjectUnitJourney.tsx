'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import UnitLearningPath from './UnitLearningPath';

type UnitEntry={name:string;lessons:Lesson[]};
export default function SubjectUnitJourney({units}:{units:UnitEntry[]}){
 const [openIndex,setOpenIndex]=useState(0);const [doneByUnit,setDoneByUnit]=useState<boolean[]>(()=>units.map(()=>false));const [ready,setReady]=useState(false);
 useEffect(()=>{const done=units.map(unit=>unit.lessons.every(l=>localStorage.getItem(`lesson:${l.id}`)==='done'));const current=done.findIndex(x=>!x);setDoneByUnit(done);setOpenIndex(current>=0?current:Math.max(0,units.length-1));setReady(true)},[units]);
 return <div className={`subjectUnitJourney worldStationRoute ${ready?'ready':''}`}>{units.map((unit,index)=>{const complete=doneByUnit[index];const isOpen=openIndex===index;const lessonCount=unit.lessons.filter(x=>x.kind!=='assessment').length;const state=complete?'complete':isOpen?'current':'upcoming';return <section className={`kidUnit unitDisclosure worldStation ${state} ${isOpen?'open':''}`} key={unit.name}>
   <span className="worldStationConnector" aria-hidden="true"/>
   <button className="unitDisclosureHead worldStationHead" onClick={()=>setOpenIndex(index)} aria-expanded={isOpen}><span className="worldStationNode" aria-hidden="true">{complete?'✓':index+1}</span><div className="worldStationCopy"><small>{complete?'أنجزتِ هذه المحطة ✨':isOpen?'أنتِ هنا':'تنتظرك لاحقًا'}</small><strong>{unit.name}</strong><span>{lessonCount} {lessonCount===1?'مغامرة':'مغامرات'}</span></div><span className="worldStationAction" aria-hidden="true">{isOpen?'⌃':'←'}</span></button>
   {isOpen&&<div className="unitDisclosureBody worldStationBody"><UnitLearningPath lessons={unit.lessons}/></div>}
  </section>})}</div>
}
