'use client';
import {useMemo,useState} from 'react';
import type {TeachingVisualSpec} from '../../../lib/teachingVisuals';
import styles from './CurriculumConceptVisual.module.css';

function visualMeta(variant?:string){const [lessonId='',objective='0',scene='1']=String(variant||'').split('|');return {lessonId,objectiveId:Number(objective)||0,sceneNumber:Number(scene)||1}}
function lessonKey(variant?:string){return visualMeta(variant).lessonId}

export default function CurriculumConceptVisual({spec}:{spec:TeachingVisualSpec}){
 if(spec.kind==='factor_tree')return <FactorTree/>;
 if(spec.kind==='fraction_bar')return <FractionBar variant={spec.variant}/>;
 if(spec.kind==='decimal_grid')return <DecimalGrid/>;
 if(spec.kind==='geometry_lab')return <GeometryLab lessonId={lessonKey(spec.variant)}/>;
 if(spec.kind==='data_chart')return <DataChart/>;
 if(spec.kind==='proportion_lab')return <ProportionLab variant={spec.variant}/>;
 if(spec.kind==='motion_lab')return <MotionLab variant={spec.variant}/>;
 if(spec.kind==='force_lab')return <ForceLab/>;
 if(spec.kind==='atom_builder')return <AtomBuilder/>;
 if(spec.kind==='reaction_lab')return <ReactionLab/>;
 if(spec.kind==='pressure_lab')return <PressureLab/>;
 if(spec.kind==='arabic_pattern')return <ArabicPattern lessonId={lessonKey(spec.variant)}/>;
 if(spec.kind==='hamza_lab')return <HamzaLab lessonId={lessonKey(spec.variant)}/>;
 if(spec.kind==='tense_timeline')return <TenseTimeline lessonId={lessonKey(spec.variant)}/>;
 return null;
}

function Shell({title,icon,children,hint}:{title:string;icon:string;children:React.ReactNode;hint?:string}){
 return <div className={styles.shell}><div className={styles.title}><span>{icon}</span><strong>{title}</strong></div><div className={styles.stage}>{children}</div>{hint&&<div className={styles.hint}>{hint}</div>}</div>
}

function FactorTree(){
 const [step,setStep]=useState(0);const number=24;
 return <Shell icon="🌳" title="ابني شجرة العوامل" hint="كلما وصلنا إلى أعداد أولية تتوقف الأغصان."><div className={styles.factorTree}><div className={styles.factorRoot}>{number}</div><div className={`${styles.factorBranch} ${step>=1?styles.show:''}`}><span>6</span><span>4</span></div><div className={`${styles.factorLeaves} ${step>=2?styles.show:''}`}><span>2</span><span>3</span><span>2</span><span>2</span></div><button className={styles.playButton} onClick={()=>setStep(v=>v>=2?0:v+1)}>{step===0?'قسّمي 24 إلى عاملين':step===1?'حللي العوامل أكثر':'أعيدي الشجرة ↻'}</button></div></Shell>
}

function FractionStrip({num,den}:{num:number;den:number}){return <div className={styles.fractionBar} style={{gridTemplateColumns:`repeat(${den},1fr)`}}>{Array.from({length:den}).map((_,i)=><button type="button" aria-label={`الجزء ${i+1}`} tabIndex={-1} key={i} className={i<num?styles.filledFraction:''}/>)}</div>}
function FractionBar({variant}:{variant?:string}){
 const {sceneNumber,lessonId}=visualMeta(variant);const [den,setDen]=useState(4);const [num,setNum]=useState(1);const [pair,setPair]=useState(0);const safeNum=Math.min(num,den);
 const equivalents=[[1,2],[1,3],[2,3],[3,4]] as const;const [baseNum,baseDen]=equivalents[pair];
 if(sceneNumber===2){
  const decimalBridge=/decimal/.test(lessonId);const secondNum=baseNum*2;const secondDen=baseDen*2;
  return <Shell icon="🟰" title={decimalBridge?'اربطي العشري بالكسر':'قارني تمثيلين للكمية نفسها'} hint={decimalBridge?`${baseNum}/${baseDen} = ${secondNum}/${secondDen} — الكمية نفسها حتى لو تغيّر عدد الأجزاء.`:`${baseNum}/${baseDen} = ${secondNum}/${secondDen} لأننا قسمنا كل جزء إلى جزأين أصغر دون تغيير الكمية.`}><div className={styles.fractionLab}><FractionStrip num={baseNum} den={baseDen}/><div className={styles.bigValue}>{baseNum}/{baseDen} = {secondNum}/{secondDen}</div><FractionStrip num={secondNum} den={secondDen}/><div className={styles.controls}><span>جرّبي مثالًا</span>{equivalents.map(([n,d],i)=><button type="button" className={pair===i?styles.activeButton:''} key={`${n}/${d}`} onClick={()=>setPair(i)}>{n}/{d}</button>)}</div></div></Shell>
 }
 return <Shell icon="🍫" title="قسّمي الشريط ثم لوّني الأجزاء" hint={`${safeNum} من ${den} أجزاء = ${safeNum}/${den}`}><div className={styles.fractionLab}><div className={styles.fractionBar} style={{gridTemplateColumns:`repeat(${den},1fr)`}}>{Array.from({length:den}).map((_,i)=><button aria-label={`الجزء ${i+1}`} key={i} className={i<safeNum?styles.filledFraction:''} onClick={()=>setNum(i+1)}/>)}</div><div className={styles.controls}><span>عدد الأجزاء</span>{[2,3,4,5,6].map(n=><button className={den===n?styles.activeButton:''} key={n} onClick={()=>{setDen(n);setNum(v=>Math.min(v,n))}}>{n}</button>)}</div></div></Shell>
}

