export type GradeAnchor={
  grade:number;
  subject:'الرياضيات'|'اللغة العربية'|'English'|'العلوم والحياة';
  title:string;
  skills:string[];
  sourceUrl:string;
};

export const gradeAnchors:GradeAnchor[]=[
  {grade:2,subject:'الرياضيات',title:'أساس الأعداد والعمليات',skills:['المقارنة بين الأعداد','الجمع ضمن 99','الطرح ضمن 99','الأعداد الزوجية والفردية','تمثيل البيانات بالصور'],sourceUrl:'https://elearn.edu.ps/c2/ma2-p1/'},
  {grade:2,subject:'اللغة العربية',title:'القراءة والكتابة المبكرة',skills:['الاستماع','المحادثة والقراءة','التدريبات اللغوية','الكتابة والإملاء'],sourceUrl:'https://elearn.edu.ps/c2/'},
  {grade:2,subject:'English',title:'English foundations',skills:['Introducing myself','basic home and town vocabulary','body vocabulary','simple action words'],sourceUrl:'https://elearn.edu.ps/en2-p1/'},

  {grade:3,subject:'الرياضيات',title:'الأعداد حتى 9999 والجمع والطرح والهندسة والبيانات',skills:['قراءة الأعداد ضمن 9999','الجمع والطرح','الاستلاف','مقارنة الأعداد','الزاوية','تمثيل البيانات بالجداول'],sourceUrl:'https://elearn.edu.ps/c3/ma3-p1/'},
  {grade:3,subject:'اللغة العربية',title:'الطلاقة والفهم والتدريبات اللغوية',skills:['المحادثة والقراءة','الاستماع','التدريبات اللغوية','الإملاء','التعبير'],sourceUrl:'https://elearn.edu.ps/c3/ar3-p1/'},
  {grade:3,subject:'English',title:'Basic communication and vocabulary',skills:['about me','jobs','market vocabulary','zoo vocabulary','health vocabulary'],sourceUrl:'https://elearn.edu.ps/c3/'},
  {grade:3,subject:'العلوم والحياة',title:'مفاهيم علمية أساسية',skills:['طبقات الأرض','الثروات الطبيعية','دورة الماء','الملاحظة والتفسير'],sourceUrl:'https://elearn.edu.ps/c3/'},

  {grade:4,subject:'الرياضيات',title:'العمليات والكسور والهندسة والبيانات',skills:['القيمة المنزلية','مقارنة الأعداد الكبيرة','الجمع مع الحمل','الطرح مع الاستلاف','الضرب','القسمة','الكسور المتكافئة','مقارنة الكسور','جمع وطرح الكسور','الزوايا','تمثيل البيانات'],sourceUrl:'https://elearn.edu.ps/c4/'},
  {grade:4,subject:'اللغة العربية',title:'القراءة والإملاء والتعبير',skills:['الفهم القرائي','التدريبات اللغوية','الإملاء','التعبير'],sourceUrl:'https://elearn.edu.ps/c4/'},
  {grade:4,subject:'English',title:'Everyday English',skills:['friends','home vocabulary','shopping vocabulary','school subjects','restaurant requests','seasons'],sourceUrl:'https://elearn.edu.ps/c4/'},
  {grade:4,subject:'العلوم والحياة',title:'علوم الصف الرابع',skills:['الملاحظة والتصنيف','القياس','المفاهيم العلمية الأساسية'],sourceUrl:'https://elearn.edu.ps/c4/'},

  {grade:5,subject:'الرياضيات',title:'الأعداد والعوامل والكسور والهندسة والبيانات',skills:['الأعداد الأولية','التحليل إلى العوامل الأولية','العامل المشترك الأكبر','المضاعف المشترك الأصغر','ضرب وقسمة الكسور','الكسور العشرية','المساحة','تنظيم البيانات'],sourceUrl:'https://elearn.edu.ps/c5/'},
  {grade:5,subject:'اللغة العربية',title:'الفهم والقواعد والإملاء',skills:['الفهم القرائي','النصوص الشعرية','العلم والضمير','اللام الشمسية والقمرية','التاء المربوطة والمفتوحة','أزمنة الفعل'],sourceUrl:'https://elearn.edu.ps/c5/'},
  {grade:5,subject:'English',title:'Present tenses and reading',skills:['present simple','present continuous','vocabulary','questions','punctuation','comparatives'],sourceUrl:'https://elearn.edu.ps/c5/'},
  {grade:5,subject:'العلوم والحياة',title:'الخلية والمادة والطاقة',skills:['الخلية','خصائص المواد','فصل المواد','التغيرات الفيزيائية والكيميائية','الطاقة وتحولاتها'],sourceUrl:'https://elearn.edu.ps/c5/'},

  {grade:6,subject:'الرياضيات',title:'العمليات والجبر والإحصاء',skills:['أولويات العمليات','الأسس','المتغير','المقدار الجبري','جمع وطرح الحدود الجبرية','ضرب الحدود والمقادير','الجداول التكرارية','الوسط الحسابي','الوسيط','المنوال'],sourceUrl:'https://elearn.edu.ps/c6/'},
  {grade:6,subject:'اللغة العربية',title:'قراءة وقواعد وإملاء متقدمة',skills:['علامات الاسم','همزة القطع والوصل','المثنى','الفهم القرائي','التعبير'],sourceUrl:'https://elearn.edu.ps/c6/'},
  {grade:6,subject:'English',title:'Tenses, questions and communication',skills:['present continuous','past simple','conjunctions','food vocabulary','giving advice','permission','modals','rules and obligations'],sourceUrl:'https://elearn.edu.ps/c6/'},
  {grade:6,subject:'العلوم والحياة',title:'المجهر والمادة والحركة',skills:['الموضع والسكون والحركة','المجهر الضوئي','تركيب المادة','الخصائص الفيزيائية للعناصر'],sourceUrl:'https://elearn.edu.ps/c6/'}
];

