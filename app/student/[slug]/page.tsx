import Link from 'next/link';
import {getStudent,getStudentLessons} from '../../../lib/data';
import StudentProgress from './StudentProgress';

export default async function StudentPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const student=getStudent(slug); if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;
 const items=getStudentLessons(slug);
 return <main className="shell"><div className="wrap"><div className="top"><Link href="/" className="btn secondary">← الرئيسية</Link><div className="brand">{student.name}</div></div>
 <section className="card" style={{marginBottom:14}}><span className="tag">الصف {student.grade===5?'الخامس':'السابع'} · الفصل الأول</span><h1 style={{marginBottom:6}}>مرحبًا {student.name} {student.emoji}</h1><p className="muted">سنبدأ بالرياضيات، ثم نضيف بقية الرزم تدريجيًا.</p><StudentProgress lessonIds={items.map(i=>i.id)}/></section>
 <h2>رياضيات — دروسك</h2><div style={{display:'grid',gap:10}}>{items.map((l,i)=><div className="lesson" key={l.id}><div><div className="muted" style={{fontSize:12}}>{l.kind==='assessment'?'اختبار الوحدة':`الدرس ${items.slice(0,i+1).filter(x=>x.kind!=='assessment').length}`} · {l.minutes} دقيقة</div><h3 style={{margin:'4px 0'}}>{l.title}</h3><div className="muted">{l.summary}</div></div><Link className="btn" href={`/lesson/${l.id}`}>{l.kind==='assessment'?'ابدئي الاختبار':'ابدئي'}</Link></div>)}</div>
 </div></main>
}
