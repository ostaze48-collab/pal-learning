'use client';

import {FormEvent, useState} from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const adminHeaders=()=>({Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`});
const sourceTypes = ['OFFICIAL_PACKAGE','STUDENT_BOOK','SOLUTIONS','TEACHER_GUIDE','WORKSHEET','EXAM','REMEDIAL','INTERACTIVE','VIDEO_REFERENCE'];
const sourceLabels:Record<string,string>={
  CATALOG_CANDIDATE:'مرشح من كتالوج الوزارة — النطاق غير متحقق',
  CURRICULUM_PLAN:'خطة منهاج حالية — Scope Evidence فقط',
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
  const [lessonId,setLessonId]=useState(1);

  function currentPackageId(){
    return (document.querySelector('[name=package_id]') as HTMLInputElement)?.value || '1';
  }

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

  async function syncOfficialCatalog(){
    const packageId=currentPackageId();
    setBusy(true); setMessage('');
    try{
      const res=await fetch(`${API}/importer/catalog/source-packages/${packageId}/sync`,{method:'POST',headers:adminHeaders()});
      const body=await res.json();
      if(!res.ok) throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'فشلت مزامنة الكتالوج الرسمي');
      const first=body.sources?.[0];
      setMessage(`كتالوج الوزارة ✓ · جديد ${body.created} · موجود ${body.existing} · محجوز للتحقق ${body.quarantined||0}${first?` · ${first.authority}`:''}. لا يدخل Coverage حتى ينجح Verify Scope.`);
      await loadPackage(packageId);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ أثناء مزامنة المصدر الرسمي');setBusy(false);}
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

  async function uploadPlan(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); setBusy(true); setMessage('');
    const data=new FormData(e.currentTarget);
    const packageId=currentPackageId();
    try{
      const res=await fetch(`${API}/importer/scope-evidence/source-packages/${packageId}/upload-plan`,{method:'POST',headers:adminHeaders(),body:data});
      const body=await res.json();
      if(!res.ok) throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'فشل رفع خطة المنهاج');
      setMessage(`خطة المنهاج الحالية ✓ · المصدر #${body.source_file_id} · ${body.page_count||0} صفحة · Coverage weight = 0. الآن شغّل تحقق الدرس من الخطة.`);
      await loadPackage(packageId);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ أثناء رفع خطة المنهاج');setBusy(false);}
  }

  async function verifyCurrentPlan(){
    setBusy(true); setMessage('');
    try{
      const res=await fetch(`${API}/importer/scope-evidence/lessons/${lessonId}/verify-current-plan`,{method:'POST',headers:adminHeaders()});
      const body=await res.json();
      if(!res.ok) throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'فشل التحقق من الخطة الحالية');
      if(body.current_scope_verified){
        setMessage(`Current Scope PASS ✓ · ${body.lesson_title} موجود ضمن ${body.unit_title} في خطة ${body.plan_edition||'الحالية'}. تم إنشاء CURRENT_SCOPE_EVIDENCE، لكنه لن يدخل factual source_context.`);
      }else{
        setMessage(`Current Scope BLOCKED · الخطة المرفوعة لا تثبت أن «${body.lesson_title}» ضمن «${body.unit_title}». لن يسمح للكتاب القديم وحده بتوليد درس جديد.`);
      }
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ أثناء تحقق الخطة');}
    finally{setBusy(false);}
  }

  async function fetchRegistered(sourceId:number){
    setBusy(true); setMessage('');
    try{
      const res=await fetch(`${API}/importer/source-files/${sourceId}/fetch-registered`,{method:'POST',headers:adminHeaders()});
      const body=await res.json();
      if(!res.ok) throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message || 'فشل جلب المصدر');
      setMessage(`تم جلب المصدر #${sourceId}: ${body.page_count} صفحة · Edition Match ${body.edition_match_score}% · Quality ${body.package_quality}%${pkg?.files.find(x=>x.id===sourceId)?.source_type==='CATALOG_CANDIDATE'?' · الخطوة التالية: Verify Scope':''}`);
      await loadPackage(pkg?.id||1);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ أثناء جلب المصدر');setBusy(false);}
  }

  async function verifyScope(sourceId:number){
    setBusy(true); setMessage('');
    try{
      const res=await fetch(`${API}/importer/catalog/source-files/${sourceId}/verify-scope`,{method:'POST',headers:adminHeaders()});
      const body=await res.json();
      if(!res.ok) throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'فشل التحقق من نطاق المصدر');
      if(body.scope_verified){
        setMessage(`Scope PASS ✓ · المصدر #${sourceId} يحتوي مؤشرات Book #001 المطلوبة وتمت ترقيته إلى ${body.source_type}. Edition Match يبقى مستقلاً: ${body.edition_match_score}%.`);
      }else{
        setMessage(`Scope BLOCKED · المصدر #${sourceId} لا يثبت نطاق Book #001. العبارات المفقودة: ${(body.missing_terms||[]).join('، ')||'—'}. لن يدخل Coverage.`);
      }
      await loadPackage(pkg?.id||1);
    }catch(err){setMessage(err instanceof Error?err.message:'حدث خطأ أثناء تحقق النطاق');setBusy(false);}
  }

  async function processPackage(){
    const packageId=currentPackageId();
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
    <p>الرابط الرسمي لا يعني تلقائيًا أنه يغطي الفصل والدرس المستهدفين. لذلك نُبقي مصادر الكتالوج كـ<strong>CATALOG_CANDIDATE</strong> حتى ينجح فحص النطاق. وإذا كان كتاب الطالب أقدم من النسخة الحالية، نحتاج <strong>CURRICULUM_PLAN</strong> حديثة تؤكد أن الدرس ما زال ضمن الخطة قبل السماح بالتوليد.</p>

    <form onSubmit={upload} style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e8edf5',display:'grid',gap:14}}>
      <label>رقم الرزمة<input name="package_id" defaultValue="1" required style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button type="button" onClick={()=>loadPackage(currentPackageId())} disabled={busy} style={{padding:10,borderRadius:10,border:'1px solid #ccd5e3',background:'white'}}>عرض حالة الرزمة</button>
        <button type="button" onClick={syncOfficialCatalog} disabled={busy} style={{padding:10,borderRadius:10,border:'1px solid #b9d4ff',background:'#eef6ff',color:'#124b9b',fontWeight:700}}>مزامنة كتالوج الوزارة</button>
      </div>
      <div style={{fontSize:12,opacity:.65}}>المزامنة تثبت أن الوزارة تربط الصف/المبحث بهذا الرابط فقط. لا تمنح المصدر أي وزن تعليمي حتى Fetch + Verify Scope.</div>
      <label>نوع المصدر<select name="source_type" defaultValue="OFFICIAL_PACKAGE" style={{display:'block',width:'100%',padding:10,marginTop:5}}>{sourceTypes.map(x=><option key={x} value={x}>{sourceLabels[x]||x} — {x}</option>)}</select></label>
      <label>الطبعة/السنة<input name="edition" defaultValue="2026" style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
      <label>درجة موثوقية المصدر<input name="reliability_score" type="number" min="0" max="100" defaultValue="100" style={{display:'block',width:'100%',padding:10,marginTop:5}}/></label>
      <label>الملف<input name="file" type="file" accept=".pdf,.txt,.md" required style={{display:'block',marginTop:8}}/></label>
      <button disabled={busy} style={{border:0,borderRadius:12,padding:12,background:'#1f6feb',color:'white',fontWeight:700}}>{busy?'جارٍ التنفيذ…':'رفع واستخراج النص'}</button>
    </form>

    <section style={{marginTop:14,background:'#f8fbff',padding:18,borderRadius:16,border:'1px solid #cddff8'}}>
      <h2 style={{marginTop:0}}>خطة المنهاج الحالية · Scope Evidence</h2>
      <p style={{fontSize:14}}>مثالنا الحالي: كتاب الطالب الكامل المتاح علنًا هو طبعة 2020، بينما توجد خطة طوارئ 2025/2026. الخطة هنا لا تشرح العلوم ولا تدخل Coverage؛ تستخدم فقط لإثبات استمرار الوحدة والدرس في النطاق الحالي.</p>
      <form onSubmit={uploadPlan} style={{display:'grid',gap:10}}>
        <label>سنة/إصدار الخطة<input name="edition" defaultValue="2025/2026 emergency plan" required style={{display:'block',width:'100%',padding:9,marginTop:4}}/></label>
        <label>موثوقية الخطة<input name="reliability_score" type="number" min="0" max="100" defaultValue="90" style={{display:'block',width:'100%',padding:9,marginTop:4}}/></label>
        <label>ملف الخطة<input name="file" type="file" accept=".pdf,.txt,.md" required style={{display:'block',marginTop:6}}/></label>
        <button disabled={busy} style={{padding:10,borderRadius:10,border:0,background:'#355c9a',color:'white',fontWeight:700}}>رفع CURRICULUM_PLAN</button>
      </form>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:12}}>
        <label>Lesson ID <input type="number" min="1" value={lessonId} onChange={e=>setLessonId(Number(e.target.value)||1)} style={{width:80,padding:8,marginInlineStart:5}}/></label>
        <button disabled={busy} onClick={verifyCurrentPlan} style={{padding:'9px 12px',borderRadius:9,border:'1px solid #8eacd5',background:'white'}}>تحقق أن الدرس ما زال في الخطة</button>
      </div>
    </section>

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
        {f.source_type==='CURRICULUM_PLAN'&&<div style={{fontSize:12,color:'#355c9a',marginTop:6}}>Scope Evidence only · Coverage weight 0 · لا يستخدم لتوليد الحقائق.</div>}
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginTop:8}}>
          {f.source_url&&<a href={f.source_url} target="_blank" rel="noreferrer">فتح المصدر المسجل</a>}
          {f.source_url&&(!f.chunk_count||f.status==='DISCOVERED'||f.status==='SCOPE_UNVERIFIED')&&<button disabled={busy} onClick={()=>fetchRegistered(f.id)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #ccd5e3',background:'#f8fbff'}}>جلب الرابط واستخراجه</button>}
          {f.source_type==='CATALOG_CANDIDATE'&&!!f.chunk_count&&<button disabled={busy} onClick={()=>verifyScope(f.id)} style={{padding:'7px 10px',borderRadius:9,border:'1px solid #f0c36a',background:'#fff8e8',color:'#7a4b00',fontWeight:700}}>Verify Scope</button>}
        </div>
      </article>)}</div>
    </section>}

    <section style={{marginTop:22,background:'white',padding:18,borderRadius:16,border:'1px solid #e8edf5'}}>
      <h2>بوابات المصدر</h2>
      <ol style={{lineHeight:2}}>
        <li><strong>Catalog:</strong> إثبات أن الرابط صادر من كتالوج الوزارة للصف/المبحث.</li>
        <li><strong>Fetch:</strong> تنزيل آمن + SHA-256 + استخراج النص والصفحات.</li>
        <li><strong>Scope:</strong> إثبات أن المصدر الرسمي نفسه يغطي الوحدة/الدرس المستهدفين؛ وإلا يبقى بلا وزن.</li>
        <li><strong>Current Plan:</strong> إذا كان مصدر الحقائق كتابًا قديمًا، نثبت بخطة حديثة أن الدرس ما زال مطلوبًا. الخطة لا تصبح factual source.</li>
        <li><strong>Edition:</strong> مطابقة السنة/العنوان مستقلة عن كونه رسميًا.</li>
        <li><strong>Coverage/Quality:</strong> تُحسب فقط من أنواع المصادر التعليمية المقبولة، لا من Catalog Candidate أو Curriculum Plan.</li>
      </ol>
    </section>
  </main>
}
