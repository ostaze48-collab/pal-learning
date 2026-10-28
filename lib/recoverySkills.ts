export type RecoveryQuestion={id:string;text:string;options:string[];correct:number;explanation:string};
export type RecoverySkill={
  id:string;
  subject:'الرياضيات'|'اللغة العربية'|'English'|'العلوم والحياة';
  title:string;
  strand:string;
  gradeBand:string;
  description:string;
  whyItMatters:string;
  explanation:string;
  screening:RecoveryQuestion[];
};

export const recoverySkills:RecoverySkill[]=[
  {
    id:'math-number-sense',subject:'الرياضيات',title:'الحس العددي والقيمة المنزلية',strand:'الأعداد',gradeBand:'الصفوف السابقة',
    description:'قراءة الأعداد ومقارنتها وفهم قيمة الرقم حسب موقعه.',whyItMatters:'أساس العمليات الحسابية والتقدير والكسور العشرية.',
    explanation:'قيمة الرقم تتغير حسب منزلته. في 4,582 قيمة الرقم 5 هي 500 لأنه في منزلة المئات.',
    screening:[
      {id:'mns1',text:'في العدد 4,582 ما قيمة الرقم 5؟',options:['5','50','500','5000'],correct:2,explanation:'الرقم 5 في منزلة المئات.'},
      {id:'mns2',text:'أي عدد أكبر؟',options:['3,905','3,590'],correct:0,explanation:'نقارن من أعلى منزلة؛ 9 مئات أكبر من 5 مئات.'}
    ]
  },
  {
    id:'math-add-sub',subject:'الرياضيات',title:'الجمع والطرح مع الحمل والاستلاف',strand:'العمليات',gradeBand:'الصفوف السابقة',
    description:'إجراء الجمع والطرح متعدد المنازل بدقة.',whyItMatters:'مطلوب في المسائل والقياس والكسور والإحصاء.',
    explanation:'نرتب المنازل تحت بعضها ونبدأ من الآحاد، مع الحمل أو الاستلاف عند الحاجة.',
    screening:[
      {id:'mas1',text:'ما ناتج 468 + 257؟',options:['715','725','735','825'],correct:1,explanation:'468 + 257 = 725.'},
      {id:'mas2',text:'ما ناتج 702 - 358؟',options:['344','354','444','454'],correct:0,explanation:'702 - 358 = 344.'}
    ]
  },
  {
    id:'math-mult-div',subject:'الرياضيات',title:'الضرب والقسمة الأساسية',strand:'العمليات',gradeBand:'الصفوف السابقة',
    description:'حقائق جدول الضرب وربط الضرب بالقسمة.',whyItMatters:'مطلوب للعوامل والكسور والنسب والمساحات والعمليات على الأعداد.',
    explanation:'إذا عرفتِ 7×8=56 فأنتِ تعرفين 56÷7=8 و56÷8=7.',
    screening:[
      {id:'mmd1',text:'ما ناتج 7 × 8؟',options:['48','54','56','64'],correct:2,explanation:'7 × 8 = 56.'},
      {id:'mmd2',text:'ما ناتج 54 ÷ 6؟',options:['7','8','9','10'],correct:2,explanation:'6 × 9 = 54.'}
    ]
  },
  {
    id:'math-fractions',subject:'الرياضيات',title:'فهم الكسور والتكافؤ والمقارنة',strand:'الكسور',gradeBand:'الصفوف السابقة',
    description:'فهم البسط والمقام والكسور المتكافئة والمقارنة.',whyItMatters:'أساس ضرب الكسور وقسمتها والنسب لاحقًا.',
    explanation:'المقام يصف عدد الأجزاء المتساوية، والبسط يصف عدد الأجزاء المأخوذة.',
    screening:[
      {id:'mf1',text:'أي كسر يكافئ 1/2؟',options:['2/4','2/3','3/5','4/5'],correct:0,explanation:'2/4 تبسط إلى 1/2.'},
      {id:'mf2',text:'أي كسر أكبر؟',options:['3/4','2/4'],correct:0,explanation:'لهما المقام نفسه، فنقارن البسط: 3 أكبر من 2.'}
    ]
  },
  {
    id:'arabic-reading',subject:'اللغة العربية',title:'الطلاقة وفهم المقروء',strand:'القراءة',gradeBand:'الصفوف السابقة',
    description:'فهم الفكرة الرئيسة وتسلسل الأحداث والمعلومة الصريحة.',whyItMatters:'كل دروس اللغة والعلوم تقريبًا تعتمد على فهم النص.',
    explanation:'نقرأ الفقرة ثم نسأل: عمّ تتحدث؟ ما أهم فكرة؟ وما الدليل من الجمل؟',
    screening:[
      {id:'ar1',text:'إذا كانت معظم جمل فقرة تتحدث عن أهمية الماء، فما الفكرة الرئيسة الأقرب؟',options:['أهمية الماء','لون الورق','عدد الكلمات','شكل الخط'],correct:0,explanation:'الفكرة الرئيسة تجمع المعنى المتكرر في الفقرة.'},
      {id:'ar2',text:'عند ترتيب أحداث قصة، ما الذي نبحث عنه؟',options:['ما حدث أولًا ثم ما تلاه','أطول كلمة','عدد الحروف','نوع الخط'],correct:0,explanation:'التسلسل الزمني يساعد على فهم القصة.'}
    ]
  },
  {
    id:'arabic-vocabulary',subject:'اللغة العربية',title:'المفردات وفهم المعنى من السياق',strand:'المفردات',gradeBand:'الصفوف السابقة',
    description:'استنتاج معنى الكلمة من الجملة وما حولها.',whyItMatters:'ضعف المفردات يسبب صعوبة في القراءة والعلوم وحتى المسائل اللفظية.',
    explanation:'ننظر إلى الكلمات قبل الكلمة وبعدها ونختبر معنى يناسب الجملة.',
    screening:[
      {id:'av1',text:'في جملة «عاد الطفل فرِحًا بعد نجاحه»، أقرب معنى لـ«فرحًا» هو:',options:['سعيدًا','غاضبًا','متعبًا','صامتًا'],correct:0,explanation:'السياق يشير إلى السعادة بعد النجاح.'},
      {id:'av2',text:'أفضل خطوة عند مواجهة كلمة غير مألوفة في نص هي:',options:['محاولة فهمها من السياق','ترك النص كله','اختيار معنى عشوائي','حذف الجملة'],correct:0,explanation:'السياق يقدم قرائن للمعنى.'}
    ]
  },
  {
    id:'arabic-spelling',subject:'اللغة العربية',title:'أساسيات الإملاء',strand:'الإملاء',gradeBand:'الصفوف السابقة',
    description:'تمييز التاء والهاء واللام الشمسية والقمرية وبعض مواضع الهمزة.',whyItMatters:'يساعد في الكتابة الصحيحة وفهم بنية الكلمات.',
    explanation:'نستخدم النطق والسياق وشكل الكلمة لتحديد الرسم الإملائي الصحيح.',
    screening:[
      {id:'as1',text:'أي كلمة تنتهي بتاء مربوطة؟',options:['مدرسة','بنت','وجه','صوت'],correct:0,explanation:'مدرسة تنتهي بـ ة.'},
      {id:'as2',text:'أي كلمة فيها لام قمرية؟',options:['القمر','الشمس','النجم','الطريق'],correct:0,explanation:'نسمع اللام في «القمر».'}
    ]
  },
  {
    id:'arabic-grammar',subject:'اللغة العربية',title:'بناء الجملة وأقسام الكلام',strand:'القواعد',gradeBand:'الصفوف السابقة',
    description:'تمييز الاسم والفعل والضمير وبناء جملة مفهومة.',whyItMatters:'أساس القواعد الحالية والكتابة السليمة.',
    explanation:'الفعل يدل على حدث، والاسم يدل على شخص أو شيء أو معنى، والضمير يحل محل الاسم.',
    screening:[
      {id:'ag1',text:'أي كلمة فعل؟',options:['كتبَ','كتاب','هو','مدرسة'],correct:0,explanation:'كتبَ يدل على حدث.'},
      {id:'ag2',text:'في «سارة تقرأ وهي سعيدة»، كلمة «هي»:',options:['ضمير','فعل','صفة فقط','حرف جر'],correct:0,explanation:'هي ضمير يعود على سارة.'}
    ]
  },
  {
    id:'english-phonics',subject:'English',title:'Phonics and basic spelling',strand:'Foundations',gradeBand:'Previous grades',
    description:'Recognising common sounds and simple word patterns.',whyItMatters:'Reading and spelling become difficult when sound-letter links are weak.',
    explanation:'Read the word slowly, connect letters to sounds, then blend the sounds together.',
    screening:[
      {id:'ep1',text:'Which word starts with the same sound as “fish”?',options:['fan','sun','cat','dog'],correct:0,explanation:'fish and fan start with /f/.'},
      {id:'ep2',text:'Which word rhymes with “cat”?',options:['hat','cup','dog','pen'],correct:0,explanation:'cat and hat share the ending sound.'}
    ]
  },
  {
    id:'english-vocabulary',subject:'English',title:'Core vocabulary',strand:'Vocabulary',gradeBand:'Previous grades',
    description:'Common school, family, time, place and action words.',whyItMatters:'Vocabulary supports reading, grammar and communication.',
    explanation:'Learn words in short sentences, not as isolated translations only.',
    screening:[
      {id:'ev1',text:'Choose the word that means «مدرسة».',options:['school','market','house','street'],correct:0,explanation:'school = مدرسة.'},
      {id:'ev2',text:'Which word is an action?',options:['run','table','blue','school'],correct:0,explanation:'run is a verb/action word.'}
    ]
  },
  {
    id:'english-sentence',subject:'English',title:'Basic sentence order',strand:'Grammar',gradeBand:'Previous grades',
    description:'Building simple subject + verb + complement sentences.',whyItMatters:'Needed before present simple, continuous and perfect structures.',
    explanation:'A basic English sentence often starts with the subject, then the verb, then the rest of the information.',
    screening:[
      {id:'es1',text:'Choose the correct sentence.',options:['She plays football.','Plays she football.','Football she plays is.'],correct:0,explanation:'Subject + verb + object/complement.'},
      {id:'es2',text:'Choose the correct question.',options:['Where do you live?','Where you live do?','Do where live you?'],correct:0,explanation:'Question word + auxiliary + subject + verb.'}
    ]
  },
  {
    id:'english-reading',subject:'English',title:'Short-text comprehension',strand:'Reading',gradeBand:'Previous grades',
    description:'Finding a stated fact and main idea in a short English text.',whyItMatters:'Current-grade English relies on reading short texts independently.',
    explanation:'Read the question first, then scan the text for the sentence that gives the evidence.',
    screening:[
      {id:'er1',text:'Text: “Lina goes to school at 7:30.” What time does Lina go to school?',options:['7:30','8:30','6:30','9:00'],correct:0,explanation:'The answer is stated directly.'},
      {id:'er2',text:'Text: “Ali likes football. He plays every Friday.” What does Ali like?',options:['football','swimming','reading','cooking'],correct:0,explanation:'The first sentence gives the answer.'}
    ]
  },
  {
    id:'science-observation',subject:'العلوم والحياة',title:'الملاحظة والتصنيف',strand:'مهارات علمية',gradeBand:'الصفوف السابقة',
    description:'ملاحظة الصفات وتجميع الأشياء وفق خاصية واضحة.',whyItMatters:'التصنيف أساس في المادة والكائنات الحية والمواد والطاقة.',
    explanation:'نحدد خاصية قابلة للملاحظة أو القياس ثم نستخدمها لتكوين مجموعات.',
    screening:[
      {id:'so1',text:'إذا صنفنا مواد إلى «تنجذب للمغناطيس» و«لا تنجذب»، فما أساس التصنيف؟',options:['خاصية مغناطيسية','اللون فقط','الاسم','مكان الشراء'],correct:0,explanation:'التصنيف اعتمد على الاستجابة للمغناطيس.'},
      {id:'so2',text:'أي عبارة تمثل ملاحظة؟',options:['الماء عديم اللون','أظن الماء سعيدًا','الماء أجمل شيء','الماء يحب الضوء'],correct:0,explanation:'الملاحظة تصف خاصية يمكن التحقق منها.'}
    ]
  },
  {
    id:'science-measurement',subject:'العلوم والحياة',title:'القياس وقراءة البيانات',strand:'مهارات علمية',gradeBand:'الصفوف السابقة',
    description:'استخدام وحدات مناسبة وقراءة جدول أو رسم بسيط.',whyItMatters:'التجارب والحركة والطاقة والضغط تعتمد على القياس والبيانات.',
    explanation:'نختار أداة ووحدة مناسبة، ثم نسجل القيمة ونقارنها بوضوح.',
    screening:[
      {id:'sm1',text:'ما الوحدة الأنسب لقياس طول قلم؟',options:['السنتيمتر','الكيلومتر','اللتر','الكيلوغرام'],correct:0,explanation:'السنتيمتر مناسب للأطوال الصغيرة.'},
      {id:'sm2',text:'إذا زادت القيم في جدول من 2 إلى 4 إلى 6، فالاتجاه هو:',options:['زيادة','نقصان','ثبات','لا يمكن القول'],correct:0,explanation:'القيم تزداد تدريجيًا.'}
    ]
  },
  {
    id:'science-cause',subject:'العلوم والحياة',title:'السبب والنتيجة والتفسير العلمي',strand:'استدلال',gradeBand:'الصفوف السابقة',
    description:'ربط تغير أو ظاهرة بسبب محتمل واستخدام دليل بسيط.',whyItMatters:'مطلوب في التغيرات الكيميائية والطاقة والحركة والتفاعلات.',
    explanation:'نسأل: ماذا تغير؟ ما العامل الذي تغير قبله؟ وما الدليل الذي يدعم العلاقة؟',
    screening:[
      {id:'sc1',text:'ذاب الثلج بعد وضعه في مكان دافئ. ما السبب الأقرب؟',options:['اكتساب حرارة','تغير اسمه','كبر حجمه فجأة','اختفاء الماء'],correct:0,explanation:'الحرارة تسبب الانصهار.'},
      {id:'sc2',text:'أي جملة تستخدم دليلًا؟',options:['ارتفعت الحرارة من 20 إلى 30 درجة','أعتقد فقط أنه حدث','ربما دون قياس','لا أعرف'],correct:0,explanation:'القيم المقاسة دليل مباشر.'}
    ]
  },
  {
    id:'science-core-concepts',subject:'العلوم والحياة',title:'مفاهيم أساسية في المادة والطاقة والكائنات',strand:'مفاهيم',gradeBand:'الصفوف السابقة',
    description:'تمييز كائن حي ومادة وطاقة وتغير بسيط.',whyItMatters:'يربط موضوعات العلوم الحالية بما سبق تعلمه.',
    explanation:'نسأل عن الخصائص: هل الشيء حي؟ ما حالته؟ هل حدث تغير؟ وهل انتقلت أو تحولت طاقة؟',
    screening:[
      {id:'scc1',text:'أي مما يلي كائن حي؟',options:['نبات','صخرة','كأس','مسمار'],correct:0,explanation:'النبات ينمو ويتنفس ويتكاثر.'},
      {id:'scc2',text:'تحول الماء من سائل إلى بخار يسمى:',options:['تبخر','تجمد','تكاثف','انصهار'],correct:0,explanation:'تحول السائل إلى غاز هو التبخر.'}
    ]
  }
];

export const subjectRecoveryStrands={
  'الرياضيات':['math-number-sense','math-add-sub','math-mult-div','math-fractions'],
  'اللغة العربية':['arabic-reading','arabic-vocabulary','arabic-spelling','arabic-grammar'],
  'English':['english-phonics','english-vocabulary','english-sentence','english-reading'],
  'العلوم والحياة':['science-observation','science-measurement','science-cause','science-core-concepts']
} as const;

export function getRecoverySkill(id:string){return recoverySkills.find(s=>s.id===id)}
export function getSubjectRecoverySkills(subject:string){return recoverySkills.filter(s=>s.subject===subject)}
