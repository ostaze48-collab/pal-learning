import Link from 'next/link';
import {getStudent,getStudentLessons,getLessonUnit} from '../../../lib/data';
import StudentProgress from './StudentProgress';
import DailyPlan from './DailyPlan';
import LessonStatus from './LessonStatus';

export default async function StudentPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const student=getStudent(slug);
  if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;

  const items=getStudentLessons(slug);
  const subjects=items.reduce<Record<string,typeof items>>((acc,lesson)=>{(acc[lesson.subject]??=[]).push(lesson);return acc;},{});

  return <main className="shell"><div className="wrap">
    <div className="top"><Link href="/" className="btn secondary">← الرئيسية</Link><div className="brand">{student.name}</div></div>
    <section className="card" style={{marginBottom:18}}><span className="tag">الصف {student.grade===5?'الخامس':'السابع'} · الفصل الأول</span><h1 style={{marginBottom:6}}>مرحبًا {student.name} {student.emoji}</h1><p className="muted">اختاري المادة، ثم تابعي الوحدات والدروس بالترتيب. يتم حفظ تقدمك على هذا الجهاز.</p><StudentProgress lessonIds={items.map(i=>i.id)}/></section>
    <DailyPlan lessons={items}/>

    <div style={{display:'grid',gap:30,marginTop:24}}>{Object.entries(subjects).map(([subject,subjectLessons])=>{
      const units=subjectLessons.reduce<Record<string,typeof subjectLessons>>((acc,lesson)=>{const unit=getLessonUnit(lesson);(acc[unit]??=[]).push(lesson);return acc;},{});
      const icon=subject==='الرياضيات'?'📘':subject==='العلوم والحياة'?'🔬':subject==='اللغة العربية'?'📕':'🔤';
      return <section className="subjectBlock" key={subject}>
        <div className="subjectHeader"><div><span className="subjectIcon">{icon}</span><h2>{subject} — الفصل الأول</h2></div><span className="tag">{subjectLessons.filter(x=>x.kind!=='assessment').length} درسًا</span></div>
        <div style={{display:'grid',gap:22}}>{Object.entries(units).map(([unit,unitLessons])=><section key={`${subject}-${unit}`}>
          <div className="unitTitle"><strong>{unit}</strong><span className="muted">{unitLessons.filter(x=>x.kind!=='assessment').length} دروس</span></div>
          <div style={{display:'grid',gap:10,marginTop:10}}>{unitLessons.map((l,i)=>{
            const lessonNumber=unitLessons.slice(0,i+1).filter(x=>x.kind!=='assessment').length;
            return <div className={`lesson ${l.kind==='assessment'?'assessment':''}`} key={l.id}>
              <div style={{flex:1}}><div className="lessonMeta"><div className="muted" style={{fontSize:12}}>{l.kind==='assessment'?'اختبار الوحدة':`الدرس ${lessonNumber}`} · {l.minutes} دقيقة</div><LessonStatus lessonId={l.id}/></div><h3 style={{margin:'4px 0'}}>{l.title}</h3><div className="muted">{l.summary}</div></div>
              <Link className="btn" href={`/lesson/${l.id}`}>{l.kind==='assessment'?'ابدئي الاختبار':'ابدئي'}</Link>
            </div>
          })}</div>
        </section>)}</div>
      </section>
    })}</div>
  </div></main>
}
