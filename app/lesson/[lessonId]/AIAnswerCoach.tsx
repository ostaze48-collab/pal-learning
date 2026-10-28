'use client';
import {useEffect,useState} from 'react';

type Feedback={correct:boolean;feedback:string;microExample:string;misconception:string;action:'continue'|'reinforce';mode:string};

export default function AIAnswerCoach({lessonId,questionId,selectedIndex,fallback}:{lessonId:string;questionId:string;selectedIndex:number;fallback:string}){
  const [data,setData]=useState<Feedback|null>(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let cancelled=false;setLoading(true);setData(null);
    fetch('/api/ai-teacher/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId,questionId,selectedIndex})}).then(r=>r.json()).then(x=>{if(!cancelled)setData(x)}).catch(()=>{if(!cancelled)setData({correct:false,feedback:fallback,microExample:'',misconception:'',action:'reinforce',mode:'local'})}).finally(()=>{if(!cancelled)setLoading(false)});
    return()=>{cancelled=true};
  },[lessonId,questionId,selectedIndex,fallback]);
  if(loading)return <div className="aiAnswerCoach loading"><strong>🤖 المعلم يراجع طريقة تفكيرك…</strong></div>;
  if(!data)return null;
  return <div className={`aiAnswerCoach ${data.correct?'correct':'wrong'}`}><strong>{data.correct?'لماذا إجابتك صحيحة':'ما الذي حدث هنا؟'}</strong><p>{data.feedback||fallback}</p>{data.misconception&&<div className="aiMisconception"><b>النقطة التي سأثبتها:</b> {data.misconception}</div>}{data.microExample&&<div className="aiMicroExample"><b>مثال قريب:</b> {data.microExample}</div>}{data.action==='reinforce'&&<small>سأستخدم هذا الخطأ في العلاج والمراجعة بدل تجاهله.</small>}</div>;
}
