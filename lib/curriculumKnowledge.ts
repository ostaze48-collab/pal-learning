export type CurriculumSource={
  id:string;
  title:string;
  authority:'official'|'official-support'|'external';
  kind:'package'|'curriculum'|'framework'|'teacher-guide'|'worksheet'|'assessment'|'solution';
  url:string;
  grades?:number[];
  subjects?:string[];
  priority:number;
  note:string;
};

export const curriculumSources:CurriculumSource[]=[
  {id:'moe-gaza-packages',title:'الرزم التعليمية لطلبة غزة',authority:'official',kind:'package',url:'https://www.moe.edu.ps/gaza/subjects',grades:[1,2,3,4,5,6,7,8],priority:100,note:'المصدر الوزاري الأول للرزم التعليمية المستخدمة لطلبة غزة.'},
  {id:'elearn-grade5',title:'الصف الخامس الأساسي — البوابة التعليمية الفلسطينية',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c5/',grades:[5],priority:95,note:'فهرس الدروس والكتب وأوراق العمل للصف الخامس.'},
  {id:'elearn-grade7',title:'الصف السابع الأساسي — البوابة التعليمية الفلسطينية',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c7/',grades:[7],priority:95,note:'فهرس الدروس والكتب وأوراق العمل للصف السابع.'},
  {id:'elearn-grade4',title:'الصف الرابع الأساسي — البوابة التعليمية الفلسطينية',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c4/',grades:[4],priority:94,note:'مرجع مهم لتشخيص فجوات ما قبل الصف الخامس.'},
  {id:'elearn-grade6',title:'الصف السادس الأساسي — البوابة التعليمية الفلسطينية',authority:'official',kind:'curriculum',url:'https://elearn.edu.ps/c6/',grades:[6],priority:94,note:'مرجع مهم لتشخيص فجوات ما قبل الصف السابع.'},
  {id:'elearn-worksheets',title:'أوراق العمل الرسمية',authority:'official-support',kind:'worksheet',url:'https://elearn.edu.ps/worksheets/',grades:[1,2,3,4,5,6,7,8,9,10,11,12],priority:90,note:'تستخدم للتدريب والتشخيص، وقد يتوفر لبعضها نموذج إجابة منشور.'},
  {id:'elearn-framework',title:'الإطار العام للمناهج الفلسطينية',authority:'official',kind:'framework',url:'https://elearn.edu.ps/g-line/',grades:[1,2,3,4,5,6,7,8,9,10,11,12],priority:96,note:'مرجع للغايات والكفايات العامة للمباحث.'},
  {id:'elearn-curriculum-docs',title:'وثائق المناهج الفلسطينية',authority:'official',kind:'framework',url:'https://elearn.edu.ps/palcirdocs/',grades:[1,2,3,4,5,6,7,8,9,10,11,12],priority:96,note:'يشمل الوثائق الوطنية للرياضيات والعربية والإنجليزية والعلوم وغيرها.'},
  {id:'teacher-guide-5',title:'أدلة المعلم للصف الخامس',authority:'official-support',kind:'teacher-guide',url:'https://elearn.edu.ps/c5_guides/',grades:[5],priority:92,note:'مفيد في طرق الشرح والأهداف والتقويم للصف الخامس.'},
  {id:'teacher-guide-6',title:'أدلة المعلم للصف السادس',authority:'official-support',kind:'teacher-guide',url:'https://elearn.edu.ps/c6_guides/',grades:[6],priority:92,note:'مفيد لتحديد المهارات التي يجب أن يمتلكها طالب السابع.'},
  {id:'teacher-guide-7',title:'أدلة المعلم للصف السابع',authority:'official-support',kind:'teacher-guide',url:'https://elearn.edu.ps/c7_guides/',grades:[7],priority:92,note:'مفيد في طرق الشرح والتقويم للصف السابع.'}
];

export const sourceTrustOrder=['package','curriculum','teacher-guide','framework','worksheet','assessment','solution'] as const;

export function getCurriculumSources(grade:number,subject?:string){
  return curriculumSources
    .filter(s=>(!s.grades||s.grades.includes(grade))&&(!subject||!s.subjects||s.subjects.includes(subject)))
    .sort((a,b)=>b.priority-a.priority);
}

export function getRecoveryGradeBand(currentGrade:number){
  return Array.from({length:3},(_,i)=>currentGrade-3+i).filter(g=>g>=1&&g<currentGrade);
}

export const curriculumGroundingPolicy={
  currentGradeShare:0.75,
  recoveryShare:0.25,
  urgentBlockerMaxMinutes:12,
  rules:[
    'لا نعيد صفوفًا سابقة كاملة؛ نستخرج المهارات التي تمنع التقدم الحالي فقط.',
    'المحتوى الحالي للصف المسجل يبقى المسار الرئيس يوميًا.',
    'عند وجود فجوة مانعة للفهم نعالجها بجلسة قصيرة ثم نعود للدرس الحالي.',
    'المرجع الرسمي مقدم على أي محتوى مولد أو مصدر غير رسمي.',
    'الاختبارات وأوراق العمل تستخدم كأدلة تشخيصية ولا تعامل وحدها كتعريف للمنهاج.'
  ]
};
