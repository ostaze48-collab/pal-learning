import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent,getLessonSourceLabel} from '../../../lib/data';
import {gapSkills,lessonPrerequisites} from '../../../lib/skillGraph';
import {getCurriculumSources,getRecoveryGradeBand} from '../../../lib/curriculumKnowledge';
import {recoverySkills} from '../../../lib/recoverySkills';

type DeepGap={title:string;score:number;gradeAnchor:string;parentSkillId:string};
type LearnerState={
  diagnosticCorrect?:boolean;
  mastery?:number;
  wrongQuestionIds?:string[];
  likelyGapId?:string|null;
  recoveryProfile?:Record<string,number>;
  deepRecoveryProfile?:Record<string,DeepGap>;
};

type RequestBody={lessonId?:string;question?:string;learnerState?:LearnerState};

function localFallback(lessonId:string,question:string,weakTitle?:string){
  const lesson=getLesson(lessonId);
  if(!lesson)return 'لم أتمكن من فتح سياق هذا الدرس.';
  const q=question.trim();
  if(weakTitle)return `قبل العودة إلى درس ${lesson.title}، ثبتي أولًا مهارة ${weakTitle}. بعد ذلك نربطها بالفكرة الأساسية في الدرس: ${lesson.learningPoints[0]}`;
  if(q.includes('مثال'))return `مثال من هذا الدرس: ${lesson.example}`;
  if(q.includes('أبسط')||q.includes('افهم')||q.includes('فهم'))return `نبدأ من أبسط نقطة: ${lesson.learningPoints[0]} ثم نطبّقها على المثال: ${lesson.example}`;
  return `الفكرة الأساسية في هذا الدرس: ${lesson.learningPoints.join(' ثم ')}. ${lesson.example}`;
}

