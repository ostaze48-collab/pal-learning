'use client';
import {useEffect,useState} from 'react';

type Status={aiConfigured:boolean;curriculumSearchConfigured:boolean;model:string;mode:string};

export default function TutorStatus(){
 const [status,setStatus]=useState<Status|null>(null);
 useEffect(()=>{fetch('/api/tutor/status').then(r=>r.json()).then(setStatus).catch(()=>setStatus({aiConfigured:false,curriculumSearchConfigured:false,model:'-',mode:'unavailable'}))},[]);
 if(!status)return <section className="tutorStatus"><strong>🤖 المعلم الذكي</strong><span>جاري فحص الإعداد…</span></section>;
 const full=status.aiConfigured&&status.curriculumSearchConfigured;
 return <section className={`tutorStatus ${full?'ready':status.aiConfigured?'partial':'local'}`}>
   <div><strong>🤖 حالة المعلم الذكي</strong><p>{full?'AI متصل + بحث داخل قاعدة المنهاج':status.aiConfigured?'AI متصل، لكن قاعدة ملفات المنهاج غير مفعلة بعد':'الشرح المحلي الاحتياطي فقط — AI غير متصل بعد'}</p></div>
   <div className="tutorStatusBadges"><span>{status.aiConfigured?'✓ AI API':'○ AI API'}</span><span>{status.curriculumSearchConfigured?'✓ Curriculum File Search':'○ Curriculum File Search'}</span></div>
 </section>;
}
