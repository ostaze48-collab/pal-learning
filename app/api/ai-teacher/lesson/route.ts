import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent,getLessonSourceLabel} from '../../../../lib/data';
import {getCurriculumSources,getRecoveryGradeBand} from '../../../../lib/curriculumKnowledge';

type Mode='overview'|'simplify'|'step_by_step'|'analogy'|'real_world'|'deep'|'check';
type Weakness={title:string;score:number;gradeAnchor?:string;cause?:string;missedFacts?:Array<{text:string;selected:string;correct:string}>};
type LastCheck={answer?:string;outcome?:'understood'|'partial'|'misconception';feedback?:string};
type Body={lessonId?:string;mode?:Mode;weaknesses?:Weakness[];previousExplanation?:string;lastCheck?:LastCheck};
type TeacherCard={title:string;body:string;kind:'explain'|'example'|'tip'|'check'};
type Payload={title:string;intro:string;cards:TeacherCard[];checkQuestion?:{text:string;hint:string};teacherNote?:string};

function fallback(lessonId:string,mode:Mode):Payload|null{
  const lesson=getLesson(lessonId);if(!lesson)return null;
  const prefix=mode==='simplify'?'نبسّط الفكرة جدًا: ':mode==='step_by_step'?'نمشي خطوة خطوة: ':mode==='analogy'?'تخيلي الفكرة بهذه الصورة: ':mode==='deep'?'لنوسّع الفكرة: ':'';
  return {title:lesson.title,intro:`${prefix}${lesson.summary}`,cards:[...lesson.learningPoints.map((x,i)=>({title:`الفكرة ${i+1}`,body:x,kind:'explain' as const})),{title:'مثال',body:lesson.example,kind:'example'}],checkQuestion:{text:lesson.questions[0]?.text||'اشرحي الفكرة بكلماتك.',hint:'استخدمي الفكرة الأساسية في الدرس.'},teacherNote:'شرح احتياطي من محتوى المنصة.'};
}
function cleanJson(text:string){return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}
function validate(value:any):Payload|null{
  if(!value||typeof value.title!=='string'||typeof value.intro!=='string'||!Array.isArray(value.cards))return null;
  const cards:TeacherCard[]=value.cards.slice(0,7).filter((x:any)=>x&&typeof x.title==='string'&&typeof x.body==='string').map((x:any)=>({title:x.title.slice(0,100),body:x.body.slice(0,1400),kind:['explain','example','tip','check'].includes(x.kind)?x.kind:'explain'}));
  if(!cards.length)return null;const out:Payload={title:value.title.slice(0,140),intro:value.intro.slice(0,1600),cards};
  if(value.checkQuestion&&typeof value.checkQuestion.text==='string')out.checkQuestion={text:value.checkQuestion.text.slice(0,500),hint:String(value.checkQuestion.hint||'').slice(0,500)};
  if(typeof value.teacherNote==='string')out.teacherNote=value.teacherNote.slice(0,400);return out;
}

