import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent,getLessonSourceLabel} from '../../../../lib/data';
import {getCurriculumSources,getRecoveryGradeBand} from '../../../../lib/curriculumKnowledge';
import {recoverySkills} from '../../../../lib/recoverySkills';

type Mode='overview'|'simplify'|'step_by_step'|'analogy'|'real_world'|'deep'|'check';
type Weakness={title:string;score:number;gradeAnchor?:string;cause?:string;missedFacts?:Array<{text:string;selected:string;correct:string}>};
type Body={lessonId?:string;mode?:Mode;weaknesses?:Weakness[];previousExplanation?:string};
type TeacherCard={title:string;body:string;kind:'explain'|'example'|'tip'|'check'};
type Payload={title:string;intro:string;cards:TeacherCard[];checkQuestion?:{text:string;hint:string};teacherNote?:string};

function fallback(lessonId:string,mode:Mode):Payload|null{
  const lesson=getLesson(lessonId);if(!lesson)return null;
  const prefix=mode==='simplify'?'نبسّط الفكرة جدًا: ':mode==='step_by_step'?'نمشي خطوة خطوة: ':mode==='analogy'?'تخيلي الفكرة بهذه الصورة: ':mode==='deep'?'لنوسّع الفكرة: ':'';
  return {title:lesson.title,intro:`${prefix}${lesson.summary}`,cards:[
    ...lesson.learningPoints.map((x,i)=>({title:`الفكرة ${i+1}`,body:x,kind:'explain' as const})),
    {title:'مثال',body:lesson.example,kind:'example'}
  ],checkQuestion:{text:lesson.questions[0]?.text||'اشرحي الفكرة بكلماتك.',hint:'استخدمي الفكرة الأساسية في الدرس.'},teacherNote:'شرح احتياطي من محتوى المنصة.'};
}

function cleanJson(text:string){return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}
function validate(value:any):Payload|null{
  if(!value||typeof value.title!=='string'||typeof value.intro!=='string'||!Array.isArray(value.cards))return null;
  const cards:TeacherCard[]=value.cards.slice(0,7).filter((x:any)=>x&&typeof x.title==='string'&&typeof x.body==='string').map((x:any)=>({title:x.title.slice(0,100),body:x.body.slice(0,1400),kind:['explain','example','tip','check'].includes(x.kind)?x.kind:'explain'}));
  if(!cards.length)return null;
  const out:Payload={title:value.title.slice(0,140),intro:value.intro.slice(0,1600),cards};
  if(value.checkQuestion&&typeof value.checkQuestion.text==='string')out.checkQuestion={text:value.checkQuestion.text.slice(0,500),hint:String(value.checkQuestion.hint||'').slice(0,500)};
  if(typeof value.teacherNote==='string')out.teacherNote=value.teacherNote.slice(0,400);
  return out;
}