export const recoverySkillOrigins:Record<string,{grade:number;subject:GradeAnchor['subject'];reason:string}[]>={
  'math-number-sense':[
    {grade:2,subject:'الرياضيات',reason:'المقارنة وقراءة الأعداد'},
    {grade:3,subject:'الرياضيات',reason:'الأعداد ضمن 9999 ومقارنتها'},
    {grade:4,subject:'الرياضيات',reason:'القيمة المنزلية والأعداد الكبيرة'}
  ],
  'math-add-sub':[
    {grade:2,subject:'الرياضيات',reason:'الجمع والطرح الأساسي'},
    {grade:3,subject:'الرياضيات',reason:'الجمع والطرح والاستلاف'},
    {grade:4,subject:'الرياضيات',reason:'الحمل والاستلاف ضمن أعداد أكبر'}
  ],
  'math-mult-div':[
    {grade:3,subject:'الرياضيات',reason:'الأساس العددي السابق للضرب والقسمة'},
    {grade:4,subject:'الرياضيات',reason:'الضرب والقسمة متعددة المنازل'},
    {grade:5,subject:'الرياضيات',reason:'العوامل والمضاعفات والتطبيقات'}
  ],
  'math-fractions':[
    {grade:4,subject:'الرياضيات',reason:'الكسور المتكافئة والمقارنة والجمع والطرح'},
    {grade:5,subject:'الرياضيات',reason:'ضرب الكسور وقسمتها'}
  ],
  'arabic-reading':[
    {grade:2,subject:'اللغة العربية',reason:'المحادثة والقراءة والاستماع'},
    {grade:3,subject:'اللغة العربية',reason:'الطلاقة والفهم في نصوص متنوعة'},
    {grade:4,subject:'اللغة العربية',reason:'الفهم القرائي والتعبير'},
    {grade:5,subject:'اللغة العربية',reason:'فهم نصوص ونصوص شعرية'}
  ],
  'arabic-vocabulary':[
    {grade:2,subject:'اللغة العربية',reason:'مفردات القراءة الأساسية'},
    {grade:3,subject:'اللغة العربية',reason:'السياق والتدريبات اللغوية'},
    {grade:4,subject:'اللغة العربية',reason:'توسع المفردات من نصوص القراءة'}
  ],
  'arabic-spelling':[
    {grade:2,subject:'اللغة العربية',reason:'التدريبات الإملائية المبكرة'},
    {grade:3,subject:'اللغة العربية',reason:'الإملاء ضمن الوحدات'},
    {grade:4,subject:'اللغة العربية',reason:'الإملاء والتعبير'},
    {grade:5,subject:'اللغة العربية',reason:'قواعد إملائية مثل اللام والتاء'}
  ],
  'arabic-grammar':[
    {grade:3,subject:'اللغة العربية',reason:'التدريبات اللغوية وبناء الجملة'},
    {grade:4,subject:'اللغة العربية',reason:'التدريبات اللغوية'},
    {grade:5,subject:'اللغة العربية',reason:'الاسم والضمير وأزمنة الفعل'},
    {grade:6,subject:'اللغة العربية',reason:'علامات الاسم والمثنى'}
  ],
  'english-phonics':[
    {grade:2,subject:'English',reason:'بداية القراءة والمفردات البسيطة'},
    {grade:3,subject:'English',reason:'تثبيت قراءة كلمات الحياة اليومية'}
  ],
  'english-vocabulary':[
    {grade:2,subject:'English',reason:'البيت والجسم والمدينة والأفعال'},
    {grade:3,subject:'English',reason:'السوق والوظائف والحيوانات والصحة'},
    {grade:4,subject:'English',reason:'البيت والتسوق والمدرسة والمطعم'},
    {grade:5,subject:'English',reason:'مفردات موضوعات الصف الخامس'},
    {grade:6,subject:'English',reason:'المفردات المرتبطة بالنصوص والتواصل'}
  ],
  'english-sentence':[
    {grade:3,subject:'English',reason:'الجمل التواصلية البسيطة'},
    {grade:4,subject:'English',reason:'بناء جمل وطلبات يومية'},
    {grade:5,subject:'English',reason:'present simple / present continuous'},
    {grade:6,subject:'English',reason:'past simple والأسئلة وmodals'}
  ],
  'english-reading':[
    {grade:3,subject:'English',reason:'فهم موضوعات قصيرة'},
    {grade:4,subject:'English',reason:'قراءة سياقات الحياة اليومية'},
    {grade:5,subject:'English',reason:'قراءة وفهم نصوص الصف الخامس'},
    {grade:6,subject:'English',reason:'نصوص وقواعد أكثر تعقيدًا'}
  ],
  'science-observation':[
    {grade:3,subject:'العلوم والحياة',reason:'ملاحظة ظواهر الأرض والماء والطبيعة'},
    {grade:4,subject:'العلوم والحياة',reason:'تثبيت التصنيف والملاحظة'},
    {grade:5,subject:'العلوم والحياة',reason:'المادة والخلية والطاقة'},
    {grade:6,subject:'العلوم والحياة',reason:'المجهر والمادة والحركة'}
  ],
  'science-measurement':[
    {grade:3,subject:'العلوم والحياة',reason:'وصف الظواهر والبيانات الأساسية'},
    {grade:4,subject:'العلوم والحياة',reason:'قياس ومقارنة الخصائص'},
    {grade:5,subject:'العلوم والحياة',reason:'خواص المواد والطاقة'},
    {grade:6,subject:'العلوم والحياة',reason:'الحركة والخصائص الفيزيائية'}
  ],
  'science-cause':[
    {grade:3,subject:'العلوم والحياة',reason:'دورة الماء والعلاقات السببية'},
    {grade:4,subject:'العلوم والحياة',reason:'تفسير الظواهر البسيطة'},
    {grade:5,subject:'العلوم والحياة',reason:'التغيرات الفيزيائية والكيميائية والطاقة'},
    {grade:6,subject:'العلوم والحياة',reason:'المادة والحركة'}
  ],
  'science-core-concepts':[
    {grade:3,subject:'العلوم والحياة',reason:'الأرض والماء والثروات الطبيعية'},
    {grade:4,subject:'العلوم والحياة',reason:'المفاهيم العلمية الأساسية'},
    {grade:5,subject:'العلوم والحياة',reason:'الخلية والمادة والطاقة'},
    {grade:6,subject:'العلوم والحياة',reason:'المجهر وتركيب المادة والحركة'}
  ]
};

export function getAnchorsForStudent(currentGrade:number,subject?:GradeAnchor['subject']){
  const min=Math.max(1,currentGrade-3);
  return gradeAnchors.filter(a=>a.grade>=min&&a.grade<currentGrade&&(!subject||a.subject===subject));
}

export function getOriginsForSkill(skillId:string,currentGrade:number){
  const min=Math.max(1,currentGrade-3);
  return (recoverySkillOrigins[skillId]||[]).filter(x=>x.grade>=min&&x.grade<currentGrade);
}
