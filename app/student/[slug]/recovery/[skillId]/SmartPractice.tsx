'use client';
import {useState} from 'react';

type Q={text:string;options:string[];correct:number;explanation:string};
type Mistake={text:string;selected:string;correct:string};

export default function SmartPractice({slug,skillId,subskillId,mistakes=[]}:{slug:string;skillId:string;subskillId:string;mistakes?:Mistake[]}){
  const [questions,setQuestions]=useState<Q[]>([]);const [loading,setLoading]=useState(false);const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [score,setScore]=useState(0);const [done,setDone]=useState(false);const [mode,setMode]=useState('');const [grounded,setGrounded]=useState(false);
  async function generate(){
    setLoading(true);setDone(false);setQuestions([]);setStep(0);setSelected(null);setScore(0);
    try{
      const res=await fetch('/api/adaptive-practice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,skillId,subskillId,mistakes,difficulty:'medium',count:5})});
      const data=await res.json();
      setQuestions(Array.isArray(data.questions)?data.questions:[]);setMode(data.mode||'');setGrounded(Boolean(data.grounded));
    }catch{setQuestions([])}finally{setLoading(false)}
  }
  function choose(i:number){if(selected!==null)return;setSelected(i)}
  function next(){if(selected===null)return;const gained=score+(selected===questions[step].correct?1:0);if(step===questions.length-1){setScore(gained);setDone(true);return}setScore(gained);setStep(v=>v+1);setSelected(null)}
  if(!questions.length)return <div className="smartPractice"><div><strong>✨ تدريب شخصي جديد</strong><p className="muted">ينشئ تمارين جديدة على نفس الفجوة بدل تكرار الأسئلة نفسها.</p></div><button className="btn secondary" disabled={loading} onClick={generate}>{loading?'أجهز التمارين…':'أنشئ 5 تمارين جديدة'}</button></div>;
  if(done){const pct=Math.round(score/questions.length*100);return <div className={pct>=80?'activitySuccess':'activityHint'}><strong>{pct>=80?'أداء قوي في التمرين الجديد ✅':'ما زلنا نحتاج قليلًا من التثبيت'}</strong><p>النتيجة {pct}% في أسئلة جديدة لم تُعرض في التشخيص الأصلي.</p><button className="btn secondary" onClick={generate}>مجموعة أخرى</button></div>}
  const q=questions[step];
  return <div className="smartPracticeQuiz"><div className="subjectStatTop"><span className="tag">تدريب شخصي {step+1}/{questions.length}</span><small className="muted">{grounded?'📚 مدعوم بقاعدة المنهاج':mode==='ai'?'AI + سياق المنهاج':'بنك ثابت احتياطي'}</small></div><h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button className={cls} key={`${o}-${i}`} onClick={()=>choose(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:14}}><div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'صحيح ✅':'نراجع هذه النقطة'}</strong><p>{q.explanation}</p></div><button className="btn" onClick={next}>{step===questions.length-1?'اعرض النتيجة':'التالي'}</button></div>}</div>;
}
