'use client';
import {useEffect,useState} from 'react';

type Status='new'|'done'|'review';

export default function LessonStatus({lessonId}:{lessonId:string}){
  const [status,setStatus]=useState<Status>('new');
  useEffect(()=>{
    const done=localStorage.getItem(`lesson:${lessonId}`)==='done';
    if(!done){setStatus('new');return}
    let needsReview=false;
    const rawReport=localStorage.getItem(`lesson:${lessonId}:report`);
    if(rawReport){try{needsReview=JSON.parse(rawReport).status==='review_needed'}catch{}}
    const rawReview=localStorage.getItem(`lesson:${lessonId}:review`);
    if(rawReview){try{needsReview=needsReview||new Date(JSON.parse(rawReview).dueAt).getTime()<=Date.now()}catch{}}
    setStatus(needsReview?'review':'done');
  },[lessonId]);
  if(status==='done')return <span className="lessonStatus done">✓ مكتمل</span>;
  if(status==='review')return <span className="lessonStatus review">↻ مراجعة</span>;
  return <span className="lessonStatus new">لم يبدأ</span>;
}
