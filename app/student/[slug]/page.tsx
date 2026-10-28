import Link from 'next/link';
import {getStudent,getStudentLessons,getLessonUnit} from '../../../lib/data';
import StudentProgress from './StudentProgress';
import SubjectProgressMini from './SubjectProgressMini';
import DailyPlan from './DailyPlan';
import SubjectUnitJourney from './SubjectUnitJourney';

const subjectInfo:Record<string,{icon:string,label:string,desc:string,tone:string}>={
  'الرياضيات':{icon:'➗',label:'الرياضيات',desc:'ألغاز وأرقام وحركة',tone:'subjectColor1'},
  'العلوم والحياة':{icon:'🔬',label:'العلوم',desc:'تجارب واكتشافات',tone:'subjectColor2'},
  'اللغة العربية':{icon:'📚',label:'العربية',desc:'قصص وكلمات ومعنى',tone:'subjectColor3'},
  'English':{icon:'🌍',label:'English',desc:'Words, stories and play',tone:'subjectColor4'}
};

export default async function StudentPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const student=getStudent(slug);if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;
  const items=getStudentLessons(slug);const subjects=items.reduce<Record<string,typeof items>>((acc,lesson)=>{(acc[lesson.subject]??=[]).push(lesson);return acc;},{});const subjectEntries=Object.entries(subjects);const isSalma=student.slug==='salma';
  return <main className={`studentJourney ${isSalma?'themeSalma':'themeSama'}`}><div className="wrap journeyWrap">
    <style>{`
      .studentJourney .welcomeQuest{max-width:980px;margin:8px auto 18px;box-shadow:none!important}
      .studentJourney .dailyPlan{max-width:980px;margin-inline:auto}
      .studentJourney .subjectPickerSection{max-width:980px;margin:30px auto 0}
      .studentJourney .subjectPicker{grid-template-columns:repeat(4,minmax(0,1fr))!important}
      .studentJourney .subjectPickCard{min-height:150px;align-content:center;box-shadow:none!important;transition:transform .15s ease}
      .studentJourney .subjectPickCard:active{transform:scale(.98)}
      .studentJourney .subjectPickIcon{font-size:38px!important}
      .studentJourney .kidUtilityRow{max-width:620px;margin:18px auto 30px;grid-template-columns:repeat(2,1fr)!important}
      .studentJourney .kidLearningMain{max-width:980px;margin-inline:auto}
      @media(max-width:800px){.studentJourney .subjectPicker{grid-template-columns:repeat(2,minmax(0,1fr))!important}.studentJourney .welcomeQuest{padding:20px!important}.studentJourney .welcomeQuest h1{font-size:32px!important}.studentJourney .journeyWrap{width:min(100% - 18px,980px)!important}}
      @media(max-width:430px){.studentJourney .subjectPicker{gap:10px!important}.studentJourney .subjectPickCard{min-height:132px;padding:15px!important}.studentJourney .kidUtilityRow{grid-template-columns:1fr 1fr!important;gap:9px}.studentJourney .welcomeCopy p{font-size:14px!important}.studentJourney .sectionTitleKid p{display:none}}
    `}</style>
    <header className="kidTopbar studentTopbar"><Link href="/" className="backBubble">→ الرئيسية</Link><div className="journeyName"><span>{student.emoji}</span><strong>{student.name}</strong></div><Link href={`/student/${slug}/practice`} className="practiceBubble">🎯 تدريب</Link></header>

    <section className="welcomeQuest"><div className="welcomeCopy"><span className="questEyebrow">{isSalma?'مغامرتك اليوم ✨':'رحلتك اليوم ✦'}</span><h1>{isSalma?`هيا يا ${student.name}! 🌈`:`جاهزة يا ${student.name}؟`}</h1><p>{isSalma?'مهمة واحدة أولًا، ثم نرى إلى أين تقودنا المغامرة.':'ابدئي بالمهمة التالية، وخذي كل فكرة خطوة واحدة في كل مرة.'}</p></div><div className="progressBubble"><span>رحلتي</span><StudentProgress lessonIds={items.map(i=>i.id)}/></div></section>

    <DailyPlan lessons={items}/>

    <section className="subjectPickerSection"><div className="sectionTitleKid"><div><span>🗺️</span><h2>اختاري عالمًا</h2></div><p>كل مادة لها طريقتها الخاصة في الاكتشاف.</p></div><div className="subjectPicker">{subjectEntries.map(([subject,subjectLessons],subjectIndex)=>{const meta=subjectInfo[subject]??{icon:'📘',label:subject,desc:'اكتشفي وتعلمي',tone:'subjectColor1'};return <a className={`subjectPickCard ${meta.tone}`} href={`#subject-${subjectIndex}`} key={subject}><span className="subjectPickIcon">{meta.icon}</span><div className="subjectPickCopy"><strong>{meta.label}</strong><small>{meta.desc}</small><SubjectProgressMini lessonIds={subjectLessons.map(x=>x.id)}/></div></a>})}</div></section>

    <div className="kidUtilityRow"><Link href={`/student/${slug}/practice`}><span>🎯</span><strong>تحدٍ إضافي</strong><small>إذا أردتِ المزيد</small></Link><Link href={`/student/${slug}/resources`}><span>📖</span><strong>كتبي</strong><small>أفتح المصدر عند الحاجة</small></Link></div>

    <div className="learningMain kidLearningMain">{subjectEntries.map(([subject,subjectLessons],subjectIndex)=>{const units=subjectLessons.reduce<Record<string,typeof subjectLessons>>((acc,lesson)=>{const unit=getLessonUnit(lesson);(acc[unit]??=[]).push(lesson);return acc;},{});const unitEntries=Object.entries(units).map(([name,unitLessons])=>({name,lessons:unitLessons}));const meta=subjectInfo[subject]??{icon:'📘',label:subject,desc:'اكتشفي وتعلمي',tone:'subjectColor1'};return <section className={`subjectBlock kidSubjectBlock ${meta.tone}`} id={`subject-${subjectIndex}`} key={subject}><div className="subjectHeader kidSubjectHeader"><div><span className="subjectIcon">{meta.icon}</span><div><small>رحلة {meta.label}</small><h2>{meta.label}</h2></div></div><div className="subjectHeaderProgress"><SubjectProgressMini lessonIds={subjectLessons.map(x=>x.id)}/></div></div><SubjectUnitJourney units={unitEntries}/></section>})}</div>
  </div></main>;
}
