'use client';

import {FormEvent, useState} from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const adminHeaders=()=>({Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`});
const sourceTypes = ['OFFICIAL_PACKAGE','STUDENT_BOOK','SOLUTIONS','TEACHER_GUIDE','WORKSHEET','EXAM','REMEDIAL','INTERACTIVE','VIDEO_REFERENCE'];
const sourceLabels:Record<string,string>={
  OFFICIAL_PACKAGE:'رزمة رسمية حالية من وزارة التربية',
  STUDENT_BOOK:'كتاب الطالب', SOLUTIONS:'الحلول/الإجابات المرجعية', TEACHER_GUIDE:'دليل المعلم',
  WORKSHEET:'ورقة عمل', EXAM:'اختبار', REMEDIAL:'مادة علاجية', INTERACTIVE:'مورد تفاعلي', VIDEO_REFERENCE:'مرجع فيديو'
};

export default function ImporterPage(){
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  async function upload(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); setBusy(true); setMessage('');
    const form=e.currentTarget;
    const data=new FormData(form);
    const packageId=data.get('package_id');
    data.delete('package_id');
    try{
      const res=await fetch(`${API}/importer/source-packages/${packageId}/upload`,{method:'POST',headers:adminHeaders(),body:data});
      const body=await res.json();
      if(!res.ok) throw new Error(body.detail || 'فشل الاستيراد');
      setMessage(`تم الاستخراج: ${body.page_count} صفحة · تطابق الطبعة ${body.edition_match_score}% · اكتمال الرزمة ${body.package_completeness}%`);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ');}
    finally{setBusy(false);}
  }
  async function processPackage(){
    const packageId=(document.querySelector('[name=package_id]') as HTMLInputElement)?.value || '1';
    setBusy(true); setMessage('');
    try{
      const res=await fetch(`${API}/importer/source-packages/${packageId}/process`,{method:'POST',headers:adminHeaders()});
      const body=await res.json();
      if(!res.ok) throw new Error(body.detail || 'فشلت المعالجة');
      setMessage(`اكتملت المعالجة المحلية · Job #${body.job_id} · الحالة ${body.package_status}`);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ');}
    finally{setBusy(false);}
  }
  return <main style={{maxWidth:900,margin:'28px auto',padding:18}}>
    <div style={{fontSize:14,opacity:.6}}>الإدارة ← مصنع المنهاج</div>
    <h1>استيراد الرزمة التعليمية</h1>
    <p>الرزمة الرسمية الحالية تُسجّل كمصدر مستقل، والكتاب الكامل والحلول ودليل المعلم تبقى مصادر منفصلة. لا نعتبر الرزمة الرسمية وحدها إثباتًا لطبعة كتاب كاملة ما لم تتم مطابقة المحتوى.</p>
    <form onSubmit={upload} style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e8edf5',display:'grid',gap:14}}>
      <label>رقم الرزمة<input name="package_id" defaultValue="1" required style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
      <label>نوع المصدر<select name="source_type" defaultValue="OFFICIAL_PACKAGE" style={{display:'block',width:'100%',padding:10,marginTop:5}}>{sourceTypes.map(x=><option key={x} value={x}>{sourceLabels[x]||x} — {x}</option>)}</select></label>
      <label>الطبعة/السنة<input name="edition" defaultValue="2026" style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
      <label>درجة موثوقية المصدر<input name="reliability_score" type="number" min="0" max="100" defaultValue="100" style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
      <label>الملف<input name="file" type="file" accept=".pdf,.txt,.md" required style={{display:'block',marginTop:8}}/></label>
      <button disabled={busy} style={{border:0,borderRadius:12,padding:12,background:'#1f6feb',color:'white',fontWeight:700}}>{busy?'جارٍ التنفيذ…':'رفع واستخراج النص'}</button>
    </form>
    <button onClick={processPackage} disabled={busy} style={{marginTop:14,border:0,borderRadius:12,padding:'12px 16px',background:'#14213d',color:'white'}}>تشغيل المعالجة المحلية للرزمة</button>
    {message&&<div style={{marginTop:16,padding:16,borderRadius:14,background:'#eef6ff'}}>{message}</div>}
    <section style={{marginTop:22,background:'white',padding:18,borderRadius:16,border:'1px solid #e8edf5'}}>
      <h2>ما يحدث عند الرفع</h2>
      <ol style={{lineHeight:2}}><li>حساب SHA-256 لمنع التكرار.</li><li>استخراج النص من PDF النصي أو UTF-8.</li><li>تقسيمه إلى Source Chunks مع رقم الصفحة.</li><li>حساب إشارة أولية لمطابقة الطبعة.</li><li>اكتشاف مرشح للوحدات والدروس.</li><li>إرساله لاحقًا إلى AI Gateway للمراجعة الدلالية.</li></ol>
    </section>
  </main>
}
