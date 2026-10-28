'use client';
import {useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';

type Props={lesson:Lesson;onComplete:()=>void};

type SortItem={value:number;bucket?:'prime'|'composite'};

function PrimeSort({onComplete}:{onComplete:()=>void}){
 const initial=useMemo(()=>[2,4,5,9,11,15,17,21].map(value=>({value} as SortItem)),[]);
 const [items,setItems]=useState(initial);const [checked,setChecked]=useState(false);
 function drop(value:number,bucket:'prime'|'composite'){setChecked(false);setItems(v=>v.map(x=>x.value===value?{...x,bucket}:x))}
 const correct=(x:SortItem)=>[2,5,11,17].includes(x.value)?x.bucket==='prime':x.bucket==='composite';
 const allPlaced=items.every(x=>x.bucket);
 return <div className="interactiveCard"><div className="visualTitle"><span>🧩</span><div><strong>صنفي الأعداد</strong><p>اسحبي كل عدد إلى المكان المناسب.</p></div></div><div className="chipBank">{items.filter(x=>!x.bucket).map(x=><button className="numberChip" draggable key={x.value} onDragStart={e=>e.dataTransfer.setData('text/plain',String(x.value))}>{x.value}</button>)}</div><div className="dropGrid"><div className="dropZone" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(Number(e.dataTransfer.getData('text/plain')),'prime')}><strong>أعداد أولية</strong>{items.filter(x=>x.bucket==='prime').map(x=><button className="numberChip placed" key={x.value} onClick={()=>drop(x.value,undefined as never)}>{x.value}</button>)}</div><div className="dropZone" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(Number(e.dataTransfer.getData('text/plain')),'composite')}><strong>غير أولية</strong>{items.filter(x=>x.bucket==='composite').map(x=><button className="numberChip placed" key={x.value} onClick={()=>drop(x.value,undefined as never)}>{x.value}</button>)}</div></div><p className="muted" style={{fontSize:12}}>على الهاتف يمكنك النقر على العدد ثم استخدام التدريب العادي؛ السحب مصمم أساسًا للابتوب.</p>{allPlaced&&!checked&&<button className="btn" onClick={()=>setChecked(true)}>تحققي</button>}{checked&&<div className={items.every(correct)?'activitySuccess':'activityHint'}>{items.every(correct)?<><strong>ممتاز ✅</strong><p>صنفتِ كل الأعداد بصورة صحيحة.</p><button className="btn" onClick={onComplete}>متابعة</button></>:<><strong>هناك عدد يحتاج مراجعة.</strong><p>تذكري: العدد الأولي أكبر من 1 وله عاملان فقط.</p><button className="btn secondary" onClick={()=>setChecked(false)}>حاولي مرة أخرى</button></>}</div>}</div>
}

function FactorTree({onComplete}:{onComplete:()=>void}){
 const [choice,setChoice]=useState<number|null>(null);const [done,setDone]=useState(false);
 const pairs=[{label:'2 × 12',ok:false},{label:'3 × 8',ok:false},{label:'4 × 6',ok:true}];
 return <div className="interactiveCard"><div className="visualTitle"><span>🌳</span><div><strong>ابني شجرة عوامل للعدد 24</strong><p>اختاري بداية مناسبة ثم شاهدي كيف نصل إلى عوامل أولية.</p></div></div><div className="factorTree"><div className="treeNode root">24</div><div className="treeBranches"><span/><span/></div>{choice===2?<><div className="treeRow"><div className="treeNode">4</div><div className="treeNode">6</div></div><div className="treeLeaves"><div>2 × 2</div><div>2 × 3</div></div><div className="treeAnswer">24 = 2 × 2 × 2 × 3</div></>:<div className="factorChoices">{pairs.map((p,i)=><button className={`option ${choice===i?(p.ok?'ok':'bad'):''}`} key={p.label} onClick={()=>{setChoice(i);if(p.ok)setDone(true)}}>{p.label}</button>)}</div>}</div>{choice!==null&&choice!==2&&<div className="activityHint"><strong>هذه بداية صحيحة كضرب، لكن جرّبي زوجًا يوضح الشجرة أسرع.</strong><p>أي زوج يمكن تحليله إلى أعداد أولية في فروع واضحة؟</p></div>}{done&&<div className="activitySuccess"><strong>رائع ✅</strong><p>وصلنا إلى 2، 2، 2، 3 وجميعها أولية.</p><button className="btn" onClick={onComplete}>متابعة</button></div>}</div>
}

