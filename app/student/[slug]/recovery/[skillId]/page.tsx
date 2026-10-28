import Link from 'next/link';
import {getStudent} from '../../../../../lib/data';
import {getRecoverySkill} from '../../../../../lib/recoverySkills';
import {getOriginsForSkill} from '../../../../../lib/gradeRecoveryLadder';
import RecoveryPractice from './RecoveryPractice';

export default async function RecoverySkillPage({params,searchParams}:{params:Promise<{slug:string;skillId:string}>;searchParams:Promise<{focus?:string;review?:string}>}){
 const {slug,skillId}=await params;const {focus,review}=await searchParams;
 const student=getStudent(slug);const skill=getRecoverySkill(skillId);
 if(!student||!skill)return <main className="wrap">المهارة غير موجودة.</main>;
 const origins=getOriginsForSkill(skill.id,student.grade);
 const retentionMode=review==='1';
 return <main className="shell"><div className="wrap">
  <div className="top"><Link className="btn secondary" href={`/student/${slug}/recovery`}>← خريطة الفجوات</Link><div className="brand">{retentionMode?'مراجعة تثبيت':'استدراك'} {student.name}</div></div>
  <section className="lessonDesktopLayout">
    <div className="lessonMainPane"><RecoveryPractice slug={slug} skill={skill} focusId={focus} retentionMode={retentionMode}/></div>
    <aside className="lessonSidebar card"><div className="lessonSidebarSection"><span className="tag">{retentionMode?'تحقق من ثبات التعلم':'مهارة سابقة'}</span><h2 style={{marginBottom:6}}>{skill.title}</h2><p className="muted">{skill.description}</p></div><div className="lessonSidebarSection"><strong>{retentionMode?'لماذا نراجع دون شرح أولًا؟':'لماذا نعالجها؟'}</strong><p className="muted">{retentionMode?'حتى نقيس ما بقي في الذاكرة فعلًا بعد مرور الوقت. إذا تعثرتِ، نفتح العلاج مباشرة.':skill.whyItMatters}</p></div>{!retentionMode&&origins.length>0&&<div className="lessonSidebarSection"><strong>أين بُنيت هذه المهارة؟</strong><div className="originTimeline">{origins.map(x=><div key={`${x.grade}-${x.reason}`}><span>الصف {x.grade}</span><p>{x.reason}</p></div>)}</div></div>}<div><strong>الهدف</strong><p className="muted">{retentionMode?'تأكيد ثبات المهارة، ثم إبعادها عن خطة الاستدراك إذا بقيت متقنة.':`نعالج الجزء الناقص فقط في جلسة قصيرة ثم نعود مباشرة إلى الصف ${student.grade}.`}</p></div></aside>
  </section>
 </div></main>;
}
