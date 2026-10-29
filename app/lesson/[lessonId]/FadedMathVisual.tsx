'use client';
import {useMemo,useState} from 'react';
import type {TeachingVisualSpec} from '../../../lib/teachingVisuals';
import FadedScienceVisual from './FadedScienceVisual';
import styles from './TeachingSceneVisual.module.css';

type Challenge={title:string;prompt:string;options:string[];correct:number;success:string};
function lessonId(variant?:string){return String(variant||'').split('|')[0]||''}
function objectiveId(variant?:string){return Number(String(variant||'').split('|')[1])||1}

function challengeFor(spec:TeachingVisualSpec):Challenge{
 const id=lessonId(spec.variant);const objective=objectiveId(spec.variant);
 if(/prime|factor|gcf|lcm/.test(id))return {title:'كمّلي وحدك',prompt:objective>=2?'أي تحليل يصل إلى عوامل أولية فقط للعدد 18؟':'أي وصف صحيح للعدد 17؟',options:objective>=2?['2 × 9','2 × 3 × 3','3 × 6']:['أولي','غير أولي','يساوي 1'],correct:objective>=2?1:0,success:'وصلتِ للنتيجة بدون أن نعرض خطوات الشجرة.'};
 if(/fraction/.test(id))return {title:'كمّلي الكسر دون مثال جاهز',prompt:/div/.test(id)?'في 3/4 ÷ 1/2، أي تحويل صحيح؟':'أي كسر يساوي 2/3؟',options:/div/.test(id)?['3/4 × 2','4/3 × 2','3/4 × 1/2']:['3/6','4/6','5/6'],correct:/div/.test(id)?0:1,success:'استخدمتِ الفكرة من دون أن نعرض لكِ الحل خطوة خطوة.'};
 if(/decimal/.test(id))return {title:'اربطي التمثيل وحدك',prompt:'أي كسر عشري يمثل 6 أعشار؟',options:['0.06','0.6','6.0'],correct:1,success:'ربطتِ الأعشار بالصيغة العشرية دون شبكة محلولة.'};
 if(/integer|absolute-value/.test(id))return {title:'تحركي في ذهنك أولًا',prompt:/multiply-divide/.test(id)?'ما إشارة (-4) × (-3)؟':'ابدئي من -2 وتحركي 5 خطوات يمينًا. أين تصلين؟',options:/multiply-divide/.test(id)?['موجبة','سالبة','صفر']:['3','-7','-3'],correct:0,success:'طبقتِ معنى الإشارة/الحركة من دون خط أعداد محلول أمامك.'};
 if(/triangle|area|rectangle|square/.test(id))return {title:'احسبي من الشكل في ذهنك',prompt:/triangle/.test(id)?'مثلث قاعدته 6 وارتفاعه 4. ما مساحته؟':'مستطيل طوله 5 وعرضه 3. ما مساحته؟',options:/triangle/.test(id)?['24','12','10']:['8','15','16'],correct:1,success:'استخدمتِ العلاقة دون أن نعرض أبعادًا متحركة أو الناتج مسبقًا.'};
 if(/net|prism|cube|pyramid/.test(id))return {title:'تخيلي الطي وحدك',prompt:'أي وصف صحيح لشبكة المكعب؟',options:['ستة مربعات يمكن طيها إلى أوجه المكعب','دائرة واحدة','ثلاثة مثلثات فقط'],correct:0,success:'انتقلتِ من الشبكة إلى المجسم من دون حركة الطي أمامك.'};
 if(/cartesian|reflection|translation/.test(id))return {title:'حرّكي النقطة ذهنيًا',prompt:/reflection/.test(id)?'انعكاس (3،-2) حول محور س يساوي:':'إذا تحركت (1،2) ثلاث وحدات يمينًا تصبح:',options:/reflection/.test(id)?['(3،2)','(-3،-2)','(-3،2)']:['(4،2)','(1،5)','(-2،2)'],correct:0,success:'طبقتِ التحويل من دون رسم محلول مسبقًا.'};
 if(/data|statistics|frequency|mean|median|mode|range|graph|chart/.test(id))return {title:'اقرئي البيانات وحدك',prompt:/median/.test(id)?'ما وسيط 2، 4، 7، 9، 11؟':/mode/.test(id)?'ما منوال 2، 3، 3، 5، 7؟':/range/.test(id)?'ما مدى 3، 6، 10، 12؟':'ما متوسط 2، 4، 6؟',options:/median/.test(id)?['4','7','9']:/mode/.test(id)?['2','3','7']:/range/.test(id)?['9','12','3']:['4','6','12'],correct:/median|mode/.test(id)?1:0,success:'استخرجتِ المقياس من القيم من دون أن يظهر لكِ الناتج أولًا.'};
 if(/inverse-proportion/.test(id))return {title:'أكملي العلاقة العكسية',prompt:'4 عمال ينجزون العمل في 6 أيام. إذا أصبحوا 8 بالمعدل نفسه، كم يومًا؟',options:['12','6','3'],correct:2,success:'حافظتِ على العلاقة العكسية دون عرض حاصل الضرب أمامك.'};
 if(/scale/.test(id))return {title:'استخدمي المقياس وحدك',prompt:'إذا كان 1 سم يمثل 4 كم، فكم تمثل 3 سم؟',options:['7 كم','12 كم','16 كم'],correct:1,success:'استخدمتِ عامل المقياس في مثال جديد.'};
 if(/proportion|ratio/.test(id))return {title:'أكملي التناسب',prompt:'إذا احتاج 4 أشخاص إلى كوبين، فكم كوبًا يحتاج 10 أشخاص بنفس المعدل؟',options:['4','5','8'],correct:1,success:'حافظتِ على النسبة دون أن نعرض الزوج المقابل جاهزًا.'};
 return {title:'جربيها بمساندة أقل',prompt:'أي خطوة تدل على أنكِ تستخدمين العلاقة بنفسك؟',options:['أعيد المثال نفسه حرفيًا','أطبقها على قيم جديدة','أختار جوابًا بلا سبب'],correct:1,success:'انتقلتِ من المشاهدة إلى الاستخدام.'};
}

function MathChallenge({spec}:{spec:TeachingVisualSpec}){
 const challenge=useMemo(()=>challengeFor(spec),[spec.variant]);const [picked,setPicked]=useState<number|null>(null);const correct=picked===challenge.correct;
 return <div className={styles.visual}><span className={styles.title}>🎯 {challenge.title}</span><div className={styles.stage}><div style={{display:'grid',gap:12,width:'100%'}}><strong style={{fontSize:18,lineHeight:1.7}}>{challenge.prompt}</strong><div className={styles.actions}>{challenge.options.map((option,index)=><button type="button" key={option} className={`${styles.button} ${picked===index?(index===challenge.correct?styles.active:''):''}`} onClick={()=>setPicked(index)}>{option}</button>)}</div>{picked!==null&&<div className={styles.hint}>{correct?`✓ ${challenge.success}`:'قريبة. ارجعي للعلاقة التي اكتشفتِها في المشهد السابق ثم جرّبي خيارًا آخر.'}</div>}</div></div></div>;
}

export default function FadedMathVisual({spec}:{spec:TeachingVisualSpec}){
 return /-science-/.test(lessonId(spec.variant))?<FadedScienceVisual spec={spec}/>:<MathChallenge spec={spec}/>;
}