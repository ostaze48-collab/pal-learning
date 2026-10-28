'use client';
import {useEffect,useState} from 'react';

export default function SubjectProgressMini({lessonIds}:{lessonIds:string[]}){
 const [done,setDone]=useState(0);
 useEffect(()=>{setDone(lessonIds.filter(id=>localStorage.getItem(`lesson:${id}`)==='done').length)},[lessonIds]);
 const percent=lessonIds.length?Math.round(done/lessonIds.length*100):0;
 return <div className="subjectMiniProgress" aria-label={`إنجاز ${percent}%`}><div><span style={{width:`${percent}%`}}/></div><small>{percent}%</small></div>;
}
