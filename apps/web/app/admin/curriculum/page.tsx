const sources = [
  ['كتاب الطالب', 'STUDENT_BOOK', 'مكتشف'],
  ['حلول الكتاب', 'SOLUTIONS', 'بانتظار الإضافة'],
  ['دليل المعلم', 'TEACHER_GUIDE', 'بانتظار الإضافة'],
  ['أوراق العمل', 'WORKSHEET', 'بانتظار الإضافة'],
  ['الاختبارات', 'EXAM', 'بانتظار الإضافة'],
  ['المواد العلاجية', 'REMEDIAL', 'بانتظار الإضافة'],
];

export default function CurriculumAdmin() {
  return (
    <main style={{maxWidth:1100,margin:'28px auto',padding:18}}>
      <h1>مصنع المنهاج</h1>
      <p style={{opacity:.7}}>PS-G05-SCI-S2-2026 · الصف الخامس · العلوم والحياة · الفصل الثاني</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,margin:'20px 0'}}>
        {sources.map(([name,code,status]) => <div key={code} style={{background:'white',padding:18,borderRadius:16,border:'1px solid #e8edf5'}}>
          <strong>{name}</strong><div style={{fontSize:12,opacity:.55,margin:'4px 0 12px'}}>{code}</div><span>{status}</span>
        </div>)}
      </div>
      <section style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e8edf5'}}>
        <h2>Pipeline</h2>
        <ol style={{lineHeight:2}}>
          <li>مطابقة الطبعة والمصادر</li>
          <li>استخراج الوحدات والدروس</li>
          <li>استخراج المفاهيم والمهارات</li>
          <li>ربط المتطلبات السابقة</li>
          <li>إنشاء الرزمة الرقمية بالذكاء الاصطناعي</li>
          <li>مطابقة الإجابات مع حلول المنهاج</li>
          <li>AI QA ثم النشر</li>
        </ol>
        <button style={{border:0,borderRadius:12,padding:'12px 16px',background:'#1f6feb',color:'white',fontWeight:700}}>بدء مهمة AI</button>
      </section>
    </main>
  );
}
