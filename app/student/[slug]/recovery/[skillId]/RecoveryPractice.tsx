'use client';
import {useMemo,useState} from 'react';
import type {RecoverySkill} from '../../../../../lib/recoverySkills';
import {getDeepDiagnostic} from '../../../../../lib/deepDiagnostics';
import SmartPractice from './SmartPractice';

export default function RecoveryPractice({slug,skill,focusId,retentionMode=false}:{slug:string;skill:RecoverySkill;focusId?:string;retentionMode?:boolean}){
 const diagnostic=getDeepDiagnostic(skill.id);
 const focus=focusId?diagnostic?.subskills.find(s=>s.id===focusId):undefined;
 const questions=focus?.questions??skill.screening;
 const title=focus?.title??skill.title;
 const explanation=focus?.miniLesson??skill.explanation;
 const treatmentSteps=focus?.treatmentSteps??[];
 const [phase,setPhase]=useState<'learn'|'quiz'|'done'>(retentionMode?'quiz':'learn');
 const [step,setStep]=useState(0);const [selected,setSelected]=useState<number|null>(null);const [score,setScore]=useState(0);
 const [finalPct,setFinalPct]=useState<number|null>(null);
 const q=questions[step];
 const deepKey=focus?`recoveryDeep:${slug}:${skill.id}:${focus.id}`:null;
 const previousDeep=useMemo(()=>focus&&deepKey?Number(globalThis?.localStorage?.getItem?.(deepKey)??NaN):NaN,[deepKey,focus]);
 const savedMistakes=useMemo(()=>{
   if(!focus)return [];
   const raw=globalThis?.localStorage?.getItem?.(`recoveryDeepResult:${slug}:${skill.id}:${focus.id}`);
   if(!raw)return [];
   try{const parsed=JSON.parse(raw);return Array.isArray(parsed?.missedFacts)?parsed.missedFacts:[]}catch{return []}
 },[slug,skill.id,focus?.id]);

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
   return <><div className="card result"><h1>{pct>=80?(retentionMode?'المهارة ما زالت ثابتة ✅':'تم تثبيت المهارة ✅'):'نحتاج جلسة قصيرة أخرى'}</h1><p>{retentionMode?'راجعنا':'تدربنا على'} <strong>{title}</strong>. النتيجة الحالية: {pct}%.</p>{focus&&<p className="muted">{retentionMode?'هذا اختبار احتفاظ دون شرح مسبق.':'كان هذا علاجًا مركزًا لجزء محدد من مهارة '+skill.title+'، وليس إعادة المجال كاملًا.'}</p>}<p className="muted">{pct>=80?(retentionMode?'سيبعد النظام موعد المراجعة التالية تدريجيًا لأن المهارة بقيت ثابتة.':'ستختفي هذه النقطة من قائمة الفجوات الآن، ويحدد النظام تحققًا قصيرًا بعد 3 أيام.'):'ستعود هذه النقطة إلى خطة الاستدراك ويعاد شرحها قبل المحاولة التالية.'}</p><button className="btn" onClick={()=>history.back()}>العودة</button></div>{focus&&!retentionMode&&<SmartPractice slug={slug} skillId={skill.id} subskillId={focus.id} mistakes={savedMistakes}/>}</>;
 }
 if(phase==='learn')return <div className="card"><span className="tag">{focus?'علاج دقيق':'شرح علاجي قصير'}</span><h1>{title}</h1>{focus&&<div className="muted" style={{marginBottom:10}}>المرجع المتوقع: {focus.gradeAnchor}{Number.isFinite(previousDeep)?` · نتيجتك السابقة ${previousDeep}%`:''}</div>}<p style={{lineHeight:1.9}}>{explanation}</p>{treatmentSteps.length>0&&<div className="gapExplanation"><strong>خطة هذه الجلسة</strong><ol>{treatmentSteps.map(x=><li key={x}>{x}</li>)}</ol></div>}<div className="exampleChips">{questions.map(x=><span key={x.id}>{x.explanation}</span>)}</div><button className="btn" style={{marginTop:18}} onClick={()=>setPhase('quiz')}>ابدأ التحقق بعد الشرح</button></div>;
 function choose(i:number){if(selected!==null)return;setSelected(i)}
 function next(){const gained=score+(selected===q.correct?1:0);if(step===questions.length-1){const pct=Math.round(gained/questions.length*100);if(focus)persistFocusedResult(pct);else localStorage.setItem(`recovery:${slug}:${skill.id}`,String(pct));setScore(gained);setFinalPct(pct);setPhase('done');return}setScore(gained);setStep(v=>v+1);setSelected(null)}
 return <div className="card"><span className="tag">{retentionMode?'اختبار احتفاظ':'تحقق بعد العلاج'} · {step+1}/{questions.length}</span>{retentionMode&&<div className="adaptiveVerify"><strong>🧠 دون تلميح هذه المرة</strong><span>نقيس ما بقي في الذاكرة بعد مرور الوقت.</span></div>}<h2>{q.text}</h2><div className="choice">{q.options.map((o,i)=>{const cls=selected===null?'option':i===q.correct?'option ok':i===selected?'option bad':'option';return <button key={o} className={cls} onClick={()=>choose(i)}>{o}</button>})}</div>{selected!==null&&<div style={{marginTop:16}}><div className={selected===q.correct?'activitySuccess':'activityHint'}><strong>{selected===q.correct?'ممتاز ✅':'هذه المهارة تحتاج تثبيتًا جديدًا'}</strong><p>{q.explanation}</p></div><button className="btn" onClick={next}>{step===questions.length-1?'احفظ النتيجة':'التالي'}</button></div>}</div>;
}
