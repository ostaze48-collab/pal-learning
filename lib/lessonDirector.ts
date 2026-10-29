import type {Lesson} from './data';
import {getTeachingScenes,type TeachingScene} from './teachingBlueprints';

function textKey(lesson:Lesson,objective:string){return `${lesson.id} ${lesson.title} ${objective}`.toLowerCase()}
function shortObjective(objective:string){const clean=objective.trim();return clean.length>125?`${clean.slice(0,122)}…`:clean}

function mathScenes(lesson:Lesson,objective:string):TeachingScene[]{
 const key=textKey(lesson,objective);const target=shortObjective(objective);
 if(/factor|prime|gcf|lcm|عامل|أولي|قاسم|مضاعف/.test(key))return [
  {icon:'🧱',label:'ابني العدد',title:'شاهدي كيف يتكوّن العدد',body:`بدل حفظ قاعدة، نحلل الفكرة إلى أجزاء يمكن رؤيتها: ${target}`,prompt:'ما المجموعات أو العوامل التي تستطيعين تكوينها؟'},
  {icon:'🌳',label:'اكشفي البنية',title:'غيّري التفكيك وابحثي عن الشيء الثابت',body:'قد نبدأ بعوامل مختلفة، لكننا نبحث عن البنية العددية التي تفسر النتيجة.',prompt:'ما الذي يتغير في الطريق، وما الذي يبقى صحيحًا في النهاية؟'},
  {icon:'🎯',label:'استخدميها',title:'اختاري عددًا جديدًا',body:'طبقي الفكرة على عدد آخر بدل تكرار المثال نفسه.',prompt:'كيف تعرفين أن طريقتك تنطبق على العدد الجديد؟'}
 ];
 if(/fraction|decimal|proportion|ratio|كسر|عشري|تناسب|نسبة|مقياس/.test(key))return [
  {icon:'🍫',label:'الكل والأجزاء',title:'ابدئي من كمية يمكن تقسيمها',body:`حوّلي الهدف إلى أجزاء أو كميات مرتبطة قبل الرموز: ${target}`,prompt:'ما الكل؟ وما الجزء أو النسبة التي نهتم بها؟'},
  {icon:'🔄',label:'غيّري الكمية',title:'غيّري جزءًا وراقبي العلاقة',body:'عندما تتغير الكمية، لا تنظري إلى الرقم وحده؛ راقبي كيف تتغير علاقته بالكل أو بالكمية الأخرى.',prompt:'إذا كبر أحد الطرفين، ماذا يجب أن يحدث للطرف المرتبط؟'},
  {icon:'✏️',label:'من الصورة للرمز',title:'اكتبي ما شاهدتِه',body:'بعد أن تصبح العلاقة واضحة بصريًا، حوّليها إلى كسر أو عدد عشري أو تناسب.',prompt:'أي رمز يصف العلاقة التي شاهدتِها دون أن يغير معناها؟'}
 ];
 if(/area|volume|triangle|rectangle|square|prism|cube|pyramid|cartesian|reflection|translation|مساحة|حجم|مثلث|مستطيل|مربع|منشور|مكعب|هرم|إحداث|انعكاس|انسحاب/.test(key))return [
  {icon:'📐',label:'شكّلها',title:'حرّكي الشكل قبل حفظ القانون',body:`نحوّل الهدف إلى شكل أو حركة يمكن فحصها: ${target}`,prompt:'أي طول أو زاوية أو وجه أو موضع يهمنا هنا؟'},
  {icon:'🧩',label:'فكّكيها',title:'ابحثي عن أجزاء تعرفينها',body:'قسّمي الشكل أو الحركة إلى أجزاء أبسط، ثم أعيدي تركيب الفكرة.',prompt:'ما الجزء الذي تستطيعين حسابه أو وصفه أولًا؟'},
  {icon:'📏',label:'استنتجي',title:'اجعلي القانون نتيجة لا بداية',body:'القانون الجيد يختصر علاقة شاهدناها بالفعل في الشكل.',prompt:'كيف تشرحين لماذا تعمل هذه القاعدة على هذا الشكل؟'}
 ];
 if(/data|frequency|chart|mean|median|mode|range|statistics|بيانات|تكرار|مخطط|متوسط|وسيط|منوال|مدى|إحصاء/.test(key))return [
  {icon:'📊',label:'اقرئي',title:'ابدئي من البيانات لا من القانون',body:`ننظر أولًا لما تقوله القيم أو الرسم: ${target}`,prompt:'ما القيمة أو النمط الذي يلفت انتباهك؟'},
  {icon:'🔎',label:'قارني',title:'غيّري قيمة واحدة',body:'شاهدي كيف يؤثر تغيير قيمة واحدة في الجدول أو الرسم أو المقياس الإحصائي.',prompt:'أي نتيجة تغيرت؟ وأي نتيجة بقيت أكثر ثباتًا؟'},
  {icon:'🧠',label:'فسّري',title:'اكتبي معنى النتيجة',body:'لا يكفي حساب رقم؛ نريد معرفة ماذا يخبرنا عن البيانات.',prompt:'ماذا تعني النتيجة في سياق البيانات؟'}
 ];
 if(/compare|order|greater|less|absolute|مقارن|رتب|ترتيب|أكبر|أصغر|قيمة مطلقة/.test(key))return [
  {icon:'↔️',label:'ضعيها على خط',title:'المكان يكشف العلاقة',body:`مثلي القيم أو الحالات على خط أو ترتيب واضح: ${target}`,prompt:'أي عنصر يقع قبل الآخر أو إلى يمينه؟'},
  {icon:'⚖️',label:'قارني',title:'غيّري المرجع واختبري الحكم',body:'استخدمي مرجعًا واضحًا مثل الصفر أو وحدة القياس، ثم قارني من جديد.',prompt:'ما المرجع الذي يجعل المقارنة أوضح؟'},
  {icon:'💬',label:'برري',title:'لا تكتفي بعلامة المقارنة',body:'قولي لماذا إحدى القيم أكبر أو أصغر مستخدمة التمثيل الذي شاهدته.',prompt:'ما الدليل من التمثيل على حكمك؟'}
 ];
 return [
  {icon:'🧺',label:'موقف',title:'ابدئي من موقف له معنى',body:`مثلي الهدف في كمية أو حركة أو توزيع يمكن تخيله: ${target}`,prompt:'ماذا يحدث فعليًا قبل أن نختار العملية؟'},
  {icon:'🖼️',label:'مثّلي',title:'شاهدي العلاقة',body:'استخدمي خط أعداد أو مجموعات أو مساحة أو جدولًا بحسب الفكرة، ثم راقبي التغير.',prompt:'أي جزء من الصورة يمثل كل رقم أو خطوة؟'},
  {icon:'✏️',label:'ابني الطريقة',title:'اختاري العملية بعد فهم المعنى',body:'الرمز يأتي بعد العلاقة، لا قبلها.',prompt:'ما العملية التي تصف ما شاهدتِه؟ ولماذا؟'}
 ];
}

