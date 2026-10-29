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
 'g5-science-materials-properties':[
  {objectiveId:1,kind:'recognize',interaction:'match',quality:'direct',prompt:'صنّفي الكلمات إلى خاصية للمادة أو شيء لا يصف خاصية المادة.',targets:['خاصية للمادة','ليست خاصية للمادة'],pairs:[{item:'الصلابة',target:'خاصية للمادة'},{item:'الذوبان',target:'خاصية للمادة'},{item:'اسم صاحبها',target:'ليست خاصية للمادة'},{item:'مكان شرائها',target:'ليست خاصية للمادة'}]},
  {objectiveId:2,kind:'apply',interaction:'experiment_choice',quality:'direct',prompt:'شاهدي الاستخدام ثم اختاري الخاصية التي تفسره.',observation:'سلك كهربائي: الجزء الداخلي معدن، والغطاء الخارجي بلاستيك.',options:['المعدن موصل والبلاستيك عازل','البلاستيك معدن أقوى','الاختيار يعتمد على اللون فقط'],correctIndex:0,explanation:'نختار المادة بحسب الخاصية المناسبة للوظيفة؛ المعدن موصل والبلاستيك عازل.'},
  {objectiveId:3,kind:'compare',interaction:'short_text',quality:'direct',prompt:'اذكري مثالين لمادتين تختلفان في خاصية واحدة مثل الذوبان أو التوصيل، واشرحي الفرق بجملة قصيرة.'}
 ],
 'g5-science-separation-methods':[
  {objectiveId:1,kind:'apply',interaction:'experiment_choice',quality:'direct',prompt:'شاهدي نتيجة التجربة ثم اختاري الاستنتاج الأفضل.',observation:'مررنا مخلوط الرمل والماء عبر ورقة ترشيح. بقي الرمل على الورقة ومر الماء إلى الوعاء.',options:['الترشيح مناسب عندما يكون الصلب غير ذائب ويمكن حجزه','المغناطيس هو الأفضل لكل مخلوط','التبخير يفصل الرمل مباشرة'],correctIndex:0,explanation:'الترشيح يعتمد على اختلاف حجم الجسيمات وكون الرمل غير ذائب في الماء.'},
  {objectiveId:2,kind:'apply',interaction:'experiment_choice',quality:'direct',prompt:'أي طريقة تفسر نتيجة هذه التجربة؟',observation:'وضعنا مخلوط برادة حديد ورمل قرب مغناطيس، فتحركت برادة الحديد نحو المغناطيس وبقي الرمل.',options:['المغناطيس لأن أحد المكونات ينجذب إليه','الترشيح لأن الحديد يذوب','التبخير لأن الرمل يتبخر'],correctIndex:0,explanation:'نستخدم المغناطيس عندما ينجذب أحد مكونات المخلوط إليه.'},
  {objectiveId:3,kind:'apply',interaction:'choice',quality:'direct',questionId:'q1',prompt:'اختاري الطريقة المناسبة لفصل مادة صلبة غير ذائبة عن سائل.'},
  {objectiveId:4,kind:'explain',interaction:'experiment_choice',quality:'direct',prompt:'ماذا نستنتج بعد ترك ماء مالح في طبق دافئ حتى اختفى الماء وبقي الملح؟',observation:'اختفى الماء تدريجيًا وبقيت بلورات الملح في الطبق.',options:['التبخير يمكن أن يسترجع مادة صلبة مذابة','المغناطيس فصل الملح','الترشيح جعل الملح يتبخر'],correctIndex:0,explanation:'يتبخر الماء وتبقى المادة الصلبة المذابة، لذلك يمكن استرجاع الملح بالتبخير.'}
 ],
 'g5-science-physical-chemical-changes':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الأمثلة بحسب ما إذا كانت المادة بقيت نفسها أم تكونت مادة جديدة.',targets:['تغير فيزيائي','تغير كيميائي'],pairs:[{item:'انصهار الثلج',target:'تغير فيزيائي'},{item:'تجمد الماء',target:'تغير فيزيائي'},{item:'احتراق الخشب',target:'تغير كيميائي'}]},
  {objectiveId:2,kind:'explain',interaction:'experiment_choice',quality:'direct',prompt:'شاهدي الملاحظة ثم اختاري أفضل استنتاج.',observation:'بعد احتراق قطعة ورق ظهر رماد وغازات ولم يعد الورق كما كان.',options:['تكونت مواد جديدة لذلك التغير كيميائي','تغير مكان الورق فقط','لم يحدث أي تغير في المادة'],correctIndex:0,explanation:'تكوّن مواد جديدة دليل أساسي على التغير الكيميائي.'},
  {objectiveId:3,kind:'apply',interaction:'error_fix',quality:'direct',prompt:'اكتشفي الخطأ في التصنيف.',statement:'قالت طالبة: ذوبان الثلج تغير كيميائي لأنه تغير شكله.',options:['الصحيح أنه تغير فيزيائي لأن المادة بقيت ماءً','الصحيح لأنه تغير كيميائي دائمًا إذا تغير الشكل','كل تغير في درجة الحرارة كيميائي'],correctIndex:0,explanation:'تغير الحالة دون تكوّن مادة جديدة هو تغير فيزيائي.'}
 ],
 'g5-math-whole-times-fraction':[
  {objectiveId:1,kind:'recognize',interaction:'match',quality:'direct',prompt:'اربطي كل عدد صحيح بصورته ككسر مقامه 1.',targets:['2/1','3/1','5/1'],pairs:[{item:'2',target:'2/1'},{item:'3',target:'3/1'},{item:'5',target:'5/1'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي الخطأ واختاري التصحيح.',statement:'2 × 3/4 = 6/8 لأننا ضربنا 2 في البسط والمقام.',options:['الصحيح 6/4؛ العدد الصحيح يكرر عدد الأرباع ولا يغير حجم الربع','الصحيح 3/8','6/8 صحيح'],correctIndex:0,explanation:'عند ضرب عدد صحيح في كسر نضرب العدد الصحيح في البسط، ويبقى المقام كما هو.'},
  {objectiveId:3,kind:'apply',interaction:'short_text',quality:'direct',prompt:'احسبي 4 × 2/3 ثم اكتبي الناتج في صورة مبسطة أو عدد كسري إن أمكن.'}
 ],
 'g5-math-fraction-times-fraction':[
  {objectiveId:1,kind:'apply',interaction:'choice',quality:'direct',questionId:'q1',prompt:'اختاري ناتج ضرب البسطين والمقامين في هذا المثال.'},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي طريقة حساب المقام.',statement:'2/3 × 3/4 = 6/7 لأننا جمعنا 3 و4 في المقام.',options:['الصحيح 6/12 لأننا نضرب المقامين 3×4','الصحيح 5/7','6/7 صحيح'],correctIndex:0,explanation:'في ضرب كسرين نضرب المقام في المقام.'},
  {objectiveId:3,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل كسر بصورة مبسطة مساوية له.',targets:['1/2','2/3','3/4'],pairs:[{item:'6/12',target:'1/2'},{item:'8/12',target:'2/3'},{item:'9/12',target:'3/4'}]}
 ],
 'g5-math-whole-div-fraction':[
  {objectiveId:1,kind:'recognize',interaction:'choice',quality:'direct',prompt:'في 3 ÷ 2/5، أي جزء يبقى كما هو عندما نبدأ التحويل؟',options:['3','2/5','نقلب الاثنين'],correctIndex:0,explanation:'نثبت العدد الأول كما هو.'},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات تحويل القسمة إلى ضرب.',orderItems:['نثبت العدد الأول','نحوّل ÷ إلى ×','نقلب الكسر الثاني']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي التحويل.',statement:'3 ÷ 2/5 = 1/3 × 2/5',options:['3 × 5/2','3 × 2/5','1/3 × 5/2'],correctIndex:0,explanation:'نثبت العدد الأول ونقلب الكسر الثاني فقط.'}
 ],
 'g5-math-fraction-div-fraction':[
  {objectiveId:1,kind:'recognize',interaction:'choice',quality:'direct',prompt:'في 2/3 ÷ 4/5، أي كسر يبقى كما هو؟',options:['2/3','4/5','الكسران ينقلبان'],correctIndex:0,explanation:'الكسر الأول يبقى كما هو.'},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات القسمة بصورة صحيحة.',orderItems:['نبقي الكسر الأول','نحوّل القسمة إلى ضرب','نقلب الكسر الثاني','نضرب ثم نبسط']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي الخطأ في قلب الكسور.',statement:'3/5 ÷ 2/7 = 5/3 × 7/2',options:['الصحيح 3/5 × 7/2','الصحيح 5/3 × 2/7','الحل صحيح'],correctIndex:0,explanation:'نقلب الكسر الثاني فقط، ويبقى الأول كما هو.'},
  {objectiveId:4,kind:'apply',interaction:'short_text',quality:'direct',prompt:'احسبي 2/3 ÷ 4/5 ثم بسطي الناتج إلى أبسط صورة.'}
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
 'g7-science-atom-structure':[
  {objectiveId:1,kind:'recognize',interaction:'match',quality:'direct',prompt:'اربطي مكونات الذرة بمكانها.',targets:['داخل النواة','حول النواة'],pairs:[{item:'البروتونات',target:'داخل النواة'},{item:'النيوترونات',target:'داخل النواة'},{item:'الإلكترونات',target:'حول النواة'}]},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل جسيم بشحنته.',targets:['موجبة','متعادلة','سالبة'],pairs:[{item:'البروتون',target:'موجبة'},{item:'النيوترون',target:'متعادلة'},{item:'الإلكترون',target:'سالبة'}]},
  {objectiveId:3,kind:'apply',interaction:'choice',quality:'direct',questionId:'q2',prompt:'اختاري شحنة الإلكترون.'},
  {objectiveId:4,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي فكرة التعادل.',statement:'ذرة فيها 8 بروتونات و4 إلكترونات متعادلة لأن فيها نيوترونات.',options:['ليست متعادلة؛ التعادل يحتاج تساوي عدد البروتونات والإلكترونات','متعادلة لأن النيوترونات تلغي الشحنة','كل ذرة متعادلة مهما كان عدد الإلكترونات'],correctIndex:0,explanation:'الشحنة الموجبة للبروتونات تتوازن مع الشحنة السالبة للإلكترونات عندما يتساوى العددان.'}
 ],
 'g7-science-important-compounds':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الأمثلة إلى عنصر أو مركب.',targets:['عنصر','مركب'],pairs:[{item:'Fe',target:'عنصر'},{item:'H₂O',target:'مركب'},{item:'NaCl',target:'مركب'}]},
  {objectiveId:2,kind:'apply',interaction:'choice',quality:'direct',questionId:'q1',prompt:'اختاري مثالًا لمركب مكوّن من الهيدروجين والأكسجين.'},
  {objectiveId:3,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي الصيغة بالاسم الشائع أو الوصف.',targets:['الماء','ملح الطعام','ثاني أكسيد الكربون'],pairs:[{item:'H₂O',target:'الماء'},{item:'NaCl',target:'ملح الطعام'},{item:'CO₂',target:'ثاني أكسيد الكربون'}]},
  {objectiveId:4,kind:'explain',interaction:'short_text',quality:'direct',prompt:'اختاري أحد المركبات H₂O أو NaCl أو CO₂، واكتبي من أي عناصر يتكون.'}
 ],
 'g7-science-chemical-reactions':[
  {objectiveId:1,kind:'recognize',interaction:'match',quality:'direct',prompt:'صنّفي المواد بحسب موقعها في التفاعل.',targets:['متفاعلات','نواتج'],pairs:[{item:'المواد الموجودة قبل بدء التفاعل',target:'متفاعلات'},{item:'المواد الجديدة بعد التفاعل',target:'نواتج'}]},
  {objectiveId:2,kind:'compare',interaction:'choice',quality:'direct',questionId:'q1',prompt:'اختاري الاسم الصحيح للمواد التي يبدأ بها التفاعل.'},
  {objectiveId:3,kind:'explain',interaction:'experiment_choice',quality:'direct',prompt:'شاهدي الملاحظة ثم اختاري أفضل استنتاج.',observation:'أثناء تجربة ظهرت فقاعات غاز وتغيرت درجة الحرارة وتكونت مادة مختلفة.',options:['هذه دلائل يمكن أن تشير إلى تفاعل كيميائي','نقلنا المادة من مكان إلى آخر فقط','لا يمكن أن يحدث أي تغير كيميائي'],correctIndex:0,explanation:'انطلاق الغاز أو تغير الحرارة أو تكون مادة جديدة قد تكون أدلة على تفاعل كيميائي.'},
  {objectiveId:4,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي الفكرة عن الذرات في التفاعل.',statement:'في التفاعل الكيميائي تختفي الذرات القديمة وتظهر ذرات جديدة.',options:['الذرات يعاد ترتيبها وارتباطها لتكوين مواد جديدة','الذرات تختفي تمامًا','المواد لا تتغير أبدًا'],correctIndex:0,explanation:'التفاعل الكيميائي يعيد ترتيب الذرات لتكوين مواد جديدة.'}
 ],
 'g7-en-question-order':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'Put the words in the correct order to make a question.',orderItems:['Where','do','you','live?']},
  {objectiveId:2,kind:'apply',interaction:'match',quality:'direct',prompt:'Match each subject with the auxiliary that normally starts its present-simple yes/no question.',targets:['Do','Does'],pairs:[{item:'you',target:'Do'},{item:'we',target:'Do'},{item:'they',target:'Do'},{item:'he',target:'Does'},{item:'she',target:'Does'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'Find the grammar mistake and choose the correct question.',statement:'Does he plays football?',options:['Does he play football?','Does he plays football?','Do he plays football?'],correctIndex:0,explanation:'After does, the main verb stays in the base form: play.'}
 ]
};

export function getExplicitEvidenceSpecs(lessonId:string){return specs[lessonId]||null}
