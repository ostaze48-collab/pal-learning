export type ExplicitEvidenceSpec={
 objectiveId:number;
 kind:'recognize'|'apply'|'explain'|'construct'|'compare'|'correct_error';
 interaction:'choice'|'short_text'|'match'|'order'|'error_fix'|'experiment_choice';
 prompt:string;
 questionId?:string;
 quality:'direct';
 pairs?:Array<{item:string;target:string}>;
 targets?:string[];
 orderItems?:string[];
 statement?:string;
 observation?:string;
 options?:string[];
 correctIndex?:number;
 explanation?:string;
};

const specs:Record<string,ExplicitEvidenceSpec[]>={
 'g5-science-cell-types':[
  {objectiveId:1,kind:'recognize',interaction:'choice',quality:'direct',questionId:'q1',prompt:'اختاري الوحدة الأساسية التي تُبنى منها أجسام الكائنات الحية.'},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي هذه الأجزاء: هل تظهر في الخلية النباتية فقط أم في النباتية والحيوانية؟',targets:['في الخلية النباتية فقط','في النباتية والحيوانية'],pairs:[{item:'البلاستيدات الخضراء',target:'في الخلية النباتية فقط'},{item:'الجدار الخلوي',target:'في الخلية النباتية فقط'},{item:'النواة',target:'في النباتية والحيوانية'},{item:'الغشاء الخلوي',target:'في النباتية والحيوانية'}]},
  {objectiveId:3,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل جزء بوظيفته الأساسية.',targets:['يحيط بالخلية','يتحكم في كثير من أنشطة الخلية','توجد فيه مكونات الخلية'],pairs:[{item:'الغشاء الخلوي',target:'يحيط بالخلية'},{item:'النواة',target:'يتحكم في كثير من أنشطة الخلية'},{item:'السيتوبلازم',target:'توجد فيه مكونات الخلية'}]},
  {objectiveId:4,kind:'explain',interaction:'short_text',quality:'direct',questionId:'q4',prompt:'رأيتِ خلية فيها جدار خلوي وبلاستيدات خضراء وفجوة عصارية كبيرة. ما نوعها؟ اكتبي السبب باختصار.'}
 ],
 'g5-science-separation-methods':[
  {objectiveId:1,kind:'apply',interaction:'experiment_choice',quality:'direct',prompt:'شاهدي نتيجة التجربة ثم اختاري الاستنتاج الأفضل.',observation:'مررنا مخلوط الرمل والماء عبر ورقة ترشيح. بقي الرمل على الورقة ومر الماء إلى الوعاء.',options:['الترشيح مناسب عندما يكون الصلب غير ذائب ويمكن حجزه','المغناطيس هو الأفضل لكل مخلوط','التبخير يفصل الرمل مباشرة'],correctIndex:0,explanation:'الترشيح يعتمد على اختلاف حجم الجسيمات وكون الرمل غير ذائب في الماء.'},
  {objectiveId:2,kind:'apply',interaction:'experiment_choice',quality:'direct',prompt:'أي طريقة تفسر نتيجة هذه التجربة؟',observation:'وضعنا مخلوط برادة حديد ورمل قرب مغناطيس، فتحركت برادة الحديد نحو المغناطيس وبقي الرمل.',options:['المغناطيس لأن أحد المكونات ينجذب إليه','الترشيح لأن الحديد يذوب','التبخير لأن الرمل يتبخر'],correctIndex:0,explanation:'نستخدم المغناطيس عندما ينجذب أحد مكونات المخلوط إليه.'},
  {objectiveId:3,kind:'apply',interaction:'choice',quality:'direct',questionId:'q1',prompt:'اختاري الطريقة المناسبة لفصل مادة صلبة غير ذائبة عن سائل.'},
  {objectiveId:4,kind:'explain',interaction:'experiment_choice',quality:'direct',prompt:'ماذا نستنتج بعد ترك ماء مالح في طبق دافئ حتى اختفى الماء وبقي الملح؟',observation:'اختفى الماء تدريجيًا وبقيت بلورات الملح في الطبق.',options:['التبخير يمكن أن يسترجع مادة صلبة مذابة','المغناطيس فصل الملح','الترشيح جعل الملح يتبخر'],correctIndex:0,explanation:'يتبخر الماء وتبقى المادة الصلبة المذابة، لذلك يمكن استرجاع الملح بالتبخير.'}
 ],
 'g5-ar-noun-types':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الكلمات إلى اسم علم أو ضمير.',targets:['اسم علم','ضمير'],pairs:[{item:'فلسطين',target:'اسم علم'},{item:'سلمى',target:'اسم علم'},{item:'هي',target:'ضمير'},{item:'نحن',target:'ضمير'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اختاري الصياغة التي تتجنب تكرار الاسم وتبقي المعنى واضحًا.',statement:'سارة قرأت القصة. سارة أعجبتها القصة.',options:['سارة قرأت القصة. هي أعجبتها القصة.','سارة قرأت القصة. فلسطين أعجبتها القصة.','سارة قرأت القصة. قرأت أعجبتها القصة.'],correctIndex:0,explanation:'الضمير «هي» يمكن أن يحل محل اسم سارة ويمنع التكرار مع بقاء المرجع واضحًا.'},
  {objectiveId:3,kind:'recognize',interaction:'match',quality:'direct',prompt:'ميّزي الضمائر عن الكلمات الأخرى.',targets:['ضمير','ليست ضميرًا'],pairs:[{item:'أنا',target:'ضمير'},{item:'هو',target:'ضمير'},{item:'هم',target:'ضمير'},{item:'غزة',target:'ليست ضميرًا'},{item:'كتاب',target:'ليست ضميرًا'}]}
 ],
 'g7-math-integers':[
  {objectiveId:1,kind:'recognize',interaction:'match',quality:'direct',prompt:'صنّفي الأعداد إلى موجب وسالب وصفر.',targets:['موجب','سالب','صفر'],pairs:[{item:'-4',target:'سالب'},{item:'0',target:'صفر'},{item:'6',target:'موجب'},{item:'-1',target:'سالب'}]},
  {objectiveId:2,kind:'apply',interaction:'match',quality:'direct',prompt:'ضعي كل عدد في موقعه بالنسبة إلى الصفر على خط الأعداد.',targets:['يسار الصفر','عند الصفر','يمين الصفر'],pairs:[{item:'-5',target:'يسار الصفر'},{item:'0',target:'عند الصفر'},{item:'3',target:'يمين الصفر'}]},
  {objectiveId:3,kind:'apply',interaction:'order',quality:'direct',prompt:'رتّبي الأعداد كما ستظهر من اليسار إلى اليمين على خط الأعداد.',orderItems:['-6','-1','0','4']}
 ],
 'g7-math-add-subtract-integers':[
  {objectiveId:1,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي الخطأ في الحل ثم اختاري التصحيح.',statement:'قالت طالبة: -3 + 5 = -8 لأنها جمعت 3 و5 ووضعت إشارة السالب.',options:['الصحيح 2؛ لأن الإشارتين مختلفتان فنطرح 3 من 5 ونأخذ إشارة الأكبر قيمة مطلقة','الصحيح -2؛ لأن كل مسألة فيها سالب نتيجتها سالبة','الصحيح 8؛ لأننا نتجاهل الإشارات'],correctIndex:0,explanation:'عند اختلاف الإشارتين نطرح القيم المطلقة ونأخذ إشارة العدد الأكبر قيمة مطلقة.'},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'هل هذا الحل صحيح؟ اختاري التصحيح الأنسب.',statement:'-7 + (-2) = -5',options:['خطأ؛ نجمع 7 و2 لأن الإشارتين متماثلتان، فيكون الناتج -9','صحيح؛ نطرح دائمًا مع الأعداد السالبة','خطأ؛ الناتج 9 موجب'],correctIndex:0,explanation:'جمع عددين سالبين يعني جمع القيم المطلقة والإبقاء على الإشارة السالبة.'},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي هذه الفكرة.',statement:'4 - (-2) = 2 لأننا طرحنا 2 من 4.',options:['الصحيح 6؛ لأن طرح السالب يتحول إلى إضافة مقابله الموجب','الصحيح -6؛ لأن هناك إشارتين سالبتين','الحل 2 صحيح'],correctIndex:0,explanation:'طرح عدد سالب يعادل إضافة مقابله الموجب: 4 - (-2) = 4 + 2 = 6.'}
 ],
 'g7-en-question-order':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'Put the words in the correct order to make a question.',orderItems:['Where','do','you','live?']},
  {objectiveId:2,kind:'apply',interaction:'match',quality:'direct',prompt:'Match each subject with the auxiliary that normally starts its present-simple yes/no question.',targets:['Do','Does'],pairs:[{item:'you',target:'Do'},{item:'we',target:'Do'},{item:'they',target:'Do'},{item:'he',target:'Does'},{item:'she',target:'Does'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'Find the grammar mistake and choose the correct question.',statement:'Does he plays football?',options:['Does he play football?','Does he plays football?','Do he plays football?'],correctIndex:0,explanation:'After does, the main verb stays in the base form: play.'}
 ]
};

export function getExplicitEvidenceSpecs(lessonId:string){return specs[lessonId]||null}
