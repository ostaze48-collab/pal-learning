'use client';
import {useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import styles from './LearningCanvas.module.css';

type CanvasStep={icon:string;label:string;title:string;body:string;prompt:string};

function evidenceText(lesson:Lesson,index=0){
 const q=lesson.questions[index%Math.max(1,lesson.questions.length)];
 return q?.explanation||lesson.example||lesson.summary;
}

function scienceSteps(lesson:Lesson):CanvasStep[]{
 return [
  {icon:'👀',label:'ألاحظ',title:'ابدئي بما ترينه',body:lesson.example||lesson.summary,prompt:'ما الشيء الذي تستطيعين ملاحظته مباشرة قبل أن نذكر أي قاعدة؟'},
  {icon:'💭',label:'أتوقع',title:'كوّني توقعًا',body:'قبل أن تعرفي النتيجة، اختاري توقعًا منطقيًا بناءً على ما رأيته.',prompt:'ما السبب الذي جعلك تميلين لهذا التوقع؟'},
  {icon:'🔎',label:'أبحث عن دليل',title:'قارني توقعك بالدليل',body:evidenceText(lesson,0),prompt:'أي جزء من الدليل أكد توقعك أو غيّره؟'},
  {icon:'🧠',label:'أفسر',title:'حوّلي المشاهدة إلى تفسير',body:lesson.summary,prompt:'اشرحي الفكرة بلغتك من خلال ما شاهدته، لا من خلال حفظ جملة.'}
 ];
}

function mathSteps(lesson:Lesson):CanvasStep[]{
 return [
  {icon:'🧱',label:'محسوس',title:'ابدئي بشيء يمكن تخيله',body:lesson.example||lesson.summary,prompt:'ما الكميات أو العلاقات التي ترينها قبل كتابة أي رمز؟'},
  {icon:'🖼️',label:'بصري',title:'حوّلي العلاقة إلى صورة',body:'مثلي ما يحدث بخط، مجموعات، أجزاء، ترتيب أو شكل يناسب المسألة.',prompt:'أي جزء في الرسم يمثل كل كمية أو خطوة؟'},
  {icon:'✏️',label:'رمزي',title:'الآن اكتبيها رياضيًا',body:evidenceText(lesson,0),prompt:'أي رمز أو عملية تمثل العلاقة التي رأيتها بصريًا؟'},
  {icon:'🚀',label:'تطبيق',title:'انقلي الطريقة إلى موقف جديد',body:'غيّري الأرقام أو السياق، لكن حافظي على نفس الفكرة التي اكتشفتها.',prompt:'ما الذي بقي ثابتًا رغم أن المثال تغيّر؟'}
 ];
}

function arabicSteps(lesson:Lesson):CanvasStep[]{
 return [
  {icon:'📖',label:'سياق',title:'ابدئي من المعنى',body:lesson.example||lesson.summary,prompt:'ما المعنى الذي فهمته من الجملة أو النص؟'},
  {icon:'🔍',label:'ألاحظ',title:'ابحثي عن النمط',body:'راقبي الكلمات أو التراكيب: ما الذي يتكرر؟ وما الذي يتغير؟',prompt:'ما الشيء المشترك بين الأمثلة؟'},
  {icon:'🧩',label:'أبني الفكرة',title:'استخرجي القاعدة من الاستخدام',body:evidenceText(lesson,0),prompt:'كيف تشرحين ما لاحظته بكلماتك؟'},
  {icon:'✍️',label:'أستخدم',title:'اصنعي مثالًا جديدًا',body:'استخدمي ما اكتشفته في جملة أو موقف جديد من عندك.',prompt:'هل مثالك الجديد يحافظ على نفس المعنى أو النمط؟'}
 ];
}

function englishSteps(lesson:Lesson):CanvasStep[]{
 return [
  {icon:'🎬',label:'Situation',title:'Start with meaning',body:lesson.example||lesson.summary,prompt:'What is happening in this situation?'},
  {icon:'👀',label:'Notice',title:'Notice what changes',body:'Look at the words that change and the words that stay the same.',prompt:'Which part carries the meaning we are learning?'},
  {icon:'🧩',label:'Build',title:'Build the pattern from examples',body:evidenceText(lesson,0),prompt:'How would you explain the pattern simply?'},
  {icon:'💬',label:'Use',title:'Use it in a new situation',body:'Create a new sentence for a different situation using the same pattern.',prompt:'Did the meaning stay correct in the new example?'}
 ];
}

function getSteps(lesson:Lesson){
 if(lesson.subject==='العلوم والحياة')return scienceSteps(lesson);
 if(lesson.subject==='الرياضيات')return mathSteps(lesson);
 if(lesson.subject==='اللغة العربية')return arabicSteps(lesson);
 if(lesson.subject==='English')return englishSteps(lesson);
 return mathSteps(lesson);
}

export default function LearningCanvas({lesson}:{lesson:Lesson}){
 const steps=useMemo(()=>getSteps(lesson),[lesson]);
 const [index,setIndex]=useState(0);
 const [reflected,setReflected]=useState(false);
 const current=steps[index];
 function move(next:number){setIndex(Math.max(0,Math.min(steps.length-1,next)));setReflected(false)}
 return <section className={styles.canvas} aria-label="مساحة بناء الفكرة">
  <div className={styles.head}><div className={styles.headCopy}><small>مساحة بناء الفكرة · بلا درجات</small><h3>نرى الفكرة من أكثر من زاوية</h3></div><div className={styles.badge}>{lesson.subject==='العلوم والحياة'?'🔬':lesson.subject==='الرياضيات'?'➗':lesson.subject==='اللغة العربية'?'📚':'🌍'}</div></div>
  <div className={styles.steps}>{steps.map((s,i)=><button key={s.label} className={`${styles.step} ${i===index?styles.active:''} ${i<index?styles.done:''}`} onClick={()=>move(i)}><span>{i<index?'✓':s.icon}</span><strong>{s.label}</strong></button>)}</div>
  <div className={styles.panel}><h4>{current.title}</h4><p>{current.body}</p><div className={styles.prompt}>💡 {current.prompt}</div></div>
  {reflected&&<div className={styles.reflection}><strong>ممتاز — فكري قبل المتابعة</strong><div className={styles.micro}>لا نبحث عن جملة محفوظة. نريد أن يصبح المعنى واضحًا ويمكن استخدامه.</div></div>}
  <div className={styles.actions}><button className={styles.action} onClick={()=>setReflected(v=>!v)}>🧠 أفكر قبل أن أكمل</button>{index>0&&<button className={styles.action} onClick={()=>move(index-1)}>→ السابق</button>}<button className={`${styles.action} ${styles.primary}`} onClick={()=>move(index<steps.length-1?index+1:index)}>{index<steps.length-1?'الزاوية التالية ←':'اكتملت التجربة ✓'}</button></div>
  <div className={styles.micro}>أهداف المنهج تعمل خلف هذه التجربة لتحديد ما يجب أن يغطيه المحتوى، لكنها لا تُعرض كقائمة للطفل.</div>
 </section>;
}
