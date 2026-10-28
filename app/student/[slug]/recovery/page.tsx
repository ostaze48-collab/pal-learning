import Link from 'next/link';
import {getStudent} from '../../../../lib/data';
import {getAnchorsForStudent} from '../../../../lib/gradeRecoveryLadder';
import RecoveryScreening from './RecoveryScreening';

export default async function RecoveryPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const student=getStudent(slug);
  if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;
  const anchors=getAnchorsForStudent(student.grade);
  const grouped=anchors.reduce<Record<number,typeof anchors>>((acc,item)=>{(acc[item.grade]??=[]).push(item);return acc;},{});
  return <main className="shell"><div className="wrap">
    <div className="top"><Link className="btn secondary" href={`/student/${slug}`}>← العودة إلى {student.name}</Link><div className="brand">فحص الفجوات</div></div>
    <section className="card"><span className="tag">استدراك ذكي · مرتبط بالمنهاج السابق</span><h1>خريطة فجوات {student.name}</h1><p className="muted">هذا ليس اختبار نجاح أو رسوب. نبحث فقط عن المهارات السابقة التي تمنع التقدم الآن، ثم نعالجها في جلسات قصيرة ونعود إلى الصف {student.grade===5?'الخامس':'السابع'}.</p><div className="recoveryPolicy"><div><strong>75%</strong><span>من وقت التعلم للصف الحالي</span></div><div><strong>25%</strong><span>استدراك مرن حسب الحاجة</span></div><div><strong>≤ 12 دقيقة</strong><span>للجلسة العلاجية الواحدة</span></div></div></section>

    <section className="priorGradeLadder"><div className="subjectHeader"><div><span className="subjectIcon">🪜</span><div><h2>سلم المهارات من الصفوف السابقة</h2><div className="muted">يستخدمه النظام لتحديد أصل الفجوة، لا لإعادة الصف كاملًا.</div></div></div></div><div className="gradeAnchorGrid">{Object.entries(grouped).sort((a,b)=>Number(a[0])-Number(b[0])).map(([grade,items])=><div className="gradeAnchor" key={grade}><div className="gradeAnchorHead"><strong>الصف {grade}</strong><span>{items.length} مواد</span></div>{items.map(item=><a href={item.sourceUrl} target="_blank" rel="noreferrer" key={`${item.grade}-${item.subject}`}><b>{item.subject}</b><small>{item.title}</small><p>{item.skills.slice(0,5).join(' · ')}</p></a>)}</div>)}</div></section>

    <RecoveryScreening slug={slug}/>
  </div></main>;
}