function DecimalGrid(){
 const [tenths,setTenths]=useState(4);
 return <Shell icon="🔟" title="شاهدي الجزء العشري" hint={`${tenths} أعشار = 0.${tenths}`}><div className={styles.decimalLab}><div className={styles.tenGrid}>{Array.from({length:10}).map((_,i)=><button key={i} className={i<tenths?styles.decimalFilled:''} onClick={()=>setTenths(i+1)}>{i<tenths?'●':''}</button>)}</div><div className={styles.bigValue}>0.{tenths}</div><input aria-label="الأعشار" type="range" min="1" max="9" value={tenths} onChange={e=>setTenths(Number(e.target.value))}/></div></Shell>
}

function GeometryLab({lessonId}:{lessonId:string}){
 const prism=/prism|cube|pyramid|net/.test(lessonId);const triangle=/triangle/.test(lessonId);
 const [a,setA]=useState(4);const [b,setB]=useState(3);
 const area=triangle?(a*b/2):(a*b);
 return <Shell icon={prism?'📦':'📐'} title={prism?'افتحي المجسم في خيالك':'غيّري الأبعاد وشاهدي المساحة'} hint={prism?'الأوجه المسطحة يمكن أن تُفتح إلى شبكة ثم تعود لتكوّن مجسمًا.':`المساحة الآن = ${area}`}>
  {prism?<PrismNet/>:<div className={styles.geometryLab}><div className={`${styles.shape} ${triangle?styles.triangle:styles.rectangle}`} style={!triangle?{width:`${90+a*10}px`,height:`${55+b*8}px`}:undefined}/><div className={styles.geometryNumbers}><button onClick={()=>setA(v=>v===7?2:v+1)}>القاعدة {a}</button><button onClick={()=>setB(v=>v===6?2:v+1)}>الارتفاع {b}</button></div><strong>{triangle?'½ × القاعدة × الارتفاع':'الطول × العرض'}</strong></div>}
 </Shell>
}

function PrismNet(){const [open,setOpen]=useState(false);return <div className={styles.netLab}><div className={`${styles.cubeToy} ${open?styles.openNet:''}`}>{Array.from({length:6}).map((_,i)=><i key={i}/>)}</div><button className={styles.playButton} onClick={()=>setOpen(v=>!v)}>{open?'أعيدي طي الشبكة':'افتحي المجسم'}</button></div>}

function DataChart(){
 const values=[2,5,3,7,4];const [picked,setPicked]=useState(1);const mean=(values.reduce((a,b)=>a+b,0)/values.length).toFixed(1);
 return <Shell icon="📊" title="المسي الأعمدة واقرئي البيانات" hint={`متوسط القيم = ${mean}`}><div className={styles.chartLab}><div className={styles.bars}>{values.map((v,i)=><button key={i} className={picked===i?styles.pickedBar:''} style={{height:`${35+v*13}px`}} onClick={()=>setPicked(i)}><span>{v}</span></button>)}</div><div className={styles.chartReadout}>القيمة المختارة: <strong>{values[picked]}</strong></div></div></Shell>
}

