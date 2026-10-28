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
 const totalObjectives=audit.lessons.reduce((s,x)=>s+x.objectiveCount,0);
 const directEvidence=audit.lessons.reduce((s,x)=>s+x.directEvidenceObjectives,0);
 const coverage=totalObjectives?Math.round(directEvidence/totalObjectives*100):0;
 const richCoverage=lessons.length?Math.round(audit.lessonsWithRichInteractions/lessons.length*100):0;
 const sorted=[...audit.lessons].sort((a,b)=>Number(a.ready)-Number(b.ready)||a.score-b.score);
 const interactionRows=Object.entries(audit.interactionCoverage).sort((a,b)=>b[1]-a[1]);
 return <main className={styles.page}><div className={styles.wrap}>
  <header className={styles.head}><div><span className={styles.tag}>لوحة الإدارة · جودة المحتوى</span><h1>هل كل درس يعلّم ويقيس ما يجب؟</h1><p>هذه الشاشة داخلية. لا تظهر لسما أو سلمى.</p></div><div className={styles.note}>آخر تدقيق: {new Date(audit.generatedAt).toLocaleString('ar')}</div></header>
  <section className={styles.summary}>
   <div className={styles.metric}><strong>{lessons.length}</strong><span>إجمالي الدروس</span></div>
   <div className={styles.metric}><strong>{audit.ready}</strong><span>جاهزة من حيث بوابة الجودة</span></div>
   <div className={styles.metric}><strong>{coverage}%</strong><span>الأهداف ذات دليل مباشر</span></div>
   <div className={styles.metric}><strong>{richCoverage}%</strong><span>دروس تستخدم تفاعلًا أغنى من اختيار/كتابة</span></div>
  </section>
  <section className={styles.panel}>
   <div className={styles.sectionTitle}><h2>صحة المنهج الحالي</h2><span className={styles.tag}>متوسط الجودة {audit.averageScore}%</span></div>
   <div className={styles.bar}><span style={{width:`${audit.averageScore}%`}}/></div>
   <div className={styles.filters}><span className={styles.pill}>⛔ محجوب {blocked.length}</span><span className={styles.pill}>⚠️ جاهز مع ملاحظات {warnings.length}</span><span className={styles.pill}>✅ نظيف {clean.length}</span></div>
   <p className={styles.note}>الدرس المحجوب لا يعني أن الطفل فشل؛ يعني أن تصميم المحتوى نفسه يحتاج دليلًا أو مثالًا أو تغطية أفضل قبل أن نعتمد نتائجه بثقة.</p>
  </section>
  <section className={styles.panel}>
   <div className={styles.sectionTitle}><h2>تنوع أدلة التعلم</h2><span className={styles.note}>عدد الدروس التي تستخدم كل نوع</span></div>
   <div className={styles.filters}>{interactionRows.map(([kind,count])=><span className={styles.pill} key={kind}>{interactionLabel(kind)} · {count}</span>)}</div>
   <p className={styles.note}>الهدف ليس استخدام كل الأنواع في كل درس، بل اختيار الدليل الأنسب لطبيعة المهارة ومنع الاعتماد المفرط على الاختيار من متعدد.</p>
  </section>
  <section className={styles.panel}>
   <div className={styles.sectionTitle}><h2>الدروس حسب الأولوية</h2><span className={styles.note}>الأضعف يظهر أولًا</span></div>
   <div className={styles.table}>{sorted.map(row=>{const lesson=byLesson.get(row.lessonId);if(!lesson)return null;return <div className={styles.row} key={row.lessonId}>
    <div><Link href={`/lesson/${row.lessonId}`}><strong>{lesson.title}</strong></Link><div className={styles.subject}>{lesson.student==='salma'?'سلمى · صف 5':'سما · صف 7'} · {subjectLabel(lesson.subject)}</div></div>
    <div><span className={`${styles.status} ${!row.ready?styles.blocked:row.issues.length?styles.warning:styles.ready}`}>{!row.ready?'محجوب':row.issues.length?'ملاحظات':'جاهز'}</span></div>
    <div><strong>{row.score}%</strong><small> جودة</small><div className={styles.bar}><span style={{width:`${row.score}%`}}/></div></div>
    <div className={styles.issues}>{row.issues.length?row.issues.slice(0,4).map((issue,i)=><span className={styles.issue} key={`${issue.code}-${i}`}>{issue.severity==='blocker'?'⛔':'⚠️'} {issue.message}</span>):<span className={styles.issue}>✅ لا توجد ملاحظات حالية</span>}{row.evidenceInteractions.map(kind=><span className={styles.issue} key={kind}>تفاعل: {interactionLabel(kind)}</span>)}</div>
   </div>})}</div>
  </section>
 </div></main>;
}
