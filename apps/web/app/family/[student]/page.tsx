import {lessonsForStudent,students,StudentSlug} from '../../../lib/familyLearning';

const subjectCards=[
  {name:'الرياضيات',icon:'➗',status:'متاح'},
  {name:'العلوم والحياة',icon:'🔬',status:'قريبًا'},
  {name:'لغتنا الجميلة',icon:'📘',status:'قريبًا'},
  {name:'English',icon:'🔤',status:'قريبًا'},
];

export default async function StudentFamilyPage({params}:{params:Promise<{student:string}>}){
  const {student}=await params;
  if(!(student in students)) return <main style={{padding:30,fontFamily:'Arial'}}>الطالبة غير موجودة.</main>;
  const profile=students[student as StudentSlug];
  const studentLessons=lessonsForStudent(profile.slug);

  return <main style={{minHeight:'100vh',background:'#f7f8fb',color:'#14213d'}}>
    <div style={{maxWidth:900,margin:'0 auto',padding:'20px 14px 54px'}}>
      <header style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:22}}>
        <a href="/" style={{textDecoration:'none',color:'#14213d',fontWeight:850}}>← الرئيسية</a>
        <a href="/family/parent" style={{textDecoration:'none',color:'#fff',background:'#14213d',padding:'9px 12px',borderRadius:11,fontWeight:850}}>🔒 لوحة الأب</a>
      </header>

      <section style={{padding:20,borderRadius:24,background:`linear-gradient(135deg,${profile.soft},#ffffff)`,border:'1px solid #e6eaf0',boxShadow:'0 14px 40px rgba(20,33,61,.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:12,fontWeight:900,color:profile.accent}}>{profile.gradeLabel} · الفصل الأول</div>
            <h1 style={{fontSize:'clamp(30px,8vw,46px)',margin:'8px 0 5px'}}>مرحبًا {profile.name} {profile.icon}</h1>
            <div style={{color:'#667085',lineHeight:1.7}}>نبدأ الآن بالرزم التعليمية للفصل الأول، مادةً ودرسًا بعد درس.</div>
          </div>
          <div style={{width:70,height:70,borderRadius:22,background:'#fff',display:'grid',placeItems:'center',fontSize:38,border:'1px solid #eceff3'}}>{profile.icon}</div>
        </div>
      </section>

      <section style={{marginTop:18}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:12,marginBottom:10}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>ابدئي من هنا</div><h2 style={{margin:'3px 0 0'}}>دروس الرياضيات المتاحة</h2></div><span style={{fontSize:12,color:'#667085'}}>{studentLessons.length} درس</span></div>
        <div style={{display:'grid',gap:10}}>{studentLessons.map((lesson,index)=><a key={lesson.slug} href={`/family/${profile.slug}/lesson/${lesson.slug}`} style={{display:'grid',gridTemplateColumns:'50px 1fr auto',gap:12,alignItems:'center',background:'#fff',border:'1px solid #e6eaf0',borderRadius:17,padding:14,textDecoration:'none',color:'#14213d'}}>
          <div style={{width:48,height:48,borderRadius:15,display:'grid',placeItems:'center',fontSize:25,background:profile.soft}}>{lesson.subjectIcon}</div>
          <div><div style={{fontSize:12,color:profile.accent,fontWeight:900}}>الدرس {index+1} · {lesson.estimatedMinutes} دقيقة</div><strong style={{fontSize:18,display:'block',marginTop:3}}>{lesson.title}</strong><div style={{fontSize:12,color:'#667085',marginTop:3}}>{lesson.subtitle}</div></div>
          <span style={{fontSize:24,color:profile.accent}}>←</span>
        </a>)}</div>
      </section>

      <section style={{marginTop:22}}><h2 style={{margin:'0 0 10px'}}>المواد</h2><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>{subjectCards.map((s)=><div key={s.name} style={{background:'#fff',border:'1px solid #e7ebf0',borderRadius:16,padding:14}}><div style={{fontSize:25}}>{s.icon}</div><strong style={{display:'block',marginTop:7}}>{s.name}</strong><span style={{display:'inline-block',marginTop:7,fontSize:11,fontWeight:900,color:s.status==='متاح'?profile.accent:'#87909d',background:s.status==='متاح'?profile.soft:'#f3f4f6',padding:'4px 8px',borderRadius:99}}>{s.status}</span></div>)}</div></section>
    </div>
  </main>;
}
