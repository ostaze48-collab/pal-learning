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

type SourceFile={id:number;source_type:string;original_filename?:string;source_url?:string;reliability_score:number;edition_match_score:number;status:string;page_count?:number;chunk_count:number};
type PackageInfo={id:number;package_code:string;status:string;completeness_score:number;quality_score:number;files:SourceFile[]};

export default function ImporterPage(){
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [pkg,setPkg]=useState<PackageInfo|null>(null);

  async function loadPackage(packageId:string|number='1'){
    setBusy(true); setMessage('');
    try{
      const res=await fetch(`${API}/curriculum/source-packages/${packageId}`,{headers:adminHeaders()});
      const body=await res.json();
      if(!res.ok) throw new Error(body.detail||'تعذر تحميل الرزمة');
      setPkg(body);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ');}
    finally{setBusy(false);}
  }

  async function upload(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); setBusy(true); setMessage('');
    const form=e.currentTarget;
    const data=new FormData(form);
    const packageId=String(data.get('package_id')||'1');
    data.delete('package_id');
    try{
      const res=await fetch(`${API}/importer/source-packages/${packageId}/upload`,{method:'POST',headers:adminHeaders(),body:data});
      const body=await res.json();
      if(!res.ok) throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message || 'فشل الاستيراد');
      setMessage(`تم الاستخراج: ${body.page_count} صفحة · تطابق الطبعة ${body.edition_match_score}% · Coverage ${body.package_completeness}% · Verified Quality ${body.package_quality}%`);
      await loadPackage(packageId);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ');setBusy(false);}
  }

  async function fetchRegistered(sourceId:number){
    setBusy(true); setMessage('');
    try{
      const res=await fetch(`${API}/importer/source-files/${sourceId}/fetch-url`,{method:'POST',headers:adminHeaders()});
      const body=await res.json();
      if(!res.ok) throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message || 'فشل جلب المصدر');
      setMessage(`تم جلب المصدر #${sourceId}: ${body.page_count} صفحة · Edition Match ${body.edition_match_score}% · Quality ${body.package_quality}%`);
      await loadPackage(pkg?.id||1);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ أثناء جلب المصدر');setBusy(false);}
  }

  async function processPackage(){
    const packageId=(document.querySelector('[name=package_id]') as HTMLInputElement)?.value || '1';
    setBusy(true); setMessage('');
    try{
      const res=await fetch(`${API}/importer/source-packages/${packageId}/process`,{method:'POST',headers:adminHeaders()});
      const body=await res.json();
      if(!res.ok) throw new Error(body.detail || 'فشلت المعالجة');
      setMessage(`اكتملت المعالجة · المصدر الأساسي ${body.result?.primary_source_type||'—'} · Job #${body.job_id} · الحالة ${body.package_status}`);
      await loadPackage(packageId);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ');setBusy(false);}
  }

  return <main style={{maxWidth:980,margin:'28px auto',padding:18}}>
    <div style={{fontSize:14,opacity:.6}}>الإدارة ← مصنع المنهاج</div>
    <h1>استيراد الرزمة التعليمية</h1>
    <p>الرزمة الرسمية الحالية تُسجّل كمصدر مستقل، والكتاب الكامل والحلول ودليل المعلم تبقى مصادر منفصلة. <strong>Coverage</strong> يقيس توفر الأنواع، و<strong>Verified Quality</strong> لا يرتفع إلا عندما يجتمع توثيق المصدر مع تطابق الطبعة.</p>
    <form onSubmit={upload} style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e8edf5',display:'grid',gap:14}}>
      <label>رقم الرزمة<input name="package_id" defaultValue="1" required style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
      <button type="button" onClick={()=>loadPackage((document.querySelector('[name=package_id]') as HTMLInputElement)?.value||'1')} disabled={busy} style={{padding:10,borderRadius:10,border:'1px solid #ccd5e3',background:'white'}}>عرض حالة الرزمة</button>
      <label>نوع المصدر<select name="source_type" defaultValue="OFFICIAL_PACKAGE" style={{display:'block',width:'100%',padding:10,marginTop:5}}>{sourceTypes.map(x=><option key={x} value={x}>{sourceLabels[x]||x} — {x}</option>)}</select></label>
      <label>الطبعة/السنة<input name="edition" defaultValue="2026" style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
      <label>درجة موثوقية المصدر<input name="reliability_score" type="number" min="0" max="100" defaultValue="100" style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
      <label>الملف<input name="file" type="file" accept=".pdf,.txt,.md" required style={{display:'block',marginTop:8}}/></label>
      <button disabled={busy} style={{border:0,borderRadius:12,padding:12,background:'#1f6feb',color:'white',fontWeight:700}}>{busy?'جارٍ التنفيذ…':'رفع واستخراج النص'}</button>
    </form>
    <button onClick={processPackage} disabled={busy} style={{marginTop:14,border:0,borderRadius:12,padding:'12px 16px',background:'#14213d',color:'white'}}>تشغيل المعالجة المحلية للرزمة</button>
    {message&&<div style={{marginTop:16,padding:16,borderRadius:14,background:'#eef6ff'}}>{message}</div>}

    {pkg&&<section style={{marginTop:20}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
        <div style={{background:'white',padding:18,borderRadius:14,border:'1px solid #e8edf5'}}><div>Coverage</div><strong style={{fontSize:30}}>{pkg.completeness_score??0}%</strong></div>
        <div style={{background:'white',padding:18,borderRadius:14,border:'1px solid #e8edf5'}}><div>Verified Quality</div><strong style={{fontSize:30}}>{pkg.quality_score??0}%</strong></div>
        <div style={{background:'white',padding:18,borderRadius:14,border:'1px solid #e8edf5'}}><div>الحالة</div><strong>{pkg.status}</strong></div>
      </div>
      <div style={{marginTop:12,display:'grid',gap:10}}>{pkg.files.map(f=><article key={f.id} style={{background:'white',padding:16,borderRadius:14,border:'1px solid #e8edf5'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><strong>{sourceLabels[f.source_type]||f.source_type}</strong><span>{f.status}</span></div>
        <div style={{fontSize:14,marginTop:8}}>Reliability: <strong>{f.reliability_score??0}%</strong> · Edition Match: <strong>{f.edition_match_score??0}%</strong> · Pages: {f.page_count??'—'} · Chunks: {f.chunk_count??0}</div>
        <div style={{fontSize:13,opacity:.7,marginTop:5}}>{f.original_filename||'مصدر مسجل بدون ملف مرفوع'}</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginTop:8}}>
          {f.source_url&&<a href={f.source_url} target="_blank" rel="noreferrer">فتح المصدر المسجل</a>}
          {f.source_url&&(!f.chunk_count||f.status==='DISCOVERED')&&<button disabled={busy} onClick={()=>fetchRegistered(f.id)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #ccd5e3',background:'#f8fbff'}}>جلب الرابط واستخراجه</button>}
        </div>
      </article>)}</div>
    </section>}

    <section style={{marginTop:22,background:'white',padding:18,borderRadius:16,border:'1px solid #e8edf5'}}>
      <h2>ما يحدث عند الرفع أو الجلب</h2>
      <ol style={{lineHeight:2}}><li>حساب SHA-256 ومنع الملف المكرر فعليًا.</li><li>تقييد جلب الروابط على نطاقات المصادر الموثوقة فقط.</li><li>استخراج النص من PDF النصي أو UTF-8.</li><li>تقسيمه إلى Source Chunks مع رقم الصفحة.</li><li>مطابقة السنة والعنوان دون منح نقاط تلقائية لملف قديم.</li><li>إعادة حساب Coverage وVerified Quality.</li><li>اكتشاف مرشح للوحدات والدروس ثم AI Gateway للمراجعة الدلالية.</li></ol>
    </section>
  </main>
}
