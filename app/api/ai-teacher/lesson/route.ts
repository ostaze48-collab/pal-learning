import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent,getLessonSourceLabel} from '../../../../lib/data';
import {getCurriculumSources,getRecoveryGradeBand} from '../../../../lib/curriculumKnowledge';
import {buildPedagogyPlan} from '../../../../lib/pedagogyEngine';
import {getLessonBridges} from '../../../../lib/curriculumBridges';
import {evaluateTeacherQuality} from '../../../../lib/teacherQuality';

type Mode='overview'|'simplify'|'step_by_step'|'analogy'|'real_world'|'deep'|'check';
type Weakness={title:string;score:number;gradeAnchor?:string;cause?:string;missedFacts?:Array<{text:string;selected:string;correct:string}>};
type LastCheck={answer?:string;outcome?:'understood'|'partial'|'misconception';feedback?:string};
type LearnerGapInput={skillId?:string;title?:string;score?:number;gradeAnchor?:string;cause?:string};
type LearnerModelInput={preferredTeachingMode?:string;teachingModeScores?:Record<string,number>;subjectMastery?:number|null;recentLessons?:Array<{title?:string;mastery?:number;understandingOutcome?:string;understandingFeedback?:string;summaryNeedsWork?:string;summaryNextStep?:string}>;gaps?:LearnerGapInput[];misconceptions?:Array<{misconception?:string;feedback?:string}>};
type Body={lessonId?:string;mode?:Mode;weaknesses?:Weakness[];previousExplanation?:string;lastCheck?:LastCheck;learnerModel?:LearnerModelInput};
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
  const cards:TeacherCard[]=value.cards.slice(0,8).filter((x:any)=>x&&typeof x.title==='string'&&typeof x.body==='string').map((x:any)=>({title:x.title.slice(0,100),body:x.body.slice(0,1500),kind:['explain','example','tip','check'].includes(x.kind)?x.kind:'explain'}));
  if(!cards.length)return null;const out:Payload={title:value.title.slice(0,140),intro:value.intro.slice(0,1700),cards};
  if(value.checkQuestion&&typeof value.checkQuestion.text==='string')out.checkQuestion={text:value.checkQuestion.text.slice(0,500),hint:String(value.checkQuestion.hint||'').slice(0,500)};
  if(typeof value.teacherNote==='string')out.teacherNote=value.teacherNote.slice(0,500);return out;
}
function learnerSummary(model:LearnerModelInput|undefined){
  if(!model)return '- لا يوجد ملف تعلم موحد بعد.';
  const lines:string[]=[];
  if(Number.isFinite(Number(model.subjectMastery)))lines.push(`- متوسط إتقان المادة: ${Number(model.subjectMastery)}%`);
  if(model.preferredTeachingMode)lines.push(`- أسلوب الشرح الأكثر نجاحًا سابقًا: ${model.preferredTeachingMode}`);
  if(model.teachingModeScores){const top=Object.entries(model.teachingModeScores).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,4);if(top.length)lines.push(`- فعالية أساليب الشرح: ${top.map(([m,s])=>`${m}=${s}`).join('، ')}`)}
  const recent=(model.recentLessons||[]).slice(0,5);if(recent.length){lines.push('- آخر إشارات التعلم:');for(const x of recent)lines.push(`  • ${String(x.title||'درس')}: إتقان ${Number(x.mastery)||0}%${x.understandingOutcome?`، فهم=${x.understandingOutcome}`:''}${x.understandingFeedback?`، ملاحظة=${String(x.understandingFeedback).slice(0,220)}`:''}${x.summaryNeedsWork?`، يحتاج تثبيت=${String(x.summaryNeedsWork).slice(0,220)}`:''}${x.summaryNextStep?`، الخطوة التالية=${String(x.summaryNextStep).slice(0,220)}`:''}`)}
  const gaps=(model.gaps||[]).slice(0,6);if(gaps.length){lines.push('- فجوات ذات أولوية:');for(const g of gaps)lines.push(`  • ${String(g.title||'مهارة')}: ${Number(g.score)||0}%${g.gradeAnchor?` (${g.gradeAnchor})`:''}${g.cause?` — ${String(g.cause).slice(0,220)}`:''}`)}
  const misconceptions=(model.misconceptions||[]).slice(0,6);if(misconceptions.length){lines.push('- سوء فهم رُصد في تدريبات سابقة:');for(const m of misconceptions)lines.push(`  • ${String(m.misconception||'').slice(0,260)}${m.feedback?` — ${String(m.feedback).slice(0,260)}`:''}`)}
  return lines.join('\n')||'- لا توجد إشارات محفوظة بعد.';
}