function ProportionLab({variant}:{variant?:string}){
 const {lessonId,sceneNumber}=visualMeta(variant);const inverse=/inverse/.test(lessonId);const scale=/scale/.test(lessonId);const [level,setLevel]=useState(2);
 if(inverse){const workers=level;const days=24/workers;return <Shell icon="🔄" title={sceneNumber===2?'ثبتي حاصل الضرب':'غيّري عدد العمال وراقبي الزمن'} hint={sceneNumber===2?`${workers} × ${days} = 24 — عندما تزيد واحدة تنقص الأخرى ليبقى الناتج ثابتًا.`:'للمهمة نفسها، زيادة عدد العمال تقلل الزمن.'}><div className={styles.ratioLab}><div><span>👥</span><strong>{workers} عمال</strong></div><div className={styles.ratioArrow}>×</div><div><span>📅</span><strong>{days} أيام</strong></div><div className={styles.controls}>{[2,3,4,6,8,12].map(n=><button className={workers===n?styles.activeButton:''} key={n} onClick={()=>setLevel(n)}>{n}</button>)}</div>{sceneNumber===2&&<div className={styles.bigValue} style={{gridColumn:'1/-1'}}>{workers} × {days} = 24</div>}</div></Shell>}
 if(scale){const cm=level;const real=cm*4;return <Shell icon="🗺️" title={sceneNumber===2?'اختبري ثبات مقياس الرسم':'من الرسم إلى الحقيقة'} hint={`${cm} سم على الرسم = ${real} كم إذا كان كل 1 سم يمثل 4 كم.`}><div className={styles.ratioLab}><div><span>📏</span><strong>{cm} سم</strong></div><div className={styles.ratioArrow}>➜</div><div><span>🗺️</span><strong>{real} كم</strong></div><div className={styles.controls}>{[1,2,3,5].map(n=><button className={cm===n?styles.activeButton:''} key={n} onClick={()=>setLevel(n)}>{n}</button>)}</div>{sceneNumber===2&&<div className={styles.bigValue} style={{gridColumn:'1/-1'}}>{real} ÷ {cm} = 4</div>}</div></Shell>}
 const people=level;const cups=people/2;return <Shell icon="⚖️" title={sceneNumber===2?'اكشفي النسبة الثابتة':'كبّري الكميتين معًا'} hint={sceneNumber===2?`${people} ÷ ${cups} = 2 — العلاقة بقيت ثابتة.`:'في التناسب الطردي تتغير الكميتان بالمعدل نفسه.'}><div className={styles.ratioLab}><div><span>👧</span><strong>{people} أشخاص</strong></div><div className={styles.ratioArrow}>↔</div><div><span>🥛</span><strong>{cups} كوب</strong></div><div className={styles.controls}>{[2,4,6,8].map(n=><button className={people===n?styles.activeButton:''} key={n} onClick={()=>setLevel(n)}>{n}</button>)}</div>{sceneNumber===2&&<div className={styles.bigValue} style={{gridColumn:'1/-1'}}>{people} ÷ {cups} = 2</div>}</div></Shell>
}

function MotionLab({variant}:{variant?:string}){
 const {lessonId,sceneNumber}=visualMeta(variant);
 if(sceneNumber===2&&/average-speed/.test(lessonId))return <SpeedRelationLab/>;
 if(sceneNumber===2&&/constant-acceleration/.test(lessonId))return <AccelerationRelationLab/>;
 if(sceneNumber===2&&/distance-displacement/.test(lessonId))return <DistanceDisplacementCompare/>;
 return <MotionPathLab lessonId={lessonId}/>;
}
function MotionPathLab({lessonId}:{lessonId:string}){
 const [position,setPosition]=useState(0);const displacement=/distance-displacement/.test(lessonId);const [distance,setDistance]=useState(0);
 function move(delta:number){setPosition(v=>Math.max(-4,Math.min(4,v+delta)));setDistance(v=>v+Math.abs(delta))}
 return <Shell icon="🚗" title={displacement?'قارني المسافة بالإزاحة':'حرّكي الجسم وراقبي موضعه'} hint={displacement?`المسافة التي قطعتها = ${distance} · موضعك من البداية = ${position}`:'الحركة تعني أن الموضع يتغير بالنسبة إلى مرجع.'}><div className={styles.motionLab}><div className={styles.road}><span className={styles.home}>🏠</span><span className={styles.car} style={{transform:`translateX(${position*24}px)`}}>🚗</span><span className={styles.school}>🏫</span></div><div className={styles.controls}><button onClick={()=>move(-1)}>← خطوة</button><button onClick={()=>{setPosition(0);setDistance(0)}}>↻ البداية</button><button onClick={()=>move(1)}>خطوة →</button></div></div></Shell>
}
function SpeedRelationLab(){const [distance,setDistance]=useState(60);const [time,setTime]=useState(12);const speed=(distance/time).toFixed(1);return <Shell icon="⏱️" title="غيّري المسافة والزمن واحسبي السرعة" hint={`السرعة المتوسطة = ${distance} ÷ ${time} = ${speed} م/ث`}><div className={styles.motionLab}><div className={styles.bigValue}>{speed} م/ث</div><div className={styles.sliderRow}><label>المسافة <b>{distance} م</b><input type="range" min="30" max="120" step="15" value={distance} onChange={e=>setDistance(Number(e.target.value))}/></label><label>الزمن <b>{time} ث</b><input type="range" min="6" max="24" step="3" value={time} onChange={e=>setTime(Number(e.target.value))}/></label></div></div></Shell>}
function AccelerationRelationLab(){const start=4;const [end,setEnd]=useState(10);const [time,setTime]=useState(3);const acceleration=((end-start)/time).toFixed(1);return <Shell icon="📈" title="راقبي تغير السرعة مع الزمن" hint={`التسارع = (${end} − ${start}) ÷ ${time} = ${acceleration} م/ث²`}><div className={styles.motionLab}><div className={styles.bigValue}>{acceleration} م/ث²</div><div className={styles.sliderRow}><label>السرعة النهائية <b>{end}</b><input type="range" min="5" max="16" value={end} onChange={e=>setEnd(Number(e.target.value))}/></label><label>الزمن <b>{time} ث</b><input type="range" min="1" max="6" value={time} onChange={e=>setTime(Number(e.target.value))}/></label></div></div></Shell>}
function DistanceDisplacementCompare(){const journeys=[{label:'4 شرقًا ثم 4 غربًا',distance:8,displacement:0},{label:'3 شرقًا ثم 1 غربًا',distance:4,displacement:2},{label:'2 غربًا ثم 5 شرقًا',distance:7,displacement:3}];const [picked,setPicked]=useState(0);const trip=journeys[picked];return <Shell icon="🧭" title="قارني الطريق بنقطة الوصول" hint="المسافة تجمع طول الطريق، أما الإزاحة فتنظر من البداية إلى النهاية."><div className={styles.motionLab}><div className={styles.wordCard}><span>{trip.label}</span><strong>المسافة {trip.distance} م · مقدار الإزاحة {trip.displacement} م</strong></div><div className={styles.controls}>{journeys.map((x,i)=><button key={x.label} className={picked===i?styles.activeButton:''} onClick={()=>setPicked(i)}>رحلة {i+1}</button>)}</div></div></Shell>}

function ForceLab(){
 const [force,setForce]=useState(4);const [mass,setMass]=useState(2);const acceleration=(force/mass).toFixed(1);
 return <Shell icon="🛒" title="غيّري القوة والكتلة" hint={`التسارع = ${force} ÷ ${mass} = ${acceleration}`}><div className={styles.forceLab}><div className={styles.forceScene}><span className={styles.pushArrow} style={{fontSize:18+force*2}}>➜</span><span className={styles.cart}>🛒</span><span className={styles.accelMarks}>{Number(acceleration)>=3?'💨💨💨':Number(acceleration)>=2?'💨💨':'💨'}</span></div><div className={styles.sliderRow}><label>القوة <b>{force}</b><input type="range" min="2" max="8" step="2" value={force} onChange={e=>setForce(Number(e.target.value))}/></label><label>الكتلة <b>{mass}</b><input type="range" min="1" max="4" value={mass} onChange={e=>setMass(Number(e.target.value))}/></label></div></div></Shell>
}

function AtomBuilder(){
 const [protons,setProtons]=useState(2);const [electrons,setElectrons]=useState(2);
 return <Shell icon="⚛️" title="ابني ذرة بسيطة" hint={protons===electrons?'الشحنة متعادلة الآن.':'عدد البروتونات والإلكترونات غير متساوٍ.'}><div className={styles.atomLab}><div className={styles.atom}><div className={styles.nucleusToy}>{Array.from({length:protons}).map((_,i)=><i key={i}>+</i>)}</div>{Array.from({length:electrons}).map((_,i)=><span key={i} style={{transform:`rotate(${i*(360/Math.max(1,electrons))}deg) translateX(70px)`}}>−</span>)}</div><div className={styles.controls}><button onClick={()=>setProtons(v=>v===4?1:v+1)}>بروتون +</button><button onClick={()=>setElectrons(v=>v===4?1:v+1)}>إلكترون −</button></div></div></Shell>
}

