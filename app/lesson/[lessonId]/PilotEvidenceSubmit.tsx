'use client';
import {useState} from 'react';

type Evidence={diagnosticCorrect:boolean;firstPassScore:number;finalScore:number;mastery:number;masteryConfidence?:number;objectiveEvidenceScore?:number|null;transferScore?:number|null;timeSeconds?:number;completedAt:string};
export default function PilotEvidenceSubmit({lessonId,report}:{lessonId:string;report:Evidence}){
 const [consent,setConsent]=useState(false);
 const [code,setCode]=useState('');
 const [state,setState]=useState<'idle'|'sending'|'sent'|'error'>('idle');
 async function submit(){
  if(!consent||!code.trim()||state==='sending')return;
  setState('sending');
  try{
   let participantId=localStorage.getItem('pilot:anonymousParticipantId');
   if(!participantId){participantId=crypto.randomUUID();localStorage.setItem('pilot:anonymousParticipantId',participantId)}
   const response=await fetch('/api/pilot-evidence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pilotCode:code.trim(),participantId,lessonId,diagnosticCorrect:report.diagnosticCorrect,firstPassScore:report.firstPassScore,finalScore:report.finalScore,mastery:report.mastery,masteryConfidence:report.masteryConfidence,objectiveEvidenceScore:report.objectiveEvidenceScore,transferScore:report.transferScore,timeSeconds:report.timeSeconds,completedAt:report.completedAt})});
   if(!response.ok)throw new Error('submit_failed');
   setState('sent');setCode('');
  }catch{setState('error')}
 }
 return <section style={{marginTop:18,padding:14,border:'1px solid var(--border,#ddd)',borderRadius:14,textAlign:'right'}}>
  <strong>المشاركة في تجربة قياس التعلم</strong>
  <p style={{fontSize:13,lineHeight:1.7}}>بموافقتك، نرسل نتائج هذا الدرس فقط إلى سجل تجريبي مجهول الهوية. لا نرسل الاسم أو الإجابات النصية أو معلومات الاتصال. يُحفظ معرّف عشوائي لتمييز المحاولات.</p>
  <label style={{display:'flex',gap:8,alignItems:'flex-start',fontSize:13,margin:'10px 0'}}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> أوافق على إرسال نتائج هذا الدرس لأغراض تقييم التجربة التعليمية.</label>
  <label style={{display:'block',fontSize:13,marginBottom:6}}>رمز مشاركة التجربة</label>
  <input value={code} onChange={e=>setCode(e.target.value)} type="password" autoComplete="off" placeholder="أدخل الرمز الذي يقدمه مشرف التجربة" style={{width:'100%',padding:10,borderRadius:8,border:'1px solid var(--border,#bbb)',background:'transparent',color:'inherit'}}/>
  <button type="button" disabled={!consent||!code.trim()||state==='sending'||state==='sent'} onClick={submit} style={{marginTop:10,padding:'10px 16px',borderRadius:9,border:0,cursor:'pointer'}}>{state==='sending'?'جارٍ الإرسال…':state==='sent'?'تم إرسال النتيجة':'إرسال النتيجة المجهولة'}</button>
  {state==='sent'&&<p role="status" style={{fontSize:13}}>وصلت النتيجة إلى سجل التجربة.</p>}
  {state==='error'&&<p role="alert" style={{fontSize:13}}>لم نتمكن من إرسال النتيجة. تحقق من الرمز والاتصال ثم أعد المحاولة.</p>}
 </section>
}
