import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent} from '../../../../lib/data';

type Body={lessonId?:string;question?:string;answer?:string};
type Outcome='understood'|'partial'|'misconception';
type Diagnosis='no_gap'|'foundation_gap'|'concept_confusion'|'procedural_gap'|'transfer_gap'|'expression_gap';

export async function POST(request:Request){
  let body:Body;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const lessonId=typeof body.lessonId==='string'?body.lessonId:'';const question=typeof body.question==='string'?body.question.slice(0,500):'';const answer=typeof body.answer==='string'?body.answer.trim().slice(0,700):'';
  const lesson=getLesson(lessonId);if(!lesson||!question||!answer)return NextResponse.json({error:'missing_context'},{status:400});
  const student=getStudent(lesson.student);if(!student)return NextResponse.json({error:'student_not_found'},{status:404});
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({outcome:'partial',diagnosis:'expression_gap',feedback:'أكملتِ محاولة جيدة. سنستخدم مثالًا قصيرًا آخر ثم نطلب منك شرح الفكرة من جديد.',nextMove:'مثال موجه قصير ثم إعادة تفسير',recommendedMode:'step_by_step',confidence:0,mode:'local'});

  const instructions=`أنت معلم شخصي يقيم فهم طفلة بعد شرح وتجربة قصيرة. قيّم الفكرة لا جودة الصياغة اللغوية.\nأولًا صنّف outcome:\n- understood: الفكرة صحيحة ويمكن البناء عليها.\n- partial: جزء صحيح لكن يوجد نقص مهم.\n- misconception: فهم خاطئ سيؤدي إلى أخطاء لاحقة.\nثم شخص سبب التعثر diagnosis باختيار واحد فقط:\n- no_gap: لا توجد فجوة مهمة.\n- foundation_gap: ينقصها أساس سابق ضروري لفهم الدرس.\n- concept_confusion: تخلط بين مفهومين أو تحمل تصورًا خاطئًا عن معنى الفكرة.\n- procedural_gap: تفهم المعنى لكن تخطئ في الخطوات/الإجراء/ترتيب التطبيق.\n- transfer_gap: تنجح مع المثال المألوف لكنها لا تنقل الفكرة إلى حالة مختلفة.\n- expression_gap: يبدو أن الفهم موجود لكن التعبير ناقص أو غير واضح، فلا تعامل ذلك كفجوة معرفية كبيرة.\nاختر nextMove كحركة تدريس واحدة قصيرة ومحددة، لا محاضرة.\nاختر recommendedMode من: overview, simplify, step_by_step, analogy, real_world, deep.\nقواعد القرار:\n- foundation_gap => simplify أو step_by_step مع رجوع قصير للأساس فقط.\n- concept_confusion => analogy أو simplify مع مثال مضاد.\n- procedural_gap => step_by_step مع إكمال خطوات ناقصة.\n- transfer_gap => real_world أو deep مع مثال مختلف السطح.\n- expression_gap => overview أو real_world، ولا تعيد الدرس كاملًا.\n- no_gap => overview أو deep حسب قوة الإجابة.\nfeedback قصير وداعم: اذكر ما فهمته الطفلة وما النقطة التي ستعملان عليها الآن.\nأعد JSON فقط: {"outcome":"understood|partial|misconception","diagnosis":"no_gap|foundation_gap|concept_confusion|procedural_gap|transfer_gap|expression_gap","feedback":"...","nextMove":"...","recommendedMode":"...","confidence":0.0}.`;
  const prompt=`الطالبة: ${student.name}\nالصف: ${student.grade}\nالمادة: ${lesson.subject}\nالدرس: ${lesson.title}\nأهداف الدرس:\n${lesson.learningPoints.join('\n')}\nمثال الدرس: ${lesson.example}\n\nسؤال التحقق: ${question}\nإجابة الطالبة: ${answer}\n\nمهم: لا تعتبر اختلاف الكلمات عن نص الكتاب خطأ إذا كان المعنى صحيحًا. حاول تحديد السبب الحقيقي وراء الإجابة قبل اختيار طريقة إعادة التدريس.`;
  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const response=await client.responses.create({model:process.env.OPENAI_TUTOR_MODEL||'gpt-5',instructions,input:prompt,max_output_tokens:500});
    const parsed=JSON.parse((response.output_text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
    const outcome:Outcome=['understood','partial','misconception'].includes(parsed.outcome)?parsed.outcome:'partial';
    const diagnoses:Diagnosis[]=['no_gap','foundation_gap','concept_confusion','procedural_gap','transfer_gap','expression_gap'];
    const diagnosis:Diagnosis=diagnoses.includes(parsed.diagnosis)?parsed.diagnosis:'expression_gap';
    const allowedModes=['overview','simplify','step_by_step','analogy','real_world','deep'];
    let recommendedMode=allowedModes.includes(parsed.recommendedMode)?parsed.recommendedMode:'step_by_step';
    if(diagnosis==='foundation_gap'&&!['simplify','step_by_step'].includes(recommendedMode))recommendedMode='step_by_step';
    if(diagnosis==='concept_confusion'&&!['analogy','simplify'].includes(recommendedMode))recommendedMode='analogy';
    if(diagnosis==='procedural_gap')recommendedMode='step_by_step';
    if(diagnosis==='transfer_gap'&&!['real_world','deep'].includes(recommendedMode))recommendedMode='real_world';
    if(diagnosis==='expression_gap'&&outcome!=='misconception'&&!['overview','real_world'].includes(recommendedMode))recommendedMode='overview';
    if(diagnosis==='no_gap'&&outcome==='understood'&&recommendedMode==='step_by_step')recommendedMode='overview';
    const confidence=Math.max(0,Math.min(1,Number(parsed.confidence)||0));
    return NextResponse.json({outcome,diagnosis,feedback:String(parsed.feedback||'').slice(0,600),nextMove:String(parsed.nextMove||'').slice(0,300),recommendedMode,confidence,mode:'ai'});
  }catch(error){console.error('AI understanding check failed',error);return NextResponse.json({outcome:'partial',diagnosis:'expression_gap',feedback:'سأستخدم مثالًا آخر ثم نتحقق من الفكرة من جديد.',nextMove:'مثال جديد قصير ثم سؤال تفسير',recommendedMode:'step_by_step',confidence:0,mode:'local_fallback'});}
}
