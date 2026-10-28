import Link from 'next/link';
import {getStudent,getStudentLessons,getLessonUnit} from '../../../lib/data';
import StudentProgress from './StudentProgress';
import SubjectProgressMini from './SubjectProgressMini';
import DailyPlan from './DailyPlan';
import UnitLearningPath from './UnitLearningPath';
import RecoveryStatus from './RecoveryStatus';

const subjectInfo:Record<string,{icon:string,label:string,desc:string,tone:string}>={
  'الرياضيات':{icon:'➗',label:'الرياضيات',desc:'ألغاز وأرقام وخطوات ذكية',tone:'subjectColor1'},
  'العلوم والحياة':{icon:'🔬',label:'العلوم',desc:'اكتشفي كيف يعمل العالم',tone:'subjectColor2'},
  'اللغة العربية':{icon:'📚',label:'العربية',desc:'اقرئي واكتبي بثقة',tone:'subjectColor3'},
  'English':{icon:'🌍',label:'English',desc:'Words, stories and fun',tone:'subjectColor4'}
};

export default async function StudentPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const student=getStudent(slug);
  if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;

  const items=getStudentLessons(slug);
  const subjects=items.reduce<Record<string,typeof items>>((acc,lesson)=>{(acc[lesson.subject]??=[]).push(lesson);return acc;},{});
  const subjectEntries=Object.entries(subjects);
  const isSalma=student.slug==='salma';

  return <main className={`studentJourney ${isSalma?'themeSalma':'themeSama'}`}><div className="wrap journeyWrap">
    <header className="kidTopbar studentTopbar">
      <Link href="/" className="backBubble">→ الرئيسية</Link>
      <div className="journeyName"><span>{student.emoji}</span><strong>{student.name}</strong></div>
      <Link href={`/student/${slug}/practice`} className="practiceBubble">🎯 تدريب</Link>
    </header>

    <section className="welcomeQuest">
      <div className="welcomeCopy">
        <span className="questEyebrow">{isSalma?'مغامرتك اليوم ✨':'جلسة اليوم ✦'}</span>
        <h1>{isSalma?`هيا يا ${student.name}! 🌈`:`جاهزة يا ${student.name}؟`}</h1>
        <p>{isSalma?'سننجز مهمة صغيرة ثم نحتفل بتقدمك. اختاري خطوة واحدة فقط وابدئي.':'اختاري مهمتك التالية. المنصة ترتب لكِ الدرس والمراجعة والتدريب بدون تشتيت.'}</p>
      </div>
      <div className="progressBubble"><span>تقدمي</span><StudentProgress lessonIds={items.map(i=>i.id)}/></div>
    </section>

    <DailyPlan lessons={items}/>
    <RecoveryStatus slug={slug}/>

    <section className="subjectPickerSection">
      <div className="sectionTitleKid"><div><span>🧭</span><h2>اختاري مادة</h2></div><p>كل بطاقة تأخذك مباشرة إلى دروس المادة.</p></div>
      <div className="subjectPicker">{subjectEntries.map(([subject,subjectLessons],subjectIndex)=>{
        const meta=subjectInfo[subject]??{icon:'📘',label:subject,desc:'تعلم خطوة بخطوة',tone:'subjectColor1'};
        const lessonCount=subjectLessons.filter(x=>x.kind!=='assessment').length;
        return <a className={`subjectPickCard ${meta.tone}`} href={`#subject-${subjectIndex}`} key={subject}>
          <span className="subjectPickIcon">{meta.icon}</span><div className="subjectPickCopy"><strong>{meta.label}</strong><small>{meta.desc}</small><SubjectProgressMini lessonIds={subjectLessons.map(x=>x.id)}/></div><b className="subjectLessonCount">{lessonCount}</b>
        </a>
      })}</div>
    </section>

    <div className="kidUtilityRow">
      <Link href={`/student/${slug}/practice`}><span>🎯</span><strong>تحدي إضافي</strong><small>أسئلة متنوعة</small></Link>
      <Link href={`/student/${slug}/recovery`}><span>💪</span><strong>قوّي مهارتي</strong><small>تدريب يساعدني</small></Link>
      <Link href={`/student/${slug}/resources`}><span>📖</span><strong>كتبي ومصادري</strong><small>للمراجعة فقط</small></Link>
    </div>

    <div className="learningMain kidLearningMain">
      {subjectEntries.map(([subject,subjectLessons],subjectIndex)=>{
        const units=subjectLessons.reduce<Record<string,typeof subjectLessons>>((acc,lesson)=>{const unit=getLessonUnit(lesson);(acc[unit]??=[]).push(lesson);return acc;},{});
        const meta=subjectInfo[subject]??{icon:'📘',label:subject,desc:'تعلم خطوة بخطوة',tone:'subjectColor1'};
        return <section className={`subjectBlock kidSubjectBlock ${meta.tone}`} id={`subject-${subjectIndex}`} key={subject}>
          <div className="subjectHeader kidSubjectHeader"><div><span className="subjectIcon">{meta.icon}</span><div><small>مسار المادة</small><h2>{meta.label}</h2></div></div><div className="subjectHeaderProgress"><SubjectProgressMini lessonIds={subjectLessons.map(x=>x.id)}/><span className="lessonCountPill">{subjectLessons.filter(x=>x.kind!=='assessment').length} درس</span></div></div>
          <div className="unitStack">{Object.entries(units).map(([unit,unitLessons],unitIndex)=><section className="kidUnit" key={`${subject}-${unit}`}>
            <div className="unitTitle kidUnitTitle"><div><span className="unitNumber">{unitIndex+1}</span><strong>{unit}</strong></div><span>{unitLessons.filter(x=>x.kind!=='assessment').length} خطوات</span></div>
            <UnitLearningPath lessons={unitLessons}/>
          </section>)}</div>
        </section>
      })}
    </div>
  </div></main>;
}
