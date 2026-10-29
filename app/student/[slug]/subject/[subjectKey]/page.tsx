import Link from 'next/link';
import {getLessonUnit,getStudent,getStudentLessons} from '../../../../../lib/data';
import SubjectProgressMini from '../../SubjectProgressMini';
import SubjectUnitJourney from '../../SubjectUnitJourney';
import KidBottomNav from '../../KidBottomNav';

const worlds:Record<string,{subject:string;icon:string;label:string;desc:string;tone:string;cue:string}>={
 math:{subject:'الرياضيات',icon:'➗',label:'عالم الرياضيات',desc:'نرى العلاقات، نحرك الأعداد، ثم نبني الطريقة بأنفسنا.',tone:'subjectColor1',cue:'ألغاز · أنماط · حركة'},
 science:{subject:'العلوم والحياة',icon:'🔬',label:'عالم العلوم',desc:'نلاحظ ونتوقع ونجرب، ثم نبحث عن الدليل الذي يفسر ما حدث.',tone:'subjectColor2',cue:'ملاحظة · تجربة · دليل'},
 arabic:{subject:'اللغة العربية',icon:'📚',label:'عالم العربية',desc:'نبدأ من المعنى والقصة، ثم نكتشف كيف تعمل الكلمات والتراكيب.',tone:'subjectColor3',cue:'قصة · معنى · كلمات'},
 english:{subject:'English',icon:'🌍',label:'English World',desc:'Start from meaning, notice the pattern, then use it in a new situation.',tone:'subjectColor4',cue:'Meaning · Notice · Use'}
};

export default async function SubjectWorldPage({params}:{params:Promise<{slug:string;subjectKey:string}>}){
 const {slug,subjectKey}=await params;const student=getStudent(slug);const world=worlds[subjectKey];
 if(!student||!world)return <main className="wrap">العالم غير موجود.</main>;
 const lessons=getStudentLessons(slug).filter(item=>item.subject===world.subject);
 const units=lessons.reduce<Record<string,typeof lessons>>((acc,lesson)=>{const unit=getLessonUnit(lesson);(acc[unit]??=[]).push(lesson);return acc;},{});
 const unitEntries=Object.entries(units).map(([name,unitLessons])=>({name,lessons:unitLessons}));const isSalma=student.slug==='salma';
 return <main className={`studentJourney subjectWorldPage ${isSalma?'themeSalma':'themeSama'} ${world.tone}`}><div className="wrap subjectWorldWrap">
  <style>{`
   .subjectWorldPage .subjectWorldWrap{max-width:940px;padding-bottom:92px}
   .subjectWorldPage .worldTopbar{max-width:900px;margin-inline:auto}
   .subjectWorldPage .worldHero{max-width:900px;margin:8px auto 20px;display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;padding:22px 24px;border-radius:30px;background:var(--subject-soft,#f1f7f5);overflow:hidden;position:relative}
   .subjectWorldPage .worldHeroIcon{width:88px;height:88px;border-radius:28px;display:grid;place-items:center;background:#fff;font-size:46px;box-shadow:0 12px 30px rgba(27,60,52,.08)}
   .subjectWorldPage .worldHeroCopy small{display:block;font-weight:900;color:#71817d;margin-bottom:4px}.subjectWorldPage .worldHeroCopy h1{font-size:clamp(28px,5vw,42px);margin:0 0 7px}.subjectWorldPage .worldHeroCopy p{margin:0;max-width:590px;line-height:1.7;color:#5e716c}
   .subjectWorldPage .worldProgress{min-width:150px;padding:12px 14px;border-radius:20px;background:rgba(255,255,255,.72)}.subjectWorldPage .worldProgress>span{display:block;font-size:11px;font-weight:900;color:#71817d;margin-bottom:5px}
   .subjectWorldPage .worldPath{max-width:900px;margin-inline:auto}.subjectWorldPage .worldPathHead{display:flex;align-items:end;justify-content:space-between;gap:14px;margin:0 4px 13px}.subjectWorldPage .worldPathHead h2{margin:0;font-size:22px}.subjectWorldPage .worldPathHead span{font-size:12px;color:#71817d;font-weight:800}
   @media(max-width:700px){.subjectWorldPage .subjectWorldWrap{width:min(100% - 18px,940px)!important}.subjectWorldPage .worldHero{grid-template-columns:64px 1fr;gap:12px;padding:16px;border-radius:25px;margin-top:4px}.subjectWorldPage .worldHeroIcon{width:64px;height:64px;border-radius:21px;font-size:34px}.subjectWorldPage .worldHeroCopy h1{font-size:27px}.subjectWorldPage .worldHeroCopy p{font-size:13px;line-height:1.55}.subjectWorldPage .worldProgress{grid-column:1/-1;min-width:0;padding:8px 11px;border-radius:16px}.subjectWorldPage .worldPathHead{align-items:center}.subjectWorldPage .worldPathHead h2{font-size:19px}.subjectWorldPage .worldPathHead span{font-size:11px}}
  `}</style>
  <header className="kidTopbar worldTopbar"><Link className="backBubble" href={`/student/${slug}`}>→ اليوم</Link><div className="journeyName"><span>{student.emoji}</span><strong>{student.name}</strong></div><span className="practiceBubble">{world.icon}</span></header>
  <section className="worldHero"><div className="worldHeroIcon">{world.icon}</div><div className="worldHeroCopy"><small>{world.cue}</small><h1>{world.label}</h1><p>{world.desc}</p></div><div className="worldProgress"><span>رحلتي في هذا العالم</span><SubjectProgressMini lessonIds={lessons.map(x=>x.id)}/></div></section>
  <section className="worldPath"><div className="worldPathHead"><h2>محطات الرحلة</h2><span>افتحي محطتك الحالية فقط</span></div><SubjectUnitJourney units={unitEntries}/></section>
 </div><KidBottomNav slug={slug} active="today"/></main>;
}
