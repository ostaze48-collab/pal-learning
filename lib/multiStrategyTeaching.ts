import type {Lesson} from './data';
import {readCreativeOutcome} from './creativeLearningProfile';

export type TeachingStrategyId=
  |'factor_pairs'
  |'factor_tree'
  |'reverse_build'
  |'decompose_game'
  |'cell_zoom_journey'
  |'cell_city_analogy'
  |'structure_function_match'
  |'cell_detective'
  |'concrete_model'
  |'visual_model'
  |'worked_example'
  |'misconception_contrast'
  |'prediction_simulation'
  |'evidence_explanation'
  |'context_first'
  |'sentence_build'
  |'compare_examples'
  |'explain_back'
  |'transfer_challenge';

export type TeachingStrategy={id:TeachingStrategyId;label:string;icon:string;purpose:string;instruction:string};
export type StrategyOutcome='understood'|'partial'|'misconception';
export type StrategyStat={attempts:number;understood:number;partial:number;misconception:number;lastAt?:string};
export type StrategyHistory={strategies:Partial<Record<TeachingStrategyId,StrategyStat>>;lastStrategy?:TeachingStrategyId};

const strategyLibrary:Record<TeachingStrategyId,TeachingStrategy>={
  factor_pairs:{id:'factor_pairs',label:'أزواج العوامل',icon:'🔗',purpose:'بناء معنى العامل قبل التحليل.',instruction:'ابدأ من أزواج الضرب التي تكوّن العدد. اجعل الطالبة تجد زوجًا واحدًا ثم زوجًا آخر، وميّز بين العامل والعدد الناتج. لا تنتقل إلى شجرة العوامل قبل أن يكون معنى العامل واضحًا.'},
  factor_tree:{id:'factor_tree',label:'شجرة العوامل',icon:'🌳',purpose:'تحويل التفكيك إلى صورة متفرعة سهلة التتبع.',instruction:'مثّل العدد كشجرة عوامل. في كل فرع اسأل: هل هذا العدد أولي؟ إن لم يكن، فككه مرة أخرى. أظهر بصريًا أن نهاية كل فرع يجب أن تكون عددًا أوليًا.'},
  reverse_build:{id:'reverse_build',label:'ابني العدد بالعكس',icon:'🧱',purpose:'التحقق أن الطالبة فهمت التحليل لا أنها حفظت خطواته.',instruction:'اعرض عوامل أولية مثل 2×3×3 واطلب بناء العدد الأصلي بالعكس. ثم اربط ذلك بأن التحليل الصحيح يجب أن يعيد تكوين العدد عند الضرب.'},
  decompose_game:{id:'decompose_game',label:'لعبة فكّكي العدد',icon:'🎮',purpose:'تحويل التكرار إلى تحد قصير قائم على القرار.',instruction:'حوّل الفكرة إلى لعبة: يظهر عدد، وتختار الطالبة زوج عوامل. إذا بقي عامل مركب تستمر في تفكيكه، وإذا كان أوليًا تقفله كقطعة نهائية. الفوز عندما تصبح كل القطع أولية.'},
  cell_zoom_journey:{id:'cell_zoom_journey',label:'رحلة داخل الخلية',icon:'🔬',purpose:'بناء صورة ذهنية للخلية كوحدة بناء للكائن الحي.',instruction:'ابدأ بصورة كلية للكائن الحي ثم قرّب المشهد تدريجيًا حتى تصل إلى الخلية. بعد ذلك ادخل إلى الخلية جزءًا جزءًا. لا تبدأ بحفظ أسماء الأجزاء؛ اجعل الطالبة تعرف أولًا لماذا نحتاج الخلية وما الذي يوجد بداخلها.'},
  cell_city_analogy:{id:'cell_city_analogy',label:'الخلية كمدينة صغيرة',icon:'🏙️',purpose:'ربط وظيفة الأجزاء بأدوار مألوفة دون استبدال المصطلح العلمي.',instruction:'استخدم تشبيه مدينة صغيرة: النواة مركز إدارة، الغشاء بوابة تنظّم الدخول والخروج، والسيتوبلازم مساحة تعمل فيها المكونات. بعد كل تشبيه ارجع فورًا إلى الاسم والوظيفة العلمية. وضح أن التشبيه للمساعدة وليس وصفًا حرفيًا.'},
  structure_function_match:{id:'structure_function_match',label:'من المسؤول عن هذه الوظيفة؟',icon:'🧩',purpose:'ربط اسم الجزء بوظيفته بدل حفظ قائمتين منفصلتين.',instruction:'اعرض وظيفة واحدة واسأل أي جزء يؤديها، ثم اعكس السؤال: اعرض الجزء واطلب وظيفته. استخدم النواة والغشاء والسيتوبلازم، ثم أضف الجدار الخلوي والبلاستيدات للخلية النباتية.'},
  cell_detective:{id:'cell_detective',label:'محقق الخلية',icon:'🕵️',purpose:'تمييز الخلية النباتية والحيوانية من الأدلة.',instruction:'اعرض أدلة تدريجية عن خلية مجهولة. وجود جدار خلوي أو بلاستيدات خضراء دليل قوي على أنها نباتية. اجعل الطالبة تبرر قرارها بدليل من الأجزاء، لا بمجرد اختيار الاسم.'},
  concrete_model:{id:'concrete_model',label:'نموذج محسوس',icon:'🧩',purpose:'ربط الفكرة بأشياء أو مجموعات يمكن تصورها.',instruction:'استخدم مجموعات أو صفوف أو قطعًا متساوية لتمثيل الفكرة قبل الرموز. اجعل الطالبة تغيّر النموذج بيدها أو تتخيله ثم اربطه بالرمز الرياضي أو العلمي.'},
  visual_model:{id:'visual_model',label:'تمثيل بصري',icon:'🖼️',purpose:'إظهار العلاقة بدل وصفها بالكلام فقط.',instruction:'حوّل العلاقة الأساسية إلى رسم أو مخطط بسيط. استخدم أقل عدد ممكن من العناصر واطلب من الطالبة قراءة الرسم قبل إعطاء التفسير.'},
  worked_example:{id:'worked_example',label:'مثال محلول مع التفكير',icon:'🪜',purpose:'إظهار لماذا تحدث كل خطوة، لا عرض الحل فقط.',instruction:'حل مثالًا واحدًا خطوة خطوة، لكن قبل كل خطوة اسأل ما الذي نبحث عنه ولماذا هذه الخطوة مناسبة. بعده أعط مثالًا قريبًا للطالبة تكمله بنفسها.'},
  misconception_contrast:{id:'misconception_contrast',label:'قارن الصح بالخطأ',icon:'⚖️',purpose:'كشف القاعدة من مقارنة حل صحيح بخطأ شائع.',instruction:'اعرض مثالين متشابهين: أحدهما صحيح والآخر يحتوي خطأ شائعًا واحدًا. اطلب تحديد الفرق وسبب الخطأ، ثم صغ القاعدة بعد أن تكتشفها الطالبة.'},
  prediction_simulation:{id:'prediction_simulation',label:'توقعي ثم جرّبي',icon:'🧪',purpose:'تعلم المفهوم العلمي من التوقع والدليل.',instruction:'ابدأ بسؤال توقع قصير، ثم محاكاة أو تغيير متغير واحد، ثم اطلب وصف ما حدث قبل تقديم التفسير العلمي.'},
  evidence_explanation:{id:'evidence_explanation',label:'دليل ثم تفسير',icon:'🔎',purpose:'الفصل بين الملاحظة والتفسير العلمي.',instruction:'اطلب من الطالبة أولًا ذكر ما لاحظته كدليل، ثم اسأل ماذا يعني هذا الدليل ولماذا. لا تسمح بالقفز مباشرة إلى السبب دون ملاحظة.'},
  context_first:{id:'context_first',label:'المعنى أولًا',icon:'📚',purpose:'بناء اللغة من السياق قبل تسمية القاعدة.',instruction:'ابدأ بجملة أو موقف مفهوم من محتوى الدرس، وتأكد من فهم المعنى، ثم اجعل الطالبة تلاحظ الكلمة أو البنية المستهدفة قبل تسمية القاعدة.'},
  sentence_build:{id:'sentence_build',label:'ابني الجملة',icon:'🧱',purpose:'تحويل القاعدة اللغوية إلى إنتاج فعلي.',instruction:'قسّم جملة نموذج إلى وحدات، ثم اجعل الطالبة تعيد بناءها أو تغير جزءًا منها. بعد النجاح اطلب جملة جديدة من إنتاجها.'},
  compare_examples:{id:'compare_examples',label:'قارني مثالين',icon:'↔️',purpose:'اكتشاف النمط من أمثلة متقابلة.',instruction:'اعرض مثالين يختلفان في العنصر المستهدف فقط. اطلب من الطالبة وصف الفرق ثم استنتاج النمط قبل ذكر القاعدة رسميًا.'},
  explain_back:{id:'explain_back',label:'علّميني أنتِ',icon:'🗣️',purpose:'اختبار الفهم العميق بالتفسير الذاتي.',instruction:'اطلب من الطالبة أن تشرح الفكرة كأنها تعلّم طفلة أخرى. اسأل سؤال لماذا واحدًا، وصحح نقطة واحدة فقط إذا لزم الأمر.'},
  transfer_challenge:{id:'transfer_challenge',label:'تحدي جديد',icon:'🏁',purpose:'التأكد أن الفهم ينتقل إلى مثال جديد.',instruction:'قدّم مثالًا جديدًا يختلف في الأرقام أو السياق لكنه يعتمد على نفس المفهوم. لا تعطه بصيغة مطابقة للمثال المحلول. اطلب تبرير الخطوة الأساسية.'}
};

