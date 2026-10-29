import type {ExplicitEvidenceSpec} from './evidenceSpecs';

const specs:Record<string,ExplicitEvidenceSpec[]>={
 'g5-math-rectangle-square-area':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة إيجاد مساحة المستطيل.',orderItems:['أحدد الطول والعرض','أضرب الطول × العرض','أكتب الناتج بوحدة مربعة']},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي حساب مساحة المربع.',statement:'مربع طول ضلعه 5 م؛ كتبت طالبة المساحة = 5 + 5 = 10 م².',options:['الصحيح 5 × 5 = 25 م²','الصحيح 4 × 5 = 20 م²','الإجابة 10 م² صحيحة'],correctIndex:0,explanation:'مساحة المربع = طول الضلع × نفسه.'},
  {objectiveId:3,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل ناتج بوحدته المناسبة.',targets:['سم²','م²'],pairs:[{item:'مساحة بطاقة صغيرة',target:'سم²'},{item:'مساحة غرفة',target:'م²'},{item:'مساحة ورقة دفتر',target:'سم²'}]}
 ],
 'g5-math-prism-surface-area':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة إيجاد المساحة الكلية لمتوازي المستطيلات.',orderItems:['أحدد أزواج الأوجه المتقابلة','أحسب مساحة كل نوع من الأوجه','أضاعف مساحة كل زوج','أجمع مساحات الأوجه الستة']},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل وجه بوجهه المقابل المساوي له.',targets:['2×3','2×4','3×4'],pairs:[{item:'وجه أبعاده 2 و3',target:'2×3'},{item:'وجه أبعاده 2 و4',target:'2×4'},{item:'وجه أبعاده 3 و4',target:'3×4'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي لماذا هذا الجمع ناقص.',statement:'لمتوازي مستطيلات أبعاده 2،3،4 حسب طالب: 2×3 + 2×4 + 3×4 = 26 وحدة².',options:['يجب مضاعفة كل مساحة لأن لكل وجه وجهًا مقابلًا؛ الناتج 52 وحدة²','الناتج 26 صحيح','يجب ضرب الأبعاد الثلاثة للحصول على المساحة الكلية'],correctIndex:0,explanation:'المساحة الكلية تشمل الأوجه الستة، وكل نوع يظهر مرتين.'}
 ],
 'g5-math-frequency-tables':[
  {objectiveId:1,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل قيمة بعدد مرات ظهورها في البيانات: 2،3،2،4،2،3.',targets:['1 مرة','2 مرات','3 مرات'],pairs:[{item:'2',target:'3 مرات'},{item:'3',target:'2 مرات'},{item:'4',target:'1 مرة'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات بناء جدول تكراري.',orderItems:['أحدد القيم المختلفة','أعدّ مرات ظهور كل قيمة','أسجل القيمة والتكرار في الجدول']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي هذا الفهم للتكرار.',statement:'في البيانات 5،5،7، قالت طالبة: تكرار 5 هو 5.',options:['تكرار 5 هو 2 لأنه ظهر مرتين','تكرار 5 هو 7','الإجابة صحيحة'],correctIndex:0,explanation:'التكرار هو عدد مرات الظهور، وليس قيمة العدد نفسه.'}
 ],
 'g5-math-bar-chart':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي ارتفاع العمود بالقيمة التي يمثلها.',targets:['3','5','8'],pairs:[{item:'عمود يصل إلى التدريج 3',target:'3'},{item:'عمود يصل إلى التدريج 5',target:'5'},{item:'عمود يصل إلى التدريج 8',target:'8'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي ما تقرئينه قبل تفسير الرسم بالأعمدة.',orderItems:['أقرأ عنوان الرسم','أقرأ أسماء الفئات والمحاور','أفحص المقياس','أقارن ارتفاع الأعمدة']},
  {objectiveId:3,kind:'experiment_choice',interaction:'experiment_choice',quality:'direct',prompt:'انظري إلى المقارنة ثم اختاري الاستنتاج الأدق.',observation:'الفئة أ قيمتها 8 والفئة ب قيمتها 5 على المقياس نفسه.',options:['الفئة أ أكبر من ب بمقدار 3','الفئة ب أكبر من أ بمقدار 3','لا يمكن المقارنة'],correctIndex:0,explanation:'8 - 5 = 3 عند استخدام المقياس نفسه.'}
 ],
 'g5-math-line-chart':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي اتجاه الخط بما يعنيه عن القيم.',targets:['زيادة','نقصان','ثبات'],pairs:[{item:'الخط يصعد مع الزمن',target:'زيادة'},{item:'الخط يهبط مع الزمن',target:'نقصان'},{item:'الخط أفقي',target:'ثبات'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة قراءة تغير زمني من الرسم الخطي.',orderItems:['أحدد الزمن على المحور الأفقي','أقرأ قيمة كل نقطة','أقارن القيم المتتالية','أصف أين زادت أو نقصت']},
  {objectiveId:3,kind:'experiment_choice',interaction:'experiment_choice',quality:'direct',prompt:'اختاري الوصف الذي يطابق التغير.',observation:'ارتفعت القيمة من 4 إلى 9 ثم انخفضت إلى 7.',options:['زادت 5 ثم نقصت 2','نقصت 5 ثم زادت 2','بقيت ثابتة'],correctIndex:0,explanation:'9-4 = 5 زيادة، ثم 9-7 = 2 نقصان.'}
 ],
 'g7-math-absolute-value':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي العدد بمسافته عن الصفر.',targets:['0 وحدات','3 وحدات','8 وحدات'],pairs:[{item:'0',target:'0 وحدات'},{item:'-3',target:'3 وحدات'},{item:'8',target:'8 وحدات'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي معنى الإشارة داخل القيمة المطلقة.',statement:'|-6| = -6 لأن العدد داخل الرمزين سالب.',options:['الصحيح |-6| = 6 لأن القيمة المطلقة مسافة','الصحيح |-6| = 0','الإجابة -6 صحيحة'],correctIndex:0,explanation:'المسافة عن الصفر لا تكون سالبة.'},
  {objectiveId:3,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل عددين بقيمتهما المطلقة المشتركة.',targets:['2','5','9'],pairs:[{item:'2 و -2',target:'2'},{item:'5 و -5',target:'5'},{item:'9 و -9',target:'9'}]}
 ],
 'g7-math-cartesian-plane':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل جزء من الزوج المرتب بحركته.',targets:['أفقي على محور س','رأسي على محور ص'],pairs:[{item:'الإحداثي الأول',target:'أفقي على محور س'},{item:'الإحداثي الثاني',target:'رأسي على محور ص'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي تمثيل النقطة (3، -2).',orderItems:['أبدأ من نقطة الأصل','أتحرك 3 وحدات يمينًا على س','أتحرك وحدتين إلى أسفل على ص','أحدد النقطة']},
  {objectiveId:3,kind:'recognize',interaction:'match',quality:'direct',prompt:'اربطي الوصف بالنقطة المناسبة.',targets:['(0،0)','(0،4)','(5،0)'],pairs:[{item:'نقطة الأصل',target:'(0،0)'},{item:'نقطة على محور ص فوق الأصل',target:'(0،4)'},{item:'نقطة على محور س يمين الأصل',target:'(5،0)'}]},
  {objectiveId:4,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي إشارة الإحداثيين بالربع المناسب.',targets:['الربع الأول','الربع الثاني','الربع الثالث','الربع الرابع'],pairs:[{item:'(+,+)',target:'الربع الأول'},{item:'(-,+)',target:'الربع الثاني'},{item:'(-,-)',target:'الربع الثالث'},{item:'(+,-)',target:'الربع الرابع'}]}
 ],
 'g7-math-scale':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي طول الرسم بالطول الحقيقي عندما 1 سم يمثل 5 كم.',targets:['5 كم','15 كم','25 كم'],pairs:[{item:'1 سم',target:'5 كم'},{item:'3 سم',target:'15 كم'},{item:'5 سم',target:'25 كم'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي الخطوات قبل استخدام مقياس الرسم.',orderItems:['أحدد وحدات طول الرسم والطول الحقيقي','أوحّد الوحدات إذا لزم','أكتب العلاقة أو التناسب','أحسب القيمة المجهولة']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي استخدام المقياس.',statement:'إذا كان 2 سم يمثل 10 م، قال طالب إن 7 سم تمثل 17 م لأنه جمع 5.',options:['الصحيح 1 سم يمثل 5 م، إذن 7 سم تمثل 35 م','الصحيح 70 م','الإجابة 17 م صحيحة'],correctIndex:0,explanation:'مقياس الرسم علاقة تناسبية؛ نحافظ على النسبة نفسها.'}
 ],
 'g7-math-median':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي البيانات قبل البحث عن الوسيط.',orderItems:['1','3','5','7','9']},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي نوع عدد القيم بطريقة إيجاد الوسيط.',targets:['آخذ القيمة الوسطى','أحسب متوسط القيمتين الوسطيتين'],pairs:[{item:'عدد القيم فردي',target:'آخذ القيمة الوسطى'},{item:'عدد القيم زوجي',target:'أحسب متوسط القيمتين الوسطيتين'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي وسيط مجموعة زوجية.',statement:'وسيط 2،4،6،8 هو 4 لأنها أول قيمة في الوسط.',options:['الصحيح (4+6)÷2 = 5','الصحيح 6 فقط','الإجابة 4 صحيحة'],correctIndex:0,explanation:'عند وجود قيمتين في الوسط نأخذ متوسطهما.'}
 ],
 'g7-math-mode':[
  {objectiveId:1,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي مجموعة البيانات بمنوالها.',targets:['2','5','لا يوجد منوال'],pairs:[{item:'1،2،2،3',target:'2'},{item:'5،5،7،8',target:'5'},{item:'1،2،3،4',target:'لا يوجد منوال'}]},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي مجموعات البيانات بحسب عدد المنوالات.',targets:['منوال واحد','منوالان','لا يوجد منوال'],pairs:[{item:'2،2،3،4',target:'منوال واحد'},{item:'2،2،4،4،6',target:'منوالان'},{item:'1،3،5،7',target:'لا يوجد منوال'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي معنى المنوال.',statement:'في البيانات 1،4،4،7 قال طالب إن المنوال 7 لأنه أكبر قيمة.',options:['المنوال 4 لأنه الأكثر تكرارًا','المنوال 7 لأنه الأكبر','لا يوجد منوال'],correctIndex:0,explanation:'المنوال يعتمد على التكرار، لا على كبر القيمة.'}
 ]
};

export function getMathMechanicsEvidenceSpecs(lessonId:string){return specs[lessonId]||null}
