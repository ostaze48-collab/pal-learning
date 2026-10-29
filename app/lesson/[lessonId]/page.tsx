import Link from 'next/link';
import {getLesson,getStudent,getStudentLessons} from '../../../lib/data';
import {getTeachingScenes} from '../../../lib/teachingBlueprints';
import LessonRunner from './LessonRunner';
import ObjectiveCoverageBridge from './ObjectiveCoverageBridge';
import EvidenceStudio from './EvidenceStudio';

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
 const isAssessment=lesson.kind==='assessment';
 const subjectClass=subjectClasses[lesson.subject]??'subjectMath';
 const subjectIcon=subjectIcons[lesson.subject]??'📘';
 const hasFullBlueprint=!isAssessment&&lesson.learningPoints.length>0&&lesson.learningPoints.every((_,index)=>Boolean(getTeachingScenes(lesson,index)?.length));

 return <main className={`lessonJourney ${isSalma?'themeSalma':'themeSama'} ${subjectClass} ${hasFullBlueprint?'hasTeachingBlueprint':''}`}><div className="wrap lessonJourneyWrap">
  <style>{`
   .lessonJourney .kidLessonLayout{display:block!important;max-width:940px;margin-inline:auto}
   .lessonJourney .lessonMainPane{width:100%;min-width:0}
   .lessonJourney .goalCard{display:none!important}
   .lessonJourney .lessonMissionHead{max-width:860px;margin:10px auto 18px;display:block!important;text-align:center;padding:10px 8px!important;background:transparent!important;border:0!important;box-shadow:none!important}
   .lessonJourney .lessonMissionHead h1{margin:8px 0 7px;font-size:clamp(30px,6vw,48px);line-height:1.2}
   .lessonJourney .lessonMissionHead p{max-width:690px;margin:0 auto;color:#667773;line-height:1.8;font-size:15px}
   .lessonJourney .missionFacts{display:flex!important;justify-content:center;gap:8px;margin-top:12px}
   .lessonJourney .missionFacts>div{display:inline-flex!important;align-items:center;gap:6px;min-width:0!important;padding:7px 11px!important;border-radius:999px!important;background:var(--subject-soft,#f2f6f5)!important;border:0!important;box-shadow:none!important}
   .lessonJourney .missionFacts strong{font-size:13px!important}.lessonJourney .missionFacts small{font-size:12px!important}.lessonJourney .missionFacts span{font-size:15px!important}
   .lessonJourney .lessonTopbar{max-width:940px;margin-inline:auto}
   .lessonJourney .lessonNavKid{max-width:940px;margin-inline:auto}
   ${hasFullBlueprint?'.hasTeachingBlueprint .creativeLessonLab{display:none!important}':''}
   @media(max-width:700px){.lessonJourney .lessonJourneyWrap{width:min(100% - 18px,940px)!important}.lessonJourney .lessonMissionHead{margin-top:2px;padding-inline:4px!important}.lessonJourney .lessonMissionHead h1{font-size:30px}.lessonJourney .lessonMissionHead p{font-size:14px}.lessonJourney .missionFacts{margin-top:9px}.lessonJourney .lessonNavKid{margin-top:18px}.lessonJourney .lessonTopbar{margin-bottom:4px}}
  `}</style>
  {!isAssessment&&<ObjectiveCoverageBridge lesson={lesson}/>} 
  {!isAssessment&&<EvidenceStudio lesson={lesson}/>} 
  <header className="kidTopbar lessonTopbar"><Link className="backBubble" href={`/student/${student.slug}`}>→ دروسي</Link><div className="lessonTopTitle"><span>{subjectIcon}</span><strong>{lesson.subject}</strong></div><div className="studentMini">{student.emoji} {student.name}</div></header>

  <section className="lessonMissionHead">
    <div className="missionCopy"><span className="questEyebrow">{isAssessment?'🏆 تحدي صغير':'✨ هيا نكتشف'}</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></div>
    <div className="missionFacts"><div><span>⏱</span><strong>{lesson.minutes}</strong><small>دقائق تقريبًا</small></div>{isAssessment&&<div><span>🎯</span><strong>{lesson.questions.length}</strong><small>أسئلة</small></div>}</div>
  </section>

  <div className="kidLessonLayout">
    <section className="lessonMainPane"><LessonRunner lesson={lesson}/></section>
  </div>

  <nav className="lessonNavKid" aria-label="التنقل بين الدروس">
    {previous?<Link href={`/lesson/${previous.id}`}><span>→</span><div><small>السابق</small><strong>{previous.title}</strong></div></Link>:<span/>}
    {next&&<Link className="nextLessonLink" href={`/lesson/${next.id}`}><div><small>بعدها</small><strong>{next.title}</strong></div><span>←</span></Link>}
  </nav>
 </div></main>;
}
