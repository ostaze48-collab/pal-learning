export type CurriculumSource={
  id:string;
  title:string;
  authority:'official'|'official-support'|'external';
  kind:'textbook'|'package'|'curriculum'|'framework'|'teacher-guide'|'worksheet'|'assessment'|'solution';
  url:string;
  grades?:number[];
  subjects?:string[];
  priority:number;
  note:string;
};

export const curriculumSources:CurriculumSource[]=[
  // PRIMARY TEACHING CORE — official Ministry textbooks.
  {id:'book-g5-math-p1',title:'كتاب الرياضيات للصف الخامس — الفصل الأول',authority:'official',kind:'textbook',url:'https://elearn.azureedge.net/Books/c5/ma5-p1.pdf',grades:[5],subjects:['الرياضيات'],priority:120,note:'المصدر الأول لشرح الرياضيات للصف الخامس: المفاهيم، التسلسل، الأمثلة والمصطلحات.'},
  {id:'book-g5-arabic-p1',title:'كتاب اللغة العربية للصف الخامس — الفصل الأول',authority:'official',kind:'textbook',url:'https://elearn.azureedge.net/Books/c5/ar5-p1.pdf',grades:[5],subjects:['اللغة العربية'],priority:120,note:'المصدر الأول لشرح اللغة العربية للصف الخامس، مع تجنب نسخ النصوص الأدبية الطويلة حرفيًا.'},
  {id:'book-g5-english-p1',title:'English for Palestine — Grade 5 — Semester 1',authority:'official',kind:'textbook',url:'https://elearn.azureedge.net/Books/c5/en5-p1.pdf',grades:[5],subjects:['English'],priority:120,note:'المصدر الأول لمحتوى وشرح English للصف الخامس.'},
  {id:'book-g5-science-p1',title:'كتاب العلوم والحياة للصف الخامس — الفصل الأول',authority:'official',kind:'textbook',url:'https://elearn.azureedge.net/Books/c5/sc5-p1.pdf',grades:[5],subjects:['العلوم والحياة'],priority:120,note:'المصدر الأول لشرح العلوم والحياة للصف الخامس.'},
  {id:'book-g7-math-p1',title:'كتاب الرياضيات للصف السابع — الفصل الأول',authority:'official',kind:'textbook',url:'https://elearn.azureedge.net/Books/c7/ma7-p1.pdf',grades:[7],subjects:['الرياضيات'],priority:120,note:'المصدر الأول لشرح الرياضيات للصف السابع.'},
  {id:'book-g7-arabic-p1',title:'كتاب اللغة العربية للصف السابع — الفصل الأول',authority:'official',kind:'textbook',url:'https://elearn.azureedge.net/Books/c7/ar7-p1.pdf',grades:[7],subjects:['اللغة العربية'],priority:120,note:'المصدر الأول لشرح اللغة العربية للصف السابع، مع تجنب نسخ النصوص الأدبية الطويلة حرفيًا.'},
  {id:'book-g7-english-p1',title:'English for Palestine — Grade 7 — Semester 1',authority:'official',kind:'textbook',url:'https://elearn.azureedge.net/Books/c7/en7-p1.pdf',grades:[7],subjects:['English'],priority:120,note:'المصدر الأول لمحتوى وشرح English للصف السابع.'},
  {id:'book-g7-science-p1',title:'كتاب العلوم والحياة للصف السابع — الفصل الأول',authority:'official',kind:'textbook',url:'https://elearn.azureedge.net/Books/c7/sc7-p01.pdf',grades:[7],subjects:['العلوم والحياة'],priority:120,note:'المصدر الأول لشرح العلوم والحياة للصف السابع.'},

  // Teacher guides help choose pedagogy, but do not replace the student's textbook content.
  {id:'teacher-guide-5',title:'أدلة المعلم للصف الخامس',authority:'official-support',kind:'teacher-guide',url:'https://elearn.edu.ps/c5_guides/',grades:[5],priority:105,note:'مرجع لطرق التدريس والأهداف والتقويم بعد تثبيت محتوى الدرس من الكتاب الوزاري.'},
  {id:'teacher-guide-6',title:'أدلة المعلم للصف السادس',authority:'official-support',kind:'teacher-guide',url:'https://elearn.edu.ps/c6_guides/',grades:[6],priority:105,note:'مرجع تربوي لدعم علاج فجوات ما قبل الصف السابع.'},
  {id:'teacher-guide-7',title:'أدلة المعلم للصف السابع',authority:'official-support',kind:'teacher-guide',url:'https://elearn.edu.ps/c7_guides/',grades:[7],priority:105,note:'مرجع لطرق التدريس والأهداف والتقويم بعد تثبيت المحتوى من الكتاب الوزاري.'},

  {id:'elearn-framework',title:'الإطار العام للمناهج الفلسطينية',authority:'official',kind:'framework',url:'https://elearn.edu.ps/g-line/',grades:[1,2,3,4,5,6,7,8,9,10,11,12],priority:100,note:'مرجع للغايات والكفايات العامة، وليس بديلًا عن كتاب الطالب في شرح الدرس.'},
  {id:'elearn-curriculum-docs',title:'وثائق المناهج الفلسطينية',authority:'official',kind:'framework',url:'https://elearn.edu.ps/palcirdocs/',grades:[1,2,3,4,5,6,7,8,9,10,11,12],priority:100,note:'مرجع وطني لبنية المباحث والكفايات.'},
  {id:'elearn-grade5',title:'الصف الخامس الأساسي — البوابة التعليمية الفلسطينية',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c5/',grades:[5],priority:98,note:'فهرس رسمي للوصول إلى الكتاب والدروس والمواد المساندة.'},
  {id:'elearn-grade5-math-p1',title:'رياضيات الصف الخامس — الفصل الأول',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c5/ma5-p1/',grades:[5],subjects:['الرياضيات'],priority:99,note:'فهرس رسمي للمبحث؛ الكتاب الوزاري المباشر يظل مصدر الشرح الأول.'},
  {id:'elearn-grade7',title:'الصف السابع الأساسي — البوابة التعليمية الفلسطينية',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c7/',grades:[7],priority:98,note:'فهرس رسمي للوصول إلى الكتاب والدروس والمواد المساندة.'},
  {id:'elearn-grade7-math-p1',title:'رياضيات الصف السابع — الفصل الأول',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c7/ma7-p1/',grades:[7],subjects:['الرياضيات'],priority:99,note:'فهرس رسمي للمبحث؛ الكتاب الوزاري المباشر يظل مصدر الشرح الأول.'},
  {id:'elearn-grade7-arabic-p1',title:'اللغة العربية للصف السابع — الفصل الأول',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c7/ar7-p1/',grades:[7],subjects:['اللغة العربية'],priority:99,note:'فهرس رسمي للمبحث.'},
  {id:'elearn-grade7-english-p1',title:'اللغة الإنجليزية للصف السابع — الفصل الأول',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c7/en7-p1/',grades:[7],subjects:['English'],priority:99,note:'فهرس رسمي للمبحث.'},
  {id:'elearn-grade7-science-p1',title:'العلوم والحياة للصف السابع — الفصل الأول',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c7/sc7-p1/',grades:[7],subjects:['العلوم والحياة'],priority:99,note:'فهرس رسمي للمبحث.'},
  {id:'elearn-grade4',title:'الصف الرابع الأساسي — البوابة التعليمية الفلسطينية',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c4/',grades:[4],priority:96,note:'مرجع فهرسة لفجوات ما قبل الصف الخامس؛ عند العلاج يُستخدم كتاب الصف السابق نفسه متى توفر.'},
  {id:'elearn-grade6',title:'الصف السادس الأساسي — البوابة التعليمية الفلسطينية',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c6/',grades:[6],priority:96,note:'مرجع فهرسة لفجوات ما قبل الصف السابع؛ عند العلاج يُستخدم كتاب الصف السابق نفسه متى توفر.'},

  {id:'elearn-worksheets',title:'أوراق العمل الرسمية',authority:'official-support',kind:'worksheet',url:'https://elearn.edu.ps/worksheets/',grades:[1,2,3,4,5,6,7,8,9,10,11,12],priority:88,note:'للتدريب والتشخيص والتثبيت بعد الشرح من الكتاب، وليست مصدرًا لتعريف محتوى الدرس.'},

  // Emergency packages deliberately come last for teaching depth.
  {id:'moe-gaza-packages',title:'الرزم التعليمية لطلبة غزة',authority:'official',kind:'package',url:'https://www.moe.edu.ps/gaza/subjects',grades:[1,2,3,4,5,6,7,8],priority:60,note:'حزمة طوارئ وحد أدنى للتعلم. تستخدم كملخص ومراجعة سريعة فقط، ولا تقود الشرح الموسع ولا تستبدل كتاب الوزارة.'}
];

export const sourceTrustOrder=['textbook','teacher-guide','framework','curriculum','worksheet','assessment','solution','package'] as const;

export function getCurriculumSources(grade:number,subject?:string){
  return curriculumSources
    .filter(s=>(!s.grades||s.grades.includes(grade))&&(!subject||!s.subjects||s.subjects.includes(subject)))
    .sort((a,b)=>b.priority-a.priority);
}

export function getRecoveryGradeBand(currentGrade:number){
  return Array.from({length:3},(_,i)=>currentGrade-3+i).filter(g=>g>=1&&g<currentGrade);
}

export function getOfficialSourceDomains(){return ['elearn.edu.ps','elearn.azureedge.net','moe.edu.ps','www.moe.edu.ps']}

export const curriculumGroundingPolicy={
  currentGradeShare:0.75,
  recoveryShare:0.25,
  urgentBlockerMaxMinutes:12,
  minimumGroundingPriority:88,
  primaryTeachingSource:'official_textbook',
  emergencyPackageRole:'summary_only',
  rules:[
    'كتاب الوزارة للصف والمبحث هو المرجع الأول للشرح الموسع، ترتيب المفاهيم، المصطلحات والأمثلة المنهجية.',
    'دليل المعلم يستخدم لتحسين طريقة التدريس والتقويم، لا لاستبدال محتوى كتاب الطالب.',
    'الرزم التعليمية للطوارئ تمثل حدًا أدنى وملخصًا سريعًا؛ لا تستخدم كأساس للشرح عندما يتوفر كتاب الوزارة.',
    'لا نعيد صفوفًا سابقة كاملة؛ نستخرج من كتب الصفوف السابقة المهارات التي تمنع التقدم الحالي فقط.',
    'المحتوى الحالي للصف المسجل يبقى المسار الرئيس يوميًا.',
    'عند وجود فجوة مانعة للفهم نعالجها بجلسة قصيرة من كتاب الصف الذي نشأت فيه المهارة ثم نعود للدرس الحالي.',
    'أوراق العمل والاختبارات تستخدم للتدريب والتشخيص والتثبيت ولا تعامل وحدها كتعريف للمنهاج.',
    'أي شرح منهجي موسع يولده AI يجب أن يكون مؤسسًا أولًا على كتاب الوزارة، ثم يمكن توسيعه تربويًا بأمثلة ووسائل شرح مناسبة دون تغيير المفهوم المنهجي.'
  ]
};
