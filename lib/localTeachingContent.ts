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
 if(strategy.id==='cell_zoom_journey')return [
  {title:'تخيلي أننا نقترب أكثر فأكثر',body:'نرى كائنًا حيًا، ثم نقترب من أجزائه حتى نصل إلى وحدات صغيرة جدًا تبني جسمه. هذه الوحدة الأساسية هي الخلية.',kind:'explain'},
  {title:'ندخل إلى الخلية',body:'داخل الخلية نجد أجزاء أساسية: الغشاء الخلوي يحيط بها، النواة تتحكم في كثير من أنشطتها، والسيتوبلازم توجد فيه مكونات الخلية.',kind:'explain'},
  {title:'ثم نكتشف أن الخلايا ليست متطابقة',body:'الخلايا النباتية والحيوانية تشترك في أجزاء أساسية، لكن الخلية النباتية تتميز بأجزاء إضافية مثل الجدار الخلوي والبلاستيدات الخضراء، وغالبًا فجوة عصارية كبيرة.',kind:'tip'},
  {title:'دليل سريع',body:lesson.example,kind:'example'}
 ];
 if(strategy.id==='cell_city_analogy')return [
  {title:'الخلية كمدينة صغيرة',body:'تخيلي الخلية مدينة صغيرة تعمل باستمرار. النواة مثل مركز الإدارة لأنها تتحكم في كثير من الأنشطة، والغشاء الخلوي مثل بوابة تنظم ما يمر عبر حدود الخلية.',kind:'explain'},
  {title:'أين تعمل بقية المكونات؟',body:'السيتوبلازم هو الوسط الذي توجد فيه مكونات الخلية. التشبيه يساعدنا، لكن الاسم العلمي يبقى: نواة، غشاء خلوي، سيتوبلازم.',kind:'tip'},
  {title:'مدينة نباتية لها إضافات',body:'الخلية النباتية لها جدار خلوي يعطيها دعمًا، وبلاستيدات خضراء تميزها عن الخلية الحيوانية في هذا الدرس.',kind:'example'}
 ];
 if(strategy.id==='structure_function_match')return [
  {title:'من المسؤول عن التحكم؟',body:'النواة تتحكم في كثير من أنشطة الخلية.',kind:'explain'},
  {title:'من يحيط بالخلية؟',body:'الغشاء الخلوي يحيط بالخلية، والسيتوبلازم وسط توجد فيه مكونات الخلية.',kind:'explain'},
  {title:'ما الذي يميز النباتية؟',body:'الجدار الخلوي والبلاستيدات الخضراء من الأجزاء المميزة للخلية النباتية في هذا الدرس.',kind:'tip'},
  {title:'الآن اعكسي السؤال',body:'إذا أعطيتك وظيفة أو دليلًا، حاولي أنتِ تسمية الجزء المناسب بدل حفظ قائمة الأسماء.',kind:'check'}
 ];
 if(strategy.id==='cell_detective')return [
  {title:'لدينا خلية مجهولة',body:'سنحدد نوعها من الأدلة، لا من شكلها فقط. ابحثي عن أجزاء مشتركة ثم عن جزء مميز.',kind:'explain'},
  {title:'الدليل الأقوى',body:'إذا وجدتِ جدارًا خلويًا أو بلاستيدات خضراء فهذه علامة قوية على أن الخلية نباتية.',kind:'tip'},
  {title:'مثال التحقيق',body:lesson.example,kind:'example'},
  {title:'قولي الدليل لا الاسم فقط',body:'عندما تقررين أن الخلية نباتية، أضيفي السبب: أي جزء رأيتِه وجعلك تحكمين؟',kind:'check'}
 ];
 if(strategy.id==='misconception_contrast')return [
  {title:'قارني حلين أو فكرتين',body:'سنضع فكرة صحيحة بجانب فكرة قريبة منها لكنها تحتوي خطأ واحدًا. ابحثي عن الفرق بدل حفظ الجملة.',kind:'explain'},
  {title:'قاعدة الحكم',body:p[0]||lesson.summary,kind:'tip'},
  {title:'مثال نراجعه',body:lesson.example,kind:'example'}
 ];
 if(strategy.id==='explain_back')return [
  {title:'أنتِ المعلمة الآن',body:'اشرحي الفكرة كما لو كنتِ تعلمين طفلة أصغر: ما الفكرة الأساسية؟ ما أهم الأجزاء أو الخطوات؟ وكيف نعرف أننا فهمناها؟',kind:'check'},
  {title:'استعيني بمثال الدرس',body:lesson.example,kind:'example'}
 ];
 if(strategy.id==='transfer_challenge')return [
  {title:'تحدي نقل الفهم',body:'استخدمي نفس الفكرة على مثال جديد مختلف عن مثال الدرس. لا تبحثي عن نفس الكلمات أو الأرقام؛ ابحثي عن نفس العلاقة.',kind:'check'},
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
 const prerequisiteIntro=readiness?.readinessStatus==='blocked'&&readiness.weakPrerequisites[0]?`قبل أن نتقدم بعيدًا في فكرة اليوم سنثبت خطوة صغيرة تساعدنا: ${readiness.weakPrerequisites[0].title}. `:readiness?.readinessStatus==='check'&&readiness.weakPrerequisites[0]?`خلال الشرح سنتأكد سريعًا من خطوة تساعدنا: ${readiness.weakPrerequisites[0].title}. `:'';
 const introPrefix=plan.level==='rebuild'?'سنفهم درس اليوم أولًا، وإذا احتجنا خطوة مساعدة سنأخذها داخل الشرح ثم نعود مباشرة. ':plan.level==='guided'?'سأعطيك دعمًا صغيرًا ثم أجعلك تجربين بنفسك. ':plan.level==='stretch'?'أنتِ قوية في الأساس؛ سنختصر التمهيد ونصل أسرع إلى التحدي. ':'';
 const strategy=options.teachingStrategy;const special=strategyCards(lesson,strategy);const points=lesson.learningPoints.slice(0,plan.level==='stretch'?3:4);const cards:Card[]=[...special];
 if(!special.length&&points.length){if(activeMode==='step_by_step')points.forEach((p,i)=>cards.push({title:`الخطوة ${i+1}`,body:p,kind:'explain'}));else if(activeMode==='simplify')points.forEach((p,i)=>cards.push({title:`فكرة صغيرة ${i+1}`,body:p,kind:'explain'}));else points.forEach((p,i)=>cards.push({title:i===0?'الفكرة الأساسية':`نربط معها ${i+1}`,body:p,kind:'explain'}))}
 if(!special.some(c=>c.kind==='example'))cards.push({title:'مثال من الدرس',body:lesson.example,kind:'example'});
 const thinkingTip=lesson.subject==='الرياضيات'?'لا تحفظي النتيجة وحدها؛ قارني كل خطوة بالعلاقة أو النموذج البصري في الدرس.':lesson.subject==='العلوم والحياة'?'بعد المثال اسألي: ماذا لاحظت؟ ما الدليل؟ وما السبب أو التفسير؟':lesson.subject==='English'?'ابدئي بمعنى الجملة والسياق ثم لاحظي النمط اللغوي وطبّقيه في مثال جديد.':'ابدئي بالمعنى والسياق، ثم لاحظي النمط أو القاعدة وطبّقيها في جملة جديدة.';
 if(!special.length)cards.push({title:`كيف أفكر؟ · ${plan.visualLabel}`,body:thinkingTip,kind:'tip'});
 if(plan.level==='stretch'&&!special.some(c=>c.kind==='check'))cards.push({title:'تحدي التفكير',body:'حاولي تفسير لماذا تعمل الفكرة، ثم طبقيها على مثال مختلف بدل إعادة نفس المثال.',kind:'check'});
 const q=lesson.questions[0];const strategyIntro=strategy?`سنفهم الدرس اليوم بطريقة «${strategy.label}». `:'';
 return {title:lesson.title,intro:`${introPrefix}${strategyIntro}${lesson.summary}${prerequisiteIntro}`,cards:cards.slice(0,7),checkQuestion:{text:q?.text||'اشرحي الفكرة بكلماتك.',hint:q?.explanation||'ارجعي إلى الفكرة الأساسية ومثال الدرس.'},teacherNote:`شرح محلي احتياطي مبني فقط على محتوى الدرس المسجل من المنهاج. الاستراتيجية: ${strategy?.label||'متدرجة'}. الجاهزية: ${readiness?.readinessStatus||'غير مقاسة'}. خطة الجلسة: ${plan.reason} قاعدة الانتقال: ${plan.transitionRule}`};
}
