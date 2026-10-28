'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {detectLikelyGap} from '../../../lib/skillGraph';

type Message={role:'student'|'tutor';text:string;mode?:string};
type Report={diagnosticCorrect?:boolean;mastery?:number;wrongQuestionIds?:string[]};

export default function AITutor({lesson}:{lesson:Lesson}){
 const [open,setOpen]=useState(false);
 const [input,setInput]=useState('');
 const [loading,setLoading]=useState(false);
 const [messages,setMessages]=useState<Message[]>([]);
 const [report,setReport]=useState<Report|null>(null);

 useEffect(()=>{
   const raw=localStorage.getItem(`lesson:${lesson.id}:report`);
   if(raw){try{setReport(JSON.parse(raw))}catch{}}
 },[lesson.id]);

 const likelyGap=useMemo(()=>detectLikelyGap(lesson.id,report?.wrongQuestionIds||[],report?.diagnosticCorrect??true),[lesson.id,report]);
 const quick=['اشرح أبسط','أعطني مثالًا جديدًا','اسألني سؤال تحقق','لماذا أخطأت؟'];

 async function ask(text:string){
   const q=text.trim();if(!q||loading)return;
   setMessages(v=>[...v,{role:'student',text:q}]);setInput('');setLoading(true);
   try{
     const res=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,question:q,learnerState:{diagnosticCorrect:report?.diagnosticCorrect,mastery:report?.mastery,wrongQuestionIds:report?.wrongQuestionIds||[],likelyGapId:likelyGap?.id||null}})});
     const data=await res.json();
     setMessages(v=>[...v,{role:'tutor',text:data.answer||'لم أتمكن من شرح هذه النقطة الآن.',mode:data.mode}]);
   }catch{setMessages(v=>[...v,{role:'tutor',text:'تعذر الاتصال بالمعلم الذكي الآن. يمكنك متابعة الشرح الموجود في الدرس.'}])}
   finally{setLoading(false)}
 }

 return <section className="aiTutor">
   <button className="aiTutorToggle" onClick={()=>setOpen(v=>!v)}><span className="aiOrb">AI</span><span><strong>المعلم الذكي</strong><small>{likelyGap?`لاحظ فجوة محتملة: ${likelyGap.title}`:'اسألي عن هذا الدرس فقط'}</small></span><span>{open?'−':'+'}</span></button>
   {open&&<div className="aiTutorBody">
     <div className="aiGuard"><strong>🎯 معلم مقيد بالدرس</strong><span>يستخدم سياق الدرس والمهارات السابقة المسجلة في المنصة، ولا يُفترض به اختراع نصوص رسمية غير موجودة.</span></div>
     {likelyGap&&<div className="gapAlert"><strong>قد تكون المشكلة أقدم من هذا الدرس</strong><p>الفجوة المحتملة: <b>{likelyGap.title}</b>. إذا كانت هذه المهارة ضعيفة فالأفضل علاجها أولًا ثم العودة للدرس.</p><button className="btn secondary" onClick={()=>ask(`أعتقد أن لدي ضعفًا في ${likelyGap.title}. اشرح لي هذه المهارة من البداية بطريقة قصيرة ثم اربطها بدرس ${lesson.title}.`)}>عالج الفجوة معي</button></div>}
     <div className="quickPrompts">{quick.map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}</div>
     <div className="chatWindow">{messages.length===0?<div className="chatEmpty">اكتبي ما لم تفهميه في هذا الدرس، أو اختاري أحد الأزرار السريعة.</div>:messages.map((m,i)=><div key={`${m.role}-${i}`} className={`chatBubble ${m.role}`}><strong>{m.role==='student'?'أنتِ':'المعلم'}</strong><p>{m.text}</p>{m.role==='tutor'&&m.mode&&m.mode!=='ai'&&<small>شرح محلي احتياطي</small>}</div>)}{loading&&<div className="chatBubble tutor"><strong>المعلم</strong><p>أفكر في أفضل طريقة للشرح…</p></div>}</div>
     <div className="chatComposer"><textarea value={input} onChange={e=>setInput(e.target.value.slice(0,700))} placeholder="مثال: لماذا 9 ليس عددًا أوليًا؟" rows={2} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(input)}}}/><button className="btn" onClick={()=>ask(input)} disabled={loading||!input.trim()}>إرسال</button></div>
   </div>}
 </section>;
}