function scienceScenes(lesson:Lesson,objective:string):TeachingScene[]{
 const key=textKey(lesson,objective);const target=shortObjective(objective);
 if(/وظيف|function|role|جزء|part|structure|تركيب/.test(key))return [
  {icon:'🔎',label:'انظري للجزء',title:'ما الذي نراه؟',body:`نركز على تركيب واحد داخل نظام أكبر: ${target}`,prompt:'أين يوجد هذا الجزء؟ وما الذي يميزه؟'},
  {icon:'🛠️',label:'جرّبي وظيفته',title:'تخيلي النظام من دونه',body:'فهم الوظيفة يصبح أقوى عندما نسأل ماذا يتغير إذا غاب الجزء أو تغير.',prompt:'ماذا تتوقعين أن يحدث إذا لم يؤد هذا الجزء عمله؟'},
  {icon:'🔗',label:'اربطي',title:'من الشكل إلى الوظيفة',body:'اربطي صفة في التركيب بالعمل الذي يساعد على أدائه.',prompt:'أي صفة في هذا الجزء تساعده على وظيفته؟'}
 ];
 if(/قارن|ميز|فرق|نوع|compare|distinguish|different|type/.test(key))return [
  {icon:'👀',label:'شاهدي حالتين',title:'ابدئي بما هو مشترك',body:`نضع حالتين جنبًا إلى جنب لفهم الهدف: ${target}`,prompt:'ما الشيء الموجود في الحالتين؟'},
  {icon:'🕵️',label:'ابحثي عن الفارق',title:'اختاري دليلًا لا شكلًا فقط',body:'ابحثي عن خاصية أو مكوّن أو نتيجة يمكن أن تميز الحالتين بوضوح.',prompt:'أي دليل سيجعلك واثقة من التصنيف؟'},
  {icon:'🧩',label:'صنّفي',title:'جربي حالة جديدة',body:'استخدمي الأدلة نفسها على مثال لم تريه قبل قليل.',prompt:'ما الدليل الذي اعتمدتِ عليه في قرارك؟'}
 ];
 if(/cause|effect|force|newton|reaction|change|pressure|energy|تحول|سبب|نتيجة|قوة|نيوتن|تفاعل|تغير|ضغط|طاقة/.test(key))return [
  {icon:'🎬',label:'ظاهرة',title:'شاهدي قبل أن نفسر',body:`ابدئي من حدث أو تغير يمكن ملاحظته: ${target}`,prompt:'ما الذي تغير فعلًا؟'},
  {icon:'💭',label:'توقعي',title:'غيّري عاملًا واحدًا',body:'توقعي ماذا سيحدث لو زادت أو نقصت كمية واحدة، ثم قارني توقعك بالدليل.',prompt:'أي عامل غيرناه؟ وما النتيجة التي تتوقعينها؟'},
  {icon:'🧪',label:'دليل',title:'اختاري التفسير الذي يطابق الملاحظة',body:'لا نريد حفظ جملة؛ نريد تفسيرًا يستطيع توقع ما سيحدث في موقف جديد.',prompt:'ما الدليل الذي يدعم تفسيرك؟'}
 ];
 if(/property|material|classif|خاصي|مادة|صنف|تصنيف/.test(key))return [
  {icon:'🧰',label:'اختبري خاصية',title:'لا تحكمي من الاسم',body:`نفحص المادة أو الحالة بصفة قابلة للملاحظة: ${target}`,prompt:'أي خاصية تستطيعين اختبارها أو ملاحظتها؟'},
  {icon:'⚖️',label:'قارني',title:'ضعي مادتين تحت الاختبار نفسه',body:'المقارنة العادلة تستخدم الخاصية نفسها في الحالتين.',prompt:'ما الفرق الذي ظهر عندما استخدمنا الاختبار نفسه؟'},
  {icon:'🎯',label:'اختاري',title:'اربطي الخاصية بالاستخدام',body:'اختيار المادة المناسبة يعتمد على الصفة التي نحتاجها في الموقف.',prompt:'أي خاصية تجعلك تختارين هذه المادة لهذا الاستخدام؟'}
 ];
 return [
  {icon:'👀',label:'ألاحظ',title:'ابدئي من ظاهرة أو نموذج',body:`نحوّل الهدف إلى شيء يمكن ملاحظته أو تمثيله: ${target}`,prompt:'ما أول شيء تستطيعين ملاحظته؟'},
  {icon:'💭',label:'أتوقع',title:'قولي توقعك قبل التفسير',body:'التوقع يجعلنا نعرف ما الدليل الذي نبحث عنه بدل قراءة النتيجة مباشرة.',prompt:'ماذا تتوقعين أن يحدث؟ ولماذا؟'},
  {icon:'🔬',label:'أستدل',title:'قارني التوقع بالدليل',body:'استخدمي الملاحظة أو النموذج لتعديل فكرتك ثم صياغة استنتاج.',prompt:'ما الدليل الذي غيّر أو أكد توقعك؟'}
 ];
}

