'use client';
import {useEffect,useState} from 'react';

export default function StudentProgress({lessonIds}:{lessonIds:string[]}){
 const [done,setDone]=useState(0);
 useEffect(()=>{setDone(lessonIds.filter(id=>localStorage.getItem(`lesson:${id}`)==='done').length)},[lessonIds]);
 const percent=lessonIds.length?Math.round(done/lessonIds.length*100):0;
 return <div style={{marginTop:14}}><div style={{display:'flex',justifyContent:'space-between',gap:10,fontSize:13,marginBottom:7}}><strong>تقدمك في المحتوى المتاح</strong><strong>{percent}%</strong></div><div className="progress"><span style={{width:`${percent}%`}}/></div><div className="muted" style={{marginTop:7,fontSize:12}}>{done} من {lessonIds.length} مكتمل</div></div>;
}
