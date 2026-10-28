export type StudentSlug='salma'|'sama';

export type StudentProfile={
  slug:StudentSlug;
  name:string;
  grade:number;
  gradeLabel:string;
  semester:number;
  accent:string;
  soft:string;
  icon:string;
};

export type LessonQuestion={
  prompt:string;
  choices:string[];
  answer:number;
  explanation:string;
};

export type LessonStep={
  title:string;
  body:string;
  example?:string;
};

export type FamilyLesson={
  slug:string;
  student:StudentSlug;
  subject:string;
  subjectIcon:string;
  title:string;
  subtitle:string;
  estimatedMinutes:number;
  skills:string[];
  steps:LessonStep[];
  questions:LessonQuestion[];
};

export const students:Record<StudentSlug,StudentProfile>={
  salma:{slug:'salma',name:'سلمى',grade:5,gradeLabel:'الصف الخامس',semester:1,accent:'#7a4db3',soft:'#faf5ff',icon:'🌷'},
  sama:{slug:'sama',name:'سما',grade:7,gradeLabel:'الصف السابع',semester:1,accent:'#176b3a',soft:'#f2fbf5',icon:'✨'},
};

export const lessons:FamilyLesson[]=[
  {
    slug:'prime-numbers',student:'salma',subject:'الرياضيات',subjectIcon:'➗',title:'العدد الأولي',subtitle:'العوامل واكتشاف الأعداد الأولية',estimatedMinutes:18,
    skills:['إيجاد عوامل العدد','فهم معنى العدد الأولي','تمييز أولي وغير أولي','تفسير الإجابة'],
    steps:[
      {title:'ابدئي بالعوامل',body:'العامل هو عدد يقسم عددًا آخر دون باقٍ.',example:'عوامل 12 هي: 1، 2، 3، 4، 6، 12'},
      {title:'قارني بين عددين',body:'للعدد 11 عاملان فقط: 1 و11، بينما للعدد 12 عوامل كثيرة.',example:'11 = 1 × 11'},
      {title:'اكتشفي القاعدة',body:'العدد الأولي عدد أكبر من 1 وله عاملان مختلفان فقط: 1 والعدد نفسه.',example:'2، 3، 5، 7، 11 أعداد أولية'},
      {title:'انتبهي للخطأ الشائع',body:'ليس كل عدد فردي أوليًا، والعدد 2 عدد زوجي لكنه أولي.',example:'9 ليس أوليًا لأن عوامله 1، 3، 9'},
      {title:'ماذا عن العدد 1؟',body:'العدد 1 ليس أوليًا لأنه يملك عاملًا واحدًا فقط.',example:'العدد الأولي يحتاج عاملين مختلفين'},
    ],
    questions:[
      {prompt:'أي عدد من الآتي أولي؟',choices:['4','5','9','15'],answer:1,explanation:'5 له عاملان فقط: 1 و5.'},
      {prompt:'ما عوامل العدد 7؟',choices:['1 و7','1 و2 و7','7 فقط','1 و3 و7'],answer:0,explanation:'7 لا يقبل القسمة دون باقٍ إلا على 1 و7.'},
      {prompt:'هل العدد 9 أولي؟',choices:['نعم، لأنه فردي','لا، لأن عوامله 1 و3 و9','نعم، لأنه أكبر من 1','لا، لأنه زوجي'],answer:1,explanation:'9 عدد فردي لكنه غير أولي لأن له أكثر من عاملين.'},
      {prompt:'لماذا العدد 1 ليس أوليًا؟',choices:['لأنه صغير','لأنه فردي','لأن له عاملًا واحدًا فقط','لأنه لا يقبل القسمة'],answer:2,explanation:'العدد الأولي يحتاج عاملين مختلفين، بينما 1 له عامل واحد فقط.'},
      {prompt:'أي مجموعة تحتوي أعدادًا أولية فقط؟',choices:['2، 3، 5','2، 4، 6','3، 9، 11','5، 10، 13'],answer:0,explanation:'2 و3 و5 لكل منها عاملان فقط.'},
    ],
  },
  {
    slug:'prime-factorization',student:'salma',subject:'الرياضيات',subjectIcon:'🌳',title:'التحليل إلى العوامل الأولية',subtitle:'فككي العدد حتى تبقى عوامل أولية فقط',estimatedMinutes:20,
    skills:['اختيار عوامل صحيحة','تمييز العامل الأولي','إكمال التحليل','التحقق من الناتج'],
    steps:[
      {title:'فككي العدد',body:'نبدأ بكتابة العدد كحاصل ضرب عاملين.',example:'18 = 6 × 3'},
      {title:'لا تتوقفي مبكرًا',body:'إذا بقي عامل غير أولي، نحلله مرة أخرى.',example:'6 = 2 × 3، إذن 18 = 2 × 3 × 3'},
      {title:'شجرة العوامل',body:'يمكنك استخدام شجرة العوامل حتى تصبح جميع أوراقها أعدادًا أولية.',example:'24 = 2 × 2 × 2 × 3'},
      {title:'تحققي',body:'اضربي العوامل الأولية معًا. يجب أن تحصلي على العدد الأصلي.',example:'2 × 2 × 5 = 20'},
    ],
    questions:[
      {prompt:'ما التحليل الأولي للعدد 12؟',choices:['2 × 6','3 × 4','2 × 2 × 3','1 × 12'],answer:2,explanation:'2 و2 و3 كلها أعداد أولية وحاصل ضربها 12.'},
      {prompt:'هل 18 = 2 × 9 تحليل أولي كامل؟',choices:['نعم','لا، لأن 9 غير أولي'],answer:1,explanation:'يجب متابعة تحليل 9 إلى 3 × 3.'},
      {prompt:'أي تحليل صحيح للعدد 30؟',choices:['3 × 10','2 × 3 × 5','5 × 6','1 × 30'],answer:1,explanation:'2 و3 و5 عوامل أولية وحاصل ضربها 30.'},
      {prompt:'أي عدد يمكن أن يكون عاملًا أوليًا؟',choices:['4','6','7','9'],answer:2,explanation:'7 عدد أولي.'},
      {prompt:'2 × 2 × 3 × 5 يساوي؟',choices:['30','45','60','90'],answer:2,explanation:'2 × 2 × 3 × 5 = 60.'},
    ],
  },
  {
    slug:'integers',student:'sama',subject:'الرياضيات',subjectIcon:'📐',title:'الأعداد الصحيحة',subtitle:'الموجبة والسالبة وخط الأعداد',estimatedMinutes:18,
    skills:['تمييز الموجب والسالب','التمثيل على خط الأعداد','المقارنة والترتيب','ربط العدد بسياق واقعي'],
    steps:[
      {title:'أعداد فوق الصفر وتحته',body:'نستخدم الأعداد الموجبة والسالبة لوصف مواقف مثل درجات الحرارة والارتفاعات.',example:'3°C أعلى من 0، و-2°C أقل من 0'},
      {title:'خط الأعداد',body:'كلما تحركنا يمينًا زادت قيمة العدد، وكلما تحركنا يسارًا قلت.',example:'-8 < -2 < 0 < 4'},
      {title:'قارني',body:'العدد الأقرب إلى اليمين هو الأكبر.',example:'-2 أكبر من -7'},
      {title:'تطبيق واقعي',body:'درجة حرارة -5°C أبرد من -1°C، وهذا يساعد على فهم ترتيب الأعداد السالبة.',example:'-5 < -1'},
    ],
    questions:[
      {prompt:'أي عدد أصغر؟',choices:['-2','-8'],answer:1,explanation:'-8 يقع إلى يسار -2 على خط الأعداد.'},
      {prompt:'أي ترتيب صحيح من الأصغر إلى الأكبر؟',choices:['-3، 0، 4','4، 0، -3','0، -3، 4','-3، 4، 0'],answer:0,explanation:'-3 أصغر من 0 و0 أصغر من 4.'},
      {prompt:'درجة الحرارة -6°C مقارنة بـ -2°C هي:',choices:['أعلى','أبرد','متساوية'],answer:1,explanation:'-6 أقل من -2 لذلك هي أبرد.'},
      {prompt:'أي عدد يقع يمين -1؟',choices:['-5','-3','0','-7'],answer:2,explanation:'0 يقع إلى يمين -1 وهو أكبر منه.'},
      {prompt:'أي عبارة صحيحة؟',choices:['-9 > -3','-3 > -9','-3 = -9','0 < -1'],answer:1,explanation:'-3 يقع إلى يمين -9، لذلك هو الأكبر.'},
    ],
  },
];

export function lessonsForStudent(student:StudentSlug){return lessons.filter((l)=>l.student===student);}
export function findLesson(student:StudentSlug,slug:string){return lessons.find((l)=>l.student===student&&l.slug===slug);}
