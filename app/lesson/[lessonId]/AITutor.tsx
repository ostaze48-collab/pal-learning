'use client';
import {useEffect,useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {detectLikelyGap} from '../../../lib/skillGraph';
import {recoverySkills} from '../../../lib/recoverySkills';

type Message={role:'student'|'tutor';text:string;mode?:string;grounded?:boolean};
type Report={diagnosticCorrect?:boolean;mastery?:number;wrongQuestionIds?:string[]};
type DeepGap={title:string;score:number;gradeAnchor:string;parentSkillId:string};

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
     if(planRaw){try{const plan=JSON.parse(planRaw);for(const weak of plan.weak||[]){if(Number(weak.score)<80)deep[`${skill.id}:${weak.id}`]={title:String(weak.title),score:Number(weak.score),gradeAnchor:String(weak.gradeAnchor||''),parentSkillId:skill.id}}}catch{}}
   }
   setRecoveryProfile(profile);setDeepRecoveryProfile(deep);
 },[lesson.id,lesson.student,lesson.subject]);

 const likelyGap=useMemo(()=>detectLikelyGap(lesson.id,report?.wrongQuestionIds||[],report?.diagnosticCorrect??true),[lesson.id,report]);
 const weakestRecovery=useMemo(()=>Object.entries(recoveryProfile).sort((a,b)=>a[1]-b[1])[0], [recoveryProfile]);
 const weakestSkill=weakestRecovery?recoverySkills.find(s=>s.id===weakestRecovery[0]):undefined;
 const weakestDeep=useMemo(()=>Object.entries(deepRecoveryProfile).sort((a,b)=>a[1].score-b[1].score)[0], [deepRecoveryProfile]);
 const quick=['اشرح أبسط','أعطني مثالًا جديدًا','اسألني سؤال تحقق','لماذا أخطأت؟','اربطه بما تعلمته سابقًا'];

 async function ask(text:string){
   const q=text.trim();if(!q||loading)return;
   setMessages(v=>[...v,{role:'student',text:q}]);setInput('');setLoading(true);
   try{
     const res=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,question:q,learnerState:{diagnosticCorrect:report?.diagnosticCorrect,mastery:report?.mastery,wrongQuestionIds:report?.wrongQuestionIds||[],likelyGapId:likelyGap?.id||null,recoveryProfile,deepRecoveryProfile}})});
     const data=await res.json();
     setMessages(v=>[...v,{role:'tutor',text:data.answer||'لم أتمكن من شرح هذه النقطة الآن.',mode:data.mode,grounded:Boolean(data.grounded)}]);
   }catch{setMessages(v=>[...v,{role:'tutor',text:'تعذر الاتصال بالمعلم الذكي الآن. يمكنك متابعة الشرح الموجود في الدرس.'}])}
   finally{setLoading(false)}
 }

 const deepGap=weakestDeep?.[1];
 return <section className="aiTutor">
   <button className="aiTutorToggle" onClick={()=>setOpen(v=>!v)}><span className="aiOrb">AI</span><span><strong>المعلم الذكي</strong><small>{deepGap?`الفجوة الدقيقة: ${deepGap.title} (${deepGap.score}%)`:weakestSkill&&weakestRecovery![1]<80?`ملف الاستدراك يشير إلى: ${weakestSkill.title}`:likelyGap?`لاحظ فجوة محتملة: ${likelyGap.title}`:'منهج الصف الحالي + مهارات الصفوف السابقة'}</small></span><span>{open?'−':'+'}</span></button>
   {open&&<div className="aiTutorBody">
     <div className="aiGuard"><strong>🎯 معلم منهجي</strong><span>يستخدم سياق الدرس، ملف الفجوات، وتسلسل مصادر المنهاج الفلسطيني الموثوقة. وعند تفعيل قاعدة الملفات ستظهر علامة «بحث في قاعدة المنهاج» على الإجابة.</span></div>
     {deepGap&&<div className="gapAlert"><strong>فجوة دقيقة موثقة</strong><p><b>{deepGap.title}</b> — النتيجة {deepGap.score}% · المرجع المتوقع {deepGap.gradeAnchor}. سيعالج المعلم هذه النقطة تحديدًا بدل إعادة المجال كاملًا.</p><button className="btn secondary" onClick={()=>ask(`التشخيص العميق أظهر أن نتيجتي في ${deepGap.title} هي ${deepGap.score}%، والمهارة ترجع إلى ${deepGap.gradeAnchor}. اشرح هذه النقطة باختصار، اختبرني عليها، ثم اربطها بدرس ${lesson.title}.`)}>عالج النقطة الدقيقة</button></div>}
     {!deepGap&&weakestSkill&&weakestRecovery![1]<80&&<div className="gapAlert"><strong>فجوة موثقة من فحص المادة</strong><p><b>{weakestSkill.title}</b> — النتيجة الحالية {weakestRecovery![1]}%. يمكن للمعلم شرحها وربطها بالدرس الحالي بدل تجاهل سبب التعثر.</p><button className="btn secondary" onClick={()=>ask(`فحص الفجوات أظهر أن نتيجتي في ${weakestSkill.title} هي ${weakestRecovery![1]}%. عالج هذه المهارة أولًا ثم اربطها بدرس ${lesson.title}.`)}>عالج الفجوة واربطها بالدرس</button></div>}
     {!deepGap&&!weakestSkill&&likelyGap&&<div className="gapAlert"><strong>قد تكون المشكلة أقدم من هذا الدرس</strong><p>الفجوة المحتملة: <b>{likelyGap.title}</b>. إذا كانت هذه المهارة ضعيفة فالأفضل علاجها أولًا ثم العودة للدرس.</p><button className="btn secondary" onClick={()=>ask(`أعتقد أن لدي ضعفًا في ${likelyGap.title}. اشرح لي هذه المهارة من البداية بطريقة قصيرة ثم اربطها بدرس ${lesson.title}.`)}>عالج الفجوة معي</button></div>}
     <div className="quickPrompts">{quick.map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}</div>
     <div className="chatWindow">{messages.length===0?<div className="chatEmpty">اكتبي ما لم تفهميه. يستطيع المعلم الرجوع للمهارات السابقة الدقيقة ثم إعادتك إلى هدف الدرس الحالي.</div>:messages.map((m,i)=><div key={`${m.role}-${i}`} className={`chatBubble ${m.role}`}><div className="chatBubbleHead"><strong>{m.role==='student'?'أنتِ':'المعلم'}</strong>{m.role==='tutor'&&m.grounded&&<span className="groundedBadge">📚 بحث في قاعدة المنهاج</span>}</div><p>{m.text}</p>{m.role==='tutor'&&m.mode&&m.mode!=='ai'&&<small>شرح محلي احتياطي — لم يُستخدم نموذج AI في هذه الإجابة.</small>}{m.role==='tutor'&&m.mode==='ai'&&!m.grounded&&<small>شرح AI مساعد مبني على سياق الدرس وملف التعلم، دون File Search في هذه الإجابة.</small>}</div>)}{loading&&<div className="chatBubble tutor"><strong>المعلم</strong><p>أراجع الدرس والفجوة الدقيقة المناسبة…</p></div>}</div>
     <div className="chatComposer"><textarea value={input} onChange={e=>setInput(e.target.value.slice(0,700))} placeholder="مثال: لا أفهم هذه الخطوة، هل هناك مهارة سابقة يجب أن أعرفها؟" rows={2} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(input)}}}/><button className="btn" onClick={()=>ask(input)} disabled={loading||!input.trim()}>إرسال</button></div>
   </div>}
 </section>;
}
