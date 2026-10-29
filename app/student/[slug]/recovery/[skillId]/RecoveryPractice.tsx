'use client';
import {useState} from 'react';
import type {RecoverySkill} from '../../../../../lib/recoverySkills';
import {getDeepDiagnostic} from '../../../../../lib/deepDiagnostics';
import MultiplicationFluencyLab from './MultiplicationFluencyLab';

export default function RecoveryPractice({slug,skill,focusId,retentionMode=false}:{slug:string;skill:RecoverySkill;focusId?:string;retentionMode?:boolean}){
 const diagnostic=getDeepDiagnostic(skill.id);
 const focus=focusId?diagnostic?.subskills.find(s=>s.id===focusId):undefined;
 const questions=focus?.questions??skill.screening;
 const title=focus?.title??skill.title;
 const explanation=focus?.miniLesson??skill.explanation;
 const multiplicationFluency=Boolean(focus?.id?.startsWith('tables-'));
 const [phase,setPhase]=useState<'learn'|'quiz'|'done'>(retentionMode?'quiz':'learn');
 const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [score,setScore]=useState(0);
 const [finalPct,setFinalPct]=useState<number|null>(null);
 const q=questions[step];

 function persistFocusedResult(pct:number){
   if(!focus||!diagnostic)return;
   localStorage.setItem(`recoveryDeep:${slug}:${skill.id}:${focus.id}`,String(pct));
   const previousResultRaw=localStorage.getItem(`recoveryDeepResult:${slug}:${skill.id}:${focus.id}`);
   let previousResult:any=null;try{if(previousResultRaw)previousResult=JSON.parse(previousResultRaw)}catch{}
   const status=pct>=80?(retentionMode?'retained':'mastered_after_recovery'):pct>=50?'fragile_foundation':'foundation_gap';
   const diagnosis=pct>=80?(retentionMode?'ثبتت المهارة بعد مرور الوقت':'تم إتقان المهارة بعد العلاج المركز'):pct>=50?'تحسن جزئي — ما زال الاستدعاء أو التطبيق غير ثابت':'الفجوة التأسيسية ما زالت تحتاج جلسة أخرى';
   const result={...(previousResult||{}),subskillId:focus.id,score:pct,status,label:diagnosis,updatedAt:new Date().toISOString(),afterRecovery:true,retentionChecked:retentionMode};
   localStorage.setItem(`recoveryDeepResult:${slug}:${skill.id}:${focus.id}`,JSON.stringify(result));

   const reviewKey=`recoveryReview:${slug}:${skill.id}:${focus.id}`;
   let oldStage=0;const rawReview=localStorage.getItem(reviewKey);try{if(rawReview)oldStage=Number(JSON.parse(rawReview).stage||0)}catch{}
   const stage=pct>=80?(retentionMode?Math.min(oldStage+1,4):Math.max(oldStage,1)):0;
   const days=pct>=80?([0,3,7,14,30][stage]||30):1;
   localStorage.setItem(reviewKey,JSON.stringify({dueAt:new Date(Date.now()+days*86400000).toISOString(),score:pct,status:pct>=80?'retention_check':'retry',stage}));

   const scored=diagnostic.subskills.map(sub=>({sub,raw:localStorage.getItem(`recoveryDeep:${slug}:${skill.id}:${sub.id}`)})).filter(x=>x.raw!==null).map(x=>({sub:x.sub,score:Number(x.raw)}));
   if(scored.length){
     const average=Math.round(scored.reduce((sum,x)=>sum+x.score,0)/scored.length);
     localStorage.setItem(`recovery:${slug}:${skill.id}`,String(average));
     const weak=scored.filter(x=>x.score<80).sort((a,b)=>a.score-b.score).map(x=>{
       const raw=localStorage.getItem(`recoveryDeepResult:${slug}:${skill.id}:${x.sub.id}`);let meta:any=null;try{if(raw)meta=JSON.parse(raw)}catch{}
       return {id:x.sub.id,title:x.sub.title,gradeAnchor:x.sub.gradeAnchor,score:x.score,status:meta?.status||'needs_recovery',diagnosis:meta?.label||'',cause:meta?.cause||'',nextAction:meta?.nextAction||'',treatmentSteps:x.sub.treatmentSteps};
     });
     localStorage.setItem(`recoveryPlan:${slug}:${skill.id}`,JSON.stringify({skillId:skill.id,updatedAt:new Date().toISOString(),average,adaptive:true,weak}));
   }
 }

 if(phase==='done'){
   const pct=finalPct??Math.round(score/questions.length*100);
   return <div className="recoveryFinish"><div className="recoveryFinishIcon">{pct>=80?'🌟':'🎈'}</div><span className="questEyebrow">انتهت اللعبة</span><h3>{pct>=80?'أصبحت أسهل!':'أحسنتِ المحاولة'}</h3><p>{pct>=80?'نعود الآن إلى رحلتك، وسنذكّرك بهذه الفكرة لاحقًا إذا احتجنا.':'سنعود لهذه الفكرة في جولة صغيرة أخرى بطريقة مختلفة.'}</p><button className="btn kidPrimaryAction" onClick={()=>history.back()}>أكمل رحلتي ←</button></div>;
 }
 if(phase==='learn'&&multiplicationFluency&&focus)return <MultiplicationFluencyLab slug={slug} subskillId={focus.id} onReady={()=>setPhase('quiz')}/>;
 if(phase==='learn')return <div className="recoveryMiniLesson"><span className="questEyebrow">💡 نشاهدها أولًا</span><h2>{title}</h2><p>{explanation}</p><div className="recoveryMiniExamples">{questions.slice(0,3).map(x=><span key={x.id}>{x.explanation}</span>)}</div><button className="btn kidPrimaryAction" onClick={()=>setPhase('quiz')}>أجرب بنفسي ←</button></div>;
 function choose(i:number){if(selected!==null)return;setSelected(i)}
 function next(){const gained=score+(selected===q.correct?1:0);if(step===questions.length-1){const pct=Math.round(gained/questions.length*100);if(focus)persistFocusedResult(pct);else localStorage.setItem(`recovery:${slug}:${skill.id}`,String(pct));setScore(gained);setFinalPct(pct);setPhase('done');return}setScore(gained);setStep(v=>v+1);setSelected(null)}
 return <div className="recoveryQuestionRound"><div className="recoveryGameTop"><span className="questEyebrow">{retentionMode?'🔄 جولة تذكّر':'🎯 جربي'}</span><div className="recoveryDots">{questions.map((_,i)=><i key={i} className={i<step?'done':i===step?'active':''}/>)}</div></div>{retentionMode&&<div className="childHint"><strong>🧠 جربي من ذاكرتك أولًا</strong><span>لا يوجد تلميح قبل المحاولة هذه المرة.</span></div>}<h2 className="recoveryQuestion">{q.text}</h2><div className="choice recoveryChoices">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>{selected!==null&&<div className="recoveryFeedback"><div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'رائعة! ⭐':'شاهدي الفكرة 💡'}</strong><p>{q.explanation}</p></div><button className="btn kidPrimaryAction" onClick={next}>{step===questions.length-1?'أنهي اللعبة ✨':'التالي ←'}</button></div>}</div>;
}
