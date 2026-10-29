'use client';
import {useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import type {TeachingVisualSpec} from '../../../lib/teachingVisuals';
import styles from './CurriculumExtraVisual.module.css';

const extraKinds=new Set(['material_properties','energy_flow','reading_lens','word_builder','punctuation_lab','comparison_scale']);

export default function CurriculumExtraVisual({spec,lesson}:{spec:TeachingVisualSpec;lesson:Lesson}){
 if(!extraKinds.has(spec.kind))return null;
 if(spec.kind==='material_properties')return <MaterialProperties/>;
 if(spec.kind==='energy_flow')return <EnergyFlow lessonId={lesson.id}/>;
 if(spec.kind==='reading_lens')return <ReadingLens lesson={lesson}/>;
 if(spec.kind==='word_builder')return <WordBuilder lesson={lesson}/>;
 if(spec.kind==='punctuation_lab')return <PunctuationLab lesson={lesson}/>;
 if(spec.kind==='comparison_scale')return <ComparisonScale/>;
 return null;
}

function Frame({icon,title,hint,children}:{icon:string;title:string;hint:string;children:React.ReactNode}){
 return <div className={styles.frame}><div className={styles.frameTitle}><span>{icon}</span><strong>{title}</strong></div><div className={styles.frameStage}>{children}</div><p className={styles.frameHint}>{hint}</p></div>;
}

function MaterialProperties(){
 const materials=[
  {name:'معدن',icon:'🥄',props:{صلب:true,مرن:false,موصل:true,يذوب:false}},
  {name:'بلاستيك',icon:'🧴',props:{صلب:false,مرن:true,موصل:false,يذوب:false}},
  {name:'زجاج',icon:'🥛',props:{صلب:true,مرن:false,موصل:false,يذوب:false}},
  {name:'ملح',icon:'🧂',props:{صلب:true,مرن:false,موصل:false,يذوب:true}}
 ] as const;
 const properties=['صلب','مرن','موصل','يذوب'] as const;
 const [material,setMaterial]=useState(0);const [property,setProperty]=useState<(typeof properties)[number]>('موصل');
 const current=materials[material];const yes=current.props[property];
 return <Frame icon="🧪" title="المسي المادة واختبري خاصية" hint="نختار المادة المناسبة من خصائصها، لا من اسمها فقط."><div className={styles.materialLab}><div className={styles.materialChoices}>{materials.map((item,i)=><button key={item.name} className={i===material?styles.activeChoice:''} onClick={()=>setMaterial(i)}><span>{item.icon}</span><strong>{item.name}</strong></button>)}</div><div className={styles.propertyChoices}>{properties.map(item=><button key={item} className={item===property?styles.activeProperty:''} onClick={()=>setProperty(item)}>{item}</button>)}</div><div className={`${styles.propertyResult} ${yes?styles.yes:styles.no}`}><span>{yes?'✓':'×'}</span><strong>{current.name} {yes?'يمكن وصفه بأنه':'لا نعدّه'} {property}</strong></div></div></Frame>;
}

function EnergyFlow({lessonId}:{lessonId:string}){
 const environment=/environment/.test(lessonId);const transformations=/transformations/.test(lessonId);
 const devices=[
  {name:'مصباح',icon:'💡',input:'كهربائية',outputs:['ضوئية','حرارية']},
  {name:'مروحة',icon:'🌀',input:'كهربائية',outputs:['حركية','صوتية']},
  {name:'جرس',icon:'🔔',input:'كهربائية',outputs:['صوتية']}
 ];
 const sources=[{name:'الشمس',icon:'☀️',kind:'متجددة'},{name:'الرياح',icon:'🌬️',kind:'متجددة'},{name:'الفحم',icon:'🪨',kind:'غير متجددة'}];
 const [picked,setPicked]=useState(0);
 if(environment){const source=sources[picked];return <Frame icon="🌍" title="اختاري مصدر الطاقة" hint="بعض المصادر تتجدد في الطبيعة، وبعضها يحتاج زمنًا طويلًا جدًا ليتكوّن."><div className={styles.energySources}>{sources.map((item,i)=><button key={item.name} className={i===picked?styles.activeChoice:''} onClick={()=>setPicked(i)}><span>{item.icon}</span><strong>{item.name}</strong></button>)}<div className={styles.energyBadge}>{source.icon} {source.name} — <b>{source.kind}</b></div></div></Frame>}
 const device=devices[picked];
 return <Frame icon="⚡" title={transformations?'تتبعي تحوّل الطاقة':'شاهدي أشكال الطاقة'} hint="الطاقة لا تختفي هنا؛ نلاحظ الشكل الذي دخل والشكل الذي ظهر."><div className={styles.energyLab}><div className={styles.deviceChoices}>{devices.map((item,i)=><button key={item.name} className={i===picked?styles.activeChoice:''} onClick={()=>setPicked(i)}><span>{item.icon}</span><strong>{item.name}</strong></button>)}</div><div className={styles.energyFlow}><div><small>تبدأ بـ</small><strong>{device.input}</strong></div><span>➜</span><div><small>تظهر كـ</small><strong>{device.outputs.join(' + ')}</strong></div></div></div></Frame>;
}

function cleanReadingText(lesson:Lesson){
 const source=(lesson.example||lesson.summary||lesson.title).replace(/\s+/g,' ').trim();
 return source.length>180?`${source.slice(0,177)}…`:source;
}

function ReadingLens({lesson}:{lesson:Lesson}){
 const text=cleanReadingText(lesson);const words=useMemo(()=>text.split(' ').filter(Boolean),[text]);const [picked,setPicked]=useState<number|null>(null);
 const selected=picked===null?'اختاري كلمة من النص':words[picked]?.replace(/[،؛,.!?؟:«»]/g,'')||'';
 return <Frame icon="🔎" title={lesson.id.includes('poem')?'عدسة القصيدة':'عدسة النص'} hint="المعنى يُبنى من الكلمات داخل السياق؛ المسِي كلمة ثم عودي للجملة كاملة."><div className={styles.readingLab}><div className={styles.readingPaper}>{words.map((word,i)=><button key={`${word}-${i}`} className={picked===i?styles.wordPicked:''} onClick={()=>setPicked(i)}>{word}</button>)}</div><div className={styles.lensResult}><span>🔍</span><strong>{selected}</strong></div></div></Frame>;
}

function normalizeEnglish(sentence:string){return sentence.replace(/[.!?,;:]/g,'').replace(/\s+/g,' ').trim()}

function WordBuilder({lesson}:{lesson:Lesson}){
 const base=normalizeEnglish(lesson.example||'We learn together every day');
 const original=useMemo(()=>base.split(' ').filter(Boolean).slice(0,8),[base]);
 const bank=useMemo(()=>original.map((word,i)=>({word,i})).sort((a,b)=>((a.i*7+3)%11)-((b.i*7+3)%11)),[original]);
 const [built,setBuilt]=useState<number[]>([]);
 const complete=built.length===original.length;const correct=complete&&built.every((index,pos)=>index===pos);
 function add(index:number){if(built.includes(index))return;setBuilt(v=>[...v,index])}
 return <Frame icon="🧱" title="ابني الجملة بيدك" hint="ابدئي بالمعنى ثم ضعي الكلمات في ترتيب يصنع جملة واضحة."><div className={styles.wordBuilder}><div className={styles.builtSentence}>{built.length?built.map(index=><button key={index} onClick={()=>setBuilt(v=>v.filter(x=>x!==index))}>{original[index]}</button>):<span>ضعي الكلمات هنا…</span>}</div><div className={styles.wordBank}>{bank.map(item=><button key={item.i} disabled={built.includes(item.i)} onClick={()=>add(item.i)}>{item.word}</button>)}</div>{complete&&<div className={`${styles.builderResult} ${correct?styles.builderGood:''}`}>{correct?'⭐ الجملة مرتبة وواضحة':'💡 قريب! المسِي كلمة في الأعلى لإعادتها ثم رتبي من جديد.'}</div>}<button className={styles.resetButton} onClick={()=>setBuilt([])}>↻ أبدأ من جديد</button></div></Frame>;
}

function PunctuationLab({lesson}:{lesson:Lesson}){
 const raw=normalizeEnglish(lesson.example||'Where are you going');const [mark,setMark]=useState('?');
 const marks=['.','?','!',','];
 return <Frame icon="✍️" title="غيّري العلامة واسمعي الجملة في ذهنك" hint="علامة الترقيم تعطي القارئ إشارة عن طريقة قراءة الجملة."><div className={styles.punctuationLab}><div className={styles.punctuationSentence} dir="ltr">{raw}<b>{mark}</b></div><div className={styles.markChoices}>{marks.map(item=><button key={item} className={mark===item?styles.activeMark:''} onClick={()=>setMark(item)}>{item}</button>)}</div><small>{mark==='?'?'هذه تبدو كسؤال.':mark==='!'?'هذه تحمل انفعالًا قويًا.':mark===','?'هذه وقفة قصيرة داخل الجملة.':'هذه نهاية هادئة للجملة.'}</small></div></Frame>;
}

function ComparisonScale(){
 const [left,setLeft]=useState(5);const [right,setRight]=useState(3);
 const relation=left===right?'as tall as':left>right?'taller than':'shorter than';
 return <Frame icon="📏" title="غيّري الطولين ثم قارني" hint="في المقارنة ننظر أولًا إلى الفرق، ثم نختار الصيغة اللغوية المناسبة."><div className={styles.compareLab}><div className={styles.comparePeople}><button onClick={()=>setLeft(v=>v===7?2:v+1)}><span style={{fontSize:26+left*7}}>🧍</span><small>A</small></button><div className={styles.compareLine}/><button onClick={()=>setRight(v=>v===7?2:v+1)}><span style={{fontSize:26+right*7}}>🧍</span><small>B</small></button></div><div className={styles.compareSentence} dir="ltr">A is <strong>{relation}</strong> B.</div></div></Frame>;
}
