import {notFound} from 'next/navigation';
import {getLesson,getStudent} from '../../../../lib/data';
import TargetedRecheck from '../reteach/TargetedRecheck';

export default async function RefreshPage({params,searchParams}:{params:Promise<{lessonId:string}>;searchParams:Promise<{objective?:string}>}){
 const {lessonId}=await params;const query=await searchParams;const lesson=getLesson(lessonId);if(!lesson)return notFound();const student=getStudent(lesson.student);if(!student)return notFound();
 const max=Math.max(1,lesson.learningPoints.length);const raw=Number(query.objective);const objectiveId=Number.isFinite(raw)?Math.min(max,Math.max(1,Math.round(raw))):1;
 return <main className={`wrap lessonJourney ${student.slug==='salma'?'themeSalma':'themeSama'}`}><section className="card aiFirstLessonShell teacherMissionCard"><div className="kidPhaseBadge">🧠 جولة تثبيت</div><h1>{lesson.title}</h1><p className="kidShortLead">فكرة قصيرة من درس سابق. جربي استرجاعها من ذاكرتك، ثم نكمل يومك.</p><TargetedRecheck lesson={lesson} studentSlug={student.slug} objectiveIdOverride={objectiveId} mode="retention"/></section></main>;
}