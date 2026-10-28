'use client';
import {useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';

const supported=['g5-math-frequency-tables','g5-math-bar-chart','g5-math-line-chart','g7-math-mean','g7-math-median','g7-math-mode'];
export function supportsDataConceptStudio(lesson:Lesson){return supported.includes(lesson.id)}
export default function DataConceptStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 if(lesson.id==='g5-math-frequency-tables')return <FrequencyStudio onOutcome={onOutcome}/>;
 if(lesson.id==='g5-math-bar-chart')return <BarStudio onOutcome={onOutcome}/>;
 if(lesson.id==='g5-math-line-chart')return <LineStudio onOutcome={onOutcome}/>;
 if(lesson.id==='g7-math-mean')return <MeanStudio onOutcome={onOutcome}/>;
 if(lesson.id==='g7-math-median')return <MedianStudio onOutcome={onOutcome}/>;
 if(lesson.id==='g7-math-mode')return <ModeStudio onOutcome={onOutcome}/>;
 return null;
}
function Head({icon,title,text}:{icon:string;title:string;text:string}){return <div className="conceptStudioHead"><span>{icon}</span><div><small>مختبر البيانات</small><h4>{title}</h4><p>{text}</p></div></div>}
function Feedback({ok,text}:{ok:boolean;text:string}){return <div className={ok?'studioFeedback ok':'studioFeedback learn'}><strong>{ok?'⭐ ممتاز':'💡 راجعي التمثيل'}</strong><p>{text}</p></div>}