function ReactionLab(){
 const [mixed,setMixed]=useState(false);
 return <Shell icon="🧪" title="راقبي قبل وبعد" hint={mixed?'تكوّن ترتيب جديد للجسيمات؛ قارني ما قبل وما بعد.':'ابدئي بمواد منفصلة ثم شغّلي التغير.'}><div className={styles.reactionLab}><div className={styles.molecules}>{mixed?<><span>🔵🔴</span><span>🔵🔴</span><span>🔵🔴</span></>:<><span>🔵 🔵 🔵</span><span>🔴 🔴 🔴</span></>}</div><button className={styles.playButton} onClick={()=>setMixed(v=>!v)}>{mixed?'أعيدي البداية':'ابدئي التغير ✨'}</button></div></Shell>
}

function PressureLab(){
 const [pressed,setPressed]=useState(false);
 return <Shell icon="🌬️" title="اضغطي الهواء داخل الحيز" hint={pressed?'عندما صغر الحيز أصبح الهواء أكثر ازدحامًا.':'الهواء يملأ الحيز حتى لو لم نره.'}><div className={styles.pressureLab}><div className={styles.syringe}><div className={styles.plunger} style={{transform:`translateX(${pressed?55:0}px)`}}/><div className={styles.airDots}>{Array.from({length:9}).map((_,i)=><i key={i}/>)}</div></div><button className={styles.playButton} onClick={()=>setPressed(v=>!v)}>{pressed?'اتركي المكبس':'اضغطي المكبس'}</button></div></Shell>
}

function ArabicPattern({lessonId}:{lessonId:string}){
 const isVerb=/verb/.test(lessonId);const items=isVerb?[['كتبَ','فعل ماضٍ'],['يكتبُ','فعل مضارع'],['اكتبْ','فعل أمر']]:[['كتاب','اسم'],['هو','ضمير'],['جميل','صفة']];
 const [index,setIndex]=useState(0);
 return <Shell icon="🧩" title="بدّلي الكلمة واكتشفي النمط" hint="ركزي على وظيفة الكلمة داخل الجملة، لا على حفظ الاسم وحده."><div className={styles.arabicLab}><div className={styles.wordCard}><span>{items[index][0]}</span><strong>{items[index][1]}</strong></div><div className={styles.controls}>{items.map((x,i)=><button className={index===i?styles.activeButton:''} key={x[0]} onClick={()=>setIndex(i)}>{x[0]}</button>)}</div></div></Shell>
}

function HamzaLab({lessonId}:{lessonId:string}){
 const solar=/solar-lunar/.test(lessonId);const words=solar?[['الشَّمس','تُدغم اللام'],['القمر','تظهر اللام']]:[['سُئِل','همزة متوسطة'],['شاطئ','همزة متطرفة'],['مساء','همزة متطرفة']];const [index,setIndex]=useState(0);
 return <Shell icon="✍️" title={solar?'اسمعي اللام في الكلمة':'شاهدي مكان الهمزة'} hint="الملاحظة في الكلمة تساعدك أكثر من حفظ قائمة طويلة."><div className={styles.spellingLab}><div className={styles.bigWord}>{words[index][0]}</div><div className={styles.ruleBubble}>{words[index][1]}</div><div className={styles.controls}>{words.map((w,i)=><button className={index===i?styles.activeButton:''} key={w[0]} onClick={()=>setIndex(i)}>{w[0]}</button>)}</div></div></Shell>
}

function TenseTimeline({lessonId}:{lessonId:string}){
 const perfect=/perfect/.test(lessonId);const continuous=/continuous/.test(lessonId);const [moment,setMoment]=useState<'past'|'now'|'span'>('now');
 const sentence=perfect?(moment==='past'?'I visited Jerusalem.':moment==='span'?'I have visited Jerusalem.':'I have just finished.'):(continuous?(moment==='now'?'She is reading now.':'She was reading then.'):(moment==='past'?'I played yesterday.':'I play every day.'));
 return <Shell icon="⏳" title="حرّكي الجملة على خط الزمن" hint="اختيار الزمن يبدأ من المعنى: متى يحدث الفعل؟"><div className={styles.tenseLab}><div className={styles.timeline}><button onClick={()=>setMoment('past')} className={moment==='past'?styles.timeActive:''}>أمس</button><i/><button onClick={()=>setMoment('span')} className={moment==='span'?styles.timeActive:''}>من قبل حتى الآن</button><i/><button onClick={()=>setMoment('now')} className={moment==='now'?styles.timeActive:''}>الآن</button></div><div className={styles.englishSentence}>{sentence}</div></div></Shell>
}
