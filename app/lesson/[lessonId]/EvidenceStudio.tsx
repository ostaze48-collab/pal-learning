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
 const [open,setOpen]=useState(false);const [index,setIndex]=useState(0);const [answer,setAnswer]=useState('');const [choice,setChoice]=useState<number|null>(null);const [matches,setMatches]=useState<Record<string,string>>({});const [order,setOrder]=useState<string[]>([]);const [busy,setBusy]=useState(false);const [feedback,setFeedback]=useState<string>('');const [result,setResult]=useState<Result|null>(null);const [results,setResults]=useState<Result[]>([]);
 const task:EvidenceTask|undefined=tasks[index];

 useEffect(()=>{
   function sync(){if(localStorage.getItem(`lesson:${lesson.id}`)==='done'){setOpen(false);return}const events=readEvents(lesson.id);const practiceAt=[...events].reverse().find((e:any)=>e?.event==='practice_complete')?.at;const completeAt=[...events].reverse().find((e:any)=>e?.event==='evidence_complete')?.at;const due=Boolean(practiceAt)&&(!completeAt||String(completeAt)<String(practiceAt));if(due)setOpen(true)}
   sync();const timer=window.setInterval(sync,450);return()=>window.clearInterval(timer);
 },[lesson.id]);

 function resetTask(){setAnswer('');setChoice(null);setMatches({});setOrder([]);setFeedback('');setResult(null);setBusy(false)}
 function record(task:EvidenceTask,r:Result){setResult(r);setResults(v=>[...v,r]);appendEvent(lesson.id,{event:task.scope==='transfer'?'transfer_evidence':'objective_evidence',...r,question:task.questionId,evidenceTaskId:task.id,interaction:task.interaction})}
 function localResult(correct:boolean,mode:string,explanation?:string){if(!task)return;const r:Result={objectiveId:task.objectiveId,scope:task.scope,kind:task.kind,quality:task.quality,correct,outcome:correct?'understood':'misconception',confidence:1,mode};record(task,r);setFeedback(correct?'ممتاز — استخدمتِ الفكرة بصورة صحيحة.':explanation||'هذه المحاولة كشفت النقطة التي تحتاج تثبيتًا قصيرًا.')}

 async function submit(){
   if(!task||busy||result)return;
   if(task.interaction==='choice'||task.interaction==='error_fix'||task.interaction==='experiment_choice'){
     if(choice===null)return;localResult(choice===task.correctIndex,task.interaction==='error_fix'?'local_error_fix':task.interaction==='experiment_choice'?'local_experiment':'local_choice',task.explanation);return;
   }
   if(task.interaction==='match'){
     const pairs=task.pairs||[];if(!pairs.length||pairs.some(p=>!matches[p.item]))return;const correct=pairs.every(p=>matches[p.item]===p.target);localResult(correct,'local_match',correct?undefined:'راجعي كل جزء: هل وضعته مع الوصف أو الفئة المناسبة؟');return;
   }
   if(task.interaction==='order'){
     const items=task.orderItems||[];if(order.length!==items.length)return;const correct=items.every((x,i)=>order[i]===x);localResult(correct,'local_order',correct?undefined:'راجعي تسلسل الخطوات ثم جرّبي ترتيبها من البداية إلى النهاية.');return;
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

 function canSubmit(){
   if(!task||busy||result)return false;
   if(['choice','error_fix','experiment_choice'].includes(task.interaction))return choice!==null;
   if(task.interaction==='short_text')return answer.trim().length>=2;
   if(task.interaction==='match')return Boolean(task.pairs?.length)&&task.pairs!.every(p=>Boolean(matches[p.item]));
   if(task.interaction==='order')return Boolean(task.orderItems?.length)&&order.length===task.orderItems!.length;
   return false;
 }

 if(!open||!task||!tasks.length)return null;
 const progress=Math.round(((index+(result?1:0))/tasks.length)*100);const transfer=task.scope==='transfer';
 const label=transfer?'🚀 جربيها في موقف جديد':task.interaction==='match'?'🧩 اربطي وصنّفي':task.interaction==='order'?'↔️ رتّبي':task.interaction==='error_fix'?'🔍 اكتشفي الخطأ':task.interaction==='experiment_choice'?'🧪 استنتجي من التجربة':'🎯 تحدي فهم قصير';
 return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="تحدي فهم قصير"><section className={styles.card}>
   <div className={styles.top}><span className={styles.eyebrow}>{label}</span><span className={styles.counter}>مهمة {index+1} من {tasks.length}</span></div>
   <div className={styles.bar}><span style={{width:`${progress}%`}}/></div>
   <h2 className={styles.prompt}>{task.prompt}</h2>
   <p className={styles.sub}>{transfer?'هذه المرة غيّرنا الموقف لنعرف هل أصبحت الفكرة قابلة للاستخدام خارج مثال الدرس.':task.interaction==='experiment_choice'?'اقرئي ما حدث في التجربة أولًا، ثم اختاري الاستنتاج الذي يفسره.':task.interaction==='error_fix'?'لا تبحثي فقط عن الناتج؛ اكتشفي أين انحرفت الفكرة ثم اختاري التصحيح.':'لا نبحث عن حفظ الجملة. استخدمي ما فهمته من التجربة السابقة.'}</p>

   {task.interaction==='error_fix'&&task.statement&&<div className={styles.errorScene}><small>حل يحتاج فحصًا</small><strong>{task.statement}</strong></div>}
   {task.interaction==='experiment_choice'&&task.observation&&<div className={styles.experimentScene}><span>🧪</span><div><small>ما شاهدناه</small><strong>{task.observation}</strong></div></div>}

   {(task.interaction==='choice'||task.interaction==='error_fix'||task.interaction==='experiment_choice')&&<div className={styles.choices}>{task.options?.map((option,i)=><button key={`${i}-${option}`} disabled={Boolean(result)} className={`${styles.choice} ${choice===i?styles.selected:''}`} onClick={()=>setChoice(i)}>{option}</button>)}</div>}
   {task.interaction==='short_text'&&<textarea className={styles.textarea} value={answer} disabled={Boolean(result)||busy} onChange={e=>setAnswer(e.target.value)} placeholder={lesson.subject==='English'?'Write your answer here…':'اكتبي إجابتك هنا…'}/>} 
   {task.interaction==='match'&&<div className={styles.matchList}>{task.pairs?.map(pair=><div className={styles.matchRow} key={pair.item}><strong>{pair.item}</strong><div className={styles.targetButtons}>{task.targets?.map(target=><button type="button" key={target} disabled={Boolean(result)} className={`${styles.target} ${matches[pair.item]===target?styles.selected:''}`} onClick={()=>setMatches(v=>({...v,[pair.item]:target}))}>{target}</button>)}</div></div>)}</div>}
   {task.interaction==='order'&&<div><div className={styles.orderBank}>{task.orderItems?.map(item=><button type="button" className={styles.orderChip} key={item} disabled={Boolean(result)||order.includes(item)} onClick={()=>setOrder(v=>[...v,item])}>{item}</button>)}</div><div className={styles.orderTrack}>{order.map((item,i)=><div className={styles.orderPlaced} key={`${item}-${i}`}><span>{i+1}</span>{item}</div>)}</div>{order.length>0&&!result&&<button type="button" className={styles.miniButton} onClick={()=>setOrder([])}>أعيدي الترتيب</button>}</div>}

   {busy&&<div className={styles.thinking}>⏳ أفحص معنى الإجابة…</div>}
   {feedback&&<div className={styles.feedback}><strong>{result?.correct===true?'⭐ فهم قوي':result?.correct===false?'🧩 وجدنا نقطة مفيدة للتثبيت':'📝 تم تسجيل المحاولة'}</strong><div>{feedback}</div></div>}
   <div className={styles.actions}>{!result?<button className={styles.button} disabled={!canSubmit()} onClick={submit}>تحققي من المحاولة</button>:<button className={styles.button} onClick={next}>{index===tasks.length-1?'ابدئي الاختبار القصير ←':'المهمة التالية ←'}</button>}</div>
   <div className={styles.quiet}>هذه المهام تقيس استخدام الفكرة بطرق مختلفة، وليست قائمة أهداف أو درجات.</div>
 </section></div>;
}