function arabicScenes(lesson:Lesson,objective:string):TeachingScene[]{
 const key=textKey(lesson,objective);const target=shortObjective(objective);
 if(/reading|poem|نص|قراءة|قصيد|فكرة|معنى|مقروء/.test(key))return [
  {icon:'📖',label:'سياق',title:'ادخلي إلى المعنى أولًا',body:`اقرئي الفكرة داخل سياقها بدل البحث عن إجابة منفصلة: ${target}`,prompt:'ما الصورة أو الفكرة التي تتكون في ذهنك؟'},
  {icon:'🔍',label:'دليل من النص',title:'ابحثي عما يثبت فهمك',body:'ارجعي إلى كلمة أو عبارة أو حدث يدعم المعنى الذي فهمته.',prompt:'أي جزء من النص جعلك تفهمين ذلك؟'},
  {icon:'💬',label:'قوليها بطريقتك',title:'أعيدي بناء المعنى',body:'عبّري عن الفكرة بكلماتك أو اربطيها بموقف آخر دون نسخ الجملة نفسها.',prompt:'كيف تقولين الفكرة لشخص لم يقرأ النص؟'}
 ];
 if(/همز|إملاء|لام شمس|لام قمر|تاء|spelling/.test(key))return [
  {icon:'👂',label:'اسمعي ولاحظي',title:'ابدئي من الكلمة',body:`شاهدي أو انطقي أمثلة تحقق الهدف: ${target}`,prompt:'أي حرف أو حركة أو صوت يتغير بين الأمثلة؟'},
  {icon:'🧩',label:'اكتشفي النمط',title:'قسّمي الكلمات إلى مجموعات',body:'صنفي الأمثلة حسب السمة التي لاحظتها، ثم استنتجي القاعدة من المجموعات.',prompt:'ما العلامة التي جعلتك تضعين الكلمات معًا؟'},
  {icon:'✍️',label:'اكتبي',title:'جربي كلمة جديدة',body:'طبقي النمط على كلمة لم تكن ضمن الأمثلة الأولى.',prompt:'كيف تحققتِ من كتابتها؟'}
 ];
 if(/اسم|فعل|ضمير|معرب|مبني|إعراب|قاعدة|grammar|نحو/.test(key))return [
  {icon:'💬',label:'جملة لها معنى',title:'لا تبدئي باسم القاعدة',body:`نضع الهدف داخل جملة طبيعية أولًا: ${target}`,prompt:'ما وظيفة الكلمة أو التركيب داخل المعنى؟'},
  {icon:'🔄',label:'بدّلي',title:'غيّري عنصرًا واحدًا',body:'بدلي كلمة أو زمنًا أو ضميرًا وراقبي ما الذي يتغير في الجملة.',prompt:'ما الذي اضطر أن يتغير معه؟'},
  {icon:'🧠',label:'صوغي القاعدة',title:'اجعلي القاعدة وصفًا لما رأيتِه',body:'بعد عدة أمثلة، قولي النمط بكلماتك ثم اختبريه على جملة جديدة.',prompt:'هل تعمل القاعدة على المثال الجديد أيضًا؟'}
 ];
 return [
  {icon:'🗣️',label:'معنى',title:'ابدئي بما تريدين قوله',body:`نضع الهدف في موقف تواصل حقيقي: ${target}`,prompt:'ما المعنى الذي تريدين إيصاله؟'},
  {icon:'🧩',label:'بناء',title:'رتّبي الكلمات لخدمة المعنى',body:'غيّري كلمة أو تركيبًا ولاحظي أثره في وضوح الجملة.',prompt:'أي اختيار جعل المعنى أدق؟'},
  {icon:'✍️',label:'استخدام',title:'اصنعي جملة من عندك',body:'استخدمي الفكرة في سياق جديد بدل تكرار المثال.',prompt:'كيف تتأكدين أن الجملة تقول ما قصدته؟'}
 ];
}

