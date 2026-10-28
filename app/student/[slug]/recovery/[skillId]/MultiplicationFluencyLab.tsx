'use client';
import {useRef,useState} from 'react';

type Fact={a:number;b:number;answer:number;hint:string};
const banks:Record<string,{title:string;pattern:string;facts:Fact[]}>= {
 'tables-2-5-10':{title:'أنماط 2 و5 و10',pattern:'نبدأ بالأنماط السهلة: الضعف، العد بالخمسات، وإضافة الصفر.',facts:[{a:2,b:8,answer:16,hint:'ضاعفي 8 مرة واحدة.'},{a:5,b:7,answer:35,hint:'عدّي 7 خمسات أو استخدمي نصف 10×7.'},{a:10,b:6,answer:60,hint:'10×6 يعني ست عشرات.'},{a:5,b:9,answer:45,hint:'10×9=90، ونصفها 45.'}]},
 'tables-3-4':{title:'نبني 3 و4',pattern:'جدول 3 يمكن بناؤه من مجموعات ثلاثية، وجدول 4 من مضاعفة جدول 2.',facts:[{a:3,b:7,answer:21,hint:'7+7+7 = 21.'},{a:4,b:8,answer:32,hint:'2×8=16 ثم ضاعفي 16.'},{a:3,b:9,answer:27,hint:'3×10=30، اطرحي 3.'},{a:4,b:6,answer:24,hint:'2×6=12 ثم ضاعفي 12.'}]},
 'tables-6-7':{title:'نبني 6 و7 من حقائق نعرفها',pattern:'لا نحفظها كجدار منفصل: 6×n = 5×n + n، و7×n يمكن بناؤه من 5×n + 2×n.',facts:[{a:6,b:7,answer:42,hint:'5×7=35 ثم +7 = 42.'},{a:7,b:8,answer:56,hint:'5×8=40 و2×8=16؛ المجموع 56.'},{a:6,b:9,answer:54,hint:'5×9=45 ثم +9 = 54.'},{a:7,b:6,answer:42,hint:'5×6=30 و2×6=12؛ المجموع 42.'}]},
 'tables-8-9':{title:'حيل ذكية لـ 8 و9',pattern:'جدول 8 يبنى بالمضاعفة، وجدول 9 يمكن بناؤه من 10×n − n.',facts:[{a:8,b:7,answer:56,hint:'4×7=28 ثم ضاعفيه.'},{a:9,b:6,answer:54,hint:'10×6=60 ثم اطرحي 6.'},{a:8,b:9,answer:72,hint:'4×9=36 ثم ضاعفيه.'},{a:9,b:8,answer:72,hint:'10×8=80 ثم اطرحي 8.'}]}
};

function choices(answer:number){
 const candidates=[answer,answer-7,answer+6,answer+8].filter(x=>x>0);
 return [...new Set(candidates)].slice(0,4).sort((a,b)=>((a*7)%11)-((b*7)%11));
}

export default function MultiplicationFluencyLab({slug,subskillId,onReady}:{slug:string;subskillId:string;onReady:()=>void}){
 const bank=banks[subskillId];
 const [stage,setStage]=useState<'pattern'|'guided'|'sprint'|'done'>('pattern');
 const [step,setStep]=useState(0);const [pick,setPick]=useState<number|null>(null);const [correct,setCorrect]=useState(0);const [times,setTimes]=useState<number[]>([]);
 const started=useRef(Date.now());
 if(!bank)return null;
 const fact=bank.facts[Math.min(step,bank.facts.length-1)];
 function startSprint(){setStage('sprint');setStep(0);setPick(null);setCorrect(0);setTimes([]);started.current=Date.now()}
 function choose(value:number){
  if(pick!==null)return;const elapsed=Date.now()-started.current;setTimes(v=>[...v,elapsed]);setPick(value);if(value===fact.answer)setCorrect(v=>v+1)
 }
 function next(){
  if(step>=bank.facts.length-1){const finalCorrect=correct+(pick===fact.answer?1:0);const finalTimes=[...times];const avgMs=finalTimes.length?Math.round(finalTimes.reduce((a,b)=>a+b,0)/finalTimes.length):0;const accuracy=Math.round(finalCorrect/bank.facts.length*100);localStorage.setItem(`foundationFluency:${slug}:${subskillId}`,JSON.stringify({accuracy,avgMs,attempts:bank.facts.length,at:new Date().toISOString()}));setStage('done');return}
  setStep(v=>v+1);setPick(null);started.current=Date.now()
 }
 if(stage==='pattern')return <section className="multiplicationLab"><div className="fluencyHead"><span>⚡</span><div><small>تحدي ذهني قصير</small><h2>{bank.title}</h2><p>{bank.pattern}</p></div></div><div className="fluencyPatternGrid">{bank.facts.slice(0,3).map(f=><div key={`${f.a}-${f.b}`}><strong>{f.a} × {f.b} = {f.answer}</strong><span>{f.hint}</span></div>)}</div><button className="btn" onClick={()=>setStage('guided')}>أريني كيف أبني الحقيقة ←</button></section>;
 if(stage==='guided')return <section className="multiplicationLab"><span className="tag">نبنيها بدل أن نحفظها وحدها</span><h2>{fact.a} × {fact.b}</h2><div className="factBuildCard"><strong>{fact.hint}</strong><p>قولي الخطوة بصوتك أو في ذهنك، ثم اكشفي النتيجة.</p><div className="factAnswer">{fact.answer}</div></div><button className="btn" onClick={startSprint}>جاهزة للاسترجاع السريع ⚡</button></section>;
 if(stage==='done'){
  const raw=typeof window!=='undefined'?localStorage.getItem(`foundationFluency:${slug}:${subskillId}`):null;let stat:{accuracy?:number;avgMs?:number}={};try{if(raw)stat=JSON.parse(raw)}catch{}
  return <section className="multiplicationLab"><div className="fluencyFinish">🏁</div><h2>انتهى التحدي</h2><p>الدقة <strong>{stat.accuracy??0}%</strong>{stat.avgMs?<> · متوسط الاستجابة <strong>{(stat.avgMs/1000).toFixed(1)} ثانية</strong></>:null}.</p><p className="muted">الآن ننتقل لتحقق قصير يقرر هل هذه المجموعة ثابتة أم تحتاج جولة أخرى لاحقًا.</p><button className="btn" onClick={onReady}>انتقلي للتحقق ←</button></section>;
 }
 return <section className="multiplicationLab"><div className="fluencySprintTop"><span>⚡ استرجاع سريع</span><strong>{step+1}/{bank.facts.length}</strong></div><h2>{fact.a} × {fact.b} = ؟</h2><p className="muted">حاولي الاسترجاع أولًا. إذا لم تتذكري، سنستخدم طريقة البناء في التغذية الراجعة.</p><div className="fluencyChoices">{choices(fact.answer).map(x=><button key={x} disabled={pick!==null} className={pick===null?'':x===fact.answer?'ok':x===pick?'bad':''} onClick={()=>choose(x)}>{x}</button>)}</div>{pick!==null&&<div className={pick===fact.answer?'activitySuccess':'activityHint'}><strong>{pick===fact.answer?'⭐ ممتاز — استرجاع صحيح':'💡 نبنيها بدل التخمين'}</strong><p>{fact.hint}</p><button className="btn" onClick={next}>{step===bank.facts.length-1?'شاهد النتيجة':'التالي ←'}</button></div>}</section>;
}
