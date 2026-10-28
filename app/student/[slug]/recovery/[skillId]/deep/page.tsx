import Link from 'next/link';
import {getStudent} from '../../../../../../lib/data';
import {getDeepDiagnostic,getApplicableSubskills} from '../../../../../../lib/deepDiagnostics';
import DeepDiagnosticPlayer from './DeepDiagnosticPlayer';

export default async function DeepDiagnosticPage({params}:{params:Promise<{slug:string;skillId:string}>}){
  const {slug,skillId}=await params;
  const student=getStudent(slug);
  const diagnostic=getDeepDiagnostic(skillId);
  if(!student||!diagnostic)return <main className="wrap">التشخيص غير موجود.</main>;
  const subskills=getApplicableSubskills(skillId,student.grade);
  return <main className="shell"><div className="wrap">
    <div className="top"><Link className="btn secondary" href={`/student/${slug}/recovery`}>← خريطة الفجوات</Link><div className="brand">تشخيص دقيق</div></div>
    <section className="card"><span className="tag">تشخيص متفرع · {diagnostic.subject}</span><h1>{diagnostic.title}</h1><p className="muted">لن نعيد المهارة كلها. سنفحص الأجزاء الصغيرة التي تتكون منها، ثم نعالج فقط ما هو أقل من مستوى الإتقان.</p><div className="recoveryPolicy"><div><strong>{subskills.length}</strong><span>مهارات فرعية</span></div><div><strong>80%</strong><span>حد الإتقان</span></div><div><strong>قصير</strong><span>علاج مركز لكل فجوة</span></div></div></section>
    <DeepDiagnosticPlayer slug={slug} skillId={skillId} currentGrade={student.grade} subskills={subskills}/>
  </div></main>;
}
