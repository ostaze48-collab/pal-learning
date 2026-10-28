'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {detectLikelyGap} from '../../../lib/skillGraph';
import {recoverySkills} from '../../../lib/recoverySkills';

type Message={role:'student'|'tutor';text:string;mode?:string;grounded?:boolean};
type Report={diagnosticCorrect?:boolean;mastery?:number;wrongQuestionIds?:string[]};
type MissedFact={text:string;selected:string;correct:string};
type DeepGap={title:string;score:number;gradeAnchor:string;parentSkillId:string;cause?:string;missedFacts?:MissedFact[]};

export default function AITutor({lesson}:{lesson:Lesson}){
 const [open,setOpen]=useState(false);
 const [input,setInput]=useState('');
 const [loading,setLoading]=useState(false);
 const [messages,setMessages]=useState<Message[]>([]);
 const [report,setReport]=useState<Report|null>(null);
 const [recoveryProfile,setRecoveryProfile]=useState<Record<string,number>>({});
 const [deepRecoveryProfile,setDeepRecoveryProfile]=useState<Record<string,DeepGap>>({});

 useEffect(()=>{
   const raw=localStorage.getItem(`lesson:${lesson.id}:report`);
   if(raw){try{setReport(JSON.parse(raw))}catch{}}
   const profile:Record<string,number>={};
   const deep:Record<string,DeepGap>={};
   for(const skill of recoverySkills){
     if(skill.subject!==lesson.subject)continue;
     const saved=localStorage.getItem(`recovery:${lesson.student}:${skill.id}`);
     if(saved!==null)profile[skill.id]=Number(saved);
     const planRaw=localStorage.getItem(`recoveryPlan:${lesson.student}:${skill.id}`);
     if(planRaw){try{const plan=JSON.parse(planRaw);for(const weak of plan.weak||[]){if(Number(weak.score)<80)deep[`${skill.id}:${weak.id}`]={title:String(weak.title),score:Number(weak.score),gradeAnchor:String(weak.gradeAnchor||''),parentSkillId:skill.id,cause:String(weak.cause||weak.diagnosis||''),missedFacts:Array.isArray(weak.missedFacts)?weak.missedFacts.slice(0,4):[]}}}catch{}}
   }
   setRecoveryProfile(profile);setDeepRecoveryProfile(deep);
 },[lesson.id,lesson.student,lesson.subject]);

 const likelyGap=useMemo(()=>detectLikelyGap(lesson.id,report?.wrongQuestionIds||[],report?.diagnosticCorrect??true),[lesson.id,report]);
 const weakestRecovery=useMemo(()=>Object.entries(recoveryProfile).sort((a,b)=>a[1]-b[1])[0],[recoveryProfile]);
 const weakestSkill=weakestRecovery?recoverySkills.find(s=>s.id===weakestRecovery[0]):undefined;
 const weakestDeep=useMemo(()=>Object.entries(deepRecoveryProfile).sort((a,b)=>a[1].score-b[1].score)[0],[deepRecoveryProfile]);
 const quick=['اشرحها بطريقة أسهل','أعطني مثالًا آخر','اسألني سؤالًا','اربطها بشيء أعرفه'];

 async function ask(text:string){
   const q=text.trim();if(!q||loading)return;
   setMessages(v=>[...v,{role:'student',text:q}]);setInput('');setLoading(true);
   try{
     const res=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,question:q,learnerState:{diagnosticCorrect:report?.diagnosticCorrect,mastery:report?.mastery,wrongQuestionIds:report?.wrongQuestionIds||[],likelyGapId:likelyGap?.id||null,recoveryProfile,deepRecoveryProfile}})});
     const data=await res.json();
     setMessages(v=>[...v,{role:'tutor',text:data.answer||'لم أتمكن من شرح هذه النقطة الآن.',mode:data.mode,grounded:Boolean(data.grounded)}]);
   }catch{setMessages(v=>[...v,{role:'tutor',text:'تعذر الاتصال الآن. تابعي الشرح الموجود وسأبقى هنا عندما يعود الاتصال.'}])}
   finally{setLoading(false)}
 }

 const deepGap=weakestDeep?.[1];
 const missedSummary=deepGap?.missedFacts?.map(x=>`${x.text} (اختارت ${x.selected} بدل ${x.correct})`).join('؛ ');
 return <section className={`aiTutor teacherAskDock ${open?'open':''}`}>
   <button className="teacherAskToggle" onClick={()=>setOpen(v=>!v)} aria-expanded={open}><span className="teacherAskAvatar">🧑‍🏫</span><span><strong>اسألي معلمتك</strong><small>{open?'أنا معك — اكتبي ما لم يتضح':'شيء لم تفهميه؟ افتحي هنا'}</small></span><b>{open?'×':'+'}</b></button>
   {open&&<div className="aiTutorBody teacherAskBody">
     {(deepGap||weakestSkill&&weakestRecovery![1]<80||likelyGap)&&<div className="teacherNoticed"><span>🌱</span><div><strong>لاحظت مهارة يمكن أن نثبتها معًا</strong><p>إذا كانت هي سبب التعثر، سأشرحها بسرعة ثم نعود مباشرة إلى هذا الدرس.</p></div><button onClick={()=>deepGap?ask(`عالج لي ${deepGap.title} باختصار، ثم اربطها بدرس ${lesson.title}.${missedSummary?` هذه بعض أخطائي: ${missedSummary}.`:''}`):weakestSkill?ask(`عالج لي ${weakestSkill.title} باختصار ثم اربطها بدرس ${lesson.title}.`):likelyGap&&ask(`اشرح لي ${likelyGap.title} من البداية باختصار ثم اربطها بدرس ${lesson.title}.`)}>ساعديني</button></div>}
     <div className="teacherAskPrompts">{quick.map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}</div>
     <div className="chatWindow teacherChatWindow">{messages.length===0?<div className="teacherChatEmpty"><span>💬</span><strong>اكتبي بطريقتك</strong><p>مثال: «لم أفهم لماذا فعلنا هذه الخطوة» أو «أعطيني مثالًا أسهل».</p></div>:messages.map((m,i)=><div key={`${m.role}-${i}`} className={`chatBubble ${m.role} teacherBubble`}><strong>{m.role==='student'?'أنتِ':'🧑‍🏫 المعلمة'}</strong><p>{m.text}</p></div>)}{loading&&<div className="chatBubble tutor teacherBubble"><strong>🧑‍🏫 المعلمة</strong><p>أفكر في أقصر طريقة توضحها لكِ…</p></div>}</div>
     <div className="chatComposer teacherComposer"><textarea value={input} onChange={e=>setInput(e.target.value.slice(0,700))} placeholder="اكتبي سؤالك هنا…" rows={2} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(input)}}}/><button className="btn" onClick={()=>ask(input)} disabled={loading||!input.trim()}>إرسال</button></div>
   </div>}
 </section>;
}
