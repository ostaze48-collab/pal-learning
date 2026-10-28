'use client';
import Link from 'next/link';
import {useMemo,useState} from 'react';
import type {DeepSubskill} from '../../../../../../lib/deepDiagnostics';

export default function DeepDiagnosticPlayer({slug,skillId,currentGrade,subskills}:{slug:string;skillId:string;currentGrade:number;subskills:DeepSubskill[]}){
  const items=useMemo(()=>subskills.flatMap(sub=>sub.questions.map(q=>({sub,q}))),[subskills]);
  const [step,setStep]=useState(0);
  const [selected,setSelected]=useState<number|null>(null);
  const [answers,setAnswers]=useState<Record<string,boolean>>({});
  const [result,setResult]=useState<Record<string,number>|null>(null);
  const current=items[step];

  function choose(i:number){if(selected!==null)return;setSelected(i)}
  function next(){
    if(!current||selected===null)return;
    const nextAnswers={...answers,[current.q.id]:selected===current.q.correct};
    setAnswers(nextAnswers);
    if(step<items.length-1){setStep(v=>v+1);setSelected(null);return}

    const scores:Record<string,number>={};
    for(const sub of subskills){
      const correct=sub.questions.filter(q=>nextAnswers[q.id]).length;
      const pct=Math.round(correct/sub.questions.length*100);
      scores[sub.id]=pct;
      localStorage.setItem(`recoveryDeep:${slug}:${skillId}:${sub.id}`,String(pct));
    }
    const average=Math.round(Object.values(scores).reduce((a,b)=>a+b,0)/Math.max(1,Object.values(scores).length));
    localStorage.setItem(`recovery:${slug}:${skillId}`,String(average));
    const weak=subskills.map(sub=>({id:sub.id,title:sub.title,gradeAnchor:sub.gradeAnchor,score:scores[sub.id],treatmentSteps:sub.treatmentSteps})).filter(x=>x.score<80).sort((a,b)=>a.score-b.score);
    const plan={skillId,updatedAt:new Date().toISOString(),average,weak};
    localStorage.setItem(`recoveryPlan:${slug}:${skillId}`,JSON.stringify(plan));
    setResult(scores);
  }

  if(result){
    const ranked=subskills.map(sub=>({sub,score:result[sub.id]??0})).sort((a,b)=>a.score-b.score);
    const weak=ranked.filter(x=>x.score<80);
    return <section className="card" style={{marginTop:18}}>
      <span className="tag">خريطة دقيقة للمهارة</span>
      <h2>الآن نعرف أين الفجوة بالضبط</h2>
      <p className="muted">لن يعيد النظام كل المجال. سيعالج فقط الأجزاء التي ظهرت أقل من 80% ثم يعيد فحصها.</p>
      <div className="recoverySkillGrid" style={{marginTop:16}}>{ranked.map(({sub,score})=><div className={`recoverySkill ${score>=80?'good':score>=50?'mid':'weak'}`} key={sub.id}>
        <div className="subjectStatTop"><strong>{sub.title}</strong><span>{score}%</span></div>
        <div className="progress"><span style={{width:`${score}%`}}/></div>
        <p><b>المرجع المتوقع:</b> {sub.gradeAnchor}</p>
        {score<80?<>
          <div className="deepTreatmentSteps"><strong>خطة العلاج:</strong><ol>{sub.treatmentSteps.map(x=><li key={x}>{x}</li>)}</ol></div>
          <Link className="btn" href={`/student/${slug}/recovery/${skillId}?focus=${encodeURIComponent(sub.id)}`}>ابدأ علاج {sub.title}</Link>
        </>:<span className="tag">متقنة</span>}
      </div>)}</div>
      <div className={weak.length?'activityHint':'activitySuccess'} style={{marginTop:16}}><strong>{weak.length?`وجدنا ${weak.length} فجوات فرعية تحتاج تثبيتًا`:'الأساس متقن جيدًا ✅'}</strong><p>{weak.length?'ستظهر أضعف فجوة في خطة اليوم كجلسة قصيرة، ثم نعود للصف الحالي.':'يمكن مواصلة الصف الحالي دون جلسة استدراك إضافية في هذه المهارة.'}</p></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:14}}><Link className="btn secondary" href={`/student/${slug}/recovery`}>العودة لخريطة الفجوات</Link><Link className="btn" href={`/student/${slug}`}>العودة لخطة اليوم</Link></div>
    </section>;
  }

  if(!current)return <section className="card" style={{marginTop:18}}>لا توجد أسئلة تشخيصية مناسبة لهذا المستوى.</section>;
  return <section className="card" style={{marginTop:18}}>
    <div className="subjectHeader"><div><span className="tag">{current.sub.gradeAnchor}</span><h2 style={{margin:'8px 0 0'}}>{current.sub.title}</h2></div><span className="tag">{step+1}/{items.length}</span></div>
    <div className="progress" style={{margin:'14px 0 22px'}}><span style={{width:`${((step+1)/items.length)*100}%`}}/></div>
    <p className="muted">نقيس الآن: {current.sub.why}</p>
    <h2>{current.q.text}</h2>
    <div className="choice">{current.q.options.map((o,i)=>{const cls=selected===null?'option':i===current.q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>
    {selected!==null&&<div style={{marginTop:16}}><div className={selected===current.q.correct?'activitySuccess':'activityHint'}><strong>{selected===current.q.correct?'صحيح ✅':'هذه إشارة تشخيصية مفيدة'}</strong><p>{current.q.explanation}</p></div><button className="btn" onClick={next}>{step===items.length-1?'اعرض خريطة المهارات':'السؤال التالي'}</button></div>}
  </section>;
}
