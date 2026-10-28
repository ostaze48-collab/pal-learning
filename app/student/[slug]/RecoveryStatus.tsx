'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {recoverySkills} from '../../../lib/recoverySkills';

export default function RecoveryStatus({slug}:{slug:string}){
 const [scores,setScores]=useState<Record<string,number>>({});
 useEffect(()=>{
   const next:Record<string,number>={};
   for(const skill of recoverySkills){const raw=localStorage.getItem(`recovery:${slug}:${skill.id}`);if(raw!==null)next[skill.id]=Number(raw)}
   setScores(next);
 },[slug]);
 const entries=Object.entries(scores);
 const screened=entries.length>0;
 const weak=entries.filter(([,score])=>score<80).sort((a,b)=>a[1]-b[1]);
 return <section className="recoveryStatus">
   <div><span className="tag">مسار الاستدراك</span><h2>فجوات السنوات السابقة</h2><p className="muted">نفحص مهارات مختارة من الصفوف السابقة ونضيف علاجًا قصيرًا دون إيقاف دروس الصف الحالي.</p></div>
   <div className="recoveryStatusSide">{screened?<><strong>{weak.length?`${weak.length} مهارات تحتاج دعمًا`:'الأساسيات جيدة حاليًا ✅'}</strong>{weak.length>0&&<span className="muted">الأولوية: {recoverySkills.find(s=>s.id===weak[0][0])?.title}</span>}</>:<strong>لم يبدأ فحص الفجوات بعد</strong>}<Link className="btn secondary" href={`/student/${slug}/recovery`}>{screened?'راجع خريطة الفجوات':'ابدأ فحص الفجوات'}</Link></div>
 </section>;
}
