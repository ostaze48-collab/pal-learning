import Link from 'next/link';
import {getLesson,getStudent,getOfficialSourceUrl,getLessonSourceLabel} from '../../../lib/data';
import LessonPlayer from './LessonPlayer';

export default async function LessonPage({params}:{params:Promise<{lessonId:string}>}){
 const {lessonId}=await params;
 const lesson=getLesson(lessonId);
 if(!lesson)return <main className="wrap">الدرس غير موجود.</main>;
 const student=getStudent(lesson.student)!;
 const sourceUrl=getOfficialSourceUrl(lesson);
 const sourceLabel=getLessonSourceLabel(lesson);
 return <main className="shell"><div className="wrap">
  <div className="top"><Link className="btn secondary" href={`/student/${student.slug}`}>← دروس {student.name}</Link><div className="brand">{lesson.subject}</div></div>
  <div className="lessonDesktopLayout">
    <section className="lessonMainPane">
      <span className="tag">{student.name} · الصف {student.grade} · الفصل الأول</span>
      <h1>{lesson.title}</h1>
      <p className="muted lessonLead">{lesson.summary}</p>
      <LessonPlayer lesson={lesson}/>
    </section>

    <aside className="lessonSidebar card">
      <div className="lessonSidebarSection"><div className="muted" style={{fontSize:12,fontWeight:900}}>معلومات الدرس</div><div className="lessonInfoRow"><span>⏱️ المدة</span><strong>{lesson.minutes} دقيقة</strong></div><div className="lessonInfoRow"><span>📚 المادة</span><strong>{lesson.subject}</strong></div><div className="lessonInfoRow"><span>🎯 النوع</span><strong>{lesson.kind==='assessment'?'اختبار':'درس'}</strong></div></div>
      <div className="lessonSidebarSection"><strong>ما الذي سأتعلمه؟</strong><ol className="learningObjectives">{lesson.learningPoints.map(point=><li key={point}>{point}</li>)}</ol></div>
      <div className="lessonSidebarSection"><strong>{lesson.kind==='assessment'?'📝 حول هذا الاختبار':'🏛️ المصدر والمحتوى'}</strong><p className="muted" style={{fontSize:13,lineHeight:1.7}}>{sourceLabel}</p>{lesson.kind!=='assessment'&&<a className="sourceLink" href={sourceUrl} target="_blank" rel="noreferrer">فتح مسار المادة الرسمي ↗</a>}</div>
    </aside>
  </div>
 </div></main>
}
