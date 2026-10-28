import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent} from '../../../../lib/data';

type Body={lessonId?:string;question?:string;answer?:string};
type Outcome='understood'|'partial'|'misconception';

export async function POST(request:Request){
  let body:Body;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const lessonId=typeof body.lessonId==='string'?body.lessonId:'';const question=typeof body.question==='string'?body.question.slice(0,500):'';const answer=typeof body.answer==='string'?body.answer.trim().slice(0,700):'';
  const lesson=getLesson(lessonId);if(!lesson||!question||!answer)return NextResponse.json({error:'missing_context'},{status:400});
  const student=getStudent(lesson.student);if(!student)return NextResponse.json({error:'student_not_found'},{status:404});
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({outcome:'partial',feedback:'أكملتِ محاولة جيدة. سننتقل إلى التدريب لنتأكد من الفهم.',recommendedMode:'step_by_step',mode:'local'});

  const instructions=`أنت معلم يقيم فهم طفلة بعد شرح قصير. لا تقيم الأسلوب اللغوي بصرامة؛ قيّم الفكرة.\nصنّف إلى understood إذا كانت الفكرة صحيحة، partial إذا التقطت جزءًا صحيحًا مع نقص مهم، misconception إذا ظهر فهم خاطئ يمكن أن يسبب أخطاء لاحقة.\nاكتب feedback قصيرًا داعمًا يوضح ما تم فهمه وما النقطة التالية دون إعطاء محاضرة.\nاختر recommendedMode من: overview, simplify, step_by_step, analogy, real_world, deep.\nإذا كان هناك سوء فهم اختر عادة simplify أو step_by_step أو analogy.\nأعد JSON فقط: {"outcome":"understood|partial|misconception","feedback":"...","recommendedMode":"..."}.`;
  const prompt=`الطالبة: ${student.name}\nالصف: ${student.grade}\nالمادة: ${lesson.subject}\nالدرس: ${lesson.title}\nأهداف الدرس:\n${lesson.learningPoints.join('\n')}\nمثال الدرس: ${lesson.example}\n\nسؤال التحقق: ${question}\nإجابة الطالبة: ${answer}`;
  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const response=await client.responses.create({model:process.env.OPENAI_TUTOR_MODEL||'gpt-5',instructions,input:prompt,max_output_tokens:350});
    const parsed=JSON.parse((response.output_text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
    const outcome:Outcome=['understood','partial','misconception'].includes(parsed.outcome)?parsed.outcome:'partial';
    const recommendedMode=['overview','simplify','step_by_step','analogy','real_world','deep'].includes(parsed.recommendedMode)?parsed.recommendedMode:'step_by_step';
    return NextResponse.json({outcome,feedback:String(parsed.feedback||'').slice(0,600),recommendedMode,mode:'ai'});
  }catch(error){console.error('AI understanding check failed',error);return NextResponse.json({outcome:'partial',feedback:'سأشرح الفكرة بطريقة أخرى ثم نتحقق منها في التدريب.',recommendedMode:'step_by_step',mode:'local_fallback'});}
}
