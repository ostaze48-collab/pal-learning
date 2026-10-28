'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

export default function ReteachActions({lessonId,studentSlug}:{lessonId:string;studentSlug:string}){
 const router=useRouter();
 function recheck(){
   localStorage.setItem(`lesson:${lessonId}:reviewMode`,'1');
   router.push(`/lesson/${lessonId}`);
 }
 return <div className="lessonNavKid" style={{marginTop:20}}>
   <Link href={`/student/${studentSlug}`}><span>→</span><div><small>أعود للخطة</small><strong>أكمل مهمة اليوم</strong></div></Link>
   <button className="btn kidPrimaryAction" onClick={recheck}>🎯 فهمتِها بطريقة أفضل؟ أعيدي القياس</button>
 </div>;
}