export async function POST(request:Request){
  let body:RequestBody;
  try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const lessonId=typeof body.lessonId==='string'?body.lessonId:'';
  const question=typeof body.question==='string'?body.question.trim().slice(0,700):'';
  const lesson=getLesson(lessonId);
  if(!lesson||!question)return NextResponse.json({error:'missing_lesson_or_question'},{status:400});

  const student=getStudent(lesson.student);
  if(!student)return NextResponse.json({error:'student_not_found'},{status:400});

  const learnerState=body.learnerState||{};
  const prereqIds=lessonPrerequisites[lesson.id]||[];
  const prereqs=prereqIds.map(id=>gapSkills[id]).filter(Boolean);
  const likelyGap=learnerState.likelyGapId?gapSkills[learnerState.likelyGapId]:undefined;
  const recoveryProfile=learnerState.recoveryProfile||{};
  const deepRecoveryProfile=learnerState.deepRecoveryProfile||{};
  const weakRecovery=Object.entries(recoveryProfile).filter(([,score])=>score<80).sort((a,b)=>a[1]-b[1])[0];
  const weakRecoverySkill=weakRecovery?recoverySkills.find(s=>s.id===weakRecovery[0]):undefined;
  const weakDeep=Object.values(deepRecoveryProfile).filter(x=>x.score<80).sort((a,b)=>a.score-b.score)[0];
  const sourceLabel=getLessonSourceLabel(lesson);
  const previousGrades=getRecoveryGradeBand(student.grade);
  const sourceGrades=[...previousGrades,student.grade];
  const officialSources=sourceGrades.flatMap(g=>getCurriculumSources(g,lesson.subject));
  const uniqueSources=[...new Map(officialSources.map(s=>[s.id,s])).values()].slice(0,12);
  const activeGapTitle=weakDeep?.title||weakRecoverySkill?.title||likelyGap?.title;

  if(!process.env.OPENAI_API_KEY){
    return NextResponse.json({answer:localFallback(lesson.id,question,activeGapTitle),mode:'local',gap:activeGapTitle||null});
  }

  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const grade=student.grade;
  const sourceList=uniqueSources.map((s,i)=>`${i+1}. ${s.title} — ${s.kind} — ثقة ${s.priority}/100 — ${s.url}`).join('\n');
  const recoveryList=Object.entries(recoveryProfile).map(([id,score])=>{const skill=recoverySkills.find(s=>s.id===id);return skill?`- ${skill.title}: ${score}% (${skill.strand})`:null}).filter(Boolean).join('\n');
  const deepList=Object.values(deepRecoveryProfile).sort((a,b)=>a.score-b.score).map(x=>`- ${x.title}: ${x.score}% — مرجع متوقع ${x.gradeAnchor}`).join('\n');

  const curriculumContext=`
الطالبة: ${student.name}
الصف الحالي المسجل: ${grade}
الفصل: الأول
المادة: ${lesson.subject}
الدرس الحالي: ${lesson.title}
وصف الدرس: ${lesson.summary}
أهداف/نقاط التعلم داخل المنصة:
${lesson.learningPoints.map((x,i)=>`${i+1}. ${x}`).join('\n')}
مثال الدرس الموجود في المنصة:
${lesson.example}
مرجع الدرس الحالي: ${sourceLabel}

نطاق الاستدراك: الصفوف السابقة ${previousGrades.join('، ')||'لا يوجد'} مع الاستمرار في الصف ${grade}.
المهارات السابقة المرتبطة مباشرة بهذا الدرس:
${prereqs.length?prereqs.map(x=>`- ${x.title}: ${x.explanation}`).join('\n'):'- لا توجد مهارة مباشرة مسجلة.'}

نتائج فحص الفجوات العامة في مادة ${lesson.subject}:
${recoveryList||'- لم يكتمل فحص الفجوات لهذه المادة بعد.'}

نتائج التشخيص العميق للمهارات الفرعية:
${deepList||'- لا يوجد تشخيص عميق محفوظ حتى الآن.'}
أضعف فجوة دقيقة موثقة: ${weakDeep?`${weakDeep.title} (${weakDeep.score}%) — مرجعها المتوقع ${weakDeep.gradeAnchor}`:'لا توجد فجوة فرعية موثقة أقل من 80%.'}
أضعف مهارة عامة: ${weakRecoverySkill?`${weakRecoverySkill.title} (${weakRecovery?.[1]}%) — ${weakRecoverySkill.whyItMatters}`:'لا توجد فجوة عامة موثقة أقل من 80%.'}
فجوة محتملة من أخطاء الدرس: ${likelyGap?`${likelyGap.title} — ${likelyGap.why}`:'لم تحدد.'}

حالة الدرس:
- التشخيص القبلي صحيح: ${learnerState.diagnosticCorrect===undefined?'غير معروف':learnerState.diagnosticCorrect?'نعم':'لا'}
- الإتقان الحالي: ${learnerState.mastery??'غير متوفر'}
- الأسئلة التي أخطأت فيها: ${(learnerState.wrongQuestionIds||[]).join(', ')||'لا يوجد'}

ترتيب المصادر الموثوقة المتاحة للنظام:
${sourceList}
`;

  const instructions=`أنت معلم ذكي لمنصة تعليم منزلية فلسطينية تعالج آثار الانقطاع التعليمي الطويل، مع إبقاء الطالبة في صفها الحالي. التزم بهذه القواعد:
1) الهدف المزدوج: مساعدة الطالبة على إتقان الصف ${grade} الحالي، وفي الوقت نفسه سد الفجوات الدقيقة فقط من الصفوف السابقة دون إعادتها لصف سابق كامل.
2) إذا وُجدت فجوة فرعية موثقة من التشخيص العميق، فهي أعلى أولوية من اسم المجال العام. عالج الجزء المحدد فقط مثل جدول 7 و8 أو past simple، ولا تعيد كل الوحدة.
3) اشرح على مستوى الصف ${grade} وبالعربية المبسطة، إلا في English فاستخدم الإنجليزية البسيطة مع شرح عربي عند الحاجة.
4) استخدم تسلسل الثقة التالي: الكتاب/الرزمة الرسمية، فهرس المنهاج الرسمي، دليل المعلم، الإطار الوطني للمبحث، أوراق العمل الرسمية، الاختبارات ونماذج الحل المنشورة، ثم الشرح المساعد الذي تولده أنت.
5) إذا كانت أداة file_search متاحة، استخدمها عندما يحتاج السؤال معلومة منهجية دقيقة أو مثالًا/تمرينًا من المواد المرجعية. لا تخترع نصًا أو حلًا رسميًا إذا لم تجده.
6) إذا أظهرت النتائج فجوة سابقة موثقة أقل من 80% وتؤثر في السؤال الحالي، عالجها أولًا في 2-5 دقائق تعليميًا ثم اربطها مباشرة بالدرس الحالي.
7) لا تجعل الاستدراك يطغى على الصف الحالي: اقترح أقصر علاج كافٍ ثم ارجع إلى هدف الدرس.
8) لا تعطِ الحل النهائي فورًا إذا كان الأفضل توجيه الطفلة بسؤال صغير أو مثال مشابه.
9) إذا كانت معلومة غير موجودة في المصادر المتاحة، قل: "لم أجد هذه النقطة في المصادر المنهجية المتاحة لي الآن" ولا تنسبها للوزارة.
10) فرّق بين: "وفق المصدر الرسمي" و"شرح مساعد" و"تمرين مشابه مولد".
11) استخدم إجابة قصيرة عادة 4-10 جمل، ويمكن إضافة مثال بصري لفظي أو سؤال تحقق واحد.
12) لا تطلب بيانات شخصية ولا تفتح محادثة عامة بعيدة عن التعلم.
13) عندما يكون سؤال الطفلة أوسع من الدرس الحالي لكن داخل منهاجها أو صفوفها السابقة، يمكنك الاستفادة من قاعدة المنهاج الكاملة بدل رفضه لمجرد أنه خارج عنوان الدرس.`;

  try{
    const tools:any[]=[];
    if(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID){
      tools.push({type:'file_search',vector_store_ids:[process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID],max_num_results:6});
    }
    const response=await client.responses.create({
      model:process.env.OPENAI_TUTOR_MODEL||'gpt-5',
      instructions,
      input:`${curriculumContext}\n\nسؤال الطفلة: ${question}`,
      ...(tools.length?{tools}:{}),
      max_output_tokens:650
    });
    const answer=(response.output_text||'').trim();
    if(!answer)throw new Error('empty_response');
    return NextResponse.json({answer,mode:'ai',gap:activeGapTitle||null,grounded:tools.length>0});
  }catch(error){
    console.error('Tutor API error',error);
    return NextResponse.json({answer:localFallback(lesson.id,question,activeGapTitle),mode:'local_fallback',gap:activeGapTitle||null});
  }
}
