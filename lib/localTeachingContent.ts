import type {Lesson} from './data';
import type {TeachingMode} from './teachingProfile';
import type {TeachingStrategy} from './multiStrategyTeaching';
import {buildTeacherSessionPlan} from './teacherBrain';
import {getLessonReadiness} from './masteryEngine';

export type LocalTeachingMode='overview'|'simplify'|'step_by_step'|'analogy'|'real_world'|'deep'|'check';
export type LocalTeacherContent={title:string;intro:string;cards:Array<{title:string;body:string;kind:'explain'|'example'|'tip'|'check'}>;checkQuestion?:{text:string;hint:string};teacherNote?:string};

type Options={diagnosticCorrect?:boolean;weaknessScore?:number|null;conceptSuccess?:number|null;subjectMastery?:number|null;preferredMode?:TeachingMode;lastUnderstanding?:string|null;teachingStrategy?:TeachingStrategy};
type Card=LocalTeacherContent['cards'][number];

function strategyCards(lesson:Lesson,strategy:TeachingStrategy|undefined):Card[]{
 if(!strategy)return [];
 const p=lesson.learningPoints;
 if(strategy.id==='factor_pairs')return [
  {title:'ابحثي عن أزواج الضرب',body:`نبدأ من معنى العامل: ${p[0]||lesson.summary} اكتبي أزواج الضرب التي تعطي العدد، ولا تحاولي حفظ قائمة العوامل مباشرة.`,kind:'explain'},
  {title:'مثال من الدرس',body:lesson.example,kind:'example'},
  {title:'ما الذي اكتشفناه؟',body:'كل رقم يظهر في زوج ضرب صحيح هو عامل للعدد. عندما نعرف العوامل يصبح الحكم على العدد أو تفكيكه أسهل.',kind:'tip'}
 ];
 if(strategy.id==='factor_tree')return [
  {title:'ابدئي بجذع الشجرة',body:p[0]||'اكتبي العدد كحاصل ضرب عاملين.',kind:'explain'},
  {title:'افحصي كل فرع',body:`${p[1]||'إذا كان العامل غير أولي، حلليه مرة أخرى.'} كل عامل مركب يصبح فرعًا جديدًا.`,kind:'explain'},
  {title:'متى تتوقف الشجرة؟',body:p[2]||'نتوقف عندما تصبح جميع العوامل أعدادًا أولية.',kind:'tip'},
  {title:'طبقي على مثال الكتاب',body:lesson.example,kind:'example'}
 ];
 if(strategy.id==='reverse_build')return [
  {title:'نبدأ من النهاية هذه المرة',body:'خذي العوامل الأولية في المثال واضربيها تدريجيًا. إذا أعادت العدد الأصلي فهذا دليل أن التحليل يحافظ على قيمة العدد.',kind:'explain'},
  {title:'مثال الدرس',body:lesson.example,kind:'example'},
  {title:'سؤال التفكير',body:'إذا أعطيتك عوامل أولية، هل تستطيعين إعادة بناء العدد الأصلي؟ هذه الطريقة تكشف هل فهمتِ معنى التحليل فعلًا.',kind:'check'}
 ];
 if(strategy.id==='decompose_game')return [
  {title:'لعبة: فككي العدد',body:'تخيلي العدد كصندوق. اختاري له زوج عوامل. كل عامل غير أولي يبقى صندوقًا يجب فتحه، وكل عامل أولي يتحول إلى قطعة نهائية.',kind:'explain'},
  {title:'قاعدة الفوز',body:p[2]||'تنتهي اللعبة فقط عندما تصبح جميع القطع أعدادًا أولية.',kind:'tip'},
  {title:'جولة من مثال الدرس',body:lesson.example,kind:'example'}
 ];
 if(strategy.id==='misconception_contrast')return [
  {title:'قارني حلين',body:'سنضع حلًا صحيحًا بجانب فكرة تبدو صحيحة لكنها تتوقف مبكرًا أو تستخدم عاملًا غير أولي. ابحثي عن الفرق بدل حفظ الخطوات.',kind:'explain'},
  {title:'قاعدة الحكم',body:p[2]||p[0]||lesson.summary,kind:'tip'},
  {title:'مثال نراجعه',body:lesson.example,kind:'example'}
 ];
 if(strategy.id==='explain_back')return [
  {title:'أنتِ المعلمة الآن',body:'اشرحي الفكرة كما لو كنتِ تعلمين طفلة أصغر: ما الذي نبدأ به؟ ماذا نفعل إذا ظهر عامل غير أولي؟ ومتى نتوقف؟',kind:'check'},
  {title:'استعيني بمثال الدرس',body:lesson.example,kind:'example'}
 ];
 if(strategy.id==='transfer_challenge')return [
  {title:'تحدي نقل الفهم',body:'استخدمي نفس الفكرة على عدد أو مثال جديد مختلف عن مثال الدرس. لا تبحثي عن نفس الأرقام؛ ابحثي عن نفس العلاقة.',kind:'check'},
  {title:'ما الذي يجب أن يبقى ثابتًا؟',body:p.join(' '),kind:'tip'}
 ];
 return [{title:`طريقة التعلم · ${strategy.label}`,body:strategy.instruction,kind:'tip'}];
}

export function buildLocalTeachingContent(lesson:Lesson,mode:LocalTeachingMode='overview',options:Options={}):LocalTeacherContent{
 const readiness=getLessonReadiness(lesson.student,lesson.id);
 const prerequisiteScores=(readiness?.weakPrerequisites||[]).map(x=>x.score).filter((x):x is number=>typeof x==='number');
 const prerequisiteWeakest=prerequisiteScores.length?Math.min(...prerequisiteScores):readiness?.readinessStatus==='check'?70:null;
 const weaknessValues=[options.weaknessScore,prerequisiteWeakest].filter((x):x is number=>typeof x==='number'&&Number.isFinite(x));
 const effectiveWeakness=weaknessValues.length?Math.min(...weaknessValues):null;
 const requested=mode!=='overview'&&mode!=='check'?mode as TeachingMode:options.preferredMode;
 const plan=buildTeacherSessionPlan(lesson,{diagnosticCorrect:options.diagnosticCorrect,weakestScore:effectiveWeakness,conceptSuccess:options.conceptSuccess,subjectMastery:options.subjectMastery,preferredMode:requested,lastUnderstanding:options.lastUnderstanding});
 const activeMode:LocalTeachingMode=mode==='overview'?plan.entryMode:mode;
 const prerequisiteIntro=readiness?.readinessStatus==='blocked'&&readiness.weakPrerequisites[0]?`قبل فكرة اليوم سنثبت سريعًا: ${readiness.weakPrerequisites[0].title}. `:readiness?.readinessStatus==='check'&&readiness.weakPrerequisites[0]?`سنبدأ بتحقق قصير من: ${readiness.weakPrerequisites[0].title}. `:'';
 const introPrefix=plan.level==='rebuild'?'سنثبت الأساس الضروري أولًا ثم نعود مباشرة لفكرة اليوم. ':plan.level==='guided'?'سأعطيك دعمًا صغيرًا ثم أجعلك تجربين بنفسك. ':plan.level==='stretch'?'أنتِ قوية في الأساس؛ سنختصر الشرح ونصل أسرع إلى التحدي. ':'';
 const strategy=options.teachingStrategy;
 const special=strategyCards(lesson,strategy);
 const points=lesson.learningPoints.slice(0,plan.level==='stretch'?3:4);
 const cards:Card[]=[...special];
 if(!special.length&&points.length){
   if(activeMode==='step_by_step')points.forEach((p,i)=>cards.push({title:`الخطوة ${i+1}`,body:p,kind:'explain'}));
   else if(activeMode==='simplify')points.forEach((p,i)=>cards.push({title:`فكرة صغيرة ${i+1}`,body:p,kind:'explain'}));
   else points.forEach((p,i)=>cards.push({title:i===0?'الفكرة الأساسية':`نربط معها ${i+1}`,body:p,kind:'explain'}));
 }
 if(!special.some(c=>c.kind==='example'))cards.push({title:'مثال من الدرس',body:lesson.example,kind:'example'});
 const thinkingTip=lesson.subject==='الرياضيات'?'لا تحفظي النتيجة وحدها؛ قارني كل خطوة بالعلاقة أو النموذج البصري في الدرس.':lesson.subject==='العلوم والحياة'?'بعد المثال اسألي: ماذا لاحظت؟ ما الدليل؟ وما السبب أو التفسير؟':lesson.subject==='English'?'ابدئي بمعنى الجملة والسياق ثم لاحظي النمط اللغوي وطبّقيه في مثال جديد.':'ابدئي بالمعنى والسياق، ثم لاحظي النمط أو القاعدة وطبّقيها في جملة جديدة.';
 if(!special.length)cards.push({title:`كيف أفكر؟ · ${plan.visualLabel}`,body:thinkingTip,kind:'tip'});
 if(plan.level==='stretch'&&!special.some(c=>c.kind==='check'))cards.push({title:'تحدي التفكير',body:'حاولي تفسير لماذا تعمل الفكرة، ثم طبقيها على مثال مختلف بدل إعادة نفس المثال.',kind:'check'});
 const q=lesson.questions[0];
 const strategyIntro=strategy?`سنجرّب اليوم طريقة «${strategy.label}». `:'';
 return {title:lesson.title,intro:`${prerequisiteIntro}${introPrefix}${strategyIntro}${lesson.summary}`,cards:cards.slice(0,7),checkQuestion:{text:q?.text||'اشرحي الفكرة بكلماتك.',hint:q?.explanation||'ارجعي إلى الفكرة الأساسية ومثال الدرس.'},teacherNote:`شرح محلي احتياطي مبني فقط على محتوى الدرس المسجل من المنهاج. الاستراتيجية: ${strategy?.label||'متدرجة'}. الجاهزية: ${readiness?.readinessStatus||'غير مقاسة'}. خطة الجلسة: ${plan.reason} قاعدة الانتقال: ${plan.transitionRule}`};
}
