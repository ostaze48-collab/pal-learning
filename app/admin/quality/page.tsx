import Link from 'next/link';
import {lessons} from '../../../lib/data';
import {auditCurriculum} from '../../../lib/lessonQualityGate';
import styles from './QualityDashboard.module.css';

function subjectLabel(subject:string){return subject==='English'?'English':subject}
function interactionLabel(kind:string){const labels:Record<string,string>={choice:'اختيار',short_text:'تفسير/كتابة',match:'مطابقة وتصنيف',order:'ترتيب',error_fix:'تصحيح خطأ',experiment_choice:'استنتاج من تجربة'};return labels[kind]||kind}

export default function QualityDashboard(){
 const audit=auditCurriculum(lessons);
 const byLesson=new Map(lessons.map(l=>[l.id,l]));
 const blocked=audit.lessons.filter(x=>!x.ready);
 const warnings=audit.lessons.filter(x=>x.ready&&x.issues.length>0);
 const clean=audit.lessons.filter(x=>x.ready&&x.issues.length===0);
 const learningRows=audit.lessons.filter(x=>x.kind==='learning');
 const totalObjectives=learningRows.reduce((s,x)=>s+x.objectiveCount,0);
 const directEvidence=learningRows.reduce((s,x)=>s+x.directEvidenceObjectives,0);
 const evidenceCoverage=totalObjectives?Math.round(directEvidence/totalObjectives*100):0;
 const richCoverage=audit.learningLessons?Math.round(audit.lessonsWithRichInteractions/audit.learningLessons*100):0;
 const sorted=[...audit.lessons].sort((a,b)=>Number(a.ready)-Number(b.ready)||a.teachingBlueprintPercent-b.teachingBlueprintPercent||a.fadedApplicationObjectivePercent-b.fadedApplicationObjectivePercent||a.interactiveTeachingPercent-b.interactiveTeachingPercent||a.score-b.score);
 const interactionRows=Object.entries(audit.interactionCoverage).sort((a,b)=>b[1]-a[1]);
 return <main className={styles.page}><div className={styles.wrap}>
  <header className={styles.head}><div><span className={styles.tag}>لوحة الإدارة · جودة المحتوى</span><h1>هل كل درس يعلّم ويقيس ما يجب؟</h1><p>أولوية الجودة تبدأ من الشرح الإبداعي الكامل، ثم التمثيل والتجربة، ثم محاولة الطالبة بمساندة أقل، وبعدها دليل التعلم والقياس.</p></div><div className={styles.note}>آخر تدقيق: {new Date(audit.generatedAt).toLocaleString('ar')}</div></header>
  <section className={styles.summary}>
   <div className={styles.metric}><strong>{audit.teachingBlueprintObjectiveCoverage}%</strong><span>الأهداف ذات شرح مخصص</span></div>
   <div className={styles.metric}><strong>{audit.interactiveTeachingSceneCoverage}%</strong><span>مشاهد الشرح ذات نموذج/تفاعل فعلي</span></div>
   <div className={styles.metric}><strong>{audit.fadedApplicationObjectiveCoverage}%</strong><span>الأهداف التي تصل لتطبيق بمساندة متلاشية</span></div>
   <div className={styles.metric}><strong>{evidenceCoverage}%</strong><span>الأهداف ذات دليل تحقق مباشر</span></div>
   <div className={styles.metric}><strong>{richCoverage}%</strong><span>دروس تستخدم أدلة تفاعلية غنية</span></div>
  </section>
  <section className={styles.panel}>
   <div className={styles.sectionTitle}><h2>جودة الشرح أولًا</h2><span className={styles.tag}>{audit.lessonsWithTeachingBlueprint} من {audit.learningLessons} درس بدأ يحصل على Blueprint مخصص</span></div>
   <div className={styles.bar}><span style={{width:`${audit.teachingBlueprintObjectiveCoverage}%`}}/></div>
   <div className={styles.filters}><span className={styles.pill}>🎬 Blueprint للأهداف · {audit.teachingBlueprintObjectiveCoverage}%</span><span className={styles.pill}>🧩 مشاهد بصرية/تفاعلية · {audit.interactiveTeachingSceneCoverage}%</span><span className={styles.pill}>🚀 تطبيق متلاشي الدعم · {audit.fadedApplicationObjectiveCoverage}%</span></div>
   <p className={styles.note}>التفاعل ليس هدفًا شكليًا. نميّز الآن بين مشهد يوضّح الفكرة، ومشهد تستكشف فيه الطالبة، ثم تطبيق تحاول فيه أولًا قبل استخدام الأداة للتحقق.</p>
  </section>
  <section className={styles.panel}>
   <div className={styles.sectionTitle}><h2>صحة دروس التعلم</h2><span className={styles.tag}>متوسط الجودة {audit.averageScore}%</span></div>
   <div className={styles.bar}><span style={{width:`${audit.averageScore}%`}}/></div>
   <div className={styles.filters}><span className={styles.pill}>⛔ محجوب {blocked.length}</span><span className={styles.pill}>⚠️ يحتاج تطوير {warnings.length}</span><span className={styles.pill}>✅ نظيف {clean.length}</span><span className={styles.pill}>🎯 اختبارات مستقلة {audit.assessments}</span></div>
   <p className={styles.note}>اختبارات الوحدة لا تدخل في متوسط جودة الشرح. الدرس الذي لا يملك شرحًا مخصصًا يظهر كمهمة تطوير حتى لو كانت أسئلته جيدة.</p>
  </section>
  <section className={styles.panel}>
   <div className={styles.sectionTitle}><h2>تنوع أدلة التعلم</h2><span className={styles.note}>بعد اكتمال الشرح</span></div>
   <div className={styles.filters}>{interactionRows.map(([kind,count])=><span className={styles.pill} key={kind}>{interactionLabel(kind)} · {count}</span>)}</div>
   <p className={styles.note}>الهدف ليس استخدام كل الأنواع في كل درس، بل اختيار الدليل الأنسب لطبيعة المهارة ومنع الاعتماد المفرط على الاختيار من متعدد.</p>
  </section>
  <section className={styles.panel}>
   <div className={styles.sectionTitle}><h2>الدروس حسب أولوية التطوير</h2><span className={styles.note}>نقدّم الدروس التي ينقصها التطبيق المستقل أو التفاعل الهادف</span></div>
   <div className={styles.table}>{sorted.map(row=>{const lesson=byLesson.get(row.lessonId);if(!lesson)return null;return <div className={styles.row} key={row.lessonId}>
    <div><Link href={`/lesson/${row.lessonId}`}><strong>{lesson.title}</strong></Link><div className={styles.subject}>{lesson.student==='salma'?'سلمى · صف 5':'سما · صف 7'} · {subjectLabel(lesson.subject)} · {row.kind==='assessment'?'اختبار':'درس تعلم'}</div></div>
    <div><span className={`${styles.status} ${!row.ready?styles.blocked:row.issues.length?styles.warning:styles.ready}`}>{!row.ready?'محجوب':row.issues.length?'تطوير':'جاهز'}</span></div>
    <div><strong>{row.kind==='learning'?`${row.teachingBlueprintPercent}%`:'—'}</strong><small> شرح مخصص</small><div className={styles.bar}><span style={{width:`${row.kind==='learning'?row.teachingBlueprintPercent:100}%`}}/></div></div>
    <div className={styles.issues}>{row.kind==='learning'&&<span className={styles.issue}>🧩 مشاهد تفاعلية {row.interactiveTeachingPercent}%</span>}{row.kind==='learning'&&<span className={styles.issue}>🚀 تطبيق متلاشي الدعم {row.fadedApplicationObjectivePercent}%</span>}{row.issues.length?row.issues.slice(0,3).map((issue,i)=><span className={styles.issue} key={`${issue.code}-${i}`}>{issue.severity==='blocker'?'⛔':'⚠️'} {issue.message}</span>):<span className={styles.issue}>✅ لا توجد ملاحظات حالية</span>}{row.kind==='learning'&&row.evidenceInteractions.map(kind=><span className={styles.issue} key={kind}>دليل: {interactionLabel(kind)}</span>)}</div>
   </div>})}</div>
  </section>
 </div></main>;
}