'use client';
import {useState} from 'react';
import type {Lesson} from '../../../lib/data';

export function supportsChemistrySimulation(lesson:Lesson){return ['g7-science-important-compounds','g7-science-chemical-reactions'].includes(lesson.id)}
export default function ChemistrySimulationStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 if(lesson.id==='g7-science-important-compounds')return <CompoundStudio onOutcome={onOutcome}/>;
 if(lesson.id==='g7-science-chemical-reactions')return <ReactionStudio onOutcome={onOutcome}/>;
 return null;
}
function Head({icon,title,text}:{icon:string;title:string;text:string}){return <div className="conceptStudioHead"><span>{icon}</span><div><small>مختبر الكيمياء</small><h4>{title}</h4><p>{text}</p></div></div>}
function Feedback({ok,text}:{ok:boolean;text:string}){return <div className={ok?'studioFeedback ok':'studioFeedback learn'}><strong>{ok?'⭐ ممتاز':'💡 راجعي النموذج'}</strong><p>{text}</p></div>}

function CompoundStudio({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const compounds=[{formula:'H₂O',name:'الماء',atoms:[['H','هيدروجين'],['H','هيدروجين'],['O','أكسجين']],correct:'هيدروجين + أكسجين'},{formula:'NaCl',name:'كلوريد الصوديوم (ملح الطعام)',atoms:[['Na','صوديوم'],['Cl','كلور']],correct:'صوديوم + كلور'},{formula:'CO₂',name:'ثاني أكسيد الكربون',atoms:[['C','كربون'],['O','أكسجين'],['O','أكسجين']],correct:'كربون + أكسجين'}];
 const [index,setIndex]=useState(0);const [pick,setPick]=useState<string|null>(null);const c=compounds[index];const options=['هيدروجين + أكسجين','صوديوم + كلور','كربون + أكسجين'];
 function choose(x:string){if(pick)return;setPick(x);onOutcome?.(x===c.correct)}
 function next(){setIndex(v=>(v+1)%compounds.length);setPick(null)}
 return <div className="chemistryStudio"><Head icon="🧪" title="افتحي الصيغة وشاهدي الذرات" text="المركب يتكون من عنصرين أو أكثر متحدين كيميائيًا بنسب محددة؛ الصيغة تساعدنا على رؤية العناصر وعدد الذرات."/><div className="compoundSelector">{compounds.map((x,i)=><button className={i===index?'active':''} key={x.formula} onClick={()=>{setIndex(i);setPick(null)}}><strong>{x.formula}</strong><small>{x.name}</small></button>)}</div><div className="moleculeStage">{c.atoms.map(([symbol,name],i)=><div className={`atomChip atom${symbol.replace(/[^A-Za-z]/g,'')}`} key={`${symbol}-${i}`}><strong>{symbol}</strong><small>{name}</small></div>)}</div><h5>ما العنصران اللذان يتكون منهما {c.name}؟</h5><div className="studioChoices">{options.map(x=><button disabled={!!pick} key={x} onClick={()=>choose(x)}>{x}</button>)}</div>{pick&&<><Feedback ok={pick===c.correct} text={`${c.formula} يتكون من ${c.correct}. اتحاد العناصر كيميائيًا يعطي مركبًا بخصائصه الخاصة.`}/><button className="simNext" onClick={next}>مركب آخر ←</button></>}</div>
}

function ReactionStudio({onOutcome}:{onOutcome?:(ok:boolean)=>void}){
 const [step,setStep]=useState<0|1|2>(0);const [pick,setPick]=useState<number|null>(null);const [evidence,setEvidence]=useState<string[]>([]);
 const evidenceOptions=[{label:'انطلاق غاز',valid:true,icon:'💨'},{label:'تكوّن راسب',valid:true,icon:'🫧'},{label:'تغير لون واضح',valid:true,icon:'🎨'},{label:'تغير حراري',valid:true,icon:'🌡️'},{label:'نقل الوعاء من مكان لآخر',valid:false,icon:'📦'}];
 function chooseConcept(i:number){if(pick!==null)return;setPick(i);onOutcome?.(i===1)}
 function toggleEvidence(label:string){setEvidence(v=>v.includes(label)?v.filter(x=>x!==label):[...v,label])}
 const evidenceCorrect=evidence.length>0&&evidence.every(x=>evidenceOptions.find(e=>e.label===x)?.valid);
 return <div className="chemistryStudio reactionStudio"><Head icon="⚗️" title="من المتفاعلات إلى النواتج" text="في التفاعل الكيميائي لا تختفي الذرات؛ يعاد ترتيبها لتكوين مواد جديدة."/><div className="reactionFlow"><div className={step>=0?'active':''}><small>1</small><strong>المتفاعلات</strong><span>مواد البداية</span></div><b>→</b><div className={step>=1?'active':''}><small>2</small><strong>إعادة ترتيب</strong><span>الذرات ترتبط بطريقة جديدة</span></div><b>→</b><div className={step>=2?'active':''}><small>3</small><strong>النواتج</strong><span>مواد جديدة</span></div></div><div className="studioControls"><button disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1) as 0|1|2)}>→ السابق</button><button disabled={step===2} onClick={()=>setStep(v=>Math.min(2,v+1) as 0|1|2)}>التالي ←</button></div><h5>ماذا يحدث للذرات في التفاعل؟</h5><div className="studioChoices"><button disabled={pick!==null} onClick={()=>chooseConcept(0)}>تختفي الذرات</button><button disabled={pick!==null} onClick={()=>chooseConcept(1)}>يعاد ترتيب الذرات لتكوين مواد جديدة</button><button disabled={pick!==null} onClick={()=>chooseConcept(2)}>تبقى كل المواد كما هي</button></div>{pick!==null&&<Feedback ok={pick===1} text="الذرات لا تختفي؛ يعاد ترتيبها، لذلك تتكون مواد جديدة تسمى النواتج."/>}<div className="evidencePanel"><strong>🔎 اختاري علامات قد تدل على تفاعل كيميائي</strong><div>{evidenceOptions.map(e=><button className={evidence.includes(e.label)?'active':''} key={e.label} onClick={()=>toggleEvidence(e.label)}><span>{e.icon}</span>{e.label}</button>)}</div>{evidence.length>0&&<small>{evidenceCorrect?'اختياراتك كلها أدلة محتملة على حدوث تفاعل.':'هناك اختيار لا يدل وحده على تفاعل؛ فكري: هل نتجت مادة جديدة أم تغير المكان فقط؟'}</small>}</div></div>
}