function lessonText(lesson:Lesson){return [lesson.id,lesson.title,lesson.summary,...lesson.learningPoints,lesson.example].join(' ').toLowerCase()}

export function getTeachingStrategies(lesson:Lesson):TeachingStrategy[]{
  const t=lessonText(lesson);let ids:TeachingStrategyId[];
  if(lesson.id==='g5-math-prime-factorization')ids=['factor_pairs','factor_tree','reverse_build','decompose_game','misconception_contrast','explain_back','transfer_challenge'];
  else if(lesson.id==='g5-math-prime-numbers'||/(عدد أولي|prime number)/i.test(t))ids=['factor_pairs','concrete_model','visual_model','misconception_contrast','decompose_game','explain_back','transfer_challenge'];
  else if(lesson.id==='g5-science-cell-types')ids=['cell_zoom_journey','cell_city_analogy','structure_function_match','cell_detective','compare_examples','explain_back','transfer_challenge'];
  else if(lesson.subject==='الرياضيات')ids=['concrete_model','visual_model','worked_example','misconception_contrast','explain_back','transfer_challenge'];
  else if(lesson.subject==='العلوم والحياة')ids=['prediction_simulation','visual_model','evidence_explanation','misconception_contrast','explain_back','transfer_challenge'];
  else ids=['context_first','compare_examples','sentence_build','misconception_contrast','explain_back','transfer_challenge'];
  return ids.map(id=>strategyLibrary[id]);
}

