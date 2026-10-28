'use client';
import {useState} from 'react';
import type {Lesson} from '../../../lib/data';

export function supportsScienceSimulation(lesson:Lesson){return ['g7-science-distance-displacement','g7-science-newton-first-law','g7-science-newton-second-law','g5-science-separation-methods','g5-science-physical-chemical-changes'].includes(lesson.id)}
export default function ScienceSimulationStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 if(lesson.id==='g7-science-distance-displacement')return <DistanceDisplacement onOutcome={onOutcome}/>;
 if(lesson.id==='g7-science-newton-first-law')return <NewtonFirst onOutcome={onOutcome}/>;
 if(lesson.id==='g7-science-newton-second-law')return <NewtonSecond onOutcome={onOutcome}/>;
 if(lesson.id==='g5-science-separation-methods')return <SeparationLab onOutcome={onOutcome}/>;
 if(lesson.id==='g5-science-physical-chemical-changes')return <ChangeLab onOutcome={onOutcome}/>;
 return null;
}
function Head({icon,title,text}:{icon:string;title:string;text:string}){return <div className="conceptStudioHead"><span>{icon}</span><div><small>محاكاة تفاعلية</small><h4>{title}</h4><p>{text}</p></div></div>}
function Feedback({ok,text}:{ok:boolean;text:string}){return <div className={ok?'studioFeedback ok':'studioFeedback learn'}><strong>{ok?'⭐ فهم ممتاز':'💡 جرّبي مرة أخرى'}</strong><p>{text}</p></div>}

function DistanceDisplacement({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const [position,setPosition]=useState(0);const [distance,setDistance]=useState(0);const [checked,setChecked]=useState(false);
 function move(delta:number){setPosition(v=>Math.max(-6,Math.min(6,v+delta)));setDistance(v=>v+1);setChecked(false)}
 function reset(){setPosition(0);setDistance(0);setChecked(false)}
 function check(){const ok=distance===6&&position===0;setChecked(true);onOutcome?.(ok)}
 const left=((position+6)/12)*100;
 return <div className="scienceSimulation distanceSim"><Head icon="🧭" title="امشي المسار وقارني المسافة بالإزاحة" text="المسافة تجمع كل خطوة، أما الإزاحة فتنظر فقط من نقطة البداية إلى نقطة النهاية مع الاتجاه."/><div className="simNumberLine"><span className="simStart">البداية 0</span><div className="simWalker" style={{left:`${left}%`}}>🚶‍♀️<b>{position}</b></div></div><div className="simMeters"><div><small>المسافة الكلية</small><strong>{distance} م</strong></div><div><small>الإزاحة من البداية</small><strong>{position===0?'0 م':`${Math.abs(position)} م ${position>0?'شرقًا':'غربًا'}`}</strong></div></div><div className="studioControls"><button onClick={()=>move(-1)}>← 1 م غربًا</button><button onClick={reset}>ابدئي من الصفر</button><button onClick={()=>move(1)}>1 م شرقًا →</button></div><div className="simMission">المهمة: تحركي 3 م شرقًا ثم 3 م غربًا، ثم تحققي.</div><button className="studioCheck wide" onClick={check}>تحقق من التجربة</button>{checked&&<Feedback ok={distance===6&&position===0} text={distance===6&&position===0?'قطعتِ 6 م فعلية، لكنك عدتِ للبداية؛ لذلك الإزاحة صفر. هذه هي الفكرة الأساسية في درس الكتاب.':'حاولي أن يكون مجموع الخطوات 6 وأن تعودي بالضبط إلى نقطة البداية.'}/>}</div>
}

function NewtonFirst({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const [force,setForce]=useState(0);const [moving,setMoving]=useState(false);const [pick,setPick]=useState<number|null>(null);
 const netZero=force===0;
 function choose(i:number){if(pick!==null)return;setPick(i);const correct=netZero?(moving?0:1):2;onOutcome?.(i===correct)}
 return <div className="scienceSimulation newtonSim"><Head icon="🚌" title="متى تتغير حالة الحركة؟" text="غيّري محصلة القوة ولاحظي: إذا كانت المحصلة صفرًا لا نحتاج إلى تغير في حالة الحركة."/><div className="forceScene"><div className={`simObject ${moving?'moving':''}`}>📦</div><div className="forceArrow" style={{opacity:force===0?.25:1,transform:`scaleX(${Math.max(.25,force/5)})`}}>➜</div></div><div className="studioTabs"><button className={!moving?'active':''} onClick={()=>{setMoving(false);setPick(null)}}>الجسم ساكن</button><button className={moving?'active':''} onClick={()=>{setMoving(true);setPick(null)}}>الجسم يتحرك بسرعة ثابتة</button></div><label className="simRange">محصلة القوة: <strong>{force} N</strong><input type="range" min="0" max="10" value={force} onChange={e=>{setForce(Number(e.target.value));setPick(null)}}/></label><h5>ماذا نتوقع الآن؟</h5><div className="studioChoices"><button disabled={pick!==null} onClick={()=>choose(0)}>يستمر بالحركة نفسها</button><button disabled={pick!==null} onClick={()=>choose(1)}>يبقى ساكنًا</button><button disabled={pick!==null} onClick={()=>choose(2)}>تتغير حالة الحركة بسبب قوة محصلة</button></div>{pick!==null&&<Feedback ok={pick===(netZero?(moving?0:1):2)} text={netZero?'عندما تكون محصلة القوى صفرًا يحافظ الجسم على حالته الحركية: سكون أو حركة منتظمة.':'وجود قوة محصلة غير صفرية يعني أن حالة الحركة يمكن أن تتغير.'}/>}</div>
}

function NewtonSecond({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const [force,setForce]=useState(12);const [mass,setMass]=useState(3);const [answer,setAnswer]=useState(4);const [checked,setChecked]=useState(false);const acceleration=Number((force/mass).toFixed(2));
 function check(){const ok=Math.abs(answer-acceleration)<.01;setChecked(true);onOutcome?.(ok)}
 return <div className="scienceSimulation newtonSecond"><Head icon="🚀" title="غيّري القوة والكتلة وشاهدي التسارع" text="القانون الثاني ليس معادلة للحفظ فقط: زيادة القوة ترفع التسارع، وزيادة الكتلة تخفضه عند ثبات القوة."/><div className="forceMassScene"><div className="massBlock" style={{transform:`scale(${.8+mass/20})`}}>📦<small>{mass} kg</small></div><div className="pushVector" style={{width:`${80+force*5}px`}}>F = {force} N →</div></div><div className="counterGrid"><Counter label="القوة المحصلة N" value={force} setValue={v=>{setForce(v);setChecked(false)}} min={2} max={24} step={2}/><Counter label="الكتلة kg" value={mass} setValue={v=>{setMass(v);setChecked(false)}} min={1} max={8}/></div><div className="formulaStage"><span>a = F ÷ m</span><strong>{acceleration} م/ث²</strong></div><label className="answerField">احسبي التسارع <input type="number" step="0.1" value={answer} onChange={e=>{setAnswer(Number(e.target.value));setChecked(false)}}/></label><button className="studioCheck wide" onClick={check}>تحقق</button>{checked&&<Feedback ok={Math.abs(answer-acceleration)<.01} text={`التسارع = ${force} ÷ ${mass} = ${acceleration} م/ث². جرّبي الآن زيادة الكتلة مع إبقاء القوة كما هي ولاحظي ماذا يحدث.`}/>}</div>
}

function SeparationLab({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const cases=[{mix:'رمل + ماء',icon:'🏖️💧',method:'الترشيح',why:'حبيبات الرمل لا تذوب ويمكن حجزها بمرشح.'},{mix:'برادة حديد + رمل',icon:'🧲🏖️',method:'المغناطيس',why:'الحديد ينجذب للمغناطيس بينما الرمل لا ينجذب.'},{mix:'ماء مالح',icon:'🧂💧',method:'التبخير',why:'يتبخر الماء وتبقى المادة الصلبة الذائبة.'}];const [caseIndex,setCaseIndex]=useState(0);const [pick,setPick]=useState<string|null>(null);const current=cases[caseIndex];const methods=['الترشيح','المغناطيس','التبخير'];
 function choose(m:string){if(pick)return;setPick(m);onOutcome?.(m===current.method)}
 function next(){setCaseIndex(v=>(v+1)%cases.length);setPick(null)}
 return <div className="scienceSimulation separationSim"><Head icon="🧪" title="اختاري طريقة الفصل من خاصية المخلوط" text="لا نحفظ اسم الطريقة وحده؛ نبحث أولًا عن الخاصية التي تختلف بين المكونات."/><div className="mixtureCard"><span>{current.icon}</span><strong>{current.mix}</strong></div><div className="studioChoices">{methods.map(m=><button key={m} disabled={!!pick} onClick={()=>choose(m)}>{m}</button>)}</div>{pick&&<><Feedback ok={pick===current.method} text={current.why}/><button className="simNext" onClick={next}>مخلوط آخر ←</button></>}</div>
}

function ChangeLab({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const cases=[{label:'ذوبان الثلج',icon:'🧊→💧',kind:'فيزيائي',why:'تغيرت الحالة لكن المادة بقيت ماءً.'},{label:'احتراق الورق',icon:'📄🔥',kind:'كيميائي',why:'تكونت مواد جديدة مثل الرماد والغازات.'},{label:'تقطيع الورق',icon:'📄✂️',kind:'فيزيائي',why:'تغير الشكل والحجم دون تكوّن مادة جديدة.'}];const [i,setI]=useState(0);const [pick,setPick]=useState<string|null>(null);const c=cases[i];function choose(kind:string){if(pick)return;setPick(kind);onOutcome?.(kind===c.kind)}function next(){setI(v=>(v+1)%cases.length);setPick(null)}
 return <div className="scienceSimulation changeSim"><Head icon="🔄" title="هل تكوّنت مادة جديدة؟" text="استخدمي السؤال الحاسم في كل حالة: هل ظهرت مادة جديدة أم تغير الشكل/الحالة فقط؟"/><div className="changeCase"><span>{c.icon}</span><strong>{c.label}</strong></div><div className="studioChoices"><button disabled={!!pick} onClick={()=>choose('فيزيائي')}>تغير فيزيائي</button><button disabled={!!pick} onClick={()=>choose('كيميائي')}>تغير كيميائي</button></div>{pick&&<><Feedback ok={pick===c.kind} text={c.why}/><button className="simNext" onClick={next}>مثال آخر ←</button></>}</div>
}

function Counter({label,value,setValue,min,max,step=1}:{label:string;value:number;setValue:(v:number)=>void;min:number;max:number;step?:number}){return <label className="advancedCounter"><span>{label}</span><div><button onClick={()=>setValue(Math.max(min,value-step))}>−</button><strong>{value}</strong><button onClick={()=>setValue(Math.min(max,value+step))}>+</button></div></label>}
