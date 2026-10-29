import {notFound} from 'next/navigation';
import {getLesson,getStudent} from '../../../../lib/data';
import AlternateTeachingCanvas from './AlternateTeachingCanvas';
import TargetedRecheck from './TargetedRecheck';

export default async function ReteachPage({params}:{params:Promise<{lessonId:string}>}){
 const {lessonId}=await params;const lesson=getLesson(lessonId);if(!lesson)return notFound();const student=getStudent(lesson.student);if(!student)return notFound();
 return <main className={`wrap lessonJourney ${student.slug==='salma'?'themeSalma':'themeSama'}`}><section className="card aiFirstLessonShell teacherMissionCard"><div className="kidPhaseBadge">✨ نجربها بطريقة ثانية</div><h1>{lesson.title}</h1><p className="kidShortLead">لن نعيد الدرس من البداية. نركز على فكرة واحدة، نشاهدها من زاوية أخرى، ثم نجرب محاولة صغيرة.</p><AlternateTeachingCanvas lesson={lesson}/><TargetedRecheck lesson={lesson} studentSlug={student.slug}/></section></main>;
}