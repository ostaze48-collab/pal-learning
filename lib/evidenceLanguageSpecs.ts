import type {ExplicitEvidenceSpec} from './evidenceSpecs';

const specs:Record<string,ExplicitEvidenceSpec[]>={
 'g5-ar-reading-blessings':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل وصف بوظيفته في فهم الفقرة.',targets:['فكرة رئيسة','تفصيل داعم'],pairs:[{item:'المعنى الذي يجمع معظم جمل الفقرة',target:'فكرة رئيسة'},{item:'مثال أو وصف يوضح المعنى العام',target:'تفصيل داعم'},{item:'جملة تشرح جانبًا صغيرًا من الموضوع',target:'تفصيل داعم'}]},
  {objectiveId:2,kind:'apply',interaction:'choice',quality:'direct',questionId:'q2',prompt:'اختاري أول خطوة مناسبة لاستنتاج معنى كلمة غير مألوفة.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة بناء إجابة فهم مرتبطة بالنص.',orderItems:['أقرأ السؤال وأحدد ما يطلبه','أبحث في النص عن الفكرة أو الدليل المرتبط','أجيب بكلماتي مع الاستناد إلى النص']}
 ],
 'g5-ar-pronouns':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الضمائر إلى منفصلة ومتصلة.',targets:['ضمير منفصل','ضمير متصل'],pairs:[{item:'أنا',target:'ضمير منفصل'},{item:'نحن',target:'ضمير منفصل'},{item:'الياء في كتابي',target:'ضمير متصل'},{item:'نا في كتبنا',target:'ضمير متصل'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي تصنيف الضمير.',statement:'في كلمة «كتابنا» الضمير «نا» منفصل لأنه يدل على جماعة.',options:['الصحيح أنه ضمير متصل لأنه اتصل بالكلمة','الصحيح أنه اسم علم','العبارة صحيحة'],correctIndex:0,explanation:'نوع الضمير يتحدد بطريقة ظهوره في الجملة؛ «نا» هنا متصلة بالكلمة.'},
  {objectiveId:3,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل ضمير بالاسم الذي يعود عليه.',targets:['سلمى','الطلاب','أنا والمتحدثون معي'],pairs:[{item:'سلمى قرأت، وهي سعيدة — «هي»',target:'سلمى'},{item:'الطلاب وصلوا، وهم مستعدون — «هم»',target:'الطلاب'},{item:'نحن نتعلم — «نحن»',target:'أنا والمتحدثون معي'}]}
 ],
 'g5-ar-poem-village':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي الألفاظ بالمشاعر التي توحي بها عادة في النص الشعري.',targets:['حنين واشتياق','محبة واعتزاز'],pairs:[{item:'أشتاق / أحنّ',target:'حنين واشتياق'},{item:'لا أنسى / أتذكر',target:'حنين واشتياق'},{item:'أحب / أعتز',target:'محبة واعتزاز'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات ربط عنوان القصيدة بفكرتها العامة.',orderItems:['أقرأ العنوان وأتوقع موضوعًا أوليًا','أقرأ الأبيات وألاحظ الأفكار أو الألفاظ المتكررة','أقارن توقعي بما ظهر في النص ثم أصوغ الفكرة العامة']},
  {objectiveId:3,kind:'apply',interaction:'choice',quality:'direct',questionId:'q3',prompt:'اختاري الطريقة الأدق لفهم تعبير شعري.'}
 ],
 'g5-ar-reading-horse-regret':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة تتبع أحداث قصة قصيرة.',orderItems:['أحدد ما حدث في البداية','أحدد الحدث الذي غيّر الموقف','أحدد النتيجة التي وصلت إليها الأحداث']},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كلمات الربط بالدور الذي تؤديه في علاقة السبب والنتيجة.',targets:['سبب','نتيجة'],pairs:[{item:'لأن',target:'سبب'},{item:'بسبب',target:'سبب'},{item:'لذلك',target:'نتيجة'},{item:'فنتج عن ذلك',target:'نتيجة'}]},
  {objectiveId:3,kind:'apply',interaction:'choice',quality:'direct',questionId:'q3',prompt:'اختاري الصفة التي يجب أن تتوافر في الفكرة العامة الجيدة.'}
 ],
 'g5-ar-poem-nurse':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة الوصول إلى فكرة القصيدة العامة.',orderItems:['أقرأ العنوان والأبيات كاملة','ألاحظ الموضوع أو الفكرة التي تتكرر','أصوغ المعنى الجامع بجملة قصيرة']},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي الألفاظ بالمشاعر التي يمكن أن تدل عليها.',targets:['تقدير وامتنان','عطف ورعاية'],pairs:[{item:'شكر / فضل',target:'تقدير وامتنان'},{item:'رحمة / عناية',target:'عطف ورعاية'}]},
  {objectiveId:3,kind:'explain',interaction:'short_text',quality:'direct',prompt:'اشرحي بأسلوبك كيف يساعد السياق والكلمات العاطفية على فهم معنى بيت شعري.'}
 ],
 'g5-ar-ta-marbuta-haa':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الكلمات بحسب الحرف في نهايتها.',targets:['تاء مربوطة «ة»','هاء «ه»'],pairs:[{item:'مدرسة',target:'تاء مربوطة «ة»'},{item:'شجرة',target:'تاء مربوطة «ة»'},{item:'وجه',target:'هاء «ه»'},{item:'مياه',target:'هاء «ه»'}]},
  {objectiveId:2,kind:'apply',interaction:'choice',quality:'direct',questionId:'q2',prompt:'اختاري الكلمة التي تنتهي بهاء.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة استخدام الوصل للتمييز بين التاء المربوطة والهاء.',orderItems:['أقرأ الكلمة في سياقها','أصل الكلمة بما بعدها وأستمع إلى صوت النهاية','أحدد هل ظهرت تاء عند الوصل أم بقي صوت الهاء']}
 ],
 'g7-ar-sound-verbs':[
  {objectiveId:1,kind:'apply',interaction:'choice',quality:'direct',questionId:'q1',prompt:'اختاري فعلًا صحيحًا سالمًا.'},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل فعل صحيح بنوعه.',targets:['سالم','مهموز','مضعف'],pairs:[{item:'كتب',target:'سالم'},{item:'أخذ',target:'مهموز'},{item:'مدّ',target:'مضعف'}]},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات تصنيف الفعل الصحيح.',orderItems:['أحدد الحروف الأصلية للفعل','أتحقق من وجود همزة أصلية أو تضعيف','أصنفه سالمًا أو مهموزًا أو مضعفًا']}
 ],
 'g7-ar-sub-inflection-signs':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'ميّزي العلامة الأصلية من العلامة الفرعية في الأمثلة.',targets:['علامة أصلية','علامة فرعية'],pairs:[{item:'الضمة في رفع اسم مفرد',target:'علامة أصلية'},{item:'الواو في رفع جمع المذكر السالم',target:'علامة فرعية'},{item:'الياء في نصب جمع المذكر السالم',target:'علامة فرعية'}]},
  {objectiveId:2,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي حالة جمع المذكر السالم بعلامة الإعراب المناسبة.',targets:['الواو','الياء'],pairs:[{item:'الرفع',target:'الواو'},{item:'النصب',target:'الياء'},{item:'الجر',target:'الياء'}]},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة اختيار علامة الإعراب.',orderItems:['أحدد نوع الكلمة أو الباب النحوي','أحدد موقعها الإعرابي: رفع أو نصب أو جر','أختار العلامة الأصلية أو الفرعية المناسبة لذلك الباب']}
 ],
 'g7-en-adverbs-frequency':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'Put the words in the natural order.',orderItems:['I','usually','play football.']},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'Correct the position of the frequency adverb with be.',statement:'She always is helpful.',options:['She is always helpful.','She helpful is always.','Always she helpful is.'],correctIndex:0,explanation:'With the verb be, the frequency adverb normally comes after am/is/are.'},
  {objectiveId:3,kind:'compare',interaction:'match',quality:'direct',prompt:'Match each adverb to its meaning.',targets:['every time','on some occasions','0% / not at all'],pairs:[{item:'always',target:'every time'},{item:'sometimes',target:'on some occasions'},{item:'never',target:'0% / not at all'}]}
 ],
 'g7-en-keep-in-touch':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'Read the mini-message: “Hi Lina, can you meet me at the library at 4? — Maya.” Match each detail to its role.',targets:['sender','receiver','purpose'],pairs:[{item:'Maya',target:'sender'},{item:'Lina',target:'receiver'},{item:'asking to meet at the library',target:'purpose'}]},
  {objectiveId:2,kind:'compare',interaction:'match',quality:'direct',prompt:'Match each short message to its purpose.',targets:['invitation','request','update'],pairs:[{item:'Would you like to come to my party on Friday?',target:'invitation'},{item:'Please send me the homework page.',target:'request'},{item:'I arrived safely and I am at my aunt’s house now.',target:'update'}]},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'Put the scanning steps in a useful order.',orderItems:['Identify the detail the question asks for','Scan for names, dates, places or actions','Read the words around the detail to confirm it','Answer only what the question asks']}
 ]
};

export function getLanguageEvidenceSpecs(lessonId:string){return specs[lessonId]||null}