function englishScenes(lesson:Lesson,objective:string):TeachingScene[]{
 const key=textKey(lesson,objective);const target=shortObjective(objective);
 if(/reading|text|story|report|message|vocab|word|meaning/.test(key))return [
  {icon:'🎬',label:'Context',title:'Start with the situation',body:`Meet the idea inside a meaningful situation: ${target}`,prompt:'What is happening, and what do you understand before translating word by word?'},
  {icon:'🔎',label:'Clue',title:'Find evidence in the text',body:'Use nearby words, actions, or details to support the meaning you chose.',prompt:'Which clue helped you most?'},
  {icon:'💬',label:'Use',title:'Say it in a new situation',body:'Reuse the idea or word in a different sentence of your own.',prompt:'What changed in your new example, and what meaning stayed the same?'}
 ];
 if(/question|punctuation|present|past|perfect|continuous|adverb|stative|comparative|pronoun|tense|grammar/.test(key))return [
  {icon:'🎭',label:'Meaning',title:'Choose what you want to mean first',body:`Grammar follows the situation: ${target}`,prompt:'Are you describing a habit, something happening now, a past event, a comparison, or a question?'},
  {icon:'👀',label:'Notice',title:'Watch the pattern change',body:'Change the subject, time, or sentence purpose and notice which words must move or change.',prompt:'Which word controls the pattern here?'},
  {icon:'💬',label:'Use',title:'Build a fresh sentence',body:'Create a new sentence for a different situation using the same meaning-pattern connection.',prompt:'Why does this form fit your new situation?'}
 ];
 if(/write|compose|email|paragraph|كتابة/.test(key))return [
  {icon:'🎯',label:'Purpose',title:'Know what the message must do',body:`Start from the communication goal: ${target}`,prompt:'Who will read it, and what should they understand or do?'},
  {icon:'🧱',label:'Build',title:'Put the message in a clear order',body:'Choose the key information first, then add details that help the reader.',prompt:'What must come first so the reader is not confused?'},
  {icon:'✍️',label:'Create',title:'Write your own version',body:'Change the names, details, or situation while keeping the communication purpose.',prompt:'Does your new version still achieve the same purpose?'}
 ];
 return [
  {icon:'🎬',label:'Situation',title:'Start with meaning',body:`Put the objective inside a real situation: ${target}`,prompt:'What do you want to understand or communicate?'},
  {icon:'👀',label:'Notice',title:'Find the useful pattern',body:'Look for the words or structure doing the important job.',prompt:'Which part carries the key meaning?'},
  {icon:'💬',label:'Use',title:'Try it yourself',body:'Create a different example using the same idea.',prompt:'What stayed the same when the situation changed?'}
 ];
}

export function getDirectedTeachingScenes(lesson:Lesson,objectiveIndex:number):TeachingScene[]|null{
 const explicit=getTeachingScenes(lesson,objectiveIndex);if(explicit?.length)return explicit;
 if(lesson.kind==='assessment')return null;
 const objectives=lesson.learningPoints.length?lesson.learningPoints:[lesson.summary];const objective=objectives[objectiveIndex];if(!objective)return null;
 if(lesson.subject==='الرياضيات')return mathScenes(lesson,objective);
 if(lesson.subject==='العلوم والحياة')return scienceScenes(lesson,objective);
 if(lesson.subject==='اللغة العربية')return arabicScenes(lesson,objective);
 if(lesson.subject==='English')return englishScenes(lesson,objective);
 return null;
}
