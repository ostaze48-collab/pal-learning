import Link from 'next/link';
import {getStudent,getStudentLessons} from '../../../../lib/data';
import PracticeLab from './PracticeLab';

export default async function PracticePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const student=getStudent(slug);if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;
 const lessons=getStudentLessons(slug);
 const bank=lessons.flatMap(lesson=>lesson.questions.map(q=>({id:`${lesson.id}:${q.id}`,lessonId:lesson.id,lessonTitle:lesson.title,subject:lesson.subject,text:q.text,options:q.options,correct:q.correct,explanation:q.explanation})));
 return <main className="shell"><div className="wrap"><div className="top"><Link className="btn secondary" href={`/student/${slug}`}>← العودة إلى {student.name}</Link><div className="brand">مختبر التدريب</div></div><section className="card"><span className="tag">اختبارات وتدريب</span><h1>تدريب {student.name}</h1><p className="muted">اختاري المادة وعدد الأسئلة. الأسئلة الحالية مأخوذة من بنك الدروس الموجود داخل المنصة، ويمكن لاحقًا توسيع البنك بأوراق العمل والاختبارات الموثوقة بعد فهرستها.</p></section><PracticeLab slug={slug} bank={bank}/></div></main>;
}
