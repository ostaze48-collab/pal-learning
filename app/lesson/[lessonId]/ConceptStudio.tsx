'use client';
import {useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {chooseVisualStrategy} from '../../../lib/visualTeaching';

function textOf(lesson:Lesson){return [lesson.title,lesson.summary,...lesson.learningPoints,lesson.example].join(' ').toLowerCase()}
function languageGrammarLesson(lesson:Lesson){const t=textOf(lesson);return /(ضمير|فعل|اسم|جملة|قاعدة|همزة|تعريف|تنكير|verb|tense|present|past|perfect|question|pronoun|comparative|sentence|grammar|punctuation)/i.test(t)}
export function supportsConceptStudio(lesson:Lesson){const strategy=chooseVisualStrategy(lesson).strategy;return strategy==='fraction_model'||strategy==='geometry'||(lesson.subject==='العلوم والحياة'&&strategy==='cause_effect')||((lesson.subject==='English'||lesson.subject==='اللغة العربية')&&languageGrammarLesson(lesson))}

export default function ConceptStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 const strategy=chooseVisualStrategy(lesson).strategy;
 if(strategy==='fraction_model')return <FractionStudio lesson={lesson} onOutcome={onOutcome}/>;
 if(strategy==='geometry')return <GeometryStudio lesson={lesson} onOutcome={onOutcome}/>;
 if(lesson.subject==='العلوم والحياة'&&strategy==='cause_effect')return <ScienceCauseStudio lesson={lesson} onOutcome={onOutcome}/>;
 if((lesson.subject==='English'||lesson.subject==='اللغة العربية')&&languageGrammarLesson(lesson))return <SentenceStudio lesson={lesson} onOutcome={onOutcome}/>;
 return null;
}

function FractionStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 const source=[lesson.example,...lesson.learningPoints,lesson.summary].join(' ');
 const match=source.match(/(\d+)\s*[\/⁄]\s*(\d+)/);
 const targetDen=Math.min(10,Math.max(2,Number(match?.[2]||4)));const targetNum=Math.min(targetDen,Math.max(0,Number(match?.[1]||3)));
 const [den,setDen]=useState(targetDen);const [num,setNum]=useState(Math.min(targetNum,targetDen));const [checked,setChecked]=useState(false);
 function changeDen(next:number){const d=Math.min(10,Math.max(2,next));setDen(d);setNum(n=>Math.min(n,d));setChecked(false)}
 function check(){const ok=den===targetDen&&num===targetNum;setChecked(true);onOutcome?.(ok)}
 return <div className="conceptStudio fractionStudio"><div className="conceptStudioHead"><span>🍰</span><div><small>مختبر الكسور</small><h4>ابني الكسر بيدك</h4><p>اضغطي على الأجزاء لتري معنى البسط والمقام بدل حفظهما فقط.</p></div></div><div className="fractionBoard">{Array.from({length:den},(_,i)=><button key={i} className={i<num?'filled':''} onClick={()=>{setNum(i+1);setChecked(false)}} aria-label={`اختيار ${i+1} من ${den}`}/>)}</div><div className="fractionReadout"><strong>{num}</strong><span/><strong>{den}</strong></div><div className="studioControls"><button onClick={()=>changeDen(den-1)}>− مقام</button><button onClick={()=>changeDen(den+1)}>+ مقام</button><button className="studioCheck" onClick={check}>تحقق من كسر المثال</button></div>{checked&&<div className={den===targetDen&&num===targetNum?'studioFeedback ok':'studioFeedback learn'}><strong>{den===targetDen&&num===targetNum?'⭐ ممتاز! بنيتِ كسر المثال':'💡 قارني بالدرس مرة أخرى'}</strong><p>الهدف هنا هو {targetNum}/{targetDen}. المقام يحدد عدد الأجزاء المتساوية، والبسط يحدد الأجزاء المأخوذة.</p></div>}</div>
}

function GeometryStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 const t=textOf(lesson);if(t.includes('مثلث'))return <TriangleStudio lesson={lesson} onOutcome={onOutcome}/>;
 const [w,setW]=useState(4);const [h,setH]=useState(3);const [pick,setPick]=useState<number|null>(null);const area=w*h;const options=[w+h,area,2*(w+h)];
 function choose(i:number){if(pick!==null)return;setPick(i);onOutcome?.(i===1)}
 return <div className="conceptStudio geometryStudio"><div className="conceptStudioHead"><span>📐</span><div><small>مختبر الهندسة</small><h4>غيّري الأبعاد وشاهدي المساحة</h4><p>كل مربع صغير يمثل وحدة مربعة واحدة.</p></div></div><div className="areaGrid" style={{gridTemplateColumns:`repeat(${w},1fr)`}}>{Array.from({length:w*h},(_,i)=><span key={i}/>)}</div><div className="dimensionControls"><label>الطول <button onClick={()=>{setW(v=>Math.max(2,v-1));setPick(null)}}>−</button><b>{w}</b><button onClick={()=>{setW(v=>Math.min(7,v+1));setPick(null)}}>+</button></label><label>العرض <button onClick={()=>{setH(v=>Math.max(2,v-1));setPick(null)}}>−</button><b>{h}</b><button onClick={()=>{setH(v=>Math.min(6,v+1));setPick(null)}}>+</button></label></div><h5>ما مساحة هذا المستطيل؟</h5><div className="studioChoices">{options.map((x,i)=><button key={`${x}-${i}`} disabled={pick!==null} onClick={()=>choose(i)}>{x}</button>)}</div>{pick!==null&&<div className={pick===1?'studioFeedback ok':'studioFeedback learn'}><strong>{pick===1?'⭐ صحيح: الطول × العرض':'💡 جرّبي عدّ المربعات'}</strong><p>{w} × {h} = {area} وحدة مربعة.</p></div>}</div>
}

function TriangleStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 const shapes=[{name:'قائم الزاوية',points:'18,90 18,18 120,90'},{name:'حاد الزوايا',points:'65,12 15,90 120,90'},{name:'منفرج الزاوية',points:'10,88 45,30 125,88'}];const target=lesson.id.length%3;const [pick,setPick]=useState<number|null>(null);
 function choose(i:number){if(pick!==null)return;setPick(i);onOutcome?.(i===target)}
 return <div className="conceptStudio geometryStudio"><div className="conceptStudioHead"><span>🔺</span><div><small>مختبر المثلثات</small><h4>راقبي الزوايا ثم صنّفي</h4><p>التصنيف هنا يعتمد على شكل الزوايا، لا على اتجاه المثلث في الشاشة.</p></div></div><svg className="triangleStage" viewBox="0 0 140 110" role="img" aria-label="مثلث للتصنيف"><polygon points={shapes[target].points}/></svg><div className="studioChoices">{shapes.map((s,i)=><button key={s.name} disabled={pick!==null} onClick={()=>choose(i)}>{s.name}</button>)}</div>{pick!==null&&<div className={pick===target?'studioFeedback ok':'studioFeedback learn'}><strong>{pick===target?'⭐ تصنيف صحيح':'💡 انظري إلى أكبر زاوية'}</strong><p>هذا مثلث {shapes[target].name}.</p></div>}</div>
}

function ScienceCauseStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 const q=lesson.questions[0];const [prediction,setPrediction]=useState<number|null>(null);const [showEvidence,setShowEvidence]=useState(false);if(!q)return null;
 function choose(i:number){if(prediction!==null)return;setPrediction(i);onOutcome?.(i===q.correct)}
 return <div className="conceptStudio scienceStudio"><div className="conceptStudioHead"><span>🔬</span><div><small>مختبر السبب والنتيجة</small><h4>توقّعي أولًا، ثم استخدمي الدليل</h4><p>العالِم لا يبدأ بالجواب؛ يبدأ بتوقع ثم يقارنه بالدليل.</p></div></div><div className="causeFlow"><div><small>الفكرة/السبب</small><strong>{lesson.learningPoints[0]||lesson.summary}</strong></div><span>→</span><div><small>ما الذي نتوقعه؟</small><strong>{showEvidence?(lesson.learningPoints[1]||q.explanation):'؟'}</strong></div></div><h5>{q.text}</h5><div className="studioChoices">{q.options.map((x,i)=><button key={x} disabled={prediction!==null} onClick={()=>choose(i)}>{x}</button>)}</div>{prediction!==null&&<button className="revealEvidence" onClick={()=>setShowEvidence(true)}>🔎 اكشفي الدليل والتفسير</button>}{showEvidence&&<div className={prediction===q.correct?'studioFeedback ok':'studioFeedback learn'}><strong>{prediction===q.correct?'⭐ توقعك وافق الدليل':'💡 التوقع مختلف، وهذا مفيد للتعلم'}</strong><p>{q.explanation}</p><small>قارني بين السبب والنتيجة: ما الذي تغيّر؟ ولماذا؟</small></div>}</div>
}

function SentenceStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 const sentence=useMemo(()=>{const raw=(lesson.example||lesson.summary).replace(/[.!?؟،,;:]+/g,' ').replace(/\s+/g,' ').trim();return raw.split(' ').filter(Boolean).slice(0,8)},[lesson.id,lesson.example,lesson.summary]);
 const shuffled=useMemo(()=>sentence.map((word,i)=>({word,i,key:(i*7+lesson.id.length*3)%17})).sort((a,b)=>a.key-b.key||b.i-a.i),[lesson.id,sentence.join('|')]);
 const [picked,setPicked]=useState<number[]>([]);const [checked,setChecked]=useState(false);if(sentence.length<3)return null;
 function add(i:number){if(picked.includes(i)||checked)return;setPicked(v=>[...v,i])}
 function check(){const ok=picked.length===sentence.length&&picked.every((x,pos)=>x===pos);setChecked(true);onOutcome?.(ok)}
 return <div className="conceptStudio sentenceStudio"><div className="conceptStudioHead"><span>🧱</span><div><small>بنّاء الجملة</small><h4>ابني الجملة بدل حفظ القاعدة</h4><p>اختاري الكلمات بالترتيب الذي يصنع جملة صحيحة، ثم قارني بالنموذج.</p></div></div><div className="sentenceTarget">{picked.length?picked.map((idx,n)=><button key={`${idx}-${n}`} onClick={()=>{if(checked)return;setPicked(v=>v.filter((_,p)=>p!==n))}}>{sentence[idx]}</button>):<span>ابدئي باختيار أول كلمة…</span>}</div><div className="sentenceBank">{shuffled.map(item=><button key={item.i} disabled={picked.includes(item.i)||checked} onClick={()=>add(item.i)}>{item.word}</button>)}</div><div className="studioControls"><button onClick={()=>{setPicked([]);setChecked(false)}}>إعادة</button><button className="studioCheck" disabled={picked.length!==sentence.length} onClick={check}>تحقق من البناء</button></div>{checked&&<div className={picked.every((x,pos)=>x===pos)?'studioFeedback ok':'studioFeedback learn'}><strong>{picked.every((x,pos)=>x===pos)?'⭐ بنيتِ الجملة بالشكل الصحيح':'💡 الترتيب يحتاج تعديلًا'}</strong><p>{sentence.join(' ')}</p></div>}</div>
}
