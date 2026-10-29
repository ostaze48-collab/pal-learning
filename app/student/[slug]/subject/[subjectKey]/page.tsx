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
 return <main className={`studentJourney subjectWorldPage world-${subjectKey} ${isSalma?'themeSalma':'themeSama'} ${world.tone}`}><div className="wrap subjectWorldWrap">
  <style>{`
   .subjectWorldPage.world-math{--subject:#7657de;--subject-soft:#f1eaff;--world-mark:'○  △  ×  □  +'}
   .subjectWorldPage.world-science{--subject:#0b9d8d;--subject-soft:#e6fbf7;--world-mark:'◌  ⚗  ◉  ✦'}
   .subjectWorldPage.world-arabic{--subject:#dc615b;--subject-soft:#fff0ed;--world-mark:'أ  ب  ت  ــ  ✎'}
   .subjectWorldPage.world-english{--subject:#277bd5;--subject-soft:#eaf4ff;--world-mark:'Hi!  A  ?  ✦'}
   .subjectWorldPage .subjectWorldWrap{max-width:940px;padding-bottom:92px}
   .subjectWorldPage .worldTopbar{max-width:900px;margin-inline:auto}
   .subjectWorldPage .worldHero{max-width:900px;margin:8px auto 20px;display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;padding:22px 24px;border-radius:30px;background:var(--subject-soft,#f1f7f5);overflow:hidden;position:relative}
   .subjectWorldPage .worldHero:before{content:var(--world-mark);position:absolute;left:18px;bottom:-10px;font-size:48px;font-weight:1000;letter-spacing:12px;color:var(--subject);opacity:.06;transform:rotate(-4deg);white-space:nowrap;pointer-events:none;direction:ltr}
   .subjectWorldPage .worldHero:after{content:"";position:absolute;width:170px;height:170px;border-radius:50%;inset:auto -55px -85px auto;background:color-mix(in srgb,var(--subject,#6d9c90) 10%,transparent);pointer-events:none}
   .subjectWorldPage .worldHeroIcon{width:88px;height:88px;border-radius:28px;display:grid;place-items:center;background:#fff;font-size:46px;box-shadow:0 12px 30px rgba(27,60,52,.08);position:relative;z-index:1}
   .subjectWorldPage .worldHeroCopy{position:relative;z-index:1}.subjectWorldPage .worldHeroCopy small{display:block;font-weight:900;color:#71817d;margin-bottom:4px}.subjectWorldPage .worldHeroCopy h1{font-size:clamp(28px,5vw,42px);margin:0 0 7px;color:color-mix(in srgb,var(--subject) 76%,#273633)}.subjectWorldPage .worldHeroCopy p{margin:0;max-width:590px;line-height:1.7;color:#5e716c}
   .subjectWorldPage .worldProgress{min-width:150px;padding:12px 14px;border-radius:20px;background:rgba(255,255,255,.72);position:relative;z-index:1}.subjectWorldPage .worldProgress>span{display:block;font-size:11px;font-weight:900;color:#71817d;margin-bottom:5px}
   .subjectWorldPage .worldPath{max-width:900px;margin-inline:auto}.subjectWorldPage .worldPathHead{display:flex;align-items:end;justify-content:space-between;gap:14px;margin:0 4px 13px}.subjectWorldPage .worldPathHead h2{margin:0;font-size:22px}.subjectWorldPage .worldPathHead span{font-size:12px;color:#71817d;font-weight:800}
   .subjectWorldPage .subjectUnitJourney{display:grid;gap:10px}.subjectWorldPage .unitDisclosure{transition:opacity .18s ease,transform .18s ease}.subjectWorldPage .unitDisclosure:not(.open){opacity:.68;transform:scale(.985)}.subjectWorldPage .unitDisclosure.open{opacity:1;transform:none}.subjectWorldPage .unitDisclosure.open .unitDisclosureHead{background:linear-gradient(135deg,var(--subject-soft,#eef6f3),#fff);box-shadow:0 10px 28px color-mix(in srgb,var(--subject,#527c72) 10%,transparent)}.subjectWorldPage .unitDisclosure:not(.open) .unitDisclosureHead{min-height:58px}.subjectWorldPage .unitDisclosure.complete:not(.open){opacity:.52}
   @media(max-width:700px){.subjectWorldPage .subjectWorldWrap{width:min(100% - 18px,940px)!important}.subjectWorldPage .worldHero{grid-template-columns:64px 1fr;gap:12px;padding:15px;border-radius:25px;margin-top:4px}.subjectWorldPage .worldHero:before{font-size:31px;letter-spacing:7px;left:8px;bottom:2px}.subjectWorldPage .worldHeroIcon{width:64px;height:64px;border-radius:21px;font-size:34px}.subjectWorldPage .worldHeroCopy h1{font-size:27px}.subjectWorldPage .worldHeroCopy p{font-size:13px;line-height:1.55}.subjectWorldPage .worldProgress{grid-column:1/-1;min-width:0;padding:8px 11px;border-radius:16px}.subjectWorldPage .worldPathHead{align-items:center;margin-bottom:9px}.subjectWorldPage .worldPathHead h2{font-size:19px}.subjectWorldPage .worldPathHead span{font-size:10px}.subjectWorldPage .unitDisclosure:not(.open){opacity:.58}.subjectWorldPage .unitDisclosure:not(.open) .unitDisclosureHead{min-height:52px;padding-block:8px!important}.subjectWorldPage .unitDisclosure.open{margin-block:4px 8px}.subjectWorldPage .unitDisclosure.open .unitDisclosureHead{border-radius:22px!important}}
   @media(prefers-reduced-motion:reduce){.subjectWorldPage .unitDisclosure{transition:none!important;transform:none!important}}
  `}</style>
  <header className="kidTopbar worldTopbar"><Link className="backBubble" href={`/student/${slug}`}>→ اليوم</Link><div className="journeyName"><span>{student.emoji}</span><strong>{student.name}</strong></div><span className="practiceBubble">{world.icon}</span></header>
  <section className="worldHero"><div className="worldHeroIcon">{world.icon}</div><div className="worldHeroCopy"><small>{world.cue}</small><h1>{world.label}</h1><p>{world.desc}</p></div><div className="worldProgress"><span>رحلتي في هذا العالم</span><SubjectProgressMini lessonIds={lessons.map(x=>x.id)}/></div></section>
  <section className="worldPath"><div className="worldPathHead"><h2>محطات الرحلة</h2><span>محطتك الحالية هي الأوضح</span></div><SubjectUnitJourney units={unitEntries}/></section>
 </div><KidBottomNav slug={slug} active="today"/></main>;
}