function emptyHistory():StrategyHistory{return {strategies:{}}}
export function readStrategyHistory(student:string,lessonId:string):StrategyHistory{if(typeof window==='undefined')return emptyHistory();const raw=localStorage.getItem(`lesson:${lessonId}:strategyHistory`);if(!raw)return emptyHistory();try{const parsed=JSON.parse(raw);return parsed&&typeof parsed==='object'?parsed:emptyHistory()}catch{return emptyHistory()}}
function strategyScore(stat:StrategyStat|undefined){if(!stat||!stat.attempts)return 0;return (stat.understood*3+stat.partial-stat.misconception*2)/stat.attempts}
export function chooseTeachingStrategy(lesson:Lesson,student:string,options:{diagnosticCorrect?:boolean;weakestScore?:number|null;conceptSuccess?:number|null;avoid?:TeachingStrategyId[]}={}):TeachingStrategy{
  const candidates=getTeachingStrategies(lesson);const history=readStrategyHistory(student,lesson.id);const avoid=new Set(options.avoid||[]);
  const latestConcept=readCreativeOutcome(student,lesson.id);const conceptSuccess=latestConcept?.successRate??options.conceptSuccess??100;
  const weak=options.diagnosticCorrect===false||Number(options.weakestScore??100)<65||Number(conceptSuccess)<65;
  const strong=options.diagnosticCorrect!==false&&Number(options.weakestScore??100)>=85&&Number(conceptSuccess)>=85;
  const preferred=weak?candidates.slice(0,Math.min(4,candidates.length)):strong?[...candidates].reverse():candidates;
  const unused=preferred.find(s=>!avoid.has(s.id)&&!(history.strategies[s.id]?.attempts));if(unused)return unused;
  const ranked=preferred.filter(s=>!avoid.has(s.id)).sort((a,b)=>strategyScore(history.strategies[b.id])-strategyScore(history.strategies[a.id]));return ranked[0]||candidates[0];
}
export function nextTeachingStrategy(lesson:Lesson,student:string,current:TeachingStrategyId,options:{diagnosticCorrect?:boolean;weakestScore?:number|null;conceptSuccess?:number|null}={}):TeachingStrategy{const history=readStrategyHistory(student,lesson.id);const attempted=Object.entries(history.strategies).filter(([,v])=>Boolean(v?.attempts)).map(([id])=>id as TeachingStrategyId);return chooseTeachingStrategy(lesson,student,{...options,avoid:[current,...attempted]})}
export function recordTeachingStrategyOutcome(student:string,lessonId:string,strategy:TeachingStrategyId,outcome:StrategyOutcome){if(typeof window==='undefined')return;const history=readStrategyHistory(student,lessonId);const stat=history.strategies[strategy]||{attempts:0,understood:0,partial:0,misconception:0};stat.attempts+=1;stat[outcome]+=1;stat.lastAt=new Date().toISOString();history.strategies[strategy]=stat;history.lastStrategy=strategy;localStorage.setItem(`lesson:${lessonId}:strategyHistory`,JSON.stringify(history))}
export function getStrategyInstruction(strategy:TeachingStrategy){return `${strategy.label}: ${strategy.instruction}`}
