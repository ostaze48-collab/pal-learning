import Link from 'next/link';
import {getStudent} from '../../../../lib/data';
import RecoveryScreening from './RecoveryScreening';

export default async function RecoveryPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const student=getStudent(slug);
  if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;
  return <main className="shell"><div className="wrap">
    <div className="top"><Link className="btn secondary" href={`/student/${slug}`}>← العودة إلى {student.name}</Link><div className="brand">فحص الفجوات</div></div>
    <section className="card"><span className="tag">استدراك ذكي · الصفوف السابقة</span><h1>خريطة فجوات {student.name}</h1><p className="muted">هذا ليس اختبار نجاح أو رسوب. نستخدم أسئلة قصيرة من المهارات الأساسية السابقة لتحديد ما يحتاج تثبيتًا فقط، ثم نعود مباشرة إلى محتوى الصف {student.grade===5?'الخامس':'السابع'}.</p><div className="recoveryPolicy"><div><strong>75%</strong><span>من وقت التعلم للصف الحالي</span></div><div><strong>25%</strong><span>استدراك مرن حسب الحاجة</span></div><div><strong>≤ 12 دقيقة</strong><span>للجلسة العلاجية الواحدة</span></div></div></section>
    <RecoveryScreening slug={slug}/>
  </div></main>;
}
