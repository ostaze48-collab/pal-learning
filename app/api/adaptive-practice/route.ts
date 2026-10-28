import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getStudent} from '../../../lib/data';
import {getRecoverySkill} from '../../../lib/recoverySkills';
import {getDeepDiagnostic} from '../../../lib/deepDiagnostics';
import {getCurriculumSources,getRecoveryGradeBand} from '../../../lib/curriculumKnowledge';

type Mistake={text?:string;selected?:string;correct?:string};
type Body={slug?:string;skillId?:string;subskillId?:string;mistakes?:Mistake[];difficulty?:'easy'|'medium'|'hard';count?:number};
type GeneratedQuestion={text:string;options:string[];correct:number;explanation:string};

function fallbackQuestions(skillId:string,subskillId?:string,count=5):GeneratedQuestion[]{
  const diagnostic=getDeepDiagnostic(skillId);
  const sub=subskillId?diagnostic?.subskills.find(s=>s.id===subskillId):diagnostic?.subskills[0];
  if(!sub)return [];
  return sub.questions.slice(0,Math.max(1,Math.min(count,sub.questions.length))).map(q=>({text:q.text,options:q.options,correct:q.correct,explanation:q.explanation}));
}

function cleanJson(text:string){
  const trimmed=text.trim();
  const unfenced=trimmed.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  return JSON.parse(unfenced);
}

function validQuestions(value:any,count:number):GeneratedQuestion[]{
  if(!value||!Array.isArray(value.questions))return [];
  const out:GeneratedQuestion[]=[];
  for(const item of value.questions){
    if(!item||typeof item.text!=='string'||!Array.isArray(item.options)||item.options.length<2||item.options.length>5)continue;
    if(!item.options.every((x:any)=>typeof x==='string'))continue;
    const correct=Number(item.correct);
    if(!Number.isInteger(correct)||correct<0||correct>=item.options.length)continue;
    if(typeof item.explanation!=='string')continue;
    out.push({text:item.text.slice(0,300),options:item.options.map((x:string)=>x.slice(0,120)),correct,explanation:item.explanation.slice(0,350)});
    if(out.length>=count)break;
  }
  return out;
}

export async function POST(request:Request){
  let body:Body;
  try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const slug=typeof body.slug==='string'?body.slug:'';
  const skillId=typeof body.skillId==='string'?body.skillId:'';
  const subskillId=typeof body.subskillId==='string'?body.subskillId:'';
  const count=Math.max(3,Math.min(6,Number(body.count)||5));
  const difficulty=body.difficulty||'medium';
  const student=getStudent(slug);const skill=getRecoverySkill(skillId);const diagnostic=getDeepDiagnostic(skillId);
  const sub=diagnostic?.subskills.find(s=>s.id===subskillId);
  if(!student||!skill||!sub)return NextResponse.json({error:'invalid_skill_context'},{status:400});

  const fallback=fallbackQuestions(skillId,subskillId,count);
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({questions:fallback,mode:'local',grounded:false});

  const previousGrades=getRecoveryGradeBand(student.grade);
  const sourceGrades=[...previousGrades,student.grade];
  const sources=sourceGrades.flatMap(g=>getCurriculumSources(g,skill.subject));
  const sourceList=[...new Map(sources.map(s=>[s.id,s])).values()].slice(0,10).map(s=>`- ${s.title} (${s.kind}, ثقة ${s.priority}/100)`).join('\n');
  const mistakes=(body.mistakes||[]).slice(0,6).map((m,i)=>`${i+1}) ${m.text||'سؤال سابق'} | اختارت: ${m.selected||'غير معروف'} | الصحيح: ${m.correct||'غير معروف'}`).join('\n');

  const instructions=`أنت مولد تمارين تعليمية قصير لمنصة أطفال فلسطينية. أنشئ أسئلة تدريب جديدة فقط، ولا تنسخ سؤال الخطأ نفسه حرفيًا. التزم بالمهارة المحددة وبمستوى الصف الحالي والصفوف السابقة المرتبطة.\n- لا تنسب أي سؤال مولد إلى وزارة التربية.\n- يجب أن يكون لكل سؤال جواب واحد صحيح بوضوح.\n- اجعل المشتتات من أخطاء شائعة منطقية، لا إجابات عبثية.\n- لا ترفع الصعوبة خارج مستوى الطالبة.\n- إذا وجدت File Search فاستفد منه للتحقق من المصطلحات والمنهج، لكن صغ أسئلة جديدة.\n- أعد JSON فقط بهذا الشكل: {"questions":[{"text":"...","options":["..."],"correct":0,"explanation":"..."}]}.`;
  const prompt=`الطالبة: ${student.name}\nالصف الحالي: ${student.grade}\nالمادة: ${skill.subject}\nالمجال: ${skill.title}\nالمهارة الدقيقة: ${sub.title}\nمرجعها المتوقع: ${sub.gradeAnchor}\nسبب أهميتها: ${sub.why}\nشرحها المصغر: ${sub.miniLesson}\nالصعوبة المطلوبة: ${difficulty}\nعدد الأسئلة: ${count}\n\nأخطاء سابقة محددة:\n${mistakes||'- لا توجد أخطاء محفوظة.'}\n\nالمصادر المنهجية المتاحة للنظام:\n${sourceList||'- لا توجد قائمة مصادر.'}`;

  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const tools:any[]=[];
    if(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID)tools.push({type:'file_search',vector_store_ids:[process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID],max_num_results:5});
    const response=await client.responses.create({
      model:process.env.OPENAI_PRACTICE_MODEL||process.env.OPENAI_TUTOR_MODEL||'gpt-6-luna',
      instructions,
      input:prompt,
      ...(tools.length?{tools}:{}),
      max_output_tokens:1100
    });
    const parsed=cleanJson(response.output_text||'');
    const questions=validQuestions(parsed,count);
    if(questions.length<3)throw new Error('invalid_generated_questions');
    return NextResponse.json({questions,mode:'ai',grounded:tools.length>0});
  }catch(error){
    console.error('Adaptive practice generation failed',error);
    return NextResponse.json({questions:fallback,mode:'local_fallback',grounded:false});
  }
}
