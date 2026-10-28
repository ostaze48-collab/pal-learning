import {notFound} from 'next/navigation';
import {getLesson,getStudent} from '../../../../lib/data';
import AlternateTeachingCanvas from './AlternateTeachingCanvas';
import ReteachActions from './ReteachActions';

export default async function ReteachPage({params}:{params:Promise<{lessonId:string}>}){
 const {lessonId}=await params;const lesson=getLesson(lessonId);if(!lesson)return notFound();const student=getStudent(lesson.student);if(!student)return notFound();
 return <main className="wrap lessonJourney"><section className="card aiFirstLessonShell teacherMissionCard"><div className="kidPhaseBadge">✨ نجربها بطريقة ثانية</div><h1>{lesson.title}</h1><p className="kidShortLead">لن نعيد الدرس من البداية. سنشاهد الفكرة من زاوية جديدة، نجربها، ثم نكمل.</p><AlternateTeachingCanvas lesson={lesson}/><ReteachActions lessonId={lesson.id} studentSlug={student.slug}/></section></main>;
}
