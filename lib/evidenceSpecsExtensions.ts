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
  {objectiveId:1,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل نقطة بصورتها عند الانعاس حول محور س.',targets:['(2،-3)','(-4،-1)','(5،2)'],pairs:[{item:'(2،3)',target:'(2،-3)'},{item:'(-4،1)',target:'(-4،-1)'},{item:'(5،-2)',target:'(5،2)'}]},
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
 ],
 'g5-ar-reading-blessings':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة الوصول إلى الفكرة الرئيسة بعد قراءة فقرة.',orderItems:['أقرأ الفقرة كاملة','أجمع التفاصيل التي تتكرر حول معنى واحد','أصوغ المعنى الجامع في جملة قصيرة']},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل قرينة سياقية بالمعنى الأقرب للكلمة.',targets:['الفرح والرضا','الكثرة والاتساع','العناية والحفظ'],pairs:[{item:'امتلأ قلبه سرورًا بهذه النعمة',target:'الفرح والرضا'},{item:'تحيط بنا خيرات كثيرة',target:'الكثرة والاتساع'},{item:'نحافظ على النعمة ولا نهملها',target:'العناية والحفظ'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اختاري الإجابة التي ترتبط بدليل من النص.',statement:'سؤال: لماذا شكر الكاتب النعمة؟ إجابة: لأنني أحب اللون الأزرق.',options:['الإجابة ضعيفة لأنها لا تستند إلى معنى من النص','الإجابة جيدة لأنها جملة كاملة','لا نحتاج إلى النص للإجابة'],correctIndex:0,explanation:'سؤال الفهم يحتاج إجابة مرتبطة بما ورد في النص أو بما نستنتجه منه.'}
 ],
 'g5-ar-pronouns':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الضمائر إلى منفصلة أو متصلة.',targets:['ضمير منفصل','ضمير متصل'],pairs:[{item:'أنا',target:'ضمير منفصل'},{item:'هو',target:'ضمير منفصل'},{item:'الياء في كتابي',target:'ضمير متصل'},{item:'نا في كتبنا',target:'ضمير متصل'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي تصنيف الضمير.',statement:'في كلمة «قلمي» الياء ضمير منفصل لأنها تدل على المتكلم.',options:['الياء ضمير متصل لأنها جاءت جزءًا من الكلمة','العبارة صحيحة لأن كل ضمير متكلم منفصل','الياء ليست ضميرًا'],correctIndex:0,explanation:'الياء في «قلمي» متصلة بالاسم، فهي ضمير متصل.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة معرفة مرجع الضمير في جملة.',orderItems:['أحدد الضمير','أعود إلى الاسم أو الشخص الذي سبق ذكره','أتحقق أن المعنى يستقيم إذا عاد الضمير إليه']}
 ],
 'g5-ar-poem-village':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي العبارة بالشعور الأقرب الذي تكشفه.',targets:['حنين','حب واعتزاز','حزن'],pairs:[{item:'لا أنسى قريتي وأشتاق إليها',target:'حنين'},{item:'أفتخر بجمالها وأهلها',target:'حب واعتزاز'},{item:'أحزن لفراق المكان',target:'حزن'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة ربط عنوان القصيدة بفكرتها العامة.',orderItems:['أقرأ العنوان','أبحث عن ألفاظ أو أفكار تتكرر في الأبيات','أفسر كيف يجمع العنوان المعنى المتكرر']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي طريقة تفسير التعبير الشعري.',statement:'أفسر عبارة «أشتاق لقريتي» من كلمة واحدة فقط وأتجاهل بقية البيت.',options:['الأفضل قراءة التعبير داخل البيت والسياق كله','صحيح؛ كلمة واحدة تكفي دائمًا','الأفضل تجاهل الألفاظ العاطفية'],correctIndex:0,explanation:'السياق يساعد على فهم المعنى الشعري والعاطفة المقصودة.'}
 ],
 'g5-ar-reading-horse-regret':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي أحداث هذا المثال القصير كما تحدث منطقيًا.',orderItems:['اتخذ الحصان قرارًا متسرعًا','ظهر أثر القرار في الحدث التالي','أدرك الحصان النتيجة وشعر بالندم']},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي كل عبارة إلى سبب أو نتيجة.',targets:['سبب','نتيجة'],pairs:[{item:'لأنه لم يفكر قبل القرار',target:'سبب'},{item:'فندم بعد أن رأى ما حدث',target:'نتيجة'},{item:'بسبب استعجاله',target:'سبب'},{item:'لذلك تغير موقفه',target:'نتيجة'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'ميّزي الفكرة العامة من تفصيل واحد.',statement:'الفكرة العامة للقصة هي فقط: «خرج الحصان في الصباح».',options:['هذا تفصيل؛ الفكرة العامة تجمع معنى الأحداث ونتيجتها','هذه فكرة عامة لأنها جملة','كل أول حدث هو الفكرة العامة'],correctIndex:0,explanation:'الفكرة العامة تجمع المعنى الأساسي للقصة ولا تقتصر على حدث جزئي.'}
 ],
 'g5-ar-poem-nurse':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي نوع العبارة بما تساعدك على اكتشافه في القصيدة.',targets:['موضوع القصيدة','تفصيل داعم'],pairs:[{item:'تكرار الحديث عن الممرضة وعملها',target:'موضوع القصيدة'},{item:'وصف حركة أو موقف واحد',target:'تفصيل داعم'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات اكتشاف عاطفة المتكلم.',orderItems:['أبحث عن الكلمات العاطفية','ألاحظ ما إذا كانت تحمل شكرًا أو تقديرًا أو غيره','أربطها بموضوع القصيدة']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي طريقة شرح البيت الشعري.',statement:'شرح البيت يعني نسخه بالكلمات نفسها دون توضيح معناه.',options:['الشرح يعيد المعنى بأسلوب واضح من عندي','النسخ وحده يكفي لإثبات الفهم','يجب تغيير موضوع البيت'],correctIndex:0,explanation:'شرح البيت يبين أنك فهمت معناه وتستطيعين التعبير عنه بأسلوبك.'}
 ],
 'g5-ar-ta-marbuta-haa':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الكلمات بحسب الحرف في نهايتها.',targets:['تاء مربوطة «ة»','هاء «ه»'],pairs:[{item:'مدرسة',target:'تاء مربوطة «ة»'},{item:'رحمة',target:'تاء مربوطة «ة»'},{item:'وجه',target:'هاء «ه»'},{item:'مياه',target:'هاء «ه»'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي الفكرة عن الهاء في آخر الكلمة.',statement:'كل كلمة نسمع في آخرها صوتًا قريبًا من الهاء عند الوقف يجب أن تكتب «ه».',options:['غير صحيح؛ التاء المربوطة قد تنطق هاء عند الوقف لكنها تكتب «ة»','صحيح دائمًا','نحذف الحرف الأخير'],correctIndex:0,explanation:'الوقف وحده قد يخفي الفرق؛ لذلك نستخدم شكل الكلمة والوصل أيضًا.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة اختبار نهاية الكلمة عند الشك.',orderItems:['أنظر إلى شكل نهاية الكلمة','أجرب وصلها بكلمة بعدها','أسمع هل تظهر تاء عند الوصل ثم أحدد «ة» أو «ه»']}
 ],
 'g7-ar-sound-verbs':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الأفعال بحسب خلو أصولها من حروف العلة.',targets:['فعل صحيح','ليس فعلًا صحيحًا'],pairs:[{item:'كتب',target:'فعل صحيح'},{item:'جلس',target:'فعل صحيح'},{item:'قال',target:'ليس فعلًا صحيحًا'},{item:'وعد',target:'ليس فعلًا صحيحًا'}]},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل فعل صحيح بنوعه.',targets:['سالم','مهموز','مضعف'],pairs:[{item:'كتب',target:'سالم'},{item:'أخذ',target:'مهموز'},{item:'مدّ',target:'مضعف'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي تصنيف الفعل.',statement:'الفعل «مدّ» صحيح سالم لأنه لا يحتوي حرف علة.',options:['هو صحيح مضعف لأن فيه حرفين متماثلين مدغمين','هو فعل معتل','هو صحيح مهموز'],correctIndex:0,explanation:'خلو الفعل من حرف العلة يجعله صحيحًا، لكن وجود التضعيف يجعله من الصحيح المضعف لا السالم.'}
 ],
 'g7-ar-sub-inflection-signs':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'ميّزي العلامة الأصلية من العلامة الفرعية.',targets:['علامة أصلية','علامة فرعية'],pairs:[{item:'الضمة',target:'علامة أصلية'},{item:'الفتحة',target:'علامة أصلية'},{item:'الواو',target:'علامة فرعية'},{item:'الياء',target:'علامة فرعية'}]},
  {objectiveId:2,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي حالة جمع المذكر السالم بعلامتها.',targets:['الواو','الياء'],pairs:[{item:'مرفوع',target:'الواو'},{item:'منصوب',target:'الياء'},{item:'مجرور',target:'الياء'}]},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة اختيار علامة الإعراب المناسبة.',orderItems:['أحدد نوع الكلمة أو الباب النحوي','أحدد موقعها الإعرابي: رفع أو نصب أو جر','أختار العلامة الأصلية أو الفرعية المناسبة لهذا الباب']}
 ],
 'g7-en-adverbs-frequency':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'Put the words in the correct order.',orderItems:['I','usually','play football']},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'Fix the position of the frequency adverb.',statement:'She always is helpful.',options:['She is always helpful.','Always she helpful is.','She helpful is always.'],correctIndex:0,explanation:'With the verb be, the frequency adverb normally comes after am/is/are.'},
  {objectiveId:3,kind:'compare',interaction:'match',quality:'direct',prompt:'Match each adverb with the closest frequency meaning.',targets:['about 100%','many times','some of the time','0%'],pairs:[{item:'always',target:'about 100%'},{item:'often',target:'many times'},{item:'sometimes',target:'some of the time'},{item:'never',target:'0%'}]}
 ],
 'g7-en-keep-in-touch':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'Read this mini-message and match each detail to its role: “From Lina to Maya: Can you send me the trip photo?”',targets:['sender','receiver','message action'],pairs:[{item:'Lina',target:'sender'},{item:'Maya',target:'receiver'},{item:'send the trip photo',target:'message action'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'Identify the purpose of the message.',statement:'“Can you send me the trip photo?” is only an update; the writer is not asking for anything.',options:['It is a request because the writer asks the receiver to send something.','It is only a greeting.','It gives directions to a place.'],correctIndex:0,explanation:'The wording asks the receiver to do something, so the purpose is a request.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'Put the scanning steps in a useful order.',orderItems:['Decide which detail you need','Look quickly for names, dates, places or actions','Read the words around the detail to confirm its meaning']}
 ]
};

export function getEvidenceSpecExtensions(lessonId:string){return specs[lessonId]||null}
