'use client';
import {useEffect,useState} from 'react';

function journeyLabel(percent:number){
 if(percent<=0)return 'جاهزة للبداية ✨';
 if(percent<25)return 'بدأتِ الرحلة 🌱';
 if(percent<60)return 'أنتِ في الطريق 🚀';
 if(percent<90)return 'قطعتِ شوطًا جميلًا 🌈';
 if(percent<100)return 'قريبة جدًا ⭐';
 return 'أكملتِ الرحلة 🌟';
}

export default function StudentProgress({lessonIds}:{lessonIds:string[]}){
 const [done,setDone]=useState(0);
 useEffect(()=>{setDone(lessonIds.filter(id=>localStorage.getItem(`lesson:${id}`)==='done').length)},[lessonIds]);
 const percent=lessonIds.length?Math.round(done/lessonIds.length*100):0;
 return <div className="childJourneyProgress" aria-label={`تقدم الرحلة ${percent}%`}><strong>{journeyLabel(percent)}</strong><div className="progress"><span style={{width:`${percent}%`}}/></div></div>;
}
