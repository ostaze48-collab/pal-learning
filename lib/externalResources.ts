export type ExternalLearningResource={
  id:string;
  grade:number;
  subject:'الرياضيات'|'اللغة العربية'|'English'|'العلوم والحياة';
  title:string;
  url:string;
  type:'resources'|'assessment-bank'|'tests-solutions';
  trust:number;
  note:string;
};

export const externalLearningResources:ExternalLearningResource[]=[
  {id:'wepal-g5-math',grade:5,subject:'الرياضيات',title:'Wepal — موارد رياضيات خامس / الفصل الأول',url:'https://www.wepal.net/lms.subjectContext?level_id=5&semester_id=1&subject_id=1&tab=resources',type:'tests-solutions',trust:55,note:'مصدر خارجي يجمع اختبارات وتقويمًا وشروحًا وحلولًا وإثراء ومراجعة. يستخدم كمساند فقط.'},
  {id:'wepal-g7-math',grade:7,subject:'الرياضيات',title:'Wepal — موارد رياضيات سابع / الفصل الأول',url:'https://www.wepal.net/lms.subjectContext?level_id=7&semester_id=1&subject_id=1',type:'tests-solutions',trust:55,note:'مصدر خارجي مساند للاختبارات والشروح والحلول، ولا يساوي المصدر الوزاري.'},
  {id:'wepal-g5-en',grade:5,subject:'English',title:'Wepal — English Grade 5 / Semester 1',url:'https://www.wepal.net/lms.subjectContext?level_id=5&semester_id=1&subject_id=3',type:'assessment-bank',trust:55,note:'يتضمن موارد وبنك أسئلة للتدريب الذاتي؛ يستخدم للتحقق والتدريب المساند.'},
  {id:'wepal-g7-en',grade:7,subject:'English',title:'Wepal — English Grade 7 / Semester 1',url:'https://www.wepal.net/lms.subjectContext?level_id=7&semester_id=1&subject_id=3',type:'assessment-bank',trust:55,note:'يتضمن موارد وبنك أسئلة وتدريبًا ذاتيًا؛ مصدر خارجي مساند.'},
  {id:'wepal-exams',grade:5,subject:'الرياضيات',title:'Wepal — بنك الاختبارات العام',url:'https://www.wepal.net/lms.examList',type:'assessment-bank',trust:50,note:'بنك اختبارات خارجي. نستخدمه كمصدر إضافي ولا ننسب محتواه للوزارة.'},
  {id:'wepal-exams-g7',grade:7,subject:'الرياضيات',title:'Wepal — بنك الاختبارات العام',url:'https://www.wepal.net/lms.examList',type:'assessment-bank',trust:50,note:'بنك اختبارات خارجي. نستخدمه كمصدر إضافي ولا ننسب محتواه للوزارة.'}
];

export function getExternalResources(grade:number){return externalLearningResources.filter(r=>r.grade===grade)}
