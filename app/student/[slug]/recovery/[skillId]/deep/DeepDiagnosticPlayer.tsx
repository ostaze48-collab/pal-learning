'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {DeepSubskill} from '../../../../../../lib/deepDiagnostics';
import {evaluateAdaptiveSubskill,shouldStartWithVerification,type AdaptiveEvidence,type AdaptiveResult} from '../../../../../../lib/adaptiveDiagnosticEngine';

type Mode='entry'|'verify'|'supported';

export default function DeepDiagnosticPlayer({slug,skillId,currentGrade:_,subskills}:{slug:string;skillId:string;currentGrade:number;subskills:DeepSubskill[]}){
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
      return {id:s.id,title:s.title,gradeAnchor:s.gradeAnchor,score:r?.score??0,status:r?.status??'needs_verification',diagnosis:r?.label??'تحتاج تحقق',cause:r?.cause??'',nextAction:r?.nextAction??'',missedFacts:r?.missedFacts??[],treatmentSteps:s.treatmentSteps};
    }).filter(x=>x.score<80).sort((a,b)=>a.score-b.score);
    const plan={skillId,updatedAt:new Date().toISOString(),average,adaptive:true,weak};
    localStorage.setItem(`recoveryPlan:${slug}:${skillId}`,JSON.stringify(plan));
    setFinished(true);
  }

  function next(){
    if(!sub||!q||selected===null)return;
    const correct=selected===q.correct;
    const ev:AdaptiveEvidence={questionId:q.id,correct,mode,responseMs:Math.max(300,Date.now()-startedAt),selectedIndex:selected};
    const nextEvidence=[...evidence,ev];
    setEvidence(nextEvidence);

    if(mode==='verify'&&evidence.length===0&&priorScores[sub.id]>=90){
      if(correct){finalizeSubskill(nextEvidence);return}
      setMode('entry');setQuestionIndex(0);setSelected(null);setStartedAt(Date.now());return;
    }
    if(mode==='entry'&&sub.questions.length>1&&questionIndex===0){
      setMode(correct?'verify':'supported');setQuestionIndex(1);setSelected(null);setStartedAt(Date.now());return;
    }
    finalizeSubskill(nextEvidence);
  }

  if(!ready)return <section className="recoveryGame"><div className="muted">✨ أجهز الجولة…</div></section>;

  if(finished){
    const ranked=subskills.map(s=>({sub:s,result:results[s.id]})).sort((a,b)=>(a.result?.score??0)-(b.result?.score??0));
    const nextItem=ranked.find(x=>(x.result?.score??0)<80);
    return <section className="recoveryGame deepChildFinish">
      <div className="recoveryFinish">
       <div className="recoveryFinishIcon">{nextItem?'🧩':'🌟'}</div>
       <span className="questEyebrow">انتهت الجولة</span>
       <h3>{nextItem?'لدي لعبة صغيرة مناسبة لكِ الآن':'رائعة — نعود إلى رحلتك!'}</h3>
       <p>{nextItem?'سنرى هذه الفكرة بطريقة أبسط ثم نكمل.':'أنجزتِ هذه الجولة، ولا تحتاجين شيئًا إضافيًا هنا الآن.'}</p>
       {nextItem?<Link className="btn kidPrimaryAction" href={`/student/${slug}/recovery/${skillId}?focus=${encodeURIComponent(nextItem.sub.id)}`}>ابدئي اللعبة التالية ←</Link>:<Link className="btn kidPrimaryAction" href={`/student/${slug}`}>أكمل رحلتي ←</Link>}
       <Link className="recoveryBackLink" href={`/student/${slug}`}>أعود إلى خطتي</Link>
      </div>
    </section>;
  }

  if(!sub||!q)return <section className="recoveryGame"><div className="recoveryFinish"><div className="recoveryFinishIcon">🌟</div><h3>اكتملت الجولة</h3><Link className="btn kidPrimaryAction" href={`/student/${slug}`}>أكمل رحلتي ←</Link></div></section>;

  const progress=Math.round(((subIndex+(mode==='verify'||mode==='supported'?0.65:0.25))/Math.max(1,subskills.length))*100);
  return <section className="recoveryGame deepChildGame">
    <div className="recoveryGameTop"><div><span className="questEyebrow">🧩 جولة {subIndex+1} من {subskills.length}</span><h2>{mode==='supported'?'نجربها بطريقة أبسط':mode==='verify'?'مرة ثانية بشكل مختلف':'سؤال واحد الآن'}</h2></div><div className="deepChildProgress"><span style={{width:`${progress}%`}}/></div></div>
    {mode==='supported'&&<div className="adaptiveSupport childHint"><strong>💡 تلميح صغير</strong><p>{sub.miniLesson}</p></div>}
    {mode==='verify'&&<div className="adaptiveVerify childHint"><strong>✨ جولة ثانية</strong><span>جربي السؤال الجديد بطريقتك.</span></div>}
    <h2 className="recoveryQuestion">{q.text}</h2>
    <div className="choice recoveryChoices">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>
    {selected!==null&&<div className="recoveryFeedback"><div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'رائعة! ⭐':'شاهدي هذه الفكرة 💡'}</strong><p>{q.explanation}</p></div><button className="btn kidPrimaryAction" onClick={next}>{subIndex===subskills.length-1&&(mode!=='entry'||sub.questions.length===1)?'أنهي الجولة ✨':'نكمل ←'}</button></div>}
  </section>;
}
