import Link from 'next/link';
import {getStudent} from '../../../../../lib/data';
import {getRecoverySkill} from '../../../../../lib/recoverySkills';
import RecoveryPractice from './RecoveryPractice';

export default async function RecoverySkillPage({params}:{params:Promise<{slug:string;skillId:string}>}){
 const {slug,skillId}=await params;
 const student=getStudent(slug);const skill=getRecoverySkill(skillId);
 if(!student||!skill)return <main className="wrap">المهارة غير موجودة.</main>;
 return <main className="shell"><div className="wrap">
  <div className="top"><Link className="btn secondary" href={`/student/${slug}/recovery`}>← خريطة الفجوات</Link><div className="brand">استدراك {student.name}</div></div>
  <section className="lessonDesktopLayout">
    <div className="lessonMainPane"><RecoveryPractice slug={slug} skill={skill}/></div>
    <aside className="lessonSidebar card"><div className="lessonSidebarSection"><span className="tag">مهارة سابقة</span><h2 style={{marginBottom:6}}>{skill.title}</h2><p className="muted">{skill.description}</p></div><div className="lessonSidebarSection"><strong>لماذا نعالجها؟</strong><p className="muted">{skill.whyItMatters}</p></div><div><strong>الهدف</strong><p className="muted">جلسة قصيرة ثم العودة مباشرة إلى دروس الصف الحالي.</p></div></aside>
  </section>
 </div></main>;
}
