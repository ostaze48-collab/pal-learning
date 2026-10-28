export type Student={slug:string;name:string;grade:number;semester:number;emoji:string};
export type Question={id:string;text:string;options:string[];correct:number;explanation:string};
export type Lesson={id:string;student:string;subject:string;title:string;minutes:number;summary:string;questions:Question[]};

export const students:Student[]=[
  {slug:'salma',name:'سلمى',grade:5,semester:1,emoji:'👧'},
  {slug:'sama',name:'سما',grade:7,semester:1,emoji:'👩‍🎓'}
];

export const lessons:Lesson[]=[
  {id:'g5-math-prime-numbers',student:'salma',subject:'الرياضيات',title:'العدد الأولي',minutes:18,summary:'اكتشاف العوامل والتمييز بين العدد الأولي وغير الأولي.',questions:[
    {id:'q1',text:'أي عدد من الآتي عدد أولي؟',options:['4','5','9','15'],correct:1,explanation:'5 له عاملان فقط: 1 و5.'},
    {id:'q2',text:'لماذا العدد 9 ليس أوليًا؟',options:['لأنه فردي','لأن عوامله 1 و3 و9','لأنه أصغر من 10','لأنه لا يقبل القسمة'],correct:1,explanation:'للعدد 9 ثلاثة عوامل: 1 و3 و9.'},
    {id:'q3',text:'هل العدد 1 عدد أولي؟',options:['نعم','لا'],correct:1,explanation:'العدد الأولي يحتاج عاملين مختلفين، بينما 1 له عامل واحد فقط.'}
  ]},
  {id:'g5-math-prime-factorization',student:'salma',subject:'الرياضيات',title:'التحليل إلى العوامل الأولية',minutes:20,summary:'تفكيك العدد إلى حاصل ضرب عوامل أولية.',questions:[
    {id:'q1',text:'أي تحليل صحيح للعدد 18؟',options:['2 × 9','2 × 3 × 3','3 × 6','1 × 18'],correct:1,explanation:'جميع العوامل في 2 × 3 × 3 أعداد أولية.'},
    {id:'q2',text:'متى نتوقف عن التحليل؟',options:['بعد أول خطوة','عندما تصبح كل العوامل أولية','عندما يظهر عدد زوجي','عند الوصول إلى 10'],correct:1,explanation:'نستمر حتى تكون جميع العوامل أولية.'}
  ]},
  {id:'g7-math-integers',student:'sama',subject:'الرياضيات',title:'الأعداد الصحيحة',minutes:18,summary:'فهم الأعداد الموجبة والسالبة وترتيبها على خط الأعداد.',questions:[
    {id:'q1',text:'أي عدد أصغر؟',options:['-2','-8'],correct:1,explanation:'-8 يقع إلى يسار -2 على خط الأعداد، لذلك هو الأصغر.'},
    {id:'q2',text:'أي عدد أكبر من الصفر؟',options:['-4','0','3'],correct:2,explanation:'3 عدد موجب وأكبر من الصفر.'}
  ]}
];

export function getStudent(slug:string){return students.find(s=>s.slug===slug)}
export function getLesson(id:string){return lessons.find(l=>l.id===id)}
export function getStudentLessons(slug:string){return lessons.filter(l=>l.student===slug)}
