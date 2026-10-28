import type {Lesson} from './data';
import type {TeachingMode} from './teachingProfile';
import {buildTeacherSessionPlan} from './teacherBrain';

export type LocalTeachingMode='overview'|'simplify'|'step_by_step'|'analogy'|'real_world'|'deep'|'check';
export type LocalTeacherContent={title:string;intro:string;cards:Array<{title:string;body:string;kind:'explain'|'example'|'tip'|'check'}>;checkQuestion?:{text:string;hint:string};teacherNote?:string};

type Options={diagnosticCorrect?:boolean;weaknessScore?:number|null;conceptSuccess?:number|null;subjectMastery?:number|null;preferredMode?:TeachingMode;lastUnderstanding?:string|null};
export function buildLocalTeachingContent(lesson:Lesson,mode:LocalTeachingMode='overview',options:Options={}):LocalTeacherContent{
 const requested=mode!=='overview'&&mode!=='check'?mode as TeachingMode:options.preferredMode;
 const plan=buildTeacherSessionPlan(lesson,{diagnosticCorrect:options.diagnosticCorrect,weakestScore:options.weaknessScore,conceptSuccess:options.conceptSuccess,subjectMastery:options.subjectMastery,preferredMode:requested,lastUnderstanding:options.lastUnderstanding});
 const activeMode:LocalTeachingMode=mode==='overview'?plan.entryMode:mode;
 const introPrefix=plan.level==='rebuild'?'سنثبت الأساس الضروري أولًا ثم نعود مباشرة لفكرة اليوم. ':plan.level==='guided'?'سأعطيك دعمًا صغيرًا ثم أجعلك تجربين بنفسك. ':plan.level==='stretch'?'أنتِ قوية في الأساس؛ سنختصر الشرح ونصل أسرع إلى التحدي. ':'';
 const points=lesson.learningPoints.slice(0,plan.level==='stretch'?3:4);
 const cards:Array<{title:string;body:string;kind:'explain'|'example'|'tip'|'check'}>=[];
 if(points.length){
   if(activeMode==='step_by_step')points.forEach((p,i)=>cards.push({title:`الخطوة ${i+1}`,body:p,kind:'explain'}));
   else if(activeMode==='simplify')points.forEach((p,i)=>cards.push({title:`فكرة صغيرة ${i+1}`,body:p,kind:'explain'}));
   else points.forEach((p,i)=>cards.push({title:i===0?'الفكرة الأساسية':`نربط معها ${i+1}`,body:p,kind:'explain'}));
 }
 cards.push({title:'مثال من الدرس',body:lesson.example,kind:'example'});
 const thinkingTip=lesson.subject==='الرياضيات'?'لا تحفظي النتيجة وحدها؛ قارني كل خطوة بالعلاقة أو النموذج البصري في الدرس.':lesson.subject==='العلوم والحياة'?'بعد المثال اسألي: ماذا لاحظت؟ ما الدليل؟ وما السبب أو التفسير؟':lesson.subject==='English'?'ابدئي بمعنى الجملة والسياق ثم لاحظي النمط اللغوي وطبّقيه في مثال جديد.':'ابدئي بالمعنى والسياق، ثم لاحظي النمط أو القاعدة وطبّقيها في جملة جديدة.';
 cards.push({title:`كيف أفكر؟ · ${plan.visualLabel}`,body:thinkingTip,kind:'tip'});
 if(plan.level==='stretch')cards.push({title:'تحدي التفكير',body:'حاولي تفسير لماذا تعمل الفكرة، ثم طبقيها على مثال مختلف بدل إعادة نفس المثال.',kind:'check'});
 const q=lesson.questions[0];
 return {title:lesson.title,intro:`${introPrefix}${lesson.summary}`,cards:cards.slice(0,7),checkQuestion:{text:q?.text||'اشرحي الفكرة بكلماتك.',hint:q?.explanation||'ارجعي إلى الفكرة الأساسية ومثال الدرس.'},teacherNote:`شرح محلي احتياطي مبني فقط على محتوى الدرس المسجل من المنهاج. خطة الجلسة: ${plan.reason} قاعدة الانتقال: ${plan.transitionRule}`};
}
