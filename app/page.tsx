import Link from 'next/link';
import {students} from '../lib/data';

const subjectMeta=[['➗','رياضيات'],['🔬','علوم'],['📚','عربي'],['🌍','English']] as const;

export default function Home(){
 return <main className="kidHome"><div className="wrap homeWrap">
   <header className="kidTopbar"><div className="kidBrand"><span className="brandSpark">✦</span><span>سما وسلمى</span></div><Link className="parentDoor" href="/parent">للكبار 🔒</Link></header>
   <section className="homeHero"><div className="heroStars" aria-hidden="true">✦　●　✧</div><span className="heroPill">جاهزة لمغامرة صغيرة؟ ✨</span><h1>من ستبدأ اليوم؟</h1><p>اختاري اسمك، ونكمل من حيث توقفتِ.</p></section>
   <section className="kidProfiles">{students.map(s=>{const isSalma=s.slug==='salma';return <article className={`kidProfileCard ${isSalma?'salmaCard':'samaCard'}`} key={s.slug}>
     <div className="profileDecor" aria-hidden="true">{isSalma?'★ ✿ ★':'✦ ◇ ✦'}</div>
     <div className="profileTop"><div className="kidAvatar">{s.emoji}</div><div><span className="gradePill">الصف {s.grade===5?'الخامس':'السابع'}</span><h2>{s.name}</h2><p>{isSalma?'اكتشفي، جربي، والعبِي بالفكرة':'اكتشفي الفكرة ثم استخدميها بطريقتك'}</p></div></div>
     <div className="miniSubjects">{subjectMeta.map(([icon,label])=><div className="miniSubject" key={label}><span className="miniSubjectIcon">{icon}</span><div><strong>{label}</strong></div></div>)}</div>
     <Link className="kidStartBtn" href={`/student/${s.slug}`}><span>أكمل رحلتي</span><b>←</b></Link>
   </article>})}</section>
   <div className="homePromise"><span>🌟</span><div><strong>خطوة واحدة كل مرة</strong><p>اكتشفي الفكرة، جربيها، ثم انتقلي للمغامرة التالية.</p></div></div>
 </div></main>
}
