import Link from 'next/link';
import {getStudent} from '../../../../lib/data';
import {getResourceBank,resourceUsePolicy} from '../../../../lib/resourceBank';

export default async function ResourcesPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const student=getStudent(slug);if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;
 const resources=getResourceBank(student.grade);
 const groups=[['current','كتب ومنهج الصف الحالي'],['recovery','كتب ومراجع الصفوف السابقة'],['guide','أدلة المعلم'],['worksheet','أوراق العمل الرسمية'],['summary','الرزم التعليمية للطوارئ — ملخص فقط'],['framework','الإطار والوثائق الوطنية'],['external','اختبارات وشروح وحلول خارجية مساندة']] as const;
 return <main className="shell"><div className="wrap">
  <div className="top"><Link className="btn secondary" href={`/student/${slug}`}>← العودة إلى {student.name}</Link><div className="brand">بنك الموارد المنهجية</div></div>
  <section className="card"><span className="tag">الكتاب الوزاري أولًا</span><h1>مراجع {student.name} التعليمية</h1><p className="muted">الشرح والتعلم الموسع يعتمدان على كتاب الوزارة الرسمي. دليل المعلم يساعد في طريقة التدريس، وأوراق العمل والاختبارات للتدريب، أما الرزم التعليمية للطوارئ فهي ملخص حد أدنى للمراجعة فقط وليست أساس الشرح.</p><div className="resourcePolicy">{resourceUsePolicy.map(x=><div key={x.label}><strong>{x.label}</strong><span>{x.description}</span></div>)}</div></section>
  <div className="resourceGroups">{groups.map(([kind,title])=>{const items=resources.filter(r=>r.kind===kind);if(!items.length)return null;return <section className={`subjectBlock ${kind==='external'?'externalResourceBlock':''}`} key={kind}><div className="subjectHeader"><div><span className="subjectIcon">{kind==='external'?'🧪':kind==='summary'?'📝':'📚'}</span><h2>{title}</h2></div><span className="tag">{items.length} مصادر</span></div>{kind==='summary'&&<p className="muted">هذه الرزم مفيدة للمراجعة السريعة والحد الأدنى في ظروف الطوارئ، لكنها لا تستبدل كتاب الوزارة ولا تحدد عمق الشرح.</p>}{kind==='external'&&<p className="muted">هذه المصادر مساندة فقط. لا تُنسخ موادها تلقائيًا إلى قاعدة المعرفة الرسمية ولا ننسب إجاباتها للوزارة.</p>}<div className="resourceGrid">{items.map(item=><a className="resourceCard" href={item.url} target="_blank" rel="noreferrer" key={item.id}><div className="resourceCardTop"><strong>{item.title}</strong><span>{item.trust}</span></div><p>{item.description}</p><small>{item.gradeLabel}</small><b>فتح المصدر ↗</b></a>)}</div></section>})}</div>
 </div></main>;
}
