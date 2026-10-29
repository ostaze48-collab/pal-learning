import Link from 'next/link';
import {getStudent,getStudentLessons} from '../../../../lib/data';
import PracticeLab from './PracticeLab';

export default async function PracticePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const student=getStudent(slug);if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;
 const lessons=getStudentLessons(slug);
 const bank=lessons.flatMap(lesson=>lesson.questions.map(q=>({id:`${lesson.id}:${q.id}`,lessonId:lesson.id,lessonTitle:lesson.title,subject:lesson.subject,text:q.text,options:q.options,correct:q.correct,explanation:q.explanation})));
 return <main className={`studentJourney ${student.slug==='salma'?'themeSalma':'themeSama'}`}><div className="wrap journeyWrap">
   <header className="kidTopbar studentTopbar"><Link className="backBubble" href={`/student/${slug}`}>→ رحلتي</Link><div className="journeyName"><span>🎯</span><strong>تحدٍ إضافي</strong></div><div className="studentMini">{student.emoji} {student.name}</div></header>
   <section className="welcomeQuest practiceWelcome"><div className="welcomeCopy"><span className="questEyebrow">✨ اختاري عالمًا</span><h1>جولة أسئلة مرحة</h1><p>اختاري المادة وطول الجولة، ثم خذي سؤالًا واحدًا في كل مرة.</p></div></section>
   <PracticeLab slug={slug} bank={bank}/>
 </div></main>;
}
