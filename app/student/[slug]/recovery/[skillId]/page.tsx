import Link from 'next/link';
import {getStudent} from '../../../../../lib/data';
import {getRecoverySkill} from '../../../../../lib/recoverySkills';
import RecoveryPractice from './RecoveryPractice';

export default async function RecoverySkillPage({params,searchParams}:{params:Promise<{slug:string;skillId:string}>;searchParams:Promise<{focus?:string;review?:string}>}){
 const {slug,skillId}=await params;const {focus,review}=await searchParams;
 const student=getStudent(slug);const skill=getRecoverySkill(skillId);
 if(!student||!skill)return <main className="wrap">اللعبة غير موجودة.</main>;
 const retentionMode=review==='1';
 return <main className={`studentJourney ${student.slug==='salma'?'themeSalma':'themeSama'}`}><div className="wrap journeyWrap">
  <header className="kidTopbar studentTopbar"><Link className="backBubble" href={`/student/${slug}/recovery`}>→ الألعاب القصيرة</Link><div className="journeyName"><span>{retentionMode?'🔄':'⚡'}</span><strong>{retentionMode?'جولة تذكّر':'لعبة قصيرة'}</strong></div><div className="studentMini">{student.emoji} {student.name}</div></header>
  <section className="welcomeQuest recoveryWelcome"><div className="welcomeCopy"><span className="questEyebrow">{retentionMode?'✨ نجرب من الذاكرة':'🎯 نلعب خطوة خطوة'}</span><h1>{skill.title}</h1><p>{retentionMode?'جربي أولًا من دون مساعدة. إذا احتجتِ، سنفتح لكِ تلميحًا صغيرًا.':'سؤال واحد في كل مرة، ومساعدة صغيرة عندما تحتاجينها.'}</p></div></section>
  <section className="recoveryGame recoveryPracticeShell"><RecoveryPractice slug={slug} skill={skill} focusId={focus} retentionMode={retentionMode}/></section>
 </div></main>;
}
