import type {ExplicitEvidenceSpec} from './evidenceSpecs';

const specs:Record<string,ExplicitEvidenceSpec[]>={
 'g5-math-prime-factorization':[
  {objectiveId:1,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل عدد بزوج عوامل صحيح يبدأ منه التحليل.',targets:['2 × 9','3 × 8','5 × 7'],pairs:[{item:'18',target:'2 × 9'},{item:'24',target:'3 × 8'},{item:'35',target:'5 × 7'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات متابعة التحليل عندما يظهر عامل غير أولي.',orderItems:['نكتب العدد كحاصل ضرب عاملين','نفحص هل كل عامل أولي','نحلل أي عامل غير أولي مرة أخرى']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي لماذا لم يكتمل التحليل.',statement:'18 = 2 × 9، إذن انتهينا من التحليل إلى عوامل أولية.',options:['لم ننتهِ؛ 9 غير أولي ويجب تحليله إلى 3 × 3','انتهينا لأن 2 أولي','يجب استبدال 2 بالعدد 1'],correctIndex:0,explanation:'نتوقف فقط عندما تصبح جميع العوامل أعدادًا أولية؛ 9 = 3 × 3.'}
 ],
 'g5-math-area-units':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي ما إذا كنا نقيس سطحًا أم طولًا.',targets:['مساحة سطح','طول'],pairs:[{item:'سطح طاولة',target:'مساحة سطح'},{item:'أرضية غرفة',target:'مساحة سطح'},{item:'طول قلم',target:'طول'},{item:'ارتفاع باب',target:'طول'}]},
  {objectiveId:2,kind:'recognize',interaction:'match',quality:'direct',prompt:'ميّزي وحدات المساحة عن وحدات الطول والحجم.',targets:['وحدة مساحة','ليست وحدة مساحة'],pairs:[{item:'سم²',target:'وحدة مساحة'},{item:'م²',target:'وحدة مساحة'},{item:'م',target:'ليست وحدة مساحة'},{item:'م³',target:'ليست وحدة مساحة'}]},
  {objectiveId:3,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل سطح بالوحدة الأنسب لقياس مساحته.',targets:['سم²','م²'],pairs:[{item:'بطاقة صغيرة',target:'سم²'},{item:'غلاف دفتر',target:'سم²'},{item:'غرفة',target:'م²'},{item:'ساحة صفية',target:'م²'}]}
 ],
 'g7-math-add-subtract-integers':[
  {objectiveId:2,kind:'apply',interaction:'choice',quality:'direct',questionId:'q2',prompt:'اختاري الناتج الصحيح عند جمع عددين سالبين.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات حل 4 - (-2).',orderItems:['نحوّل طرح السالب إلى إضافة مقابله الموجب','نكتب 4 + 2','نحصل على 6']}
 ],
 'g7-math-multiply-divide-integers':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل زوج إشارات بإشارة الناتج في الضرب أو القسمة.',targets:['موجب','سالب'],pairs:[{item:'موجب مع موجب',target:'موجب'},{item:'سالب مع سالب',target:'موجب'},{item:'موجب مع سالب',target:'سالب'},{item:'سالب مع موجب',target:'سالب'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي قاعدة الإشارة.',statement:'(-5) × (-2) = -10 لأن وجود عدد سالب يجعل الناتج سالبًا.',options:['الصحيح 10؛ لأن الإشارتين متماثلتان','الصحيح -7؛ لأننا نجمع القيم','الحل -10 صحيح'],correctIndex:0,explanation:'عند تماثل الإشارتين يكون الناتج موجبًا، و5 × 2 = 10.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة حل عملية ضرب أو قسمة أعداد صحيحة.',orderItems:['نحدد إشارة الناتج من الإشارتين','نجري العملية على القيم المطلقة','نضع الإشارة التي حددناها على الناتج']}
 ],
 'g7-math-reflection-translation':[
  {objectiveId:1,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل نقطة بصورتها عند الانعكاس حول محور س.',targets:['(2،-3)','(-4،-1)','(5،2)'],pairs:[{item:'(2،3)',target:'(2،-3)'},{item:'(-4،1)',target:'(-4،-1)'},{item:'(5،-2)',target:'(5،2)'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي انعكاس النقطة حول محور ص.',statement:'انعكاس (-4،1) حول محور ص يعطي (-4،-1).',options:['الصحيح (4،1)؛ نغير إشارة س فقط','الصحيح (-4،-1)؛ نغير ص فقط','الصحيح (4،-1)؛ نغير الإحداثيين'],correctIndex:0,explanation:'الانعكاس حول محور ص يغير إشارة الإحداثي السيني فقط.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات انسحاب النقطة (1،2) ثلاث وحدات إلى اليمين.',orderItems:['نحدد أن الحركة أفقية نحو اليمين','نضيف 3 إلى الإحداثي السيني ونبقي الصادي','نحصل على (4،2)']}
 ],
 'g7-math-proportion':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي أزواج النسب إلى متناسبة أو غير متناسبة.',targets:['متناسبة','غير متناسبة'],pairs:[{item:'2/3 و4/6',target:'متناسبة'},{item:'1/2 و2/4',target:'متناسبة'},{item:'2/3 و5/6',target:'غير متناسبة'},{item:'3/5 و5/7',target:'غير متناسبة'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي طريقة التحقق من التناسب.',statement:'للتحقق من 2/3 = 4/6 نجمع 2+3 ونقارنها مع 4+6.',options:['نستخدم الضرب التبادلي: 2×6 و3×4','نجمع البسطين فقط','نطرح المقامين'],correctIndex:0,explanation:'التناسب يتحقق بمقارنة الضربين المتقاطعين.'},
  {objectiveId:3,kind:'apply',interaction:'choice',quality:'direct',questionId:'q3',prompt:'استخدمي التناسب لإيجاد القيمة المجهولة.'}
 ],
 'g7-math-direct-proportion':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي العلاقات إلى طردية أو ليست طردية في هذه المواقف.',targets:['تناسب طردي','ليست طردية'],pairs:[{item:'عدد الأقلام والتكلفة بسعر ثابت',target:'تناسب طردي'},{item:'الكمية والتكلفة بسعر وحدة ثابت',target:'تناسب طردي'},{item:'السرعة والزمن لمسافة ثابتة',target:'ليست طردية'}]},
  {objectiveId:2,kind:'apply',interaction:'choice',quality:'direct',questionId:'q1',prompt:'احسبي قيمة جديدة مع بقاء سعر الوحدة ثابتًا.'},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي فكرة ثبات النسبة.',statement:'إذا تضاعف عدد القطع لكن التكلفة لم تتضاعف مع ثبات سعر القطعة، فالعلاقة ما زالت تناسبًا طرديًا.',options:['غير صحيح؛ في التناسب الطردي تبقى النسبة ثابتة','صحيح؛ كل علاقة متزايدة طردية','صحيح إذا كانت الأعداد موجبة'],correctIndex:0,explanation:'التناسب الطردي يحتاج ثبات النسبة بين الكميتين، لا مجرد أن تكونا موجبتين أو متزايدتين.'}
 ],
 'g7-math-inverse-proportion':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي العلاقات إلى عكسية أو ليست عكسية.',targets:['تناسب عكسي','ليست عكسية'],pairs:[{item:'السرعة والزمن لمسافة ثابتة',target:'تناسب عكسي'},{item:'عدد العمال والزمن لنفس العمل وبالمعدل نفسه',target:'تناسب عكسي'},{item:'عدد الأقلام والتكلفة بسعر ثابت',target:'ليست عكسية'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات حل مسألة 4 عمال في 6 أيام، ونريد الزمن عند 8 عمال.',orderItems:['نحسب حاصل الضرب 4 × 6 = 24','نثبت حاصل الضرب للعلاقة العكسية','نقسم 24 ÷ 8 فنحصل على 3 أيام']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي ما الذي يبقى ثابتًا في التناسب العكسي البسيط.',statement:'في التناسب العكسي يبقى مجموع الكميتين ثابتًا.',options:['الصحيح أن حاصل ضرب الكميتين يبقى ثابتًا','الصحيح أن فرق الكميتين يبقى ثابتًا','العبارة صحيحة دائمًا'],correctIndex:0,explanation:'في النموذج العكسي البسيط يبقى حاصل ضرب القيمتين ثابتًا.'}
 ],
 'g7-math-mean':[
  {objectiveId:1,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل مجموعة بيانات بمجموع قيمها.',targets:['12','15','24'],pairs:[{item:'2، 4، 6',target:'12'},{item:'3، 5، 7',target:'15'},{item:'6، 8، 10',target:'24'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات حساب الوسط الحسابي.',orderItems:['نجمع جميع القيم','نعدّ عدد القيم','نقسم المجموع على عدد القيم']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي معنى الوسط الحسابي.',statement:'الوسط الحسابي يجب أن يكون دائمًا إحدى القيم الموجودة أصلًا في البيانات.',options:['غير صحيح؛ قد يكون قيمة غير موجودة لكنه يمثل مركزًا عدديًا للبيانات','صحيح دائمًا','الوسط الحسابي هو أكثر قيمة تكرارًا'],correctIndex:0,explanation:'الوسط الحسابي ناتج قسمة المجموع على عدد القيم، وقد لا يكون إحدى القيم الأصلية.'}
 ],
 'g7-science-average-speed':[
  {objectiveId:1,kind:'apply',interaction:'choice',quality:'direct',questionId:'q1',prompt:'احسبي السرعة المتوسطة من المسافة الكلية والزمن الكلي.'},
  {objectiveId:2,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل مسافة وزمن بالوحدة المناسبة لكتابة السرعة.',targets:['م/ث','كم/س','م/دقيقة'],pairs:[{item:'60 م خلال 12 ث',target:'م/ث'},{item:'6 كم خلال 0.5 ساعة',target:'كم/س'},{item:'300 م خلال 5 دقائق',target:'م/دقيقة'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي معنى السرعة المتوسطة.',statement:'إذا كانت السرعة المتوسطة لرحلة 5 م/ث فهذا يعني أن الجسم تحرك بسرعة 5 م/ث في كل لحظة.',options:['غير صحيح؛ المتوسط يلخص المسافة الكلية والزمن الكلي وقد تتغير السرعة أثناء الرحلة','صحيح؛ المتوسط يعني سرعة ثابتة دائمًا','غير صحيح؛ السرعة المتوسطة لا تستخدم الزمن'],correctIndex:0,explanation:'السرعة المتوسطة لا تعني أن السرعة اللحظية بقيت ثابتة طوال الرحلة.'}
 ]
};

export function getEvidenceSpecExtensions(lessonId:string){return specs[lessonId]||null}
