import {notFound} from 'next/navigation';
import {getLesson,getStudent} from '../../../../lib/data';
import LessonVisual from '../LessonVisual';
import AITeacherLesson from '../AITeacherLesson';
import AITutor from '../AITutor';
import ReteachActions from './ReteachActions';

export default async function ReteachPage({params}:{params:Promise<{lessonId:string}>}){
 const {lessonId}=await params;
 const lesson=getLesson(lessonId);if(!lesson)return notFound();
 const student=getStudent(lesson.student);if(!student)return notFound();
 return <main className="wrap lessonJourney">
   <section className="card aiFirstLessonShell teacherMissionCard">
     <div className="kidPhaseBadge">🎯 تثبيت ذكي — طريقة مختلفة</div>
     <h1>{lesson.title}</h1>
     <p className="kidShortLead">لن نعيد الدرس كاملًا. المعلم لاحظ أن نقطة واحدة تحتاج تمثيلًا مختلفًا، لذلك سنغيّر طريقة الشرح ثم نطلب منكِ دليل فهم جديد.</p>
     <div className="remediation" style={{marginBottom:18}}>
       <strong>ما الذي سيحدث الآن؟</strong>
       <p>مثال أو تمثيل جديد → محاولة منكِ → تفسير قصير → قياس جديد. وإذا ثبتت الفكرة نعود فورًا لمسار صفك.</p>
     </div>
     <LessonVisual lesson={lesson}/>
     <AITeacherLesson lesson={lesson} diagnosticCorrect={true}/>
     <ReteachActions lessonId={lesson.id} studentSlug={student.slug}/>
   </section>
   <AITutor lesson={lesson}/>
 </main>;
}