export async function POST(request:Request){
  let body:Body;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const lessonId=typeof body.lessonId==='string'?body.lessonId:'';const mode:Mode=body.mode||'overview';
  const lesson=getLesson(lessonId);if(!lesson)return NextResponse.json({error:'lesson_not_found'},{status:404});
  const student=getStudent(lesson.student);if(!student)return NextResponse.json({error:'student_not_found'},{status:404});
  const backup=fallback(lesson.id,mode);if(!process.env.OPENAI_API_KEY)return NextResponse.json({content:backup,mode:'local',grounded:false,webUsed:false});

  const weaknesses=(body.weaknesses||[]).slice(0,8);const priorGrades=getRecoveryGradeBand(student.grade);
  const officialSources=[...priorGrades,student.grade].flatMap(g=>getCurriculumSources(g,lesson.subject));
  const sourceList=[...new Map(officialSources.map(x=>[x.id,x])).values()].slice(0,12).map(x=>`- ${x.title} | ${x.kind} | ثقة ${x.priority}/100 | ${x.url}`).join('\n');
  const weaknessText=weaknesses.length?weaknesses.map(w=>`- ${w.title}: ${w.score}%${w.gradeAnchor?` (${w.gradeAnchor})`:''}${w.cause?` — ${w.cause}`:''}${w.missedFacts?.length?` — أخطاء: ${w.missedFacts.map(m=>`${m.text} [اختارت ${m.selected}، الصحيح ${m.correct}]`).join('؛ ')}`:''}`).join('\n'):'- لا توجد فجوات دقيقة محفوظة لهذه المادة.';
  const lastCheckText=body.lastCheck?.answer?`\nمحاولة الفهم الأخيرة للطالبة:\n- إجابة الطالبة: ${String(body.lastCheck.answer).slice(0,700)}\n- التقييم: ${body.lastCheck.outcome||'غير محدد'}\n- ملاحظة المعلم: ${String(body.lastCheck.feedback||'').slice(0,800)}\nتعليمات إعادة التدريس: لا تكرر الشرح السابق. حدد الفكرة التي سببت الخلط من هذه الإجابة، ثم أعد بناء الشرح حولها بمثال جديد أصغر وأسهل، وبعده سؤال تحقق جديد مختلف.`:'';
  const styleMap:Record<Mode,string>={overview:'اشرح الدرس شرحًا متدرجًا واضحًا من الفكرة إلى المثال ثم تحقق قصير.',simplify:'أعد الشرح بأبسط لغة ممكنة، جمل قصيرة، وفكرة واحدة في كل خطوة. لا تفترض فهم المصطلحات.',step_by_step:'حوّل الفكرة إلى خطوات مرقمة صغيرة جدًا مع مثال محلول خطوة بخطوة.',analogy:'استخدم تشبيهًا أو قصة أو تصورًا بصريًا مناسبًا لعمر الطالبة، ثم اربطه بالمفهوم الحقيقي حتى لا يبقى التشبيه مضللًا.',real_world:'اربط المفهوم بموقف من الحياة اليومية أو البيئة المحيطة ثم أعد ربطه مباشرة بهدف المنهاج.',deep:'وسّع الشرح بمعلومات إضافية صحيحة ومناسبة للعمر، مع الحفاظ على هدف الدرس الحالي وعدم إغراق الطالبة.',check:'ركز على سؤال أو سؤالين يكشفان هل فهمت الطالبة الفكرة فعلًا، مع تلميح بدل الحل المباشر.'};
  const hasCurriculumStore=Boolean(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID);
  const instructions=`أنت المعلم الأساسي في منصة تعليم منزلية فلسطينية لطفلتين. مهمتك ليست الدردشة العامة؛ أنت معلم شخصي تكيفي.
1) المرجع الأول هو المنهاج الفلسطيني. إذا كانت file_search متاحة فاستخدمها أولًا. وإذا لم تكن متاحة فاستعمل web_search للتحقق من المصادر الفلسطينية الرسمية، مع أولوية elearn.edu.ps وmoe.edu.ps وأي نطاق رسمي تابع لوزارة التربية والتعليم الفلسطينية.
2) لا تستبدل هدف الدرس الحالي بمعلومة خارجية. استخدم الويب للتحقق والتوسيع فقط.
3) استخدم نتائج الفجوات السابقة لتحديد نقطة البداية. إذا كانت فجوة سابقة تمنع الفهم، اشرحها باختصار ثم عد للدرس الحالي.
4) استخدم التدرج من المعلوم للمجهول، أمثلة محلولة، تمثيلًا بصريًا/لفظيًا، استرجاعًا نشطًا، وسؤال تحقق.
5) لا تكتفِ بالتعريف: فسّر لماذا وكيف، ثم مثالًا، ومثالًا مضادًا عند فائدته.
6) إذا وصلت لك محاولة فهم سابقة خاطئة أو جزئية، اعتبرها أهم إشارة تربوية: شخص سبب الخلط، غيّر التمثيل أو المثال أو مستوى الخطوات، ولا تكرر نفس الجمل بصياغة مختلفة فقط.
7) في الرياضيات لا تقفز خطوات؛ في العلوم استخدم السبب والنتيجة؛ في العربية السياق ثم القاعدة؛ في English استخدم الإنجليزية البسيطة مع توضيح عربي عند الحاجة.
8) إذا بحثت على الويب ووجدت مصدرًا غير رسمي، لا تعامله كمرجع منهجي أساسي. استخدمه فقط كمصدر مساعد عند الحاجة.
9) لا تعرض للطالبة تفاصيل تقنية عن المصدر أو الثقة.
10) لا تنسب معلومة للوزارة إن لم تجدها في مصدر رسمي.
11) ${styleMap[mode]}
12) أعد JSON فقط: {"title":"...","intro":"...","cards":[{"title":"...","body":"...","kind":"explain|example|tip|check"}],"checkQuestion":{"text":"...","hint":"..."},"teacherNote":"..."}.`;
  const prompt=`الطالبة: ${student.name}\nالصف: ${student.grade}\nالفصل: الأول\nالمادة: ${lesson.subject}\nالدرس: ${lesson.title}\nملخص المنصة: ${lesson.summary}\nأهداف التعلم:\n${lesson.learningPoints.map((x,i)=>`${i+1}. ${x}`).join('\n')}\nمثال موجود: ${lesson.example}\nمرجع الدرس: ${getLessonSourceLabel(lesson)}\n\nفجوات مرتبطة محفوظة:\n${weaknessText}\n\nمصادر منهجية مسجلة:\n${sourceList}\n${body.previousExplanation?`\nشرح سابق لم ينجح بما يكفي:\n${body.previousExplanation.slice(0,1800)}`:''}${lastCheckText}`;

  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});const tools:any[]=[];
    if(hasCurriculumStore)tools.push({type:'file_search',vector_store_ids:[process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID],max_num_results:7});
    if(!hasCurriculumStore||mode==='deep'||mode==='real_world')tools.push({type:'web_search'});
    const response=await client.responses.create({model:process.env.OPENAI_TUTOR_MODEL||'gpt-5',instructions,input:prompt,...(tools.length?{tools}:{}),max_output_tokens:1700});
    const content=validate(cleanJson(response.output_text||''));if(!content)throw new Error('invalid_teacher_payload');
    const output:any[]=Array.isArray((response as any).output)?(response as any).output:[];
    const grounded=output.some(x=>x?.type==='file_search_call');
    const webUsed=output.some(x=>x?.type==='web_search_call'||x?.type==='web_search_preview_call');
    return NextResponse.json({content,mode:'ai',grounded,webUsed});
  }catch(error){console.error('AI lesson teacher failed',error);return NextResponse.json({content:backup,mode:'local_fallback',grounded:false,webUsed:false});}
}
