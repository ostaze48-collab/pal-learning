import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent,getLessonSourceLabel} from '../../../lib/data';
import {gapSkills,lessonPrerequisites} from '../../../lib/skillGraph';

type LearnerState={
  diagnosticCorrect?:boolean;
  mastery?:number;
  wrongQuestionIds?:string[];
  likelyGapId?:string|null;
};

type RequestBody={lessonId?:string;question?:string;learnerState?:LearnerState};

function localFallback(lessonId:string,question:string){
  const lesson=getLesson(lessonId);
  if(!lesson)return 'لم أتمكن من فتح سياق هذا الدرس.';
  const q=question.trim();
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

  const prereqIds=lessonPrerequisites[lesson.id]||[];
  const prereqs=prereqIds.map(id=>gapSkills[id]).filter(Boolean);
  const likelyGap=body.learnerState?.likelyGapId?gapSkills[body.learnerState.likelyGapId]:undefined;
  const sourceLabel=getLessonSourceLabel(lesson);

  if(!process.env.OPENAI_API_KEY){
    return NextResponse.json({answer:localFallback(lesson.id,question),mode:'local',gap:likelyGap?.title||null});
  }

  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const grade=student.grade;
  const learnerState=body.learnerState||{};

  const curriculumContext=`
الطالبة: ${student.name}
الصف: ${grade}
الفصل: الأول
المادة: ${lesson.subject}
الدرس: ${lesson.title}
وصف الدرس: ${lesson.summary}
أهداف/نقاط التعلم المعتمدة داخل المنصة:
${lesson.learningPoints.map((x,i)=>`${i+1}. ${x}`).join('\n')}
مثال الدرس الموجود في المنصة:
${lesson.example}
المصدر: ${sourceLabel}
المهارات السابقة المطلوبة:
${prereqs.length?prereqs.map(x=>`- ${x.title}: ${x.explanation}`).join('\n'):'- لا توجد مهارة سابقة مسجلة لهذا الدرس.'}
حالة المتعلمة الحالية:
- التشخيص القبلي صحيح: ${learnerState.diagnosticCorrect===undefined?'غير معروف':learnerState.diagnosticCorrect?'نعم':'لا'}
- الإتقان الحالي: ${learnerState.mastery??'غير متوفر'}
- الأسئلة التي أخطأت فيها: ${(learnerState.wrongQuestionIds||[]).join(', ')||'لا يوجد'}
- الفجوة المحتملة: ${likelyGap?`${likelyGap.title} — ${likelyGap.why}`:'لم تحدد بعد'}
`;

  const instructions=`أنت معلم ذكي خاص بطفلة في منصة تعليم منزلية فلسطينية. التزم حرفيًا بهذه القواعد:
1) اشرح على مستوى الصف ${grade} وبالعربية المبسطة، إلا إذا كانت المادة English فاسمح بالإنجليزية البسيطة مع شرح عربي عند الحاجة.
2) اجعل إجابتك مرتبطة بالدرس الحالي والسياق المقدم فقط. لا تنسب معلومة إلى المنهاج إن لم تكن موجودة في السياق.
3) إذا كان السؤال يحتاج معلومة دقيقة غير موجودة في السياق، قل بوضوح: "هذه النقطة غير موجودة في سياق الدرس المتاح لي الآن" ثم قدم شرحًا عامًا قصيرًا فقط إذا كان آمنًا ومفيدًا، مع تمييزه بأنه شرح مساعد وليس نصًا رسميًا.
4) لا تعطِ الحل النهائي فورًا إذا كان الأفضل أن تقود الطفلة خطوة بخطوة. استخدم سؤالًا صغيرًا أو مثالًا ثم اطلب منها التفكير.
5) إذا أظهرت حالة المتعلمة فجوة سابقة مثل جدول الضرب أو خط الأعداد أو معنى الكسر، عالج تلك الفجوة أولًا قبل العودة للمفهوم الحالي.
6) لا تستخدم مصطلحات أعلى من مستوى الصف دون شرحها.
7) حافظ على الإجابة قصيرة: عادة 4-8 جمل، ويمكن استخدام نقاط قليلة.
8) لا تطلب أي بيانات شخصية من الطفلة ولا تفتح محادثة عامة خارج التعلم.
9) عندما يكون مناسبًا اختم بسؤال تحقق واحد فقط.
10) فرّق دائمًا بين "محتوى الدرس المتاح" و"شرح مساعد" ولا تدّعِ أن صياغتك نص رسمي من الوزارة.`;

  try{
    const response=await client.responses.create({
      model:process.env.OPENAI_TUTOR_MODEL||'gpt-6-luna',
      instructions,
      input:`${curriculumContext}\n\nسؤال الطفلة: ${question}`,
      max_output_tokens:500
    });
    const answer=(response.output_text||'').trim();
    if(!answer)throw new Error('empty_response');
    return NextResponse.json({answer,mode:'ai',gap:likelyGap?.title||null});
  }catch(error){
    console.error('Tutor API error',error);
    return NextResponse.json({answer:localFallback(lesson.id,question),mode:'local_fallback',gap:likelyGap?.title||null});
  }
}
