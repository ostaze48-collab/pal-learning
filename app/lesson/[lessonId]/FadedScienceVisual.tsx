'use client';
import {useMemo,useState} from 'react';
import type {TeachingVisualSpec} from '../../../lib/teachingVisuals';
import styles from './TeachingSceneVisual.module.css';

type Challenge={title:string;prompt:string;options:string[];correct:number;success:string};
function lessonId(variant?:string){return String(variant||'').split('|')[0]||''}
function objectiveId(variant?:string){return Number(String(variant||'').split('|')[1])||1}

function challengeFor(spec:TeachingVisualSpec):Challenge{
 const id=lessonId(spec.variant);const objective=objectiveId(spec.variant);
 if(/cell-types/.test(id)){
  if(objective===1)return {title:'استدلي دون صورة جاهزة',prompt:'وجدنا في كائن حي وحدات صغيرة جدًا تبني أنسجته. ما الاسم الأدق لهذه الوحدات؟',options:['الخلايا','الأعضاء','الأجهزة'],correct:0,success:'ربطتِ الوحدة الصغيرة ببناء الكائن الحي دون أن نعرض المجهر مرة أخرى.'};
  if(objective===2||objective===4)return {title:'استخدمي دليلًا واحدًا قويًا',prompt:'خلية فيها جدار خلوي وبلاستيدات خضراء. ماذا تستنتجين؟',options:['نباتية','حيوانية','لا يمكن التمييز'],correct:0,success:'اعتمدتِ على تركيب مميز لا على شكل الخلية فقط.'};
  return {title:'اربطي الجزء بالعمل',prompt:'إذا تعطلت قدرة الخلية على تنظيم كثير من أنشطتها، فأي جزء نراجع أولًا؟',options:['النواة','الجدار الخلوي','الفجوة فقط'],correct:0,success:'استخدمتِ معنى الوظيفة بدل حفظ اسم الجزء.'};
 }
 if(/separation-methods/.test(id)){
  const prompts=[
   {prompt:'مخلوط ماء ورمل. أي خاصية تقودك للطريقة المناسبة؟',options:['الرمل غير ذائب ويمكن حجزه بمرشح','الرمل ينجذب للمغناطيس','الماء يتحول إلى حديد'],correct:0},
   {prompt:'برادة حديد مختلطة برمل. ما أول أداة تختارينها؟',options:['مغناطيس','مرشح ورقي','مصباح'],correct:0},
   {prompt:'ملح مذاب تمامًا في ماء ونريد استرجاع الملح. ما الأنسب؟',options:['التبخير','المغناطيس','الغربلة'],correct:0}
  ];const picked=prompts[Math.min(prompts.length-1,Math.max(0,objective-1))];return {title:'اختاري من خاصية المادة',...picked,success:'اخترتِ طريقة الفصل من الدليل الموجود في المخلوط، لا من اسم محفوظ.'};
 }
 if(/materials-properties/.test(id))return {title:'اختاري مادة من خاصيتها',prompt:'نريد غطاءً لمقبض كهربائي يقلل انتقال الكهرباء إلى اليد. أي خاصية نبحث عنها؟',options:['العزل الكهربائي','الذوبان السريع','اللمعان فقط'],correct:0,success:'ربطتِ الاستخدام بالخاصية المطلوبة.'};
 if(/physical-chemical-changes|physical-chemical/.test(id))return {title:'ابحثي عن المادة الجديدة',prompt:'ذاب مكعب ثلج ثم تجمد مرة أخرى. ما أفضل وصف؟',options:['تغير فيزيائي لأن المادة بقيت ماءً','تغير كيميائي لأن الشكل تغير','تفاعل كيميائي لأن البرودة ظهرت'],correct:0,success:'استخدمتِ سؤال «هل تكونت مادة جديدة؟» بدل شكل التغير فقط.'};
 if(/energy-transformations/.test(id))return {title:'تتبعي الطاقة وحدك',prompt:'في مصباح يعمل ببطارية، أي تحول هو الأقرب؟',options:['كيميائية → كهربائية → ضوئية','ضوئية → كيميائية فقط','حرارية → كتلة'],correct:0,success:'تتبعتِ انتقال الطاقة عبر النظام بدل حفظ زوج جاهز.'};
 if(/energy-forms|energy-environment/.test(id))return {title:'حددي الطاقة من الموقف',prompt:'كرة تتحرك بسرعة على الأرض. أي شكل طاقة يظهر بوضوح؟',options:['طاقة حركية','طاقة ضوئية فقط','لا توجد طاقة'],correct:0,success:'استدللتِ على شكل الطاقة من حالة الجسم.'};
 if(/average-speed/.test(id))return {title:'احسبي من موقف جديد',prompt:'قطع جسم 120 مترًا في 30 ثانية. ما سرعته المتوسطة؟',options:['4 م/ث','90 م/ث','3600 م/ث'],correct:0,success:'استخدمتِ المسافة الكلية والزمن الكلي في مثال جديد.'};
 if(/distance-displacement/.test(id))return {title:'ميّزي الطريق من التغير الصافي',prompt:'مشى شخص 3 م شرقًا ثم 3 م غربًا إلى نقطة البداية. ماذا يساوي الإزاحة؟',options:['0 م','6 م','3 م'],correct:0,success:'فصلتِ طول الطريق عن التغير الصافي في الموقع.'};
 if(/constant-acceleration/.test(id))return {title:'استنتجي من تغير السرعة',prompt:'زادت سرعة جسم من 2 م/ث إلى 8 م/ث خلال 3 ثوانٍ. هل يوجد تسارع؟',options:['نعم لأن السرعة تغيرت مع الزمن','لا لأن الجسم يتحرك فقط','لا يمكن أن توجد سرعة وتسارع معًا'],correct:0,success:'استخدمتِ تغير السرعة مع الزمن كدليل.'};
 if(/translational-motion/.test(id))return {title:'استدلي من الحركة',prompt:'تحرك كتاب على الطاولة وبقي شكله واتجاه أجزائه بالنسبة لبعضها تقريبًا كما هو. ما الوصف الأقرب؟',options:['حركة انتقالية','تفاعل كيميائي','لا توجد حركة'],correct:0,success:'استدللتِ من تغير موضع الجسم ككل.'};
 if(/newton|force/.test(id))return {title:'توقعي قبل أن تري النتيجة',prompt:'دُفع جسم بالقوة نفسها، ثم أصبحت كتلته أكبر كثيرًا. ماذا تتوقعين لتسارعه؟',options:['يقل','يزداد دائمًا','لا يتأثر أبدًا'],correct:0,success:'ربطتِ القوة والكتلة بالتسارع في موقف جديد.'};
 if(/atom-structure/.test(id))return {title:'ابني استنتاجًا من الشحنة',prompt:'ذرة متعادلة فيها 9 بروتونات. كم إلكترونًا نتوقع؟',options:['9','18','0'],correct:0,success:'استخدمتِ معنى التعادل بدل حفظ مثال بعينه.'};
 if(/element-compound|important-compounds/.test(id))return {title:'ميّزي من نوع الذرات',prompt:'مادة تتكون وحداتها من نوعين مختلفين من الذرات مرتبطين كيميائيًا. ما التصنيف الأقرب؟',options:['مركب','عنصر نقي من نوع واحد','مخلوط بلا روابط'],correct:0,success:'استدللتِ على المركب من ارتباط أنواع مختلفة من الذرات.'};
 if(/chemical-reactions|reaction/.test(id))return {title:'اتبعي الذرات لا شكل المادة',prompt:'بعد تفاعل ظهرت مادة جديدة. ما الوصف الأدق للذرات؟',options:['أعيد ترتيبها في روابط جديدة','اختفت كلها','ظهرت ذرات من العدم'],correct:0,success:'استخدمتِ فكرة إعادة ترتيب الذرات لتفسير التفاعل.'};
 if(/atmospheric-pressure|pressure/.test(id))return {title:'توقعي من عمود الهواء',prompt:'صعدنا من شاطئ البحر إلى قمة جبل مرتفع. ماذا نتوقع للضغط الجوي عادة؟',options:['يقل','يزداد لأننا اقتربنا من السماء','يبقى متطابقًا دائمًا'],correct:0,success:'ربطتِ الضغط بكمية الهواء فوق المكان.'};
 return {title:'استدلي قبل التحقق',prompt:'أي تصرف يدل على استخدام الفكرة العلمية بنفسك؟',options:['أتوقع ثم أبحث عن دليل','أنسخ النتيجة قبل التجربة','أختار دون ملاحظة'],correct:0,success:'انتقلتِ من مشاهدة الظاهرة إلى بناء استنتاج.'};
}

export default function FadedScienceVisual({spec}:{spec:TeachingVisualSpec}){
 const challenge=useMemo(()=>challengeFor(spec),[spec.variant]);const [picked,setPicked]=useState<number|null>(null);const correct=picked===challenge.correct;
 return <div className={styles.visual}><span className={styles.title}>🧪 {challenge.title}</span><div className={styles.stage}><div style={{display:'grid',gap:12,width:'100%'}}><strong style={{fontSize:18,lineHeight:1.7}}>{challenge.prompt}</strong><div className={styles.actions}>{challenge.options.map((option,index)=><button type="button" key={option} className={`${styles.button} ${picked===index&&correct?styles.active:''}`} onClick={()=>setPicked(index)}>{option}</button>)}</div>{picked!==null&&<div className={styles.hint}>{correct?`✓ ${challenge.success}`:'راجعي ما لاحظتِه في المشهد السابق: ما الدليل الذي يغيّر أو يدعم توقعك؟ ثم جرّبي مرة أخرى.'}</div>}</div></div></div>;
}
