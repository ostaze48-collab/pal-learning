import Link from 'next/link';
import {getStudent} from '../../../../../../lib/data';
import {getDeepDiagnostic,getApplicableSubskills} from '../../../../../../lib/deepDiagnostics';
import DeepDiagnosticPlayer from './DeepDiagnosticPlayer';

export default async function DeepDiagnosticPage({params}:{params:Promise<{slug:string;skillId:string}>}){
  const {slug,skillId}=await params;
  const student=getStudent(slug);
  const diagnostic=getDeepDiagnostic(skillId);
  if(!student||!diagnostic)return <main className="wrap">اللعبة غير موجودة.</main>;
  const subskills=getApplicableSubskills(skillId,student.grade);
  return <main className={`studentJourney ${student.slug==='salma'?'themeSalma':'themeSama'}`}><div className="wrap journeyWrap">
    <header className="kidTopbar studentTopbar"><Link className="backBubble" href={`/student/${slug}/recovery`}>→ الألعاب القصيرة</Link><div className="journeyName"><span>🧩</span><strong>لعبة خطوة بخطوة</strong></div><div className="studentMini">{student.emoji} {student.name}</div></header>
    <section className="welcomeQuest recoveryWelcome"><div className="welcomeCopy"><span className="questEyebrow">✨ سؤال صغير ثم التالي</span><h1>{diagnostic.title}</h1><p>سنجرّب الفكرة بأكثر من شكل. إذا احتجتِ مساعدة، تظهر في اللحظة المناسبة فقط.</p></div></section>
    <DeepDiagnosticPlayer slug={slug} skillId={skillId} currentGrade={student.grade} subskills={subskills}/>
  </div></main>;
}
