import Link from 'next/link';
import {getLesson,getStudent} from '../../../lib/data';
import LessonPlayer from './LessonPlayer';

export default async function LessonPage({params}:{params:Promise<{lessonId:string}>}){
 const {lessonId}=await params; const lesson=getLesson(lessonId); if(!lesson)return <main className="wrap">الدرس غير موجود.</main>;
 const student=getStudent(lesson.student)!;
 return <main className="shell"><div className="wrap"><div className="top"><Link className="btn secondary" href={`/student/${student.slug}`}>← دروس {student.name}</Link><div className="brand">{lesson.subject}</div></div><span className="tag">{student.name} · الصف {student.grade}</span><h1>{lesson.title}</h1><p className="muted">{lesson.summary}</p><LessonPlayer lesson={lesson}/></div></main>
}
