'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {DeepSubskill} from '../../../../../../lib/deepDiagnostics';
import {evaluateAdaptiveSubskill,shouldStartWithVerification,type AdaptiveEvidence,type AdaptiveResult} from '../../../../../../lib/adaptiveDiagnosticEngine';

type Mode='entry'|'verify'|'supported';

export default function DeepDiagnosticPlayer({slug,skillId,currentGrade,subskills}:{slug:string;skillId:string;currentGrade:number;subskills:DeepSubskill[]}){
  const [subIndex,setSubIndex]=useState(0);
  const [questionIndex,setQuestionIndex]=useState(0);
  const [mode,setMode]=useState<Mode>('entry');
  const [selected,setSelected]=useState<number|null>(null);
  const [evidence,setEvidence]=useState<AdaptiveEvidence[]>([]);
  const [results,setResults]=useState<Record<string,AdaptiveResult>>({});
  const [finished,setFinished]=useState(false);
  const [ready,setReady]=useState(false);
  const [priorScores,setPriorScores]=useState<Record<string,number>>({});
  const [startedAt,setStartedAt]=useState(Date.now());

  const sub=subskills[subIndex];
  const q=sub?.questions[questionIndex];

  useEffect(()=>{
    const prior:Record<string,number>={};
    for(const s of subskills){const raw=localStorage.getItem(`recoveryDeep:${slug}:${skillId}:${s.id}`);if(raw!==null)prior[s.id]=Number(raw)}
    setPriorScores(prior);setReady(true);
  },[slug,skillId,subskills]);

  useEffect(()=>{
    if(!ready||!sub)return;
    const startVerify=shouldStartWithVerification(priorScores[sub.id],sub.questions.length);
    setMode(startVerify?'verify':'entry');
    setQuestionIndex(startVerify?1:0);
    setSelected(null);setEvidence([]);setStartedAt(Date.now());
  },[subIndex,ready]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(i:number){if(selected!==null)return;setSelected(i)}

  function finalizeSubskill(nextEvidence:AdaptiveEvidence[]){
    if(!sub)return;
    const result=evaluateAdaptiveSubskill(sub,nextEvidence,priorScores[sub.id]);
    const nextResults={...results,[sub.id]:result};
    setResults(nextResults);
    localStorage.setItem(`recoveryDeep:${slug}:${skillId}:${sub.id}`,String(result.score));
    localStorage.setItem(`recoveryDeepResult:${slug}:${skillId}:${sub.id}`,JSON.stringify(result));
    if(subIndex<subskills.length-1){setSubIndex(v=>v+1);return}

    const scores=Object.fromEntries(subskills.map(s=>[s.id,nextResults[s.id]?.score??0]));
    const average=Math.round(Object.values(scores).reduce((a,b)=>a+b,0)/Math.max(1,Object.values(scores).length));
    localStorage.setItem(`recovery:${slug}:${skillId}`,String(average));
    const weak=subskills.map(s=>{
      const r=nextResults[s.id];
      return {id:s.id,title:s.title,gradeAnchor:s.gradeAnchor,score:r?.score??0,status:r?.status??'needs_verification',diagnosis:r?.label??'تحتاج تحقق',cause:r?.cause??'',nextAction:r?.nextAction??'',treatmentSteps:s.treatmentSteps};
    }).filter(x=>x.score<80).sort((a,b)=>a.score-b.score);
    const plan={skillId,updatedAt:new Date().toISOString(),average,adaptive:true,weak};
    localStorage.setItem(`recoveryPlan:${slug}:${skillId}`,JSON.stringify(plan));
    setFinished(true);
  }

  function next(){
    if(!sub||!q||selected===null)return;
    const correct=selected===q.correct;
    const ev:AdaptiveEvidence={questionId:q.id,correct,mode,responseMs:Math.max(300,Date.now()-startedAt)};
    const nextEvidence=[...evidence,ev];
    setEvidence(nextEvidence);

    // طالب/ة لديه إتقان سابق مرتفع: نبدأ بسؤال تحقق أصعب. إذا نجح ننهي بسرعة، وإذا أخفق نعود لسؤال الأساس.
    if(mode==='verify'&&evidence.length===0&&priorScores[sub.id]>=90){
      if(correct){finalizeSubskill(nextEvidence);return}
      setMode('entry');setQuestionIndex(0);setSelected(null);setStartedAt(Date.now());return;
    }

    // في المحاولة الأولى العادية: النجاح يقود للتحقق، والخطأ يقود لسؤال مدعوم مع تلميح تأسيسي.
    if(mode==='entry'&&sub.questions.length>1&&questionIndex===0){
      setMode(correct?'verify':'supported');setQuestionIndex(1);setSelected(null);setStartedAt(Date.now());return;
    }

    finalizeSubskill(nextEvidence);
  }

  if(!ready)return <section className="card" style={{marginTop:18}}>نجهز التشخيص المتكيف…</section>;

  if(finished){
    const ranked=subskills.map(s=>({sub:s,result:results[s.id]})).sort((a,b)=>(a.result?.score??0)-(b.result?.score??0));
    const weak=ranked.filter(x=>(x.result?.score??0)<80);
    return <section className="card" style={{marginTop:18}}>
      <span className="tag">خريطة تكيفية للمهارات</span>
      <h2>الآن نعرف مستوى الفجوة وسببها الأقرب</h2>
      <p className="muted">النظام لم يكتفِ بنسبة النجاح؛ قارن إجابة الأساس بسؤال التحقق وحدد هل المشكلة تأسيسية أم في التطبيق أو في ثبات الاستدعاء.</p>
      <div className="recoverySkillGrid" style={{marginTop:16}}>{ranked.map(({sub:s,result})=>{const score=result?.score??0;return <div className={`recoverySkill ${score>=80?'good':score>=50?'mid':'weak'}`} key={s.id}>
        <div className="subjectStatTop"><strong>{s.title}</strong><span>{score}%</span></div>
        <div className="progress"><span style={{width:`${score}%`}}/></div>
        <p><b>{result?.label}</b> · {s.gradeAnchor}</p>
        <div className="deepDiagnosis"><strong>السبب الأقرب:</strong><p>{result?.cause}</p></div>
        {score<80?<>
          <div className="deepTreatmentSteps"><strong>الخطوة التالية:</strong><p>{result?.nextAction}</p><ol>{s.treatmentSteps.map(x=><li key={x}>{x}</li>)}</ol></div>
          <Link className="btn" href={`/student/${slug}/recovery/${skillId}?focus=${encodeURIComponent(s.id)}`}>ابدأ علاج {s.title}</Link>
        </>:<span className="tag">متقنة — لا نعيدها</span>}
      </div>})}</div>
      <div className={weak.length?'activityHint':'activitySuccess'} style={{marginTop:16}}><strong>{weak.length?`وجدنا ${weak.length} نقاط دقيقة تحتاج تثبيتًا`:'الأساس متقن جيدًا ✅'}</strong><p>{weak.length?'ستدخل أضعف نقطة فقط إلى خطة اليوم، ثم يعاد التحقق منها بعد العلاج.':'نوفّر وقت الاستدراك ونواصل محتوى الصف الحالي.'}</p></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:14}}><Link className="btn secondary" href={`/student/${slug}/recovery`}>العودة لخريطة الفجوات</Link><Link className="btn" href={`/student/${slug}`}>العودة لخطة اليوم</Link></div>
    </section>;
  }

  if(!sub||!q)return <section className="card" style={{marginTop:18}}>لا توجد أسئلة تشخيصية مناسبة لهذا المستوى.</section>;
  const progress=Math.round(((subIndex+(mode==='verify'||mode==='supported'?0.65:0.25))/Math.max(1,subskills.length))*100);
  return <section className="card" style={{marginTop:18}}>
    <div className="subjectHeader"><div><span className="tag">{sub.gradeAnchor}</span><h2 style={{margin:'8px 0 0'}}>{sub.title}</h2></div><span className="tag">مهارة {subIndex+1}/{subskills.length}</span></div>
    <div className="progress" style={{margin:'14px 0 22px'}}><span style={{width:`${progress}%`}}/></div>
    {mode==='supported'&&<div className="adaptiveSupport"><strong>🔎 نرجع خطوة صغيرة لتحديد أصل المشكلة</strong><p>{sub.miniLesson}</p></div>}
    {mode==='verify'&&<div className="adaptiveVerify"><strong>⚡ سؤال تحقق</strong><span>نجحتِ في الخطوة السابقة؛ نتحقق الآن أن الفكرة ثابتة وليست مجرد تخمين.</span></div>}
    <p className="muted">نقيس الآن: {sub.why}</p>
    <h2>{q.text}</h2>
    <div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>
    {selected!==null&&<div style={{marginTop:16}}><div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'صحيح ✅':'هذه إشارة تشخيصية مفيدة'}</strong><p>{q.explanation}</p></div><button className="btn" onClick={next}>{subIndex===subskills.length-1&&(mode!=='entry'||sub.questions.length===1)?'اعرض الخريطة':'تابع التشخيص'}</button></div>}
  </section>;
}
