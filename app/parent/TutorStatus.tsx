'use client';
import {useEffect,useState} from 'react';

type Status={aiConfigured:boolean;curriculumSearchConfigured:boolean;webResearchAvailable:boolean;model:string;mode:string};

export default function TutorStatus(){
 const [status,setStatus]=useState<Status|null>(null);
 useEffect(()=>{fetch('/api/tutor/status').then(r=>r.json()).then(setStatus).catch(()=>setStatus({aiConfigured:false,curriculumSearchConfigured:false,webResearchAvailable:false,model:'-',mode:'unavailable'}))},[]);
 if(!status)return <section className="tutorStatus"><strong>🤖 المعلم الذكي</strong><span>جاري فحص الإعداد…</span></section>;
 const full=status.aiConfigured&&status.curriculumSearchConfigured;
 return <section className={`tutorStatus ${full?'ready':status.aiConfigured?'partial':'local'}`}>
   <div><strong>🤖 حالة المعلم الذكي</strong><p>{full?'AI متصل + بحث داخل كتب الوزارة + بحث خارجي عند الحاجة':status.aiConfigured?'AI متصل والبحث الخارجي متاح، لكن قاعدة كتب الوزارة لم تُفعّل بعد':'الشرح المحلي الاحتياطي فقط — AI غير متصل بعد'}</p><small className="muted">النموذج: {status.model}</small><div className="sourcePolicyNote"><b>📘 سياسة المصدر:</b> كتاب الوزارة هو أساس الشرح والتوسع. دليل المعلم لطريقة التدريس، وأوراق العمل للتدريب، والرزم التعليمية للطوارئ للملخص والمراجعة فقط.</div></div>
   <div className="tutorStatusBadges"><span>{status.aiConfigured?'✓ AI API':'○ AI API'}</span><span>{status.curriculumSearchConfigured?'✓ Ministry Textbook Search':'○ Ministry Textbook Search'}</span><span>{status.webResearchAvailable?'✓ Web Research':'○ Web Research'}</span></div>
 </section>;
}