export async function POST(request:Request){
  let body:Body;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const lessonId=typeof body.lessonId==='string'?body.lessonId:'';const mode:Mode=body.mode||'overview';
  const lesson=getLesson(lessonId);if(!lesson)return NextResponse.json({error:'lesson_not_found'},{status:404});
  const student=getStudent(lesson.student);if(!student)return NextResponse.json({error:'student_not_found'},{status:404});
  const backup=fallback(lesson.id,mode);
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({content:backup,mode:'local',grounded:false,webUsed:false});

  const weaknesses=(body.weaknesses||[]).slice(0,8);
  const priorGrades=getRecoveryGradeBand(student.grade);
  const officialSources=[...priorGrades,student.grade].flatMap(g=>getCurriculumSources(g,lesson.subject));
  const sourceList=[...new Map(officialSources.map(x=>[x.id,x])).values()].slice(0,12).map(x=>`- ${x.title} | ${x.kind} | ثقة ${x.priority}/100`).join('\n');
  const weaknessText=weaknesses.length?weaknesses.map(w=>`- ${w.title}: ${w.score}%${w.gradeAnchor?` (${w.gradeAnchor})`:''}${w.cause?` — ${w.cause}`:''}${w.missedFacts?.length?` — أخطاء: ${w.missedFacts.map(m=>`${m.text} [اختارت ${m.selected}، الصحيح ${m.correct}]`).join('؛ ')}`:''}`).join('\n'):'- لا توجد فجوات دقيقة محفوظة لهذه المادة.';

  const styleMap:Record<Mode,string>={
    overview:'اشرح الدرس شرحًا متدرجًا واضحًا من الفكرة إلى المثال ثم تحقق قصير.',
    simplify:'أعد الشرح بأبسط لغة ممكنة، جمل قصيرة، وفكرة واحدة في كل خطوة. لا تفترض فهم المصطلحات.',
    step_by_step:'حوّل الفكرة إلى خطوات مرقمة صغيرة جدًا مع مثال محلول خطوة بخطوة.',
    analogy:'استخدم تشبيهًا أو قصة أو تصورًا بصريًا مناسبًا لعمر الطالبة، ثم اربطه بالمفهوم الحقيقي حتى لا يبقى التشبيه مضللًا.',
    real_world:'اربط المفهوم بموقف من الحياة اليومية أو البيئة المحيطة ثم أعد ربطه مباشرة بهدف المنهاج.',
    deep:'وسّع الشرح بمعلومات إضافية صحيحة ومناسبة للعمر، مع الحفاظ على هدف الدرس الحالي وعدم إغراق الطالبة.',
    check:'ركز على سؤال أو سؤالين يكشفان هل فهمت الطالبة الفكرة فعلًا، مع تلميح بدل الحل المباشر.'
  };
  const instructions=`أنت المعلم الأساسي في منصة تعليم منزلية فلسطينية لطفلتين. مهمتك ليست الدردشة العامة؛ أنت معلم شخصي تكيفي.
قواعدك:
1) المرجع الأول هو المنهاج الفلسطيني والملفات الرسمية المتاحة عبر file_search. لا تغيّر هدف الدرس الحالي بمعلومة خارجية.
2) استخدم نتائج الفجوات السابقة لتحديد نقطة البداية. إذا كانت فجوة سابقة تمنع الفهم، اشرحها في 2-4 دقائق ذهنيًا ثم عد للدرس الحالي.
3) طبّق مبادئ تعليم فعالة: التدرج من المعلوم للمجهول، worked examples، التمثيل البصري/اللفظي، الاسترجاع النشط، سؤال تحقق، وتصحيح سوء الفهم دون توبيخ.
4) لا تكتفِ بالتعريف. فسّر لماذا وكيف، ثم مثال، ثم مثال مضاد عند فائدته، ثم تحقق.
5) في الرياضيات: لا تقفز خطوات. في العلوم: فرّق بين الملاحظة والتفسير واستخدم سبب/نتيجة. في العربية: ركز على الفهم والسياق ثم القاعدة. في English: الإنجليزية البسيطة أولًا مع توضيح عربي عند الحاجة.
6) البحث الخارجي مسموح فقط لتوسيع مثال واقعي أو حقيقة عامة حديثة/علمية مناسبة، ولا تستخدمه لاستبدال المنهاج أو لجلب محتوى غير مناسب للطفل.
7) لا تعرض للطالبة تفاصيل تقنية عن المصدر أو الثقة؛ هذه تحفظ للنظام/الأب.
8) لا تختلق أن معلومة وردت في الوزارة. إذا لم تجدها في ملفات المنهاج فاعتبرها شرحًا مساعدًا.
9) ${styleMap[mode]}
10) أعد JSON فقط بالشكل: {"title":"...","intro":"...","cards":[{"title":"...","body":"...","kind":"explain|example|tip|check"}],"checkQuestion":{"text":"...","hint":"..."},"teacherNote":"..."}.`;

  const prompt=`الطالبة: ${student.name}\nالصف: ${student.grade}\nالفصل: الأول\nالمادة: ${lesson.subject}\nالدرس: ${lesson.title}\nملخص المنصة: ${lesson.summary}\nأهداف التعلم:\n${lesson.learningPoints.map((x,i)=>`${i+1}. ${x}`).join('\n')}\nمثال موجود: ${lesson.example}\nمرجع الدرس: ${getLessonSourceLabel(lesson)}\n\nفجوات مرتبطة محفوظة:\n${weaknessText}\n\nمصادر منهجية مسجلة:\n${sourceList}\n${body.previousExplanation?`\nشرح سابق لم ينجح بما يكفي:\n${body.previousExplanation.slice(0,1800)}`:''}`;

  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const tools:any[]=[];
    if(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID)tools.push({type:'file_search',vector_store_ids:[process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID],max_num_results:7});
    const useWeb=mode==='deep'||mode==='real_world';
    if(useWeb)tools.push({type:'web_search'});
    const response=await client.responses.create({model:process.env.OPENAI_TUTOR_MODEL||'gpt-5',instructions,input:prompt,...(tools.length?{tools}:{}),max_output_tokens:1700});
    const content=validate(cleanJson(response.output_text||''));if(!content)throw new Error('invalid_teacher_payload');
    return NextResponse.json({content,mode:'ai',grounded:Boolean(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID),webUsed:useWeb});
  }catch(error){console.error('AI lesson teacher failed',error);return NextResponse.json({content:backup,mode:'local_fallback',grounded:false,webUsed:false});}
}