function NumberLine({onComplete}:{onComplete:()=>void}){
 const [selected,setSelected]=useState<number|null>(null);const target=-3;const values=Array.from({length:11},(_,i)=>i-5);
 return <div className="interactiveCard"><div className="visualTitle"><span>📏</span><div><strong>خط الأعداد</strong><p>انقري على العدد -3.</p></div></div><div className="numberLine">{values.map(v=><button key={v} className={`tick ${selected===v?(v===target?'ok':'bad'):''}`} onClick={()=>setSelected(v)}><span>{v}</span></button>)}</div>{selected!==null&&<div className={selected===target?'activitySuccess':'activityHint'}>{selected===target?<><strong>صحيح ✅</strong><p>-3 يقع ثلاث خطوات إلى يسار الصفر.</p><button className="btn" onClick={onComplete}>متابعة</button></>:<><strong>راجعي الاتجاه.</strong><p>الأعداد السالبة تقع يسار الصفر، وكلما تحركنا يسارًا صغرت القيمة.</p></>}</div>}</div>
}

function TriangleVisual({onComplete}:{onComplete:()=>void}){
 const [selected,setSelected]=useState<string|null>(null);
 return <div className="interactiveCard"><div className="visualTitle"><span>📐</span><div><strong>تعرفي إلى المثلث</strong><p>أي شكل يمثل مثلثًا قائم الزاوية؟</p></div></div><div className="shapeGrid"><button className={`shapeButton ${selected==='right'?'ok':''}`} onClick={()=>setSelected('right')}><svg viewBox="0 0 120 90" role="img" aria-label="مثلث قائم"><polygon points="20,70 20,20 100,70" fill="none" stroke="currentColor" strokeWidth="5"/><path d="M20 58 L32 58 L32 70" fill="none" stroke="currentColor" strokeWidth="3"/></svg><span>أ</span></button><button className={`shapeButton ${selected==='acute'?'bad':''}`} onClick={()=>setSelected('acute')}><svg viewBox="0 0 120 90" role="img" aria-label="مثلث حاد"><polygon points="60,15 15,75 105,75" fill="none" stroke="currentColor" strokeWidth="5"/></svg><span>ب</span></button><button className={`shapeButton ${selected==='obtuse'?'bad':''}`} onClick={()=>setSelected('obtuse')}><svg viewBox="0 0 120 90" role="img" aria-label="مثلث منفرج"><polygon points="20,70 55,25 110,70" fill="none" stroke="currentColor" strokeWidth="5"/></svg><span>ج</span></button></div>{selected&&<div className={selected==='right'?'activitySuccess':'activityHint'}>{selected==='right'?<><strong>صحيح ✅</strong><p>الشكل أ يحتوي زاوية مقدارها 90°.</p><button className="btn" onClick={onComplete}>متابعة</button></>:<><strong>ابحثي عن علامة الزاوية القائمة.</strong><p>الزاوية القائمة مقدارها 90°.</p></>}</div>}</div>
}

export function hasInteractiveActivity(lessonId:string){return ['g5-math-prime-numbers','g5-math-prime-factorization','g7-math-integers','g7-math-integer-order','g5-math-triangles'].includes(lessonId)}

export default function InteractiveActivity({lesson,onComplete}:Props){
 if(lesson.id==='g5-math-prime-numbers')return <PrimeSort onComplete={onComplete}/>;
 if(lesson.id==='g5-math-prime-factorization')return <FactorTree onComplete={onComplete}/>;
 if(lesson.id==='g7-math-integers'||lesson.id==='g7-math-integer-order')return <NumberLine onComplete={onComplete}/>;
 if(lesson.id==='g5-math-triangles')return <TriangleVisual onComplete={onComplete}/>;
 return null;
}
