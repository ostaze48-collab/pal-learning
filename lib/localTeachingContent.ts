import type {Lesson} from './data';
import {chooseVisualStrategy} from './visualTeaching';

export type LocalTeachingMode='overview'|'simplify'|'step_by_step'|'analogy'|'real_world'|'deep'|'check';
export type LocalTeacherContent={title:string;intro:string;cards:Array<{title:string;body:string;kind:'explain'|'example'|'tip'|'check'}>;checkQuestion?:{text:string;hint:string};teacherNote?:string};

type Options={diagnosticCorrect?:boolean;weaknessScore?:number|null;conceptSuccess?:number|null};
export function buildLocalTeachingContent(lesson:Lesson,mode:LocalTeachingMode='overview',options:Options={}):LocalTeacherContent{
 const needsSupport=options.diagnosticCorrect===false||(Number.isFinite(Number(options.weaknessScore))&&Number(options.weaknessScore)<80)||(Number.isFinite(Number(options.conceptSuccess))&&Number(options.conceptSuccess)<80);
 const visual=chooseVisualStrategy(lesson);
 const introPrefix=needsSupport?'سنبدأ من أبسط نقطة ضرورية ثم نبني عليها. ':mode==='deep'?'سنفهم الفكرة ثم نوسعها ضمن هدف الدرس. ':mode==='step_by_step'?'سنمشي خطوة خطوة. ':mode==='simplify'?'سنأخذ فكرة واحدة في كل مرة. ':'';
 const points=lesson.learningPoints.slice(0,4);
 const cards:Array<{title:string;body:string;kind:'explain'|'example'|'tip'|'check'}>=[];
 if(points.length){
   if(mode==='step_by_step')points.forEach((p,i)=>cards.push({title:`الخطوة ${i+1}`,body:p,kind:'explain'}));
   else if(mode==='simplify')points.forEach((p,i)=>cards.push({title:`فكرة صغيرة ${i+1}`,body:p,kind:'explain'}));
   else points.forEach((p,i)=>cards.push({title:i===0?'الفكرة الأساسية':`نربط معها ${i+1}`,body:p,kind:'explain'}));
 }
 cards.push({title:'مثال من الدرس',body:lesson.example,kind:'example'});
 const thinkingTip=lesson.subject==='الرياضيات'?'لا تحفظي النتيجة وحدها؛ قارني كل خطوة بالعلاقة أو النموذج البصري في الدرس.':lesson.subject==='العلوم والحياة'?'بعد المثال اسألي: ماذا لاحظت؟ ما الدليل؟ وما السبب أو التفسير؟':lesson.subject==='English'?'ابدئي بمعنى الجملة والسياق ثم لاحظي النمط اللغوي وطبّقيه في مثال جديد.':'ابدئي بالمعنى والسياق، ثم لاحظي النمط أو القاعدة وطبّقيها في جملة جديدة.';
 cards.push({title:`كيف أفكر؟ · ${visual.label}`,body:thinkingTip,kind:'tip'});
 const q=lesson.questions[0];
 return {title:lesson.title,intro:`${introPrefix}${lesson.summary}`,cards:cards.slice(0,7),checkQuestion:{text:q?.text||'اشرحي الفكرة بكلماتك.',hint:q?.explanation||'ارجعي إلى الفكرة الأساسية ومثال الدرس.'},teacherNote:'شرح محلي احتياطي مبني فقط على محتوى الدرس المسجل من المنهاج؛ لا يضيف حقائق منهجية خارجية.'};
}
