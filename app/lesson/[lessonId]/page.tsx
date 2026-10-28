import Link from 'next/link';
import {getLesson,getStudent,getStudentLessons} from '../../../lib/data';
import LessonPlayer from './LessonPlayer';

export default async function LessonPage({params}:{params:Promise<{lessonId:string}>}){
 const {lessonId}=await params;
 const lesson=getLesson(lessonId);
 if(!lesson)return <main className="wrap">الدرس غير موجود.</main>;
 const student=getStudent(lesson.student)!;
 const subjectLessons=getStudentLessons(student.slug).filter(item=>item.subject===lesson.subject);
 const currentIndex=subjectLessons.findIndex(item=>item.id===lesson.id);
 const previous=currentIndex>0?subjectLessons[currentIndex-1]:null;
 const next=currentIndex>=0&&currentIndex<subjectLessons.length-1?subjectLessons[currentIndex+1]:null;

 return <main className="shell"><div className="wrap">
  <div className="top"><Link className="btn secondary" href={`/student/${student.slug}`}>← دروس {student.name}</Link><div className="brand">{lesson.subject}</div></div>
  <div className="lessonDesktopLayout">
    <section className="lessonMainPane">
      <span className="tag">{student.name} · الصف {student.grade} · الفصل الأول</span>
      <h1>{lesson.title}</h1>
      <p className="muted lessonLead">{lesson.summary}</p>
      <LessonPlayer lesson={lesson}/>
      <nav style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginTop:18}} aria-label="التنقل بين الدروس">
        <div>{previous&&<Link className="btn secondary" href={`/lesson/${previous.id}`}>→ السابق: {previous.title}</Link>}</div>
        <div>{next&&<Link className="btn" href={`/lesson/${next.id}`}>التالي: {next.title} ←</Link>}</div>
      </nav>
    </section>

    <aside className="lessonSidebar card">
      <div className="lessonSidebarSection"><div className="muted" style={{fontSize:12,fontWeight:900}}>معلومات الدرس</div><div className="lessonInfoRow"><span>⏱️ المدة</span><strong>{lesson.minutes} دقيقة</strong></div><div className="lessonInfoRow"><span>📚 المادة</span><strong>{lesson.subject}</strong></div><div className="lessonInfoRow"><span>🎯 النوع</span><strong>{lesson.kind==='assessment'?'اختبار':'درس'}</strong></div></div>
      <div className="lessonSidebarSection"><strong>ما الذي سأتعلمه؟</strong><ol className="learningObjectives">{lesson.learningPoints.map(point=><li key={point}>{point}</li>)}</ol></div>
    </aside>
  </div>
 </div></main>;
}
