export type Student={slug:string;name:string;grade:number;semester:number;emoji:string};
export type Question={id:string;text:string;options:string[];correct:number;explanation:string};
export type Lesson={id:string;student:string;subject:string;title:string;minutes:number;summary:string;learningPoints:string[];example:string;questions:Question[]};

export const students:Student[]=[
  {slug:'salma',name:'سلمى',grade:5,semester:1,emoji:'👧'},
  {slug:'sama',name:'سما',grade:7,semester:1,emoji:'👩‍🎓'}
];

export const lessons:Lesson[]=[
  {id:'g5-math-prime-numbers',student:'salma',subject:'الرياضيات',title:'العدد الأولي',minutes:18,summary:'اكتشاف العوامل والتمييز بين العدد الأولي وغير الأولي.',learningPoints:['العامل يقسم العدد دون باقٍ.','العدد الأولي أكبر من 1 وله عاملان مختلفان فقط: 1 والعدد نفسه.','ليس كل عدد فردي أوليًا، والعدد 2 هو العدد الزوجي الأولي الوحيد.'],example:'عوامل 7 هي 1 و7 فقط، لذلك 7 عدد أولي. أما عوامل 9 فهي 1 و3 و9، لذلك 9 ليس أوليًا.',questions:[
    {id:'q1',text:'أي عدد من الآتي عدد أولي؟',options:['4','5','9','15'],correct:1,explanation:'5 له عاملان فقط: 1 و5.'},
    {id:'q2',text:'لماذا العدد 9 ليس أوليًا؟',options:['لأنه فردي','لأن عوامله 1 و3 و9','لأنه أصغر من 10','لأنه لا يقبل القسمة'],correct:1,explanation:'للعدد 9 ثلاثة عوامل: 1 و3 و9.'},
    {id:'q3',text:'هل العدد 1 عدد أولي؟',options:['نعم','لا'],correct:1,explanation:'العدد الأولي يحتاج عاملين مختلفين، بينما 1 له عامل واحد فقط.'}
  ]},
  {id:'g5-math-prime-factorization',student:'salma',subject:'الرياضيات',title:'التحليل إلى العوامل الأولية',minutes:20,summary:'تفكيك العدد إلى حاصل ضرب عوامل أولية.',learningPoints:['نبدأ بكتابة العدد كحاصل ضرب عاملين.','إذا كان أحد العوامل غير أولي نحلله مرة أخرى.','نتوقف فقط عندما تصبح جميع العوامل أعدادًا أولية.'],example:'18 = 6 × 3، ثم 6 = 2 × 3، إذن 18 = 2 × 3 × 3.',questions:[
    {id:'q1',text:'أي تحليل صحيح للعدد 18 إلى عوامل أولية؟',options:['2 × 9','2 × 3 × 3','3 × 6','1 × 18'],correct:1,explanation:'جميع العوامل في 2 × 3 × 3 أعداد أولية.'},
    {id:'q2',text:'متى نتوقف عن التحليل؟',options:['بعد أول خطوة','عندما تصبح كل العوامل أولية','عندما يظهر عدد زوجي','عند الوصول إلى 10'],correct:1,explanation:'نستمر حتى تكون جميع العوامل أولية.'}
  ]},
  {id:'g5-math-gcf',student:'salma',subject:'الرياضيات',title:'العامل المشترك الأكبر',minutes:20,summary:'إيجاد أكبر عامل مشترك بين عددين أو أكثر.',learningPoints:['نكتب عوامل كل عدد.','نحدد العوامل الموجودة في القائمتين معًا.','نختار أكبر عامل مشترك، ويسمى العامل المشترك الأكبر.','يمكن استخدام التحليل إلى العوامل الأولية للوصول إلى النتيجة أيضًا.'],example:'عوامل 12: 1، 2، 3، 4، 6، 12. عوامل 18: 1، 2، 3، 6، 9، 18. العوامل المشتركة: 1، 2، 3، 6. إذن العامل المشترك الأكبر = 6.',questions:[
    {id:'q1',text:'ما العامل المشترك الأكبر للعددين 8 و12؟',options:['2','4','6','8'],correct:1,explanation:'عوامل 8 هي 1،2،4،8 وعوامل 12 هي 1،2،3،4،6،12؛ وأكبر عامل مشترك هو 4.'},
    {id:'q2',text:'أي مجموعة تمثل العوامل المشتركة للعددين 12 و18؟',options:['1،2،3،6','2،4،6','1،3،9','6،12،18'],correct:0,explanation:'العوامل المشتركة بين 12 و18 هي 1،2،3،6.'},
    {id:'q3',text:'إذا كان ع.م.أ للعددين 15 و25، فما قيمته؟',options:['3','5','10','15'],correct:1,explanation:'عوامل 15: 1،3،5،15 وعوامل 25: 1،5،25؛ أكبر عامل مشترك هو 5.'},
    {id:'q4',text:'ما الخطوة الصحيحة أولًا عند استخدام طريقة العوامل؟',options:['نجمع العددين','نكتب عوامل كل عدد','نضرب العددين','نختار أكبر عدد مباشرة'],correct:1,explanation:'نبدأ بكتابة عوامل كل عدد ثم نبحث عن العوامل المشتركة.'}
  ]},
  {id:'g5-math-lcm',student:'salma',subject:'الرياضيات',title:'المضاعف المشترك الأصغر',minutes:20,summary:'إيجاد أصغر مضاعف موجب مشترك بين عددين أو أكثر.',learningPoints:['نكتب مضاعفات كل عدد بالترتيب.','نبحث عن المضاعفات التي تظهر في القائمتين معًا.','نختار أصغر مضاعف موجب مشترك.','يمكن استخدام التحليل إلى العوامل الأولية عند الحاجة.'],example:'مضاعفات 4: 4، 8، 12، 16، 20، 24... ومضاعفات 6: 6، 12، 18، 24... أول مضاعف مشترك هو 12، إذن م.م.أ = 12.',questions:[
    {id:'q1',text:'ما المضاعف المشترك الأصغر للعددين 4 و6؟',options:['6','8','12','24'],correct:2,explanation:'12 هو أصغر عدد يظهر ضمن مضاعفات 4 ومضاعفات 6.'},
    {id:'q2',text:'أي عدد هو مضاعف مشترك للعددين 3 و5؟',options:['8','10','15','20'],correct:2,explanation:'15 يقبل القسمة على 3 وعلى 5، وهو مضاعف لهما.'},
    {id:'q3',text:'ما م.م.أ للعددين 5 و10؟',options:['5','10','15','20'],correct:1,explanation:'10 هو أول مضاعف مشترك للعددين 5 و10.'},
    {id:'q4',text:'عند استخدام طريقة القوائم، ماذا نفعل بعد كتابة المضاعفات؟',options:['نختار أكبر عدد','نبحث عن المشترك ثم نختار الأصغر','نجمع المضاعفات','نحذف كل الأعداد الزوجية'],correct:1,explanation:'نحدد المضاعفات المشتركة ثم نختار أصغر مضاعف موجب مشترك.'}
  ]},
  {id:'g7-math-integers',student:'sama',subject:'الرياضيات',title:'الأعداد الصحيحة',minutes:18,summary:'فهم الأعداد الموجبة والسالبة وترتيبها على خط الأعداد.',learningPoints:['الأعداد الصحيحة تشمل السالبة والصفر والموجبة.','على خط الأعداد تزداد القيمة كلما اتجهنا يمينًا.','العدد السالب الأبعد يسارًا يكون أصغر.'],example:'-8 أصغر من -2 لأن -8 يقع إلى يسار -2 على خط الأعداد.',questions:[
    {id:'q1',text:'أي عدد أصغر؟',options:['-2','-8'],correct:1,explanation:'-8 يقع إلى يسار -2 على خط الأعداد، لذلك هو الأصغر.'},
    {id:'q2',text:'أي عدد أكبر من الصفر؟',options:['-4','0','3'],correct:2,explanation:'3 عدد موجب وأكبر من الصفر.'}
  ]}
];

export function getStudent(slug:string){return students.find(s=>s.slug===slug)}
export function getLesson(id:string){return lessons.find(l=>l.id===id)}
export function getStudentLessons(slug:string){return lessons.filter(l=>l.student===slug)}
