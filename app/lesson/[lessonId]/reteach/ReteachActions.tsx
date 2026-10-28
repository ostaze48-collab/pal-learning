'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';

export default function ReteachActions({lessonId,studentSlug}:{lessonId:string;studentSlug:string}){
 const router=useRouter();const [ready,setReady]=useState(false);
 useEffect(()=>{function sync(){setReady(Boolean(localStorage.getItem(`lesson:${lessonId}:reteachComplete`)))}sync();const timer=window.setInterval(sync,300);return()=>window.clearInterval(timer)},[lessonId]);
 function recheck(){if(!ready)return;localStorage.setItem(`lesson:${lessonId}:reviewMode`,'1');router.push(`/lesson/${lessonId}`)}
 return <div className="lessonNavKid" style={{marginTop:20}}>
   <Link href={`/student/${studentSlug}`}><span>→</span><div><small>أعود للخطة</small><strong>أكمل مهمة اليوم</strong></div></Link>
   <button className="btn kidPrimaryAction" disabled={!ready} onClick={recheck}>{ready?'🎯 أعيدي القياس القصير':'🧭 أكملي الطريقة البديلة أولًا'}</button>
 </div>;
}
