import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent} from '../../../../lib/data';

type Body={lessonId?:string;questionId?:string;selectedIndex?:number};

export async function POST(request:Request){
  let body:Body;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const lesson=getLesson(typeof body.lessonId==='string'?body.lessonId:'');if(!lesson)return NextResponse.json({error:'lesson_not_found'},{status:404});
  const q=lesson.questions.find(x=>x.id===body.questionId);if(!q)return NextResponse.json({error:'question_not_found'},{status:404});
  const selected=Number(body.selectedIndex);if(!Number.isInteger(selected)||selected<0||selected>=q.options.length)return NextResponse.json({error:'bad_selection'},{status:400});
  const correct=selected===q.correct;const fallback={correct,feedback:correct?'إجابة صحيحة. فكرتك مناسبة لهذا السؤال.':q.explanation,microExample:'',misconception:correct?'':'نراجع الفكرة المرتبطة بهذا السؤال.',action:correct?'continue':'reinforce'};
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({...fallback,mode:'local'});
  const student=getStudent(lesson.student);if(!student)return NextResponse.json({...fallback,mode:'local'});
  const instructions=`أنت معلم شخصي للأطفال. حلل إجابة واحدة في درس مدرسي. لا تكتفِ بقول صح/خطأ.
- إذا كانت صحيحة: أثبت سبب صحتها بجملة قصيرة ثم أعطِ رابطًا صغيرًا بالفكرة الأساسية.
- إذا كانت خاطئة: استنتج سوء الفهم الأقرب من الاختيار نفسه دون مبالغة، وفسّر الفرق بين اختيار الطفلة والصحيح.
- أعط مثالًا صغيرًا مشابهًا لكنه ليس نفس السؤال.
- لا تعط محاضرة طويلة: 2-5 جمل.
- لا توبّخ ولا تستخدم لغة طفولية مبالغًا فيها.
- أعد JSON فقط: {"feedback":"...","microExample":"...","misconception":"...","action":"continue|reinforce"}.`;
  const prompt=`الطالبة: ${student.name}\nالصف: ${student.grade}\nالمادة: ${lesson.subject}\nالدرس: ${lesson.title}\nالفكرة الأساسية: ${lesson.learningPoints.join(' | ')}\nالسؤال: ${q.text}\nالخيارات: ${q.options.map((x,i)=>`${i}:${x}`).join(' | ')}\nاختيار الطالبة: ${selected}:${q.options[selected]}\nالإجابة الصحيحة: ${q.correct}:${q.options[q.correct]}\nشرح المنصة المرجعي: ${q.explanation}`;
  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const response=await client.responses.create({model:process.env.OPENAI_TUTOR_MODEL||'gpt-5',instructions,input:prompt,max_output_tokens:450});
    const parsed=JSON.parse((response.output_text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
    return NextResponse.json({correct,feedback:String(parsed.feedback||fallback.feedback).slice(0,700),microExample:String(parsed.microExample||'').slice(0,500),misconception:String(parsed.misconception||'').slice(0,400),action:parsed.action==='reinforce'?'reinforce':'continue',mode:'ai'});
  }catch(error){console.error('AI answer feedback failed',error);return NextResponse.json({...fallback,mode:'local_fallback'});}
}
