'use client';
import {useMemo,useState} from 'react';
import type {TeachingVisualSpec} from '../../../lib/teachingVisuals';
import styles from './TeachingSceneVisual.module.css';

type ChoiceChallenge={kind:'choice';title:string;prompt:string;options:string[];correct:number;success:string};
type OpenChallenge={kind:'open';title:string;prompt:string;hint:string;success:string};
type Challenge=ChoiceChallenge|OpenChallenge;
function lessonId(variant?:string){return String(variant||'').split('|')[0]||''}
function objectiveId(variant?:string){return Number(String(variant||'').split('|')[1])||1}

function readingChallenge(id:string,objective:number):OpenChallenge{
 const poetic=/poem/.test(id);
 if(objective===1)return {kind:'open',title:poetic?'عبّري عن الفكرة بصوتك أنتِ':'لخّصي الفكرة بكلماتك',prompt:poetic?'اكتبي جملة واحدة تعبّر عن الفكرة أو الشعور الأبرز في النص.':'اكتبي الفكرة الرئيسة أو القضية التي يجمعها النص في جملة واحدة.',hint:'لا تنسخي العنوان؛ اكتبي المعنى الذي فهمتِه.',success:'أنتِ الآن تنتجين المعنى بدل أن تختاريه من قائمة.'};
 if(objective===2)return {kind:'open',title:'هاتِ دليلًا من النص',prompt:'اكتبي كلمة أو تفصيلًا أو موقفًا من النص يدعم فهمك، ثم اذكري ماذا يدل عليه.',hint:'الدليل يجب أن يكون مرتبطًا بالفكرة أو الشعور الذي اخترتِه.',success:'ربطتِ الفكرة بدليل بدل الاكتفاء بانطباع عام.'};
 return {kind:'open',title:'أعيدي صياغة المعنى',prompt:poetic?'اختاري تعبيرًا أو صورة من النص، ثم اشرحي معناها بأسلوبك في جملة قصيرة.':'اكتبي العلاقة أو القيمة أو النتيجة التي فهمتِها من النص بأسلوبك.',hint:'الفكرة ليست نسخ العبارة نفسها؛ اشرحي ماذا تعني لكِ داخل السياق.',success:'انتقلتِ من القراءة إلى التفسير بلغتك أنتِ.'};
}

