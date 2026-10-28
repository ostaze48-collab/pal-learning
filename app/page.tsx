import Link from 'next/link';
import {lessons,students} from '../lib/data';
import InstallAppButton from './InstallAppButton';

export default function Home(){
 const subjectMeta=[['الرياضيات','📘'],['العلوم والحياة','🔬'],['اللغة العربية','📕'],['English','🔤']] as const;
 return <main className="shell"><div className="wrap">
   <div className="top"><div className="brand">تعلم سلمى وسما</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><InstallAppButton/><Link className="btn secondary" href="/parent">لوحة الأب 🔒</Link></div></div>
   <section className="hero"><span className="tag">الفصل الأول · الرزم التعليمية الفلسطينية</span><h1>من سيتعلم الآن؟</h1><p className="muted">تعلم يومي منظم لسلمى وسما: دروس، اختبارات، علاج للأخطاء، مراجعات متباعدة، ومتابعة للأب.</p></section>
   <section className="grid">{students.map(s=>{const own=lessons.filter(l=>l.student===s.slug);return <div className="card student" key={s.slug}><div className="avatar">{s.emoji}</div><div><h2 style={{margin:'0 0 6px'}}>{s.name}</h2><div className="muted">الصف {s.grade===5?'الخامس':'السابع'} · الفصل الأول</div></div><div className="subjects">{subjectMeta.map(([subject,icon])=>{const count=own.filter(l=>l.subject===subject&&l.kind!=='assessment').length;return <div className="subject" key={subject}><strong>{icon} {subject}</strong><div className="muted" style={{fontSize:12,marginTop:4}}>{count} درسًا متاحًا</div></div>})}</div><Link className="btn" href={`/student/${s.slug}`}>ابدئي التعلم</Link></div>})}</section>
 </div></main>
}
