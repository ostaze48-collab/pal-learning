import Link from 'next/link';
import {getStudent} from '../../../../lib/data';
import RecoveryScreening from './RecoveryScreening';

export default async function RecoveryPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const student=getStudent(slug);
  if(!student)return <main className="wrap">الطالبة غير موجودة.</main>;
  return <main className={`studentJourney ${student.slug==='salma'?'themeSalma':'themeSama'}`}><div className="wrap journeyWrap">
    <header className="kidTopbar studentTopbar"><Link className="backBubble" href={`/student/${slug}`}>→ رحلتي</Link><div className="journeyName"><span>⚡</span><strong>جولة تقوية</strong></div><div className="studentMini">{student.emoji} {student.name}</div></header>

    <section className="welcomeQuest recoveryWelcome">
      <div className="welcomeCopy"><span className="questEyebrow">✨ لعبة قصيرة</span><h1>نجرب كم سؤال ونرى ماذا نلعب بعد ذلك</h1><p>اختاري مادة واحدة. لا توجد درجات هنا؛ كل إجابة تساعدنا فقط في اختيار الجولة التالية المناسبة لكِ.</p></div>
      <div className="progressBubble"><span>القاعدة الوحيدة</span><strong style={{fontSize:18}}>سؤال واحد في كل مرة 🎯</strong></div>
    </section>

    <RecoveryScreening slug={slug}/>
  </div></main>;
}
