import type {Lesson} from './data';
import {recoverySkills} from './recoverySkills';

export type CurriculumBridge={skillId:string;title:string;reason:string;priority:number};

type Rule={test:(lesson:Lesson)=>boolean;skills:Array<{id:string;reason:string;priority:number}>};

const has=(lesson:Lesson,pattern:RegExp)=>pattern.test(`${lesson.id} ${lesson.title} ${lesson.summary}`.toLowerCase());

const rules:Rule[]=[
  {test:l=>l.subject==='الرياضيات'&&has(l,/prime|factor|gcf|lcm|عامل|أولي|مضاعف/),skills:[
    {id:'math-mult-div',reason:'العوامل والمضاعفات تعتمد مباشرة على حقائق الضرب والقسمة.',priority:100},
    {id:'math-number-sense',reason:'فهم بنية العدد والقيمة يساعد في اختبار القابلية والعوامل.',priority:78}
  ]},
  {test:l=>l.subject==='الرياضيات'&&has(l,/fraction|كسر/),skills:[
    {id:'math-fractions',reason:'الدرس الحالي يبني على معنى البسط والمقام والتكافؤ والمقارنة.',priority:100},
    {id:'math-mult-div',reason:'عمليات الكسور تحتاج حقائق ضرب وقسمة مستقرة.',priority:92}
  ]},
  {test:l=>l.subject==='الرياضيات'&&has(l,/decimal|عشري/),skills:[
    {id:'math-number-sense',reason:'الكسور العشرية تعتمد على القيمة المنزلية وموقع الفاصلة.',priority:100},
    {id:'math-mult-div',reason:'الضرب والقسمة العشرية تتطلب طلاقة في العمليات الأساسية.',priority:88}
  ]},
  {test:l=>l.subject==='الرياضيات'&&has(l,/area|مساح|triangle|مثلث|prism|pyramid|هرم|مكعب|متوازي/),skills:[
    {id:'math-mult-div',reason:'المساحة والحجوم تعتمد على الضرب والقسمة.',priority:96},
    {id:'math-number-sense',reason:'التقدير وفهم الوحدات العددية يساعدان على التحقق من معقولية الناتج.',priority:78}
  ]},
  {test:l=>l.subject==='الرياضيات'&&has(l,/proportion|تناسب|scale|مقياس/),skills:[
    {id:'math-fractions',reason:'التناسب امتداد لفهم الكسور المتكافئة والعلاقات النسبية.',priority:100},
    {id:'math-mult-div',reason:'إيجاد القيمة المجهولة يتطلب ضربًا وقسمة بثبات.',priority:96}
  ]},
  {test:l=>l.subject==='الرياضيات'&&has(l,/mean|median|mode|وسط|وسيط|منوال|data|بيانات|تكرار/),skills:[
    {id:'math-add-sub',reason:'قراءة البيانات وحساب الوسط تحتاج جمعًا دقيقًا.',priority:92},
    {id:'math-number-sense',reason:'المقارنة والترتيب أساس للوسيط والمنوال وفهم البيانات.',priority:88}
  ]},
  {test:l=>l.subject==='الرياضيات'&&has(l,/integer|صحيح|absolute|مطلق/),skills:[
    {id:'math-number-sense',reason:'الأعداد الصحيحة تحتاج فهم المقارنة والترتيب وموقع العدد.',priority:92},
    {id:'math-add-sub',reason:'الجمع والطرح الأساسيان يدعمان الانتقال إلى العمليات على الأعداد الصحيحة.',priority:85}
  ]},

  {test:l=>l.subject==='اللغة العربية'&&has(l,/قراءة|قصيد|شعر|نص|قريت|قريتي|فلسطين|رحمة|تلميذة|رجال|الرقيب|سنعود/),skills:[
    {id:'arabic-reading',reason:'فهم النص الحالي يعتمد على الطلاقة واستخراج الفكرة والدليل.',priority:100},
    {id:'arabic-vocabulary',reason:'المفردات والسياق ضروريان لفهم النص واستنتاج المعنى.',priority:94}
  ]},
  {test:l=>l.subject==='اللغة العربية'&&has(l,/إملاء|همزة|تاء|شمسية|قمرية/),skills:[
    {id:'arabic-spelling',reason:'القاعدة الحالية تبني مباشرة على أساسيات الرسم الإملائي.',priority:100},
    {id:'arabic-vocabulary',reason:'فهم بنية الكلمة وسياقها يساعد في تطبيق القاعدة.',priority:72}
  ]},
  {test:l=>l.subject==='اللغة العربية'&&has(l,/قواعد|اسم|ضمير|فعل|نكرة|معرفة|مبني|معرب|إعراب/),skills:[
    {id:'arabic-grammar',reason:'القاعدة الحالية تعتمد على تمييز أقسام الكلام وبناء الجملة.',priority:100},
    {id:'arabic-reading',reason:'فهم الجملة في سياقها يمنع تطبيق القاعدة بصورة آلية خاطئة.',priority:76}
  ]},

  {test:l=>l.subject==='English'&&has(l,/present|past|perfect|stative|adverb|pronoun|question|which|or|compare|continuous/),skills:[
    {id:'english-sentence',reason:'Grammar in the current lesson depends on stable basic sentence and question order.',priority:100},
    {id:'english-vocabulary',reason:'Core vocabulary reduces cognitive load while practising grammar.',priority:82}
  ]},
  {test:l=>l.subject==='English'&&has(l,/text|friend|country|holiday|animal|sport|report|direction|message|magic/),skills:[
    {id:'english-reading',reason:'Current texts require finding details and main ideas in short passages.',priority:98},
    {id:'english-vocabulary',reason:'Vocabulary knowledge supports comprehension and expression.',priority:94}
  ]},
  {test:l=>l.subject==='English'&&has(l,/spelling|punctuation|capital|phonics/),skills:[
    {id:'english-phonics',reason:'Sound-letter and spelling foundations support accurate reading and writing.',priority:100},
    {id:'english-sentence',reason:'Sentence structure supports punctuation and complete writing.',priority:80}
  ]},

  {test:l=>l.subject==='العلوم والحياة'&&has(l,/خلية|cell|كائن|نبات|حيوان/),skills:[
    {id:'science-core-concepts',reason:'فهم الكائنات والمادة يوفر الأساس لفهم الخلية ووظيفتها.',priority:100},
    {id:'science-observation',reason:'الملاحظة والتصنيف يساعدان على مقارنة الخلايا والخصائص.',priority:90}
  ]},
  {test:l=>l.subject==='العلوم والحياة'&&has(l,/مادة|materials|فصل|mixture|تغير|chemical|كيميائ|فيزيائ|atom|ذرة|مركب|تفاعل/),skills:[
    {id:'science-core-concepts',reason:'المادة وحالاتها والتغيرات البسيطة أساس للمفهوم الحالي.',priority:100},
    {id:'science-observation',reason:'تمييز الخصائص والتغيرات يعتمد على الملاحظة والتصنيف.',priority:94},
    {id:'science-cause',reason:'التغير والتفاعل يحتاجان ربط الدليل بالسبب والنتيجة.',priority:90}
  ]},
  {test:l=>l.subject==='العلوم والحياة'&&has(l,/طاقة|energy/),skills:[
    {id:'science-core-concepts',reason:'فهم أشكال المادة والطاقة يوفر نقطة البداية للتحولات.',priority:100},
    {id:'science-cause',reason:'تحولات الطاقة تحتاج تفسير ما الذي تسبب في التغير وما الدليل.',priority:92}
  ]},
  {test:l=>l.subject==='العلوم والحياة'&&has(l,/حركة|مسافة|إزاحة|سرعة|تسارع|نيوتن|ضغط|motion|speed|newton|pressure/),skills:[
    {id:'science-measurement',reason:'الحركة والضغط يحتاجان قياسًا ووحدات وقراءة بيانات صحيحة.',priority:100},
    {id:'science-cause',reason:'القوى والتسارع والضغط تتطلب تفسير علاقات السبب والنتيجة.',priority:96},
    {id:'science-core-concepts',reason:'المفاهيم الأساسية في المادة والطاقة والقوة تدعم الفهم الحالي.',priority:78}
  ]}
];

export function getLessonBridges(lesson:Lesson):CurriculumBridge[]{
  const merged=new Map<string,CurriculumBridge>();
  for(const rule of rules){
    if(!rule.test(lesson))continue;
    for(const s of rule.skills){
      const skill=recoverySkills.find(x=>x.id===s.id);if(!skill)continue;
      const old=merged.get(s.id);
      if(!old||s.priority>old.priority)merged.set(s.id,{skillId:s.id,title:skill.title,reason:s.reason,priority:s.priority});
    }
  }
  if(!merged.size){
    for(const skill of recoverySkills.filter(x=>x.subject===lesson.subject).slice(0,2))merged.set(skill.id,{skillId:skill.id,title:skill.title,reason:'مهارة تأسيسية عامة في هذه المادة؛ تُفحص فقط إذا ظهر ما يدل على ضعفها.',priority:45});
  }
  return [...merged.values()].sort((a,b)=>b.priority-a.priority).slice(0,4);
}
