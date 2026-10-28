import Link from 'next/link';
import {getLesson,getStudent,getStudentLessons} from '../../../lib/data';
import LessonPlayerV2 from './LessonPlayerV2';
import LessonProgressRail from './LessonProgressRail';

const subjectIcons:Record<string,string>={'الرياضيات':'➗','العلوم والحياة':'🔬','اللغة العربية':'📚','English':'🌍'};
const subjectClasses:Record<string,string>={'الرياضيات':'subjectMath','العلوم والحياة':'subjectScience','اللغة العربية':'subjectArabic','English':'subjectEnglish'};

export default async function LessonPage({params}:{params:Promise<{lessonId:string}>}){
 const {lessonId}=await params;
 const lesson=getLesson(lessonId);
 if(!lesson)return <main className="wrap">الدرس غير موجود.</main>;
 const student=getStudent(lesson.student)!;
 const subjectLessons=getStudentLessons(student.slug).filter(item=>item.subject===lesson.subject);
 const currentIndex=subjectLessons.findIndex(item=>item.id===lesson.id);
 const previous=currentIndex>0?subjectLessons[currentIndex-1]:null;
 const next=currentIndex>=0&&currentIndex<subjectLessons.length-1?subjectLessons[currentIndex+1]:null;
 const isSalma=student.slug==='salma';
 const subjectClass=subjectClasses[lesson.subject]??'subjectMath';

 return <main className={`lessonJourney ${isSalma?'themeSalma':'themeSama'} ${subjectClass}`}><div className="wrap lessonJourneyWrap">
  <header className="kidTopbar lessonTopbar"><Link className="backBubble" href={`/student/${student.slug}`}>→ دروسي</Link><div className="lessonTopTitle"><span>{subjectIcons[lesson.subject]??'📘'}</span><strong>{lesson.subject}</strong></div><div className="studentMini">{student.emoji} {student.name}</div></header>

  <section className="lessonMissionHead">
    <div className="missionCopy"><span className="questEyebrow">{lesson.kind==='assessment'?'🏆 تحدي قصير':'✨ رحلة تعلم'}</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></div>
    <div className="missionFacts"><div><span>⏱</span><strong>{lesson.minutes}</strong><small>دقيقة</small></div><div><span>🎯</span><strong>{lesson.learningPoints.length}</strong><small>أهداف</small></div></div>
  </section>

  <LessonProgressRail/>

  <div className="kidLessonLayout">
    <section className="lessonMainPane"><LessonPlayerV2 lesson={lesson}/></section>
    <aside className="goalCard">
      <div className="goalCardIcon">🎯</div><span>بنهاية الرحلة</span><h2>سأستطيع أن…</h2><ul>{lesson.learningPoints.slice(0,4).map(point=><li key={point}>{point}</li>)}</ul>
    </aside>
  </div>

  <nav className="lessonNavKid" aria-label="التنقل بين الدروس">
    {previous?<Link href={`/lesson/${previous.id}`}><span>→</span><div><small>الدرس السابق</small><strong>{previous.title}</strong></div></Link>:<span/>}
    {next&&<Link className="nextLessonLink" href={`/lesson/${next.id}`}><div><small>بعدها</small><strong>{next.title}</strong></div><span>←</span></Link>}
  </nav>
 </div></main>;
}
