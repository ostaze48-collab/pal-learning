import {notFound} from 'next/navigation';
import {getLesson,getStudent} from '../../../../lib/data';
import LessonVisual from '../LessonVisual';
import AdaptiveLessonExperience from '../AdaptiveLessonExperience';
import ReteachActions from './ReteachActions';

export default async function ReteachPage({params}:{params:Promise<{lessonId:string}>}){
 const {lessonId}=await params;
 const lesson=getLesson(lessonId);if(!lesson)return notFound();
 const student=getStudent(lesson.student);if(!student)return notFound();
 return <main className="wrap lessonJourney">
   <section className="card aiFirstLessonShell teacherMissionCard">
     <div className="kidPhaseBadge">🎯 تثبيت ذكي — طريقة مختلفة</div>
     <h1>{lesson.title}</h1>
     <p className="kidShortLead">لن نعيد الدرس كاملًا، ولن نكرر نفس الشرح. سنعرض الفكرة بصريًا ونجربها بتفاعل مختلف، ثم نعيد قياسها بسؤال قصير.</p>
     <div className="remediation" style={{marginBottom:18}}>
       <strong>المسار الآن</strong>
       <p>تمثيل بصري مختلف → تجربة قصيرة → ربط الفكرة بالهدف → إعادة قياس. وإذا ثبتت الفكرة نعود مباشرة لمسار الصف.</p>
     </div>
     <LessonVisual lesson={lesson}/>
     <AdaptiveLessonExperience lesson={lesson} diagnosticCorrect={false}/>
     <ReteachActions lessonId={lesson.id} studentSlug={student.slug}/>
   </section>
 </main>;
}
