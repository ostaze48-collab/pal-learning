import Link from 'next/link';
import {students} from '../lib/data';

export default function Home(){
 return <main className="shell"><div className="wrap">
   <div className="top"><div className="brand">تعلم سلمى وسما</div><Link className="btn secondary" href="/parent">لوحة الأب 🔒</Link></div>
   <section className="hero"><span className="tag">الفصل الأول · الرزم التعليمية الفلسطينية</span><h1>من سيتعلم الآن؟</h1><p className="muted">منصة منزلية بسيطة نطوّرها درسًا بعد درس لسلمى وسما.</p></section>
   <section className="grid">{students.map(s=><div className="card student" key={s.slug}><div className="avatar">{s.emoji}</div><div><h2 style={{margin:'0 0 6px'}}>{s.name}</h2><div className="muted">الصف {s.grade===5?'الخامس':'السابع'} · الفصل الأول</div></div><div className="subjects"><div className="subject"><strong>📘 الرياضيات</strong><div className="muted" style={{fontSize:12,marginTop:4}}>بدأنا الإنتاج</div></div><div className="subject"><strong>📗 العلوم</strong><div className="muted" style={{fontSize:12,marginTop:4}}>قريبًا</div></div><div className="subject"><strong>📕 العربية</strong><div className="muted" style={{fontSize:12,marginTop:4}}>قريبًا</div></div><div className="subject"><strong>📙 English</strong><div className="muted" style={{fontSize:12,marginTop:4}}>قريبًا</div></div></div><Link className="btn" href={`/student/${s.slug}`}>ابدئي التعلم</Link></div>)}</section>
 </div></main>
}