export async function POST(request:Request){
  let body:Body;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const lessonId=typeof body.lessonId==='string'?body.lessonId:'';const mode:Mode=body.mode||'overview';
  const lesson=getLesson(lessonId);if(!lesson)return NextResponse.json({error:'lesson_not_found'},{status:404});
  const student=getStudent(lesson.student);if(!student)return NextResponse.json({error:'student_not_found'},{status:404});
  const backup=fallback(lesson.id,mode);if(!process.env.OPENAI_API_KEY)return NextResponse.json({content:backup,mode:'local',grounded:false,webUsed:false,groundingQuality:'local',qualityScore:0});

  const weaknesses=(body.weaknesses||[]).slice(0,8);const priorGrades=getRecoveryGradeBand(student.grade);
  const officialSources=[...priorGrades,student.grade].flatMap(g=>getCurriculumSources(g,lesson.subject));
  const sourceList=[...new Map(officialSources.map(x=>[x.id,x])).values()].slice(0,14).map(x=>`- ${x.title} | ${x.kind} | ثقة ${x.priority}/100 | ${x.url}`).join('\n');
  const weaknessText=weaknesses.length?weaknesses.map(w=>`- ${w.title}: ${w.score}%${w.gradeAnchor?` (${w.gradeAnchor})`:''}${w.cause?` — ${w.cause}`:''}${w.missedFacts?.length?` — أخطاء: ${w.missedFacts.map(m=>`${m.text} [اختارت ${m.selected}، الصحيح ${m.correct}]`).join('؛ ')}`:''}`).join('\n'):'- لا توجد فجوات دقيقة محفوظة لهذه المادة.';
  const lastCheckText=body.lastCheck?.answer?`\nمحاولة الفهم الأخيرة للطالبة:\n- إجابة الطالبة: ${String(body.lastCheck.answer).slice(0,700)}\n- التقييم: ${body.lastCheck.outcome||'غير محدد'}\n- ملاحظة المعلم: ${String(body.lastCheck.feedback||'').slice(0,800)}\nتعليمات إعادة التدريس: لا تكرر الشرح السابق. حدد الفكرة التي سببت الخلط من هذه الإجابة، ثم أعد بناء الشرح حولها بمثال جديد أصغر وأسهل، وبعده سؤال تحقق جديد مختلف.`:'';
  const modelText=learnerSummary(body.learnerModel);
  const bridges=getLessonBridges(lesson);
  const bridgeText=bridges.map(b=>{
    const measured=(body.learnerModel?.gaps||[]).filter(g=>g.skillId===b.skillId).sort((a,c)=>Number(a.score??100)-Number(c.score??100))[0];
    const state=measured?`نتيجة فجوة محفوظة ${Number(measured.score)}%${measured.gradeAnchor?` (${measured.gradeAnchor})`:''}${measured.cause?` — ${measured.cause}`:''}`:'لا توجد فجوة مقاسة مرتبطة بهذه المهارة.';
    return `- ${b.title} | صلة ${b.priority}/100 | ${b.reason} | ${state}`;
  }).join('\n');
  const blockingGap=(body.learnerModel?.gaps||[]).some(g=>Number(g.score)<50)||weaknesses.some(w=>Number(w.score)<50);
  const pedagogy=buildPedagogyPlan(lesson.subject,body.learnerModel?.subjectMastery,blockingGap,mode);
  const pedagogyText=`المستوى التدريسي المقترح: ${pedagogy.level}\nالطريقة الأساسية: ${pedagogy.method}\nتسلسل التدريس:\n${pedagogy.sequence.map((x,i)=>`${i+1}. ${x}`).join('\n')}\nقاعدة التغذية الراجعة: ${pedagogy.feedbackRule}\nضبط الحمل المعرفي: ${pedagogy.cognitiveLoad}\nقاعدة الاسترجاع: ${pedagogy.retrievalRule}`;
  const styleMap:Record<Mode,string>={overview:'اشرح الدرس شرحًا متدرجًا واضحًا من الفكرة إلى المثال ثم تحقق قصير.',simplify:'أعد الشرح بأبسط لغة ممكنة، جمل قصيرة، وفكرة واحدة في كل خطوة. لا تفترض فهم المصطلحات.',step_by_step:'حوّل الفكرة إلى خطوات مرقمة صغيرة جدًا مع مثال محلول خطوة بخطوة.',analogy:'استخدم تشبيهًا أو قصة أو تصورًا بصريًا مناسبًا لعمر الطالبة، ثم اربطه بالمفهوم الحقيقي حتى لا يبقى التشبيه مضللًا.',real_world:'اربط المفهوم بموقف من الحياة اليومية أو البيئة المحيطة ثم أعد ربطه مباشرة بهدف المنهاج.',deep:'وسّع الشرح بمعلومات إضافية صحيحة ومناسبة للعمر، مع الحفاظ على هدف الدرس الحالي وعدم إغراق الطالبة.',check:'ركز على سؤال أو سؤالين يكشفان هل فهمت الطالبة الفكرة فعلًا، مع تلميح بدل الحل المباشر.'};
  const hasCurriculumStore=Boolean(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID);
  const instructions=`أنت المعلم الأساسي في منصة تعليم منزلية فلسطينية لطفلتين. مهمتك ليست الدردشة العامة؛ أنت معلم شخصي تكيفي ودقيق.
1) قبل صياغة الشرح، اجمع سندًا للمفهوم من المنهاج الفلسطيني: استخدم file_search إذا كانت متاحة؛ وإلا استخدم web_search للتحقق من المصادر الفلسطينية الرسمية، مع أولوية elearn.edu.ps وmoe.edu.ps.
2) لا تعتمد على الذاكرة العامة للنموذج وحدها في تعريف هدف الدرس أو تسلسله أو حقيقة منهجية أساسية. إذا تعذر إيجاد سند مناسب، لا تخترع؛ اجعل الشرح محافظًا ومحدودًا بما هو موجود في سياق الدرس.
3) التزم بالخطة البيداغوجية المرفقة، وطبّقها في ترتيب الشرح والأمثلة والأسئلة.
4) استخدم ملف التعلم الموحد لتحديد نقطة البداية وطول الشرح ونوع المثال.
5) استخدم جسور المهارات السابقة كخريطة prerequisite، لكن لا تعيد تدريسها جميعًا. إذا كانت المهارة السابقة غير ضعيفة أو غير مقاسة، يكفي استرجاع قصير عند الحاجة. إذا كانت نتيجتها أقل من 80% وتؤثر مباشرة في الدرس، علّم الجزء الضروري فقط. إذا كانت أقل من 50% وهي مانع مباشر، أعط علاجًا تأسيسيًا قصيرًا ثم عد للدرس الحالي.
6) اجعل العلاقة بسيطة مثل: «نحتاج هذه الخطوة حتى نفهم فكرة اليوم»، من دون وصم الطالبة بالتأخر.
7) لا تكتفِ بتعريف واحد. عند ملاءمة الموضوع قدّم تمثيلًا بسيطًا، مثالًا محلولًا، مثالًا ثانيًا مختلفًا قليلًا لاختبار انتقال الفهم، ثم خطأ شائعًا أو مثالًا مضادًا.
8) لا تكرر نفس الأرقام أو الكلمات أو القصة في المثال الثاني؛ غيّر السطح مع تثبيت المفهوم.
9) إذا وصلت محاولة فهم سابقة خاطئة أو جزئية، شخص سبب الخلط وغيّر التمثيل أو مستوى الخطوات، ولا تكرر نفس الجمل بصياغة مختلفة فقط.
10) إذا تكرر سوء فهم في دروس سابقة، قدّم وقاية قصيرة منه قبل النقطة التي تسبب الخطأ.
11) في الرياضيات: وضّح العلاقات والخطوات وتحقق من المعقولية. في العلوم: فرّق بين الملاحظة والدليل والتفسير والسبب/النتيجة. في العربية: ابدأ بالسياق والمعنى ثم استخرج النمط والقاعدة. في English: استخدم مدخلًا مفهومًا ونموذجًا قصيرًا ثم ممارسة وإنتاجًا، مع عربي عند الحاجة.
12) لا تستخدم مصدرًا خارجيًا غير رسمي لتغيير محتوى المنهاج؛ يمكن استخدامه فقط لإثراء مثال لا يتعارض مع المصدر الرسمي.
13) لا تعرض للطالبة تفاصيل تقنية عن المصدر أو الثقة، ولا تنسب معلومة للوزارة إن لم تجدها في مصدر رسمي.
14) ${styleMap[mode]}
15) اجعل الشرح غنيًا بما يكفي للفهم، لكن لا تكدّس معلومات لا تخدم هدف الدرس أو الفجوة الحالية.
16) أعد JSON فقط: {"title":"...","intro":"...","cards":[{"title":"...","body":"...","kind":"explain|example|tip|check"}],"checkQuestion":{"text":"...","hint":"..."},"teacherNote":"..."}.`;
  const prompt=`الطالبة: ${student.name}\nالصف: ${student.grade}\nالفصل: الأول\nالمادة: ${lesson.subject}\nالدرس: ${lesson.title}\nملخص المنصة: ${lesson.summary}\nأهداف التعلم:\n${lesson.learningPoints.map((x,i)=>`${i+1}. ${x}`).join('\n')}\nمثال موجود: ${lesson.example}\nمرجع الدرس: ${getLessonSourceLabel(lesson)}\n\nالخطة البيداغوجية لهذه الجلسة:\n${pedagogyText}\n\nالجسور ذات الصلة من المهارات السابقة إلى درس اليوم:\n${bridgeText||'- لا يوجد جسر محدد؛ لا تضف استدراكًا إلا إذا كشف الأداء حاجة واضحة.'}\n\nملف التعلم الموحد للطالبة في هذه المادة:\n${modelText}\n\nفجوات مرتبطة مباشرة محفوظة:\n${weaknessText}\n\nمصادر منهجية مسجلة مرتبة بالأولوية:\n${sourceList}\n${body.previousExplanation?`\nشرح سابق لم ينجح بما يكفي:\n${body.previousExplanation.slice(0,1800)}`:''}${lastCheckText}`;

  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});const tools:any[]=[];
    if(hasCurriculumStore)tools.push({type:'file_search',vector_store_ids:[process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID],max_num_results:8});
    if(!hasCurriculumStore||mode==='deep'||mode==='real_world')tools.push({type:'web_search'});
    const response=await client.responses.create({model:process.env.OPENAI_TUTOR_MODEL||'gpt-5',instructions,input:prompt,...(tools.length?{tools}:{}),max_output_tokens:2200});
    const content=validate(cleanJson(response.output_text||''));if(!content)throw new Error('invalid_teacher_payload');
    const output:any[]=Array.isArray((response as any).output)?(response as any).output:[];
    const grounded=output.some(x=>x?.type==='file_search_call');
    const webUsed=output.some(x=>x?.type==='web_search_call'||x?.type==='web_search_preview_call');
    if(!grounded&&!webUsed)throw new Error('ungrounded_teacher_payload');
    const quality=evaluateTeacherQuality(content,mode);
    if(!quality.pass)throw new Error(`low_teacher_quality:${quality.score}:${quality.issues.join('|')}`);
    const groundingQuality=grounded?'curriculum-file':webUsed?'official-web':'local';
    return NextResponse.json({content,mode:'ai',grounded,webUsed,groundingQuality,pedagogyLevel:pedagogy.level,qualityScore:quality.score,qualityIssues:quality.issues,bridges:bridges.map(b=>({skillId:b.skillId,title:b.title,priority:b.priority}))});
  }catch(error){console.error('AI lesson teacher failed',error);return NextResponse.json({content:backup,mode:'local_fallback',grounded:false,webUsed:false,groundingQuality:'local',pedagogyLevel:pedagogy.level,qualityScore:0,qualityIssues:['fallback'],bridges:bridges.map(b=>({skillId:b.skillId,title:b.title,priority:b.priority}))});}
}
