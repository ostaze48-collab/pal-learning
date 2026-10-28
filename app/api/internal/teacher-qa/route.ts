import {NextResponse} from 'next/server';

const QA_KEY='ai-teacher-qa-oct2026';

type Case={name:string;payload:Record<string,unknown>};

export async function GET(request:Request){
  const url=new URL(request.url);
  if(url.searchParams.get('k')!==QA_KEY)return NextResponse.json({error:'not_found'},{status:404});
  const port=process.env.PORT||'10000';
  const endpoint=`http://127.0.0.1:${port}/api/ai-teacher/lesson`;
  const cases:Case[]=[
    {name:'prime',payload:{lessonId:'g5-math-prime-numbers',mode:'overview',weaknesses:[],learnerModel:{subjectMastery:75,gaps:[],misconceptions:[],recentLessons:[]}}},
    {name:'integers-gap',payload:{lessonId:'g7-math-integers',mode:'step_by_step',weaknesses:[{title:'خط الأعداد والأعداد السالبة',score:45,gradeAnchor:'الصف السادس',cause:'تخلط بين اتجاه اليمين واليسار على خط الأعداد'}],learnerModel:{subjectMastery:58,gaps:[{skillId:'math-number-sense',title:'خط الأعداد والأعداد السالبة',score:45,gradeAnchor:'الصف السادس',cause:'تخلط بين اتجاه اليمين واليسار'}],misconceptions:[],recentLessons:[]}}},
    {name:'motion-deep',payload:{lessonId:'g7-science-translational-motion',mode:'deep',weaknesses:[{title:'القياس وقراءة البيانات',score:65,gradeAnchor:'الصف السادس',cause:'تحتاج تثبيت مفهوم المرجع والقياس'}],learnerModel:{subjectMastery:62,gaps:[{skillId:'science-measurement',title:'القياس وقراءة البيانات',score:65,gradeAnchor:'الصف السادس',cause:'تحتاج تثبيت مفهوم المرجع والقياس'}],misconceptions:[],recentLessons:[]}}}
  ];
  const results=[] as any[];
  for(const c of cases){
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c.payload),cache:'no-store'});
      const data=await response.json();
      results.push({name:c.name,status:response.status,mode:data.mode,grounded:data.grounded,webUsed:data.webUsed,groundingQuality:data.groundingQuality,qualityScore:data.qualityScore,qualityIssues:data.qualityIssues,retried:data.retried,pedagogyLevel:data.pedagogyLevel,bridges:data.bridges,content:data.content});
    }catch(error){results.push({name:c.name,error:String(error)})}
  }
  return NextResponse.json({at:new Date().toISOString(),results});
}
