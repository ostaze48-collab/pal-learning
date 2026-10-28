'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {buildEvidenceTasks,buildTransferTask,type EvidenceTask} from '../../../lib/evidenceDesign';
import styles from './EvidenceStudio.module.css';

type Result={objectiveId:number;scope:'objective'|'transfer';kind:string;quality:'direct'|'inferred';correct:boolean|null;outcome:'understood'|'partial'|'misconception'|'unscored';confidence:number;mode:string};

function readEvents(lessonId:string){try{const raw=localStorage.getItem(`lessonUx:${lessonId}`);const parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[]}catch{return []}}
function appendEvent(lessonId:string,event:Record<string,unknown>){try{const key=`lessonUx:${lessonId}`;const old=readEvents(lessonId).slice(-159);old.push({at:new Date().toISOString(),...event});localStorage.setItem(key,JSON.stringify(old))}catch{}}

export default function EvidenceStudio({lesson}:{lesson:Lesson}){
 const tasks=useMemo(()=>[...buildEvidenceTasks(lesson),buildTransferTask(lesson)],[lesson]);
 const [open,setOpen]=useState(false);const [index,setIndex]=useState(0);const [answer,setAnswer]=useState('');const [choice,setChoice]=useState<number|null>(null);const [busy,setBusy]=useState(false);const [feedback,setFeedback]=useState<string>('');const [result,setResult]=useState<Result|null>(null);const [results,setResults]=useState<Result[]>([]);
 const task:EvidenceTask|undefined=tasks[index];

 useEffect(()=>{
   function sync(){
     if(localStorage.getItem(`lesson:${lesson.id}`)==='done'){setOpen(false);return}
     const events=readEvents(lesson.id);const practiceAt=[...events].reverse().find((e:any)=>e?.event==='practice_complete')?.at;const completeAt=[...events].reverse().find((e:any)=>e?.event==='evidence_complete')?.at;const due=Boolean(practiceAt)&&(!completeAt||String(completeAt)<String(practiceAt));if(due)setOpen(true);
   }
   sync();const timer=window.setInterval(sync,450);return()=>window.clearInterval(timer);
 },[lesson.id]);

 function resetTask(){setAnswer('');setChoice(null);setFeedback('');setResult(null);setBusy(false)}
 function record(task:EvidenceTask,r:Result){setResult(r);setResults(v=>[...v,r]);appendEvent(lesson.id,{event:task.scope==='transfer'?'transfer_evidence':'objective_evidence',...r,question:task.questionId,evidenceTaskId:task.id})}

 async function submit(){
   if(!task||busy||result)return;
   if(task.interaction==='choice'){
     if(choice===null)return;const correct=choice===task.correctIndex;const r:Result={objectiveId:task.objectiveId,scope:task.scope,kind:task.kind,quality:task.quality,correct,outcome:correct?'understood':'misconception',confidence:1,mode:'local_choice'};record(task,r);setFeedback(correct?'ممتاز — استخدمتِ الفكرة بصورة صحيحة.':task.explanation||'هذه المحاولة أعطتنا دليلًا على النقطة التي تحتاج تثبيتًا.');return;
   }
   if(answer.trim().length<2)return;setBusy(true);
   try{
     const response=await fetch('/api/ai-teacher/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,question:task.prompt,answer})});const data=await response.json();const outcome=['understood','partial','misconception'].includes(data?.outcome)?data.outcome:'partial';const confidence=Math.max(0,Math.min(1,Number(data?.confidence)||0));const mode=String(data?.mode||'unknown');const reliable=mode==='ai'&&confidence>=0.5;const correct=reliable?(outcome==='understood'?true:outcome==='misconception'?false:null):null;const r:Result={objectiveId:task.objectiveId,scope:task.scope,kind:task.kind,quality:task.quality,correct,outcome,confidence,mode};record(task,r);setFeedback(String(data?.feedback||'سجلنا محاولتك وسنستخدمها لتحسين الخطوة التالية.'));
   }catch{
     const r:Result={objectiveId:task.objectiveId,scope:task.scope,kind:task.kind,quality:'inferred',correct:null,outcome:'unscored',confidence:0,mode:'offline'};record(task,r);setFeedback('تم حفظ محاولتك. لن نعتبر غياب التقييم خطأ عليكِ.');
   }finally{setBusy(false)}
 }

 function next(){
   if(!result)return;
   if(index>=tasks.length-1){
     const all=[...results];const objectiveResults=all.filter(x=>x.scope==='objective');const transfer=all.find(x=>x.scope==='transfer')||null;
     appendEvent(lesson.id,{event:'evidence_complete',count:objectiveResults.length,understood:objectiveResults.filter(x=>x.correct===true).length,needsSupport:objectiveResults.filter(x=>x.correct===false).map(x=>x.objectiveId),unscored:objectiveResults.filter(x=>x.correct===null).map(x=>x.objectiveId),transfer:transfer?.correct??null});
     try{localStorage.setItem(`lessonEvidence:${lesson.id}`,JSON.stringify({lessonId:lesson.id,results:all,transfer,completedAt:new Date().toISOString()}))}catch{}
     setOpen(false);return;
   }
   setIndex(v=>v+1);resetTask();
 }

 if(!open||!task||!tasks.length)return null;
 const progress=Math.round(((index+(result?1:0))/tasks.length)*100);const transfer=task.scope==='transfer';
 return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="تحدي فهم قصير"><section className={styles.card}>
   <div className={styles.top}><span className={styles.eyebrow}>{transfer?'🚀 جربيها في موقف جديد':'🎯 تحدي فهم قصير'}</span><span className={styles.counter}>مهمة {index+1} من {tasks.length}</span></div>
   <div className={styles.bar}><span style={{width:`${progress}%`}}/></div>
   <h2 className={styles.prompt}>{task.prompt}</h2>
   <p className={styles.sub}>{transfer?'هذه المرة غيّرنا الموقف لنعرف هل أصبحت الفكرة قابلة للاستخدام خارج مثال الدرس.':'لا نبحث عن حفظ الجملة. استخدمي ما فهمته من التجربة السابقة.'}</p>
   {task.interaction==='choice'?<div className={styles.choices}>{task.options?.map((option,i)=><button key={`${i}-${option}`} disabled={Boolean(result)} className={`${styles.choice} ${choice===i?styles.selected:''}`} onClick={()=>setChoice(i)}>{option}</button>)}</div>:<textarea className={styles.textarea} value={answer} disabled={Boolean(result)||busy} onChange={e=>setAnswer(e.target.value)} placeholder={lesson.subject==='English'?'Write your answer here…':'اكتبي إجابتك هنا…'}/>} 
   {busy&&<div className={styles.thinking}>⏳ أفحص معنى الإجابة…</div>}
   {feedback&&<div className={styles.feedback}><strong>{result?.correct===true?'⭐ فهم قوي':result?.correct===false?'🧩 وجدنا نقطة مفيدة للتثبيت':'📝 تم تسجيل المحاولة'}</strong><div>{feedback}</div></div>}
   <div className={styles.actions}>{!result?<button className={styles.button} disabled={busy||(task.interaction==='choice'?choice===null:answer.trim().length<2)} onClick={submit}>تحققي من المحاولة</button>:<button className={styles.button} onClick={next}>{index===tasks.length-1?'ابدئي الاختبار القصير ←':'المهمة التالية ←'}</button>}</div>
   <div className={styles.quiet}>هذه المهام تقيس استخدام الفكرة بطرق مختلفة، وليست قائمة أهداف أو درجات.</div>
 </section></div>;
}