function FrequencyStudio({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const data=[2,3,2,4,2];const values=[2,3,4];const [selected,setSelected]=useState(2);const [answer,setAnswer]=useState(3);const [checked,setChecked]=useState(false);const frequency=data.filter(x=>x===selected).length;
 function check(){const ok=answer===frequency;setChecked(true);onOutcome?.(ok)}
 return <div className="dataStudio"><Head icon="🔢" title="ابني التكرار من البيانات الخام" text="اختاري قيمة، ثم عدّي كم مرة ظهرت قبل النظر إلى الجدول."/><div className="rawDataRow">{data.map((x,i)=><span className={x===selected?'active':''} key={i}>{x}</span>)}</div><div className="valueTabs">{values.map(v=><button className={selected===v?'active':''} key={v} onClick={()=>{setSelected(v);setAnswer(0);setChecked(false)}}>القيمة {v}</button>)}</div><div className="frequencyVisual">{values.map(v=><div key={v}><strong>{v}</strong><span>{Array.from({length:data.filter(x=>x===v).length},(_,i)=><b key={i}>●</b>)}</span></div>)}</div><label className="answerField">كم مرة ظهرت {selected}؟ <input type="number" value={answer} onChange={e=>{setAnswer(Number(e.target.value));setChecked(false)}}/></label><button className="studioCheck wide" onClick={check}>تحقق</button>{checked&&<Feedback ok={answer===frequency} text={`القيمة ${selected} ظهرت ${frequency} مرة؛ وهذا هو معنى التكرار.`}/>}</div>
}

function BarStudio({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const [football,setFootball]=useState(6);const [swim,setSwim]=useState(3);const [answer,setAnswer]=useState(3);const [checked,setChecked]=useState(false);const diff=Math.abs(football-swim);function check(){const ok=answer===diff;setChecked(true);onOutcome?.(ok)}
 return <div className="dataStudio"><Head icon="📊" title="غيّري البيانات وشاهدي الأعمدة" text="ارتفاع العمود يمثل القيمة باستخدام المقياس نفسه؛ لذلك المقارنة تصبح مرئية."/><div className="barStage"><div><span style={{height:`${football*13}px`}}/><strong>كرة القدم</strong><b>{football}</b></div><div><span style={{height:`${swim*13}px`}}/><strong>السباحة</strong><b>{swim}</b></div></div><div className="counterGrid"><Counter label="كرة القدم" value={football} setValue={v=>{setFootball(v);setChecked(false)}}/><Counter label="السباحة" value={swim} setValue={v=>{setSwim(v);setChecked(false)}}/></div><label className="answerField">ما الفرق بين العمودين؟ <input type="number" value={answer} onChange={e=>{setAnswer(Number(e.target.value));setChecked(false)}}/></label><button className="studioCheck wide" onClick={check}>تحقق</button>{checked&&<Feedback ok={answer===diff} text={`الفرق = ${Math.max(football,swim)} − ${Math.min(football,swim)} = ${diff}.`}/>}</div>
}

function LineStudio({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const [values,setValues]=useState([20,22,25,23,27]);const [pick,setPick]=useState<number|null>(null);const points=values.map((v,i)=>`${20+i*70},${150-(v-18)*12}`).join(' ');const biggestRise=values.slice(1).reduce((best,v,i)=>v-values[i]>best.delta?{delta:v-values[i],index:i}:best,{delta:-99,index:0});
 function change(index:number,delta:number){setValues(v=>v.map((x,i)=>i===index?Math.max(18,Math.min(30,x+delta)):x));setPick(null)}
 function choose(i:number){if(pick!==null)return;setPick(i);onOutcome?.(i===biggestRise.index)}
 return <div className="dataStudio"><Head icon="📈" title="شاهدي التغير عبر الزمن" text="الرسم الخطي لا يعرض القيم فقط؛ اتجاه الخط يخبرنا أين زادت أو انخفضت."/><svg className="lineChartStage" viewBox="0 0 330 180" aria-label="رسم خطي تفاعلي"><line x1="15" y1="155" x2="315" y2="155"/><polyline points={points} fill="none" stroke="currentColor" strokeWidth="5"/>{values.map((v,i)=><g key={i}><circle cx={20+i*70} cy={150-(v-18)*12} r="7"/><text x={20+i*70} y={172} textAnchor="middle">{i+1}</text><text x={20+i*70} y={142-(v-18)*12} textAnchor="middle">{v}</text></g>)}</svg><div className="lineValueControls">{values.map((v,i)=><div key={i}><small>اليوم {i+1}</small><button onClick={()=>change(i,-1)}>−</button><b>{v}</b><button onClick={()=>change(i,1)}>+</button></div>)}</div><h5>بين أي يومين حدثت أكبر زيادة؟</h5><div className="studioChoices">{values.slice(0,-1).map((_,i)=><button disabled={pick!==null} key={i} onClick={()=>choose(i)}>{i+1} → {i+2}</button>)}</div>{pick!==null&&<Feedback ok={pick===biggestRise.index} text={`أكبر زيادة هنا مقدارها ${biggestRise.delta} بين اليوم ${biggestRise.index+1} واليوم ${biggestRise.index+2}.`}/>}</div>
}

function MeanStudio({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const [values,setValues]=useState([4,6,8]);const [answer,setAnswer]=useState(6);const [checked,setChecked]=useState(false);const sum=values.reduce((a,b)=>a+b,0);const mean=Number((sum/values.length).toFixed(2));function check(){const ok=Math.abs(answer-mean)<.01;setChecked(true);onOutcome?.(ok)}
 return <div className="dataStudio"><Head icon="⚖️" title="حرّكي قيمة وشاهدي المتوسط" text="الوسط الحسابي يتأثر بكل قيمة؛ نجمع أولًا ثم نوزع المجموع بالتساوي على عدد القيم."/><div className="dataBalance">{values.map((v,i)=><div key={i}><button onClick={()=>{setValues(a=>a.map((x,n)=>n===i?Math.max(0,x-1):x));setChecked(false)}}>−</button><strong>{v}</strong><button onClick={()=>{setValues(a=>a.map((x,n)=>n===i?x+1:x));setChecked(false)}}>+</button></div>)}</div><div className="meanEquation"><span>{values.join(' + ')} = {sum}</span><strong>{sum} ÷ {values.length} = {mean}</strong></div><label className="answerField">الوسط الحسابي <input type="number" step="0.1" value={answer} onChange={e=>{setAnswer(Number(e.target.value));setChecked(false)}}/></label><button className="studioCheck wide" onClick={check}>تحقق</button>{checked&&<Feedback ok={Math.abs(answer-mean)<.01} text={`نجمع القيم فنحصل على ${sum}، ثم نقسم على ${values.length}، فيكون الوسط ${mean}.`}/>}</div>
}

function MedianStudio({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const raw=[9,2,11,5,7];const sorted=useMemo(()=>[...raw].sort((a,b)=>a-b),[]);const median=sorted[Math.floor(sorted.length/2)];const [sortedOpen,setSortedOpen]=useState(false);const [pick,setPick]=useState<number|null>(null);function choose(v:number){if(pick!==null)return;setPick(v);onOutcome?.(v===median)}
 return <div className="dataStudio"><Head icon="↔️" title="رتّبي ثم ابحثي عن المنتصف" text="الوسيط يعتمد على الموقع، لذلك لا يمكن إيجاده بثقة قبل ترتيب القيم."/><div className="medianRow">{(sortedOpen?sorted:raw).map((x,i)=><span key={`${x}-${i}`} className={sortedOpen&&i===Math.floor(sorted.length/2)?'middle':''}>{x}</span>)}</div><button className="revealEvidence" onClick={()=>setSortedOpen(true)}>رتّبي القيم من الأصغر للأكبر</button>{sortedOpen&&<><h5>أي قيمة تقع في المنتصف؟</h5><div className="studioChoices">{sorted.map(v=><button disabled={pick!==null} key={v} onClick={()=>choose(v)}>{v}</button>)}</div>{pick!==null&&<Feedback ok={pick===median} text={`بعد الترتيب ${sorted.join('، ')} تكون القيمة الوسطى هي ${median}.`}/>}</>}</div>
}

function ModeStudio({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const data=[2,3,3,5,7];const counts=useMemo(()=>Object.entries(data.reduce<Record<number,number>>((a,v)=>{a[v]=(a[v]||0)+1;return a},{})).map(([v,c])=>({value:Number(v),count:c})),[]);const mode=counts.reduce((a,b)=>b.count>a.count?b:a).value;const [pick,setPick]=useState<number|null>(null);function choose(v:number){if(pick!==null)return;setPick(v);onOutcome?.(v===mode)}
 return <div className="dataStudio"><Head icon="🔁" title="ابحثي عن القيمة الأكثر تكرارًا" text="المنوال ليس الأكبر ولا الوسط؛ هو القيمة التي تظهر أكثر من غيرها."/><div className="modeStacks">{counts.map(x=><button disabled={pick!==null} key={x.value} onClick={()=>choose(x.value)}><span>{Array.from({length:x.count},(_,i)=><b key={i}>●</b>)}</span><strong>{x.value}</strong><small>{x.count} مرة</small></button>)}</div>{pick!==null&&<Feedback ok={pick===mode} text={`القيمة ${mode} ظهرت أكثر من بقية القيم، لذلك هي المنوال.`}/>}</div>
}
function Counter({label,value,setValue}:{label:string;value:number;setValue:(v:number)=>void}){return <label className="advancedCounter"><span>{label}</span><div><button onClick={()=>setValue(Math.max(0,value-1))}>−</button><strong>{value}</strong><button onClick={()=>setValue(value+1)}>+</button></div></label>}
