'use client';
import {useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import styles from './LearningCanvas.module.css';

type CanvasStep={icon:string;label:string;title:string;body:string;prompt:string};

function scienceSteps(lesson:Lesson):CanvasStep[]{
 const point=lesson.learningPoints[0]||lesson.summary;
 return [
  {icon:'👀',label:'ألاحظ',title:'ابدئي بما ترينه',body:lesson.example||lesson.summary,prompt:'ما الشيء الذي تستطيعين ملاحظته مباشرة قبل أن نذكر القاعدة؟'},
  {icon:'💭',label:'أتوقع',title:'كوّني توقعًا',body:`قبل معرفة النتيجة، فكري: ما الذي تتوقعين حدوثه أو ظهوره؟`,prompt:'قولي لنفسك لماذا اخترتِ هذا التوقع.'},
  {icon:'🔎',label:'أبحث عن دليل',title:'قارني التوقع بالدليل',body:`ابحثي في الصورة أو التجربة عن شيء يدعم الفكرة: ${point}`,prompt:'ما الدليل الذي غيّر أو أكد توقعك؟'},
  {icon:'🧠',label:'أفسر',title:'حوّلي الدليل إلى فكرة',body:`الهدف الآن ليس حفظ الجملة، بل تفسيرها بلغتك: ${point}`,prompt:'اشرحي العلاقة بين ما رأيته والفكرة في جملة قصيرة.'}
 ];
}

function mathSteps(lesson:Lesson):CanvasStep[]{
 const point=lesson.learningPoints[0]||lesson.summary;
 return [
  {icon:'🧱',label:'محسوس',title:'ابدئي بشيء يمكن تخيله',body:lesson.example||lesson.summary,prompt:'ما الكمية أو العلاقة الموجودة هنا قبل كتابة أي رمز؟'},
  {icon:'🖼️',label:'بصري',title:'حوّلي الفكرة إلى صورة أو نموذج',body:`مثلي العلاقة بخط، مجموعات، أجزاء أو ترتيب. الفكرة الأساسية: ${point}`,prompt:'أي جزء في الرسم يمثل كل كمية؟'},
  {icon:'✏️',label:'رمزي',title:'الآن نكتبها بالرموز',body:`بعد أن أصبحت العلاقة واضحة بصريًا، اكتبيها بالطريقة الرياضية المناسبة.`,prompt:'ما الرمز أو العملية التي تمثل العلاقة التي رأيتها؟'},
  {icon:'🚀',label:'تطبيق',title:'استخدميها في موقف جديد',body:`انقلي الفكرة نفسها إلى مثال مختلف عن المثال الأول.`,prompt:'ما الذي بقي ثابتًا رغم أن الأرقام أو السياق تغير؟'}
 ];
}

function arabicSteps(lesson:Lesson):CanvasStep[]{
 const point=lesson.learningPoints[0]||lesson.summary;
 return [
  {icon:'📖',label:'سياق',title:'ابدئي من المعنى',body:lesson.example||lesson.summary,prompt:'ما المعنى الذي فهمته من الجملة أو النص؟'},
  {icon:'🔍',label:'ألاحظ',title:'ابحثي عن النمط',body:`انظري إلى الكلمات أو التراكيب التي تتكرر أو تتغير.`,prompt:'ما الشيء المشترك بين الأمثلة؟'},
  {icon:'🧩',label:'أبني القاعدة',title:'استخرجي الفكرة من الأمثلة',body:`حوّلي ما لاحظته إلى قاعدة أو ملاحظة مفيدة: ${point}`,prompt:'كيف تشرحين القاعدة بكلماتك؟'},
  {icon:'✍️',label:'أستخدم',title:'اصنعي مثالًا جديدًا',body:`الآن استخدمي الفكرة في جملة من عندك.`,prompt:'هل مثالك الجديد يحقق نفس النمط؟'}
 ];
}

function englishSteps(lesson:Lesson):CanvasStep[]{
 const point=lesson.learningPoints[0]||lesson.summary;
 return [
  {icon:'🎬',label:'Situation',title:'Start with meaning',body:lesson.example||lesson.summary,prompt:'What is happening in this situation?'},
  {icon:'👀',label:'Notice',title:'Notice the pattern',body:'Look at the words that change and the words that stay the same.',prompt:'Which part carries the meaning we are learning?'},
  {icon:'🧩',label:'Build',title:'Build the pattern',body:`Connect the examples to this idea: ${point}`,prompt:'How would you explain the pattern simply?'},
  {icon:'💬',label:'Use',title:'Use it in a new sentence',body:'Create a new sentence for a different situation using the same pattern.',prompt:'Did the meaning stay correct in the new example?'}
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
  <div className={styles.head}><div className={styles.headCopy}><small>مساحة بناء الفكرة · بلا درجات</small><h3>نفس الفكرة من أكثر من زاوية</h3></div><div className={styles.badge}>{lesson.subject==='العلوم والحياة'?'🔬':lesson.subject==='الرياضيات'?'➗':lesson.subject==='اللغة العربية'?'📚':'🌍'}</div></div>
  <div className={styles.steps}>{steps.map((s,i)=><button key={s.label} className={`${styles.step} ${i===index?styles.active:''} ${i<index?styles.done:''}`} onClick={()=>move(i)}><span>{i<index?'✓':s.icon}</span><strong>{s.label}</strong></button>)}</div>
  <div className={styles.panel}><h4>{current.title}</h4><p>{current.body}</p><div className={styles.prompt}>💡 {current.prompt}</div></div>
  {reflected&&<div className={styles.reflection}><strong>ممتاز — توقفي لحظة قبل المتابعة</strong><div className={styles.micro}>لا نبحث عن إجابة محفوظة؛ فقط تأكدي أنك تستطيعين ربط ما رأيته بالفكرة.</div></div>}
  <div className={styles.map}>{lesson.learningPoints.slice(0,4).map((p,i)=><div className={styles.mapNode} key={`${i}-${p}`}><b>رابط {i+1}</b>{p}</div>)}</div>
  <div className={styles.actions}><button className={styles.action} onClick={()=>setReflected(v=>!v)}>🧠 أفكر قبل أن أكمل</button>{index>0&&<button className={styles.action} onClick={()=>move(index-1)}>→ السابق</button>}<button className={`${styles.action} ${styles.primary}`} onClick={()=>move(index<steps.length-1?index+1:index)}>{index<steps.length-1?'الزاوية التالية ←':'اكتملت الزوايا ✓'}</button></div>
  <div className={styles.micro}>هذه المساحة جزء من الشرح وليست اختبارًا. الهدف أن يرى الطفل الفكرة في تمثيلات مختلفة قبل الانتقال إلى التحقق النهائي.</div>
 </section>;
}
