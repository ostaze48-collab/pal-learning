import Link from 'next/link';
import {getStudent} from '../../../../../lib/data';
import {getRecoverySkill} from '../../../../../lib/recoverySkills';
import {getOriginsForSkill} from '../../../../../lib/gradeRecoveryLadder';
import RecoveryPractice from './RecoveryPractice';

export default async function RecoverySkillPage({params}:{params:Promise<{slug:string;skillId:string}>}){
 const {slug,skillId}=await params;
 const student=getStudent(slug);const skill=getRecoverySkill(skillId);
 if(!student||!skill)return <main className="wrap">المهارة غير موجودة.</main>;
 const origins=getOriginsForSkill(skill.id,student.grade);
 return <main className="shell"><div className="wrap">
  <div className="top"><Link className="btn secondary" href={`/student/${slug}/recovery`}>← خريطة الفجوات</Link><div className="brand">استدراك {student.name}</div></div>
  <section className="lessonDesktopLayout">
    <div className="lessonMainPane"><RecoveryPractice slug={slug} skill={skill}/></div>
    <aside className="lessonSidebar card"><div className="lessonSidebarSection"><span className="tag">مهارة سابقة</span><h2 style={{marginBottom:6}}>{skill.title}</h2><p className="muted">{skill.description}</p></div><div className="lessonSidebarSection"><strong>لماذا نعالجها؟</strong><p className="muted">{skill.whyItMatters}</p></div>{origins.length>0&&<div className="lessonSidebarSection"><strong>أين بُنيت هذه المهارة؟</strong><div className="originTimeline">{origins.map(x=><div key={`${x.grade}-${x.reason}`}><span>الصف {x.grade}</span><p>{x.reason}</p></div>)}</div></div>}<div><strong>الهدف</strong><p className="muted">نعالج الجزء الناقص فقط في جلسة قصيرة ثم نعود مباشرة إلى الصف {student.grade}.</p></div></aside>
  </section>
 </div></main>;
}
