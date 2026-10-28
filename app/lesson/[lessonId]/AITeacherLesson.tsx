'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {recoverySkills} from '../../../lib/recoverySkills';

type Mode='overview'|'simplify'|'step_by_step'|'analogy'|'real_world'|'deep'|'check';
type Card={title:string;body:string;kind:'explain'|'example'|'tip'|'check'};
type Content={title:string;intro:string;cards:Card[];checkQuestion?:{text:string;hint:string};teacherNote?:string};
type Weakness={title:string;score:number;gradeAnchor?:string;cause?:string;missedFacts?:Array<{text:string;selected:string;correct:string}>};

const modes:Array<{id:Mode;label:string;icon:string}>=[
  {id:'simplify',label:'اشرح أبسط',icon:'🪶'},
  {id:'step_by_step',label:'خطوة بخطوة',icon:'🪜'},
  {id:'analogy',label:'شبّهها لي',icon:'💡'},
  {id:'real_world',label:'مثال من الحياة',icon:'🌍'},
  {id:'deep',label:'اشرح أكثر',icon:'🔎'},
  {id:'check',label:'اختبر فهمي',icon:'🎯'}
];

function localContent(lesson:Lesson):Content{
  return {title:lesson.title,intro:lesson.summary,cards:[...lesson.learningPoints.map((x,i)=>({title:`الفكرة ${i+1}`,body:x,kind:'explain' as const})),{title:'مثال محلول',body:lesson.example,kind:'example'}],checkQuestion:{text:lesson.questions[0]?.text||'اشرحي الفكرة بكلماتك.',hint:lesson.questions[0]?.explanation||'ارجعي للفكرة الأساسية.'}};
}

export default function AITeacherLesson({lesson}:{lesson:Lesson}){
  const [content,setContent]=useState<Content>(()=>localContent(lesson));
  const [mode,setMode]=useState<Mode>('overview');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [hintOpen,setHintOpen]=useState(false);
  const [speaking,setSpeaking]=useState(false);

  const weaknesses=useMemo<Weakness[]>(()=>{
    if(typeof window==='undefined')return [];
    const out:Weakness[]=[];
    for(const skill of recoverySkills){
      if(skill.subject!==lesson.subject)continue;
      const raw=localStorage.getItem(`recoveryPlan:${lesson.student}:${skill.id}`);if(!raw)continue;
      try{const plan=JSON.parse(raw);for(const w of plan.weak||[]){if(Number(w.score)<80)out.push({title:String(w.title),score:Number(w.score),gradeAnchor:String(w.gradeAnchor||''),cause:String(w.cause||''),missedFacts:Array.isArray(w.missedFacts)?w.missedFacts:[]})}}catch{}
    }
    return out.sort((a,b)=>a.score-b.score).slice(0,6);
  },[lesson.id,lesson.student,lesson.subject]);

  async function load(nextMode:Mode,force=false){
    setMode(nextMode);setLoading(true);setError('');setHintOpen(false);
    const fingerprint=weaknesses.map(w=>`${w.title}:${w.score}`).join('|').slice(0,240);
    const key=`aiLesson:${lesson.id}:${nextMode}:${fingerprint}`;
    if(!force){const cached=localStorage.getItem(key);if(cached){try{const parsed=JSON.parse(cached);if(parsed?.content){setContent(parsed.content);setLoading(false);return}}catch{}}}
    try{
      const res=await fetch('/api/ai-teacher/lesson',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,mode:nextMode,weaknesses,previousExplanation:nextMode==='overview'?'':content.intro+' '+content.cards.map(c=>c.body).join(' ')})});
      const data=await res.json();
      if(!res.ok||!data?.content)throw new Error('bad_response');
      setContent(data.content);localStorage.setItem(key,JSON.stringify({content:data.content,at:new Date().toISOString()}));
    }catch{setError('تعذر تحديث الشرح الآن، لذلك سأستخدم الشرح المحفوظ في المنصة.');setContent(localContent(lesson))}finally{setLoading(false)}
  }

  useEffect(()=>{load('overview')},[lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>()=>{if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel()},[]);

  function speak(){
    if(!('speechSynthesis' in window))return;
    if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return}
    const text=[content.title,content.intro,...content.cards.map(c=>`${c.title}. ${c.body}`)].join('. ');
    const u=new SpeechSynthesisUtterance(text);u.lang=lesson.subject==='English'?'en-US':'ar-SA';u.rate=.88;u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false);setSpeaking(true);window.speechSynthesis.cancel();window.speechSynthesis.speak(u);
  }

  const cardIcon=(kind:Card['kind'])=>kind==='example'?'🧩':kind==='tip'?'💡':kind==='check'?'🎯':'📖';
  return <section className="aiLessonTeacher">
    <div className="aiLessonHead"><div><span className="tag">🤖 المعلم الذكي</span><h2>{content.title}</h2><p>{loading?'أراجع الدرس ومستواك لأختار أفضل طريقة للشرح…':content.intro}</p></div><button className="btn secondary" onClick={speak}>{speaking?'⏹ إيقاف':'🔊 استمعي'}</button></div>
    {weaknesses.length>0&&<div className="aiTeacherAware"><strong>سأبدأ من النقطة المناسبة لكِ</strong><span>لاحظت أن هناك مهارة سابقة تحتاج دعمًا، لذلك سأشرح هذا الدرس دون افتراض أنها متقنة بالكامل.</span></div>}
    <div className="aiTeachingModes">{modes.map(m=><button key={m.id} className={mode===m.id?'active':''} disabled={loading} onClick={()=>load(m.id,true)}><span>{m.icon}</span>{m.label}</button>)}</div>
    {error&&<div className="activityHint"><strong>ملاحظة</strong><p>{error}</p></div>}
    {loading?<div className="aiTeacherLoading"><span/><span/><span/><p>أبني الشرح المناسب…</p></div>:<div className="aiLessonCards">{content.cards.map((c,i)=><article className={`aiLessonCard ${c.kind}`} key={`${c.title}-${i}`}><div className="aiLessonCardIcon">{cardIcon(c.kind)}</div><div><h3>{c.title}</h3><p>{c.body}</p></div></article>)}</div>}
    {!loading&&content.checkQuestion&&<div className="aiCheckCard"><span className="tag">تحقق سريع</span><h3>{content.checkQuestion.text}</h3><button className="btn secondary" onClick={()=>setHintOpen(v=>!v)}>{hintOpen?'إخفاء التلميح':'أريد تلميحًا'}</button>{hintOpen&&<p>{content.checkQuestion.hint}</p>}</div>}
    {!loading&&<div className="aiTeacherActions"><button className="btn secondary" onClick={()=>load(mode,true)}>🔄 شرح جديد بنفس الطريقة</button><span className="muted">إذا لم تصل الفكرة، غيّري طريقة الشرح بدل إعادة نفس الكلام.</span></div>}
  </section>;
}
