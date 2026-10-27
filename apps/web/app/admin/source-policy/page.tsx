'use client';

import {useEffect,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Authority={
  source_type:string;
  factual_grounding:boolean;
  current_scope_evidence:boolean;
  answer_validation:boolean;
  pedagogy_guidance:boolean;
  assessment_style:boolean;
  remediation_support:boolean;
  enrichment_only:boolean;
};
type PolicyResponse={policy_version:string;capabilities:string[];sources:Record<string,Authority>;rules:Record<string,string>};

const labels:Record<string,string>={
  OFFICIAL_PACKAGE:'رزمة رسمية', STUDENT_BOOK:'كتاب الطالب', SOLUTIONS:'الحلول',
  TEACHER_GUIDE:'دليل المعلم', WORKSHEET:'ورقة عمل', EXAM:'اختبار', REMEDIAL:'مادة علاجية',
  INTERACTIVE:'مورد تفاعلي', VIDEO_REFERENCE:'مرجع فيديو', CURRICULUM_PLAN:'خطة المنهاج',
  CATALOG_CANDIDATE:'مرشح كتالوج غير متحقق'
};
const capabilityLabels:Record<string,string>={
  factual_grounding:'شرح الحقائق', current_scope_evidence:'إثبات النطاق الحالي', answer_validation:'التحقق من الإجابات',
  pedagogy_guidance:'إرشاد تربوي', assessment_style:'نمط التقييم', remediation_support:'دعم علاجي', enrichment_only:'إثراء فقط'
};

export default function SourcePolicyPage(){
  const [data,setData]=useState<PolicyResponse|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const token=localStorage.getItem('pal_admin_token')||'';
    fetch(`${API}/importer/source-policy`,{headers:{Authorization:`Bearer ${token}`}})
      .then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.detail||'تعذر تحميل سياسة المصادر');return b;})
      .then(setData).catch(e=>setError(e.message||'تعذر تحميل سياسة المصادر'));
  },[]);

  const rows=data?Object.values(data.sources):[];
  return <main style={{maxWidth:1150,margin:'30px auto',padding:18}}>
    <div style={{fontSize:14,opacity:.65}}>الإدارة ← مصادر المنهاج ← Authority Matrix</div>
    <h1>سياسة صلاحيات المصادر</h1>
    <p>كل نوع مصدر له وظيفة محددة. النظام يمنع المصدر من أداء وظيفة غير مصرح بها حتى لو تم ربطه يدويًا بالدرس. الأنواع غير المعروفة تُعامل تلقائيًا كـ <strong>DENY ALL</strong>.</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <a href="/admin/source-discovery">المصادر المكتشفة</a>
      <a href="/admin/importer">استيراد الملفات</a>
      <a href="/admin">لوحة الإدارة</a>
    </div>
    {error&&<div style={{padding:14,borderRadius:12,background:'#ffecec'}}>{error}</div>}
    {!data&&!error&&<p>جارٍ تحميل المصفوفة…</p>}
    {data&&<>
      <div style={{padding:14,borderRadius:12,background:'#f8fbff',border:'1px solid #d9e7f8',marginBottom:16}}>
        <strong>{data.policy_version}</strong> · factual generation requires <code>factual_grounding=true</code> · current scope requires <code>current_scope_evidence=true</code>.
      </div>
      <div style={{overflowX:'auto',background:'white',borderRadius:14,border:'1px solid #e8edf5'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
          <thead><tr><th style={{textAlign:'right',padding:12}}>المصدر</th>{data.capabilities.map(c=><th key={c} style={{padding:12,fontSize:12}}>{capabilityLabels[c]||c}</th>)}</tr></thead>
          <tbody>{rows.map(row=><tr key={row.source_type} style={{borderTop:'1px solid #eef1f5'}}>
            <td style={{padding:12}}><strong>{labels[row.source_type]||row.source_type}</strong><div style={{fontSize:12,opacity:.6}}>{row.source_type}</div></td>
            {data.capabilities.map(c=><td key={c} style={{textAlign:'center',padding:12,fontWeight:700}}>{(row as unknown as Record<string,boolean|string>)[c]===true?'✓':'—'}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <section style={{marginTop:18,background:'white',padding:18,borderRadius:14,border:'1px solid #e8edf5'}}>
        <h2>أمثلة حاسمة</h2>
        <ul style={{lineHeight:2}}>
          <li><strong>كتاب الطالب / الرزمة الرسمية المتحققة:</strong> يمكن استخدامهما لتأصيل الحقائق.</li>
          <li><strong>الحلول:</strong> للتحقق من الإجابات ونمط التقييم، وليس لشرح حقائق الدرس.</li>
          <li><strong>خطة المنهاج:</strong> تثبت أن الوحدة/الدرس ما زال ضمن الخطة الحالية، ولا تدخل factual context.</li>
          <li><strong>مرشح كتالوج الوزارة:</strong> بلا صلاحيات حتى يثبت النطاق ويُرقّى إلى نوع موثوق.</li>
          <li><strong>Discovery Candidate:</strong> ليس SourceFile أصلًا؛ هو فقط دليل بأن ملفًا محتملًا موجود ويجب الحصول على الملف الفعلي أولًا.</li>
        </ul>
      </section>
    </>}
  </main>;
}
