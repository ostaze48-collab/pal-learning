import {notFound} from 'next/navigation';
import {getLesson,getStudent} from '../../../../lib/data';
import AlternateTeachingCanvas from './AlternateTeachingCanvas';
import ReteachActions from './ReteachActions';

export default async function ReteachPage({params}:{params:Promise<{lessonId:string}>}){
 const {lessonId}=await params;
 const lesson=getLesson(lessonId);if(!lesson)return notFound();
 const student=getStudent(lesson.student);if(!student)return notFound();
 return <main className="wrap lessonJourney">
   <section className="card aiFirstLessonShell teacherMissionCard">
     <div className="kidPhaseBadge">🎯 تثبيت قصير — بطريقة مختلفة</div>
     <h1>{lesson.title}</h1>
     <p className="kidShortLead">لن نعيد الدرس كاملًا ولن نكرر نفس الشرح. سنغيّر التمثيل أو السياق في النقطة التي تحتاج تثبيتًا فقط، ثم نعيد القياس.</p>
     <AlternateTeachingCanvas lesson={lesson}/>
     <ReteachActions lessonId={lesson.id} studentSlug={student.slug}/>
   </section>
 </main>;
}
