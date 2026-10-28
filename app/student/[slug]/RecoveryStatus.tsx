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
 if(!screened)return <section className="skillBoostCard"><div className="skillBoostIcon">💪</div><div><span>قوّي مهاراتك</span><h2>تمرين صغير يساعدك في الدروس القادمة</h2><p>أسئلة قصيرة تعرفنا على المهارات التي تحتاج تدريبًا أكثر.</p></div><Link className="skillBoostBtn" href={`/student/${slug}/recovery`}>ابدئي التمرين</Link></section>;
 return <section className={`skillBoostCard ${weak.length?'needsBoost':'allGood'}`}><div className="skillBoostIcon">{weak.length?'🧩':'🌟'}</div><div><span>{weak.length?'لديك مهمة تقوية':'ممتاز!'}</span><h2>{weak.length?`${weak.length} مهارة سنقويها خطوة خطوة`:'مهاراتك الأساسية جيدة الآن'}</h2><p>{weak.length?`نبدأ بالأهم: ${recoverySkills.find(s=>s.id===weak[0][0])?.title??'مهارة أساسية'}.`:'استمري في خطة اليوم وسنخبرك إذا احتجتِ تدريبًا إضافيًا.'}</p></div>{weak.length>0&&<Link className="skillBoostBtn" href={`/student/${slug}/recovery`}>قوّي مهارتي</Link>}</section>;
}
