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
   .subjectWorldPage .worldPath{max-width:900px;margin-inline:auto}.subjectWorldPage .worldPathHead{display:flex;align-items:end;justify-content:space-between;gap:14px;margin:0 4px 16px}.subjectWorldPage .worldPathHead h2{margin:0;font-size:22px}.subjectWorldPage .worldPathHead span{font-size:12px;color:#71817d;font-weight:800}
   .subjectWorldPage .worldStationRoute{position:relative;display:grid;gap:16px;padding-inline-start:10px}
   .subjectWorldPage .worldStationRoute:before{content:"";position:absolute;inset-inline-start:31px;top:32px;bottom:32px;width:5px;border-radius:99px;background:linear-gradient(180deg,color-mix(in srgb,var(--subject) 46%,#fff),color-mix(in srgb,var(--subject) 12%,#fff));opacity:.85}
   .subjectWorldPage .worldStation{position:relative;border:0!important;background:transparent!important;box-shadow:none!important;padding:0!important;transition:opacity .18s ease,transform .18s ease}
   .subjectWorldPage .worldStationHead{position:relative;z-index:1;width:100%;display:grid!important;grid-template-columns:62px minmax(0,1fr) 38px;align-items:center;gap:14px;min-height:80px;padding:10px 12px!important;border:0!important;border-radius:25px!important;background:transparent!important;text-align:start;cursor:pointer}
   .subjectWorldPage .worldStationNode{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:#fff;border:4px solid color-mix(in srgb,var(--subject) 18%,#fff);color:var(--subject);font-size:18px;font-weight:1000;box-shadow:0 8px 22px rgba(35,57,52,.07)}
   .subjectWorldPage .worldStationCopy{min-width:0;display:grid;gap:2px}.subjectWorldPage .worldStationCopy small{font-size:10px;font-weight:1000;color:#7b8885}.subjectWorldPage .worldStationCopy strong{font-size:18px;line-height:1.35;color:#303a38}.subjectWorldPage .worldStationCopy>span{font-size:11px;color:#84908d;font-weight:800}
   .subjectWorldPage .worldStationAction{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#fff;color:var(--subject);font-weight:1000;box-shadow:0 5px 16px rgba(36,63,57,.06)}
   .subjectWorldPage .worldStation.current .worldStationHead{padding:16px!important;background:linear-gradient(135deg,var(--subject-soft,#eef6f3),#fff)!important;box-shadow:0 16px 38px color-mix(in srgb,var(--subject) 12%,transparent)}
   .subjectWorldPage .worldStation.current .worldStationNode{width:62px;height:62px;background:var(--subject);border-color:#fff;color:#fff;box-shadow:0 0 0 7px color-mix(in srgb,var(--subject) 13%,transparent),0 11px 26px color-mix(in srgb,var(--subject) 20%,transparent)}
   .subjectWorldPage .worldStation.current .worldStationCopy small{color:var(--subject)}.subjectWorldPage .worldStation.current .worldStationCopy strong{font-size:21px}
   .subjectWorldPage .worldStation.complete{opacity:.62}.subjectWorldPage .worldStation.complete .worldStationNode{background:color-mix(in srgb,var(--subject) 10%,#fff);color:var(--subject)}
   .subjectWorldPage .worldStation.upcoming{opacity:.58}.subjectWorldPage .worldStation.upcoming .worldStationNode{background:#fff;color:#9aa5a2;border-color:#e8edeb}.subjectWorldPage .worldStation.upcoming .worldStationAction{color:#9aa5a2}
   .subjectWorldPage .worldStationBody{position:relative;z-index:1;margin:2px 0 10px 76px;padding:15px 12px 8px;border-radius:24px;background:rgba(255,255,255,.78)}
   .subjectWorldPage .unitDisclosureIdentity,.subjectWorldPage .unitDisclosureMeta,.subjectWorldPage .unitNumber{display:none!important}
   @media(max-width:700px){.subjectWorldPage .subjectWorldWrap{width:min(100% - 18px,940px)!important}.subjectWorldPage .worldHero{grid-template-columns:68px 1fr;gap:12px;padding:14px;border-radius:25px;margin-top:4px}.subjectWorldPage .worldHero:before{font-size:31px;letter-spacing:7px;left:8px;bottom:2px}.subjectWorldPage .worldHeroIcon{width:68px;height:68px;border-radius:22px;font-size:36px}.subjectWorldPage .worldHeroCopy h1{font-size:27px;margin-bottom:2px}.subjectWorldPage .worldHeroCopy p{display:none}.subjectWorldPage .worldHeroCopy small{font-size:11px;margin-bottom:2px}.subjectWorldPage .worldProgress{grid-column:1/-1;min-width:0;padding:7px 10px;border-radius:15px}.subjectWorldPage .worldProgress>span{display:none}.subjectWorldPage .worldPathHead{align-items:center;margin-bottom:10px}.subjectWorldPage .worldPathHead h2{font-size:19px}.subjectWorldPage .worldPathHead span{font-size:10px}.subjectWorldPage .worldStationRoute{gap:11px;padding-inline-start:0}.subjectWorldPage .worldStationRoute:before{inset-inline-start:26px;width:4px;top:28px;bottom:28px}.subjectWorldPage .worldStationHead{grid-template-columns:52px minmax(0,1fr) 32px;gap:10px;min-height:64px;padding:7px 8px!important}.subjectWorldPage .worldStationNode{width:48px;height:48px;font-size:15px;border-width:3px}.subjectWorldPage .worldStationCopy strong{font-size:15px}.subjectWorldPage .worldStationCopy>span{font-size:10px}.subjectWorldPage .worldStationAction{width:31px;height:31px;font-size:13px}.subjectWorldPage .worldStation.current{opacity:1!important}.subjectWorldPage .worldStation.current .worldStationHead{padding:12px 10px!important;border-radius:23px!important}.subjectWorldPage .worldStation.current .worldStationNode{width:52px;height:52px;box-shadow:0 0 0 5px color-mix(in srgb,var(--subject) 12%,transparent),0 8px 20px color-mix(in srgb,var(--subject) 16%,transparent)}.subjectWorldPage .worldStation.current .worldStationCopy strong{font-size:18px}.subjectWorldPage .worldStation.complete{opacity:.5}.subjectWorldPage .worldStation.upcoming{opacity:.46}.subjectWorldPage .worldStationBody{margin-inline-start:58px;margin-inline-end:0;padding:10px 4px 4px;border-radius:20px;background:transparent}}
   @media(prefers-reduced-motion:reduce){.subjectWorldPage .worldStation{transition:none!important;transform:none!important}}
  `}</style>
  <header className="kidTopbar worldTopbar"><Link className="backBubble" href={`/student/${slug}`}>→ اليوم</Link><div className="journeyName"><span>{student.emoji}</span><strong>{student.name}</strong></div><span className="practiceBubble">{world.icon}</span></header>
  <section className="worldHero"><div className="worldHeroIcon">{world.icon}</div><div className="worldHeroCopy"><small>{world.cue}</small><h1>{world.label}</h1><p>{world.desc}</p></div><div className="worldProgress"><span>رحلتي في هذا العالم</span><SubjectProgressMini lessonIds={lessons.map(x=>x.id)}/></div></section>
  <section className="worldPath"><div className="worldPathHead"><h2>هيا نكمل</h2><span>المحطة الحالية هي الأوضح</span></div><SubjectUnitJourney units={unitEntries}/></section>
 </div><KidBottomNav slug={slug} active="today"/></main>;
}