function challengeFor(spec:TeachingVisualSpec):Challenge{
 const id=lessonId(spec.variant);const objective=objectiveId(spec.variant);
 if(/reading|poem|teacher-merit/.test(id))return readingChallenge(id,objective);
 if(/noun-types/.test(id))return {kind:'choice',title:'صنّفي مثالًا جديدًا',prompt:'في «ليان وصلت، وهي سعيدة» ما تصنيف «ليان» و«هي»؟',options:['ليان علم، وهي ضمير','ليان ضمير، وهي علم','الكلمتان فعلان'],correct:0,success:'استخدمتِ وظيفة الكلمة داخل جملة جديدة.'};
 if(/pronouns/.test(id))return {kind:'choice',title:'ميّزي الضمير من استعماله',prompt:'في «قلمنا جديد» ما نوع «نا»؟',options:['ضمير متصل','ضمير منفصل','اسم علم'],correct:0,success:'حددتِ النوع من طريقة ظهور الضمير لا من حفظ مثال سابق.'};
 if(/verb-tenses/.test(id))return {kind:'choice',title:'اختاري الزمن من المعنى',prompt:'أي فعل يدل على طلب حدوث الفعل؟',options:['اكتبْ','كتبَ','يكتبُ'],correct:0,success:'ربطتِ صيغة الفعل بوظيفتها الزمنية/الدلالية.'};
 if(/solar-lunar/.test(id))return {kind:'choice',title:'استخدمي النطق للحكم',prompt:'أي كلمة فيها لام شمسية؟',options:['النَّجم','القمر','الكتاب'],correct:0,success:'اعتمدتِ على نطق اللام وتشديد الحرف التالي.'};
 if(/ta-spelling/.test(id))return {kind:'choice',title:'صححي نهاية الكلمة',prompt:'أي كتابة صحيحة لاسم مكان نتعلم فيه؟',options:['مدرسة','مدرست','مدرسه'],correct:0,success:'ميزتِ التاء المربوطة في كلمة جديدة.'};
 if(/ta-marbuta-haa/.test(id))return {kind:'choice',title:'اختبري النهاية بالوصل',prompt:'أي كلمة تنتهي بهاء وليست تاء مربوطة؟',options:['وجه','شجرة','رحمة'],correct:0,success:'استخدمتِ شكل الحرف وصوته عند الوصل للتمييز.'};
 if(/middle-hamza/.test(id))return {kind:'choice',title:'طبقي قاعدة أقوى الحركتين',prompt:'إذا كانت الهمزة مكسورة وما قبلها مضمومًا، فعلى ماذا تكتب غالبًا؟',options:['نبرة','واو','ألف'],correct:0,success:'قارنتِ الحركتين وطبقتِ قوة الكسرة.'};
 if(/final-hamza/.test(id))return {kind:'choice',title:'انظري لما قبل الهمزة',prompt:'إذا كان الحرف قبل الهمزة المتطرفة مكسورًا، فعلى ماذا تكتب غالبًا؟',options:['نبرة','واو','السطر دائمًا'],correct:0,success:'طبقتِ قاعدة الهمزة المتطرفة على حركة الحرف السابق.'};
 if(/definite-indefinite/.test(id))return {kind:'choice',title:'ميّزي التعيين من السياق',prompt:'أي كلمة معرفة؟',options:['هذا','كتاب','قلم'],correct:0,success:'ميزتِ المعرفة من دلالتها ونوعها.'};
 if(/sound-verbs/.test(id))return {kind:'choice',title:'افحصي الحروف الأصلية',prompt:'أي فعل صحيح مضعف؟',options:['شدّ','كتب','أخذ'],correct:0,success:'صنفتِ الفعل بعد فحص أصوله لا شكله السطحي فقط.'};
 if(/weak-verbs/.test(id))return {kind:'choice',title:'حددي موقع حرف العلة',prompt:'الفعل «باع» من أي نوع؟',options:['أجوف','مثال','ناقص'],correct:0,success:'استخدمتِ موقع حرف العلة لتحديد النوع.'};
 if(/inflected-built-nouns/.test(id))return {kind:'choice',title:'اختبري الكلمة في أكثر من موقع',prompt:'أي سلسلة تدل على اسم معرب؟',options:['طالبٌ / طالبًا / طالبٍ','هذا / هذا / هذا','هو / هو / هو'],correct:0,success:'استدللتِ من تغير آخر الكلمة.'};
 if(/built-nouns/.test(id))return {kind:'choice',title:'ابحثي عن ثبات الآخر',prompt:'أي كلمة من الأسماء المبنية غالبًا؟',options:['هذا','طالب','كتاب'],correct:0,success:'ربطتِ البناء بثبات آخر الكلمة.'};
 if(/sub-inflection-signs/.test(id))return {kind:'choice',title:'اختاري العلامة من الباب والموقع',prompt:'ما علامة رفع جمع المذكر السالم؟',options:['الواو','الياء','الفتحة'],correct:0,success:'حددتِ العلامة الفرعية بعد معرفة نوع الاسم وموقعه.'};
 if(/building-signs/.test(id))return {kind:'choice',title:'اربطِي النوع بعلامة البناء',prompt:'فعل أمر صحيح الآخر مثل «اكتبْ» يبنى على ماذا؟',options:['السكون','الضمة','الكسرة'],correct:0,success:'طبقتِ علامة البناء على مثال جديد.'};
 return {kind:'open',title:'استخدمي الفكرة بطريقتك',prompt:'اكتبي مثالًا جديدًا من عندك يطبق الفكرة التي اكتشفتِها في هذا الدرس.',hint:'غيّري الكلمات أو الموقف، لكن احتفظي بالقاعدة أو المعنى نفسه.',success:'حوّلتِ الفكرة من مثال شاهدتِه إلى استخدام من عندك.'};
}

function ChoiceView({challenge}:{challenge:ChoiceChallenge}){const [picked,setPicked]=useState<number|null>(null);const correct=picked===challenge.correct;return <div style={{display:'grid',gap:12,width:'100%'}}><strong style={{fontSize:18,lineHeight:1.8}}>{challenge.prompt}</strong><div className={styles.actions}>{challenge.options.map((option,index)=><button type="button" key={option} className={`${styles.button} ${picked===index&&correct?styles.active:''}`} onClick={()=>setPicked(index)}>{option}</button>)}</div>{picked!==null&&<div className={styles.hint}>{correct?`✓ ${challenge.success}`:'راجعي القاعدة أو الدليل الذي اكتشفتِه في المشهد السابق، ثم جرّبي مرة أخرى.'}</div>}</div>}
function OpenView({challenge}:{challenge:OpenChallenge}){const [text,setText]=useState('');const [saved,setSaved]=useState(false);return <div style={{display:'grid',gap:12,width:'100%'}}><strong style={{fontSize:18,lineHeight:1.8}}>{challenge.prompt}</strong><textarea value={text} onChange={e=>{setText(e.target.value);setSaved(false)}} placeholder={challenge.hint} rows={3} style={{width:'100%',border:'1px solid #d8e3df',borderRadius:14,padding:12,font:'inherit',lineHeight:1.8,resize:'vertical'}}/><button type="button" className={`${styles.button} ${saved?styles.active:''}`} disabled={text.trim().length<8} onClick={()=>setSaved(true)}>{saved?'ثبتت فكرتي ✓':'ثبتي فكرتك'}</button>{saved&&<div className={styles.hint}>✓ {challenge.success} قارني ما كتبتِه بالسياق قبل الانتقال.</div>}</div>}

export default function FadedArabicVisual({spec}:{spec:TeachingVisualSpec}){const challenge=useMemo(()=>challengeFor(spec),[spec.variant]);return <div className={styles.visual}><span className={styles.title}>✍️ {challenge.title}</span><div className={styles.stage}>{challenge.kind==='choice'?<ChoiceView challenge={challenge}/>:<OpenView challenge={challenge}/>}</div></div>}
