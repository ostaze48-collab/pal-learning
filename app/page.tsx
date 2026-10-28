import Link from 'next/link';
import {lessons,students} from '../lib/data';

const subjectMeta=[
  ['الرياضيات','➗','أرقام وألغاز'],
  ['العلوم والحياة','🔬','اكتشاف وتجارب'],
  ['اللغة العربية','📚','قراءة ولغة'],
  ['English','🌍','Words & stories']
] as const;

export default function Home(){
 return <main className="kidHome"><div className="wrap homeWrap">
   <header className="kidTopbar">
     <div className="kidBrand"><span className="brandSpark">✦</span><span>رحلة سلمى وسما</span></div>
     <Link className="parentDoor" href="/parent">للأب 🔒</Link>
   </header>

   <section className="homeHero">
     <div className="heroStars" aria-hidden="true">✦　●　✧</div>
     <span className="heroPill">كل يوم خطوة صغيرة 🌱</span>
     <h1>من ستبدأ رحلتها الآن؟</h1>
     <p>اختاري بطاقتك، وسنأخذك مباشرة إلى مهمة اليوم. لا قوائم معقدة ولا خطوات كثيرة.</p>
   </section>

   <section className="kidProfiles">{students.map(s=>{
     const own=lessons.filter(l=>l.student===s.slug);
     const isSalma=s.slug==='salma';
     return <article className={`kidProfileCard ${isSalma?'salmaCard':'samaCard'}`} key={s.slug}>
       <div className="profileDecor" aria-hidden="true">{isSalma?'★ ✿ ★':'✦ ◇ ✦'}</div>
       <div className="profileTop">
         <div className="kidAvatar">{s.emoji}</div>
         <div><span className="gradePill">الصف {s.grade===5?'الخامس':'السابع'}</span><h2>{s.name}</h2><p>{isSalma?'مغامرة تعلم مرحة وواضحة':'مسار تعلم ذكي وسريع'}</p></div>
       </div>
       <div className="miniSubjects">{subjectMeta.map(([subject,icon,label])=>{
         const count=own.filter(l=>l.subject===subject&&l.kind!=='assessment').length;
         return <div className="miniSubject" key={subject}><span className="miniSubjectIcon">{icon}</span><div><strong>{subject}</strong><small>{label} · {count} درس</small></div></div>
       })}</div>
       <Link className="kidStartBtn" href={`/student/${s.slug}`}><span>{isSalma?'ابدئي مغامرتك':'ابدئي جلسة اليوم'}</span><b>←</b></Link>
     </article>
   })}</section>

   <div className="homePromise"><span>🎯</span><div><strong>مهمة واحدة في كل مرة</strong><p>المنصة تختار ما تحتاجينه اليوم وتخفي التعقيد في الخلفية.</p></div></div>
 </div></main>
}
