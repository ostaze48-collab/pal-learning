'use client';
import {useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';

type PartId='membrane'|'nucleus'|'cytoplasm'|'wall'|'chloroplast'|'vacuole';
type Part={id:PartId;label:string;icon:string;shared:boolean;plant:boolean;function:string;analogy:string};

const parts:Part[]=[
 {id:'membrane',label:'الغشاء الخلوي',icon:'🫧',shared:true,plant:true,function:'يحيط بالخلية وينظم مرور المواد عبر حدودها.',analogy:'مثل بوابة ذكية للخلية.'},
 {id:'nucleus',label:'النواة',icon:'🎯',shared:true,plant:true,function:'تتحكم في كثير من أنشطة الخلية.',analogy:'مثل مركز الإدارة.'},
 {id:'cytoplasm',label:'السيتوبلازم',icon:'💧',shared:true,plant:true,function:'وسط توجد فيه مكونات الخلية.',analogy:'مثل مساحة العمل داخل الخلية.'},
 {id:'wall',label:'الجدار الخلوي',icon:'🧱',shared:false,plant:true,function:'يدعم الخلية النباتية ويعطيها شكلًا أكثر ثباتًا.',analogy:'مثل جدار داعم حول الخلية النباتية.'},
 {id:'chloroplast',label:'البلاستيدات الخضراء',icon:'🌿',shared:false,plant:true,function:'من الأجزاء المميزة للخلية النباتية وتساعد النبات في صنع غذائه.',analogy:'مثل وحدات تستفيد من الضوء في الخلية النباتية.'},
 {id:'vacuole',label:'الفجوة العصارية',icon:'💧',shared:false,plant:true,function:'تكون كبيرة غالبًا في الخلية النباتية وتساعد في التخزين.',analogy:'مثل خزان داخل الخلية.'}
];

const stages=[
 {id:'zoom',label:'ما الخلية؟',icon:'🔍'},
 {id:'inside',label:'داخلها',icon:'🧫'},
 {id:'compare',label:'نقارن',icon:'↔️'},
 {id:'detective',label:'محقق الخلية',icon:'🕵️'}
] as const;

type Stage=typeof stages[number]['id'];

export default function CellJourneyStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 const [stage,setStage]=useState<Stage>('zoom');
 const [zoom,setZoom]=useState(0);
 const [activePart,setActivePart]=useState<PartId>('nucleus');
 const [kind,setKind]=useState<'plant'|'animal'>('plant');
 const [detectivePick,setDetectivePick]=useState<'plant'|'animal'|null>(null);
 const [functionPick,setFunctionPick]=useState<PartId|null>(null);
 const active=parts.find(p=>p.id===activePart)??parts[1];
 const zoomSteps=useMemo(()=>[
  {title:'كائن حي',text:'أجسام الكائنات الحية مبنية من وحدات صغيرة جدًا.'},
  {title:'نقترب أكثر',text:'كلما اقتربنا نصل إلى وحدات البناء الأساسية.'},
  {title:'الخلية',text:'الخلية هي الوحدة الأساسية في بناء أجسام الكائنات الحية.'}
 ],[]);
 const detectiveCorrect='plant';
 function moveStage(next:Stage){setStage(next);setDetectivePick(null);setFunctionPick(null)}
 function chooseFunction(id:PartId){if(functionPick)return;setFunctionPick(id);onOutcome?.(id==='nucleus')}
 function chooseDetective(value:'plant'|'animal'){if(detectivePick)return;setDetectivePick(value);onOutcome?.(value===detectiveCorrect)}
 return <div className="cellJourneyStudio advancedStudio">
  <div className="cellJourneyHead"><div className="cellJourneyMascot">🔬</div><div><small>رحلة داخل الخلية</small><h4>لن نحفظ الأجزاء — سنكتشف لماذا هي موجودة</h4><p>المعلومات من درس الخلية، لكننا سنبني الصورة خطوة خطوة حتى تصبح الفكرة واضحة في ذهنك.</p></div></div>
  <div className="cellJourneyProgress">{stages.map((s,i)=><button key={s.id} className={`${stage===s.id?'active':''} ${stages.findIndex(x=>x.id===stage)>i?'done':''}`} onClick={()=>moveStage(s.id)}><span>{s.icon}</span><b>{s.label}</b></button>)}</div>

  {stage==='zoom'&&<section className="cellJourneyScene zoomScene"><div className="zoomVisual"><div className={`zoomRing level${zoom}`}><span>{zoom===0?'🌱':zoom===1?'🔍':'🧫'}</span></div></div><div className="zoomNarrative"><small>الخطوة {zoom+1} من 3</small><h5>{zoomSteps[zoom].title}</h5><p>{zoomSteps[zoom].text}</p>{zoom<2?<button onClick={()=>setZoom(v=>Math.min(2,v+1))}>اقتربي أكثر 🔍</button>:<button onClick={()=>moveStage('inside')}>ادخلي إلى الخلية ←</button>}</div></section>}

  {stage==='inside'&&<section className="cellJourneyScene"><div className="cellExplorer"><div className={`journeyCell ${kind}`}><span className="journeyNucleus">نواة</span><span className="journeyCytoplasm">سيتوبلازم</span><span className="journeyMembrane">غشاء</span>{kind==='plant'&&<><span className="journeyWall">جدار</span><span className="journeyChloroplast one">●</span><span className="journeyChloroplast two">●</span><span className="journeyVacuole">فجوة</span></>}</div><div className="cellPartButtons">{parts.filter(p=>kind==='plant'||p.shared).map(p=><button key={p.id} className={activePart===p.id?'active':''} onClick={()=>setActivePart(p.id)}><span>{p.icon}</span>{p.label}</button>)}</div></div><div className="cellPartStory"><span>{active.icon}</span><small>{active.label}</small><h5>{active.function}</h5><p>{active.analogy} <b>التشبيه للمساعدة فقط؛ الاسم والوظيفة العلمية هما الأساس.</b></p></div><div className="cellFunctionCheck"><h5>من المسؤول عن التحكم في كثير من أنشطة الخلية؟</h5><div className="studioChoices"><button disabled={!!functionPick} onClick={()=>chooseFunction('membrane')}>الغشاء الخلوي</button><button disabled={!!functionPick} onClick={()=>chooseFunction('nucleus')}>النواة</button><button disabled={!!functionPick} onClick={()=>chooseFunction('cytoplasm')}>السيتوبلازم</button></div>{functionPick&&<div className={functionPick==='nucleus'?'studioFeedback ok':'studioFeedback learn'}><strong>{functionPick==='nucleus'?'⭐ ربطتِ الجزء بوظيفته':'💡 قارني الوظيفة بالأجزاء'}</strong><p>النواة تتحكم في كثير من أنشطة الخلية.</p></div>}</div><button className="cellJourneyNext" onClick={()=>moveStage('compare')}>الآن نقارن النوعين ←</button></section>}

  {stage==='compare'&&<section className="cellJourneyScene"><div className="studioTabs"><button className={kind==='plant'?'active':''} onClick={()=>setKind('plant')}>🌿 خلية نباتية</button><button className={kind==='animal'?'active':''} onClick={()=>setKind('animal')}>🐾 خلية حيوانية</button></div><div className="cellCompareGrid"><div className="cellCompareCard shared"><strong>مشترك بينهما</strong><span>الغشاء الخلوي</span><span>النواة</span><span>السيتوبلازم</span></div><div className="cellCompareCard plantOnly"><strong>يميز النباتية في درسنا</strong><span>الجدار الخلوي</span><span>البلاستيدات الخضراء</span><span>فجوة عصارية كبيرة غالبًا</span></div></div><div className="studioFeedback ok"><strong>الفكرة الأهم</strong><p>لا نميز الخلية النباتية لأنها «خضراء» فقط؛ نبحث عن دليل من تركيبها، مثل الجدار الخلوي أو البلاستيدات الخضراء.</p></div><button className="cellJourneyNext" onClick={()=>moveStage('detective')}>ابدئي مهمة المحقق 🕵️</button></section>}

  {stage==='detective'&&<section className="cellJourneyScene detectiveScene"><div className="detectiveClues"><span>🔎 الدليل 1: لها غشاء خلوي ونواة وسيتوبلازم.</span><span>🔎 الدليل 2: لها جدار خلوي.</span><span>🔎 الدليل 3: تحتوي بلاستيدات خضراء.</span></div><h5>ما نوع هذه الخلية؟ وما الدليل الأقوى؟</h5><div className="studioChoices"><button disabled={!!detectivePick} onClick={()=>chooseDetective('animal')}>خلية حيوانية</button><button disabled={!!detectivePick} onClick={()=>chooseDetective('plant')}>خلية نباتية</button></div>{detectivePick&&<div className={detectivePick===detectiveCorrect?'studioFeedback ok':'studioFeedback learn'}><strong>{detectivePick===detectiveCorrect?'🏆 حللتِ الأدلة مثل عالمة':'💡 أعيدي قراءة الدليلين 2 و3'}</strong><p>{detectivePick===detectiveCorrect?'الجدار الخلوي والبلاستيدات الخضراء دليلان على أنها خلية نباتية.':'النواة والغشاء والسيتوبلازم مشتركة؛ ابحثي عن الجزء المميز.'}</p></div>}<div className="cellTeachBack"><strong>قوليها بطريقتك</strong><p>بعد هذا المختبر سيطلب منك المعلم أن تشرحي: ما الخلية؟ وما الأجزاء الأساسية؟ وكيف تميزين النباتية عن الحيوانية؟</p></div><small className="cellBookAnchor">📘 مرجع الفكرة: {lesson.title} — الهدف أن تفهمي معلومات الدرس كاملة بطريقة أوضح، لا أن تحفظي شكلًا واحدًا.</small></section>}
 </div>
}
