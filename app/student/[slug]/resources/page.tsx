import Link from 'next/link';
import {getStudent} from '../../../../lib/data';
import {getResourceBank} from '../../../../lib/resourceBank';

function resourceIcon(kind:string){return kind==='worksheet'?'✏️':kind==='summary'?'📝':'📘'}

export default async function ResourcesPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const student=getStudent(slug);if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;
 const resources=getResourceBank(student.grade).filter(r=>['current','worksheet','summary'].includes(r.kind));
 const groups=[['current','كتبي'],['worksheet','أوراق ألعب بها'],['summary','مراجعة سريعة']] as const;
 return <main className={`studentJourney ${student.slug==='salma'?'themeSalma':'themeSama'}`}><div className="wrap journeyWrap">
  <header className="kidTopbar studentTopbar"><Link className="backBubble" href={`/student/${slug}`}>→ رحلتي</Link><div className="journeyName"><span>📚</span><strong>مكتبتي</strong></div><div className="studentMini">{student.emoji} {student.name}</div></header>
  <section className="welcomeQuest libraryWelcome"><div className="welcomeCopy"><span className="questEyebrow">📖 عندما تحتاجين المصدر</span><h1>كتبي ومواد المراجعة</h1><p>افتحي الكتاب أو ورقة المراجعة عندما تريدين رؤية المصدر بنفسك.</p></div></section>
  <div className="childLibrary">{groups.map(([kind,title])=>{const items=resources.filter(r=>r.kind===kind);if(!items.length)return null;return <section className="libraryShelf" key={kind}><div className="libraryShelfTitle"><span>{resourceIcon(kind)}</span><h2>{title}</h2></div><div className="libraryGrid">{items.map(item=><a className="libraryBook" href={item.url} target="_blank" rel="noreferrer" key={item.id}><span className="libraryBookIcon">{resourceIcon(kind)}</span><div><strong>{item.title}</strong><p>{item.description}</p></div><b>↗</b></a>)}</div></section>})}</div>
 </div></main>;
}
