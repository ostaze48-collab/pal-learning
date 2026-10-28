import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent} from '../../../../lib/data';
import {chooseLessonExperience,type ExperienceKind} from '../../../../lib/lessonExperience';
import {getCurriculumSources} from '../../../../lib/curriculumKnowledge';

type Body={lessonId?:string;diagnosticCorrect?:boolean;subjectMastery?:number|null;recentCreativeSuccess?:number|null};
const allowed:ExperienceKind[]=['slides','puzzle','game','experiment','story','challenge','sort'];
function cleanJson(text:string){return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''))}

export async function POST(request:Request){
 let body:Body;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
 const lesson=getLesson(String(body.lessonId||''));if(!lesson)return NextResponse.json({error:'lesson_not_found'},{status:404});
 const student=getStudent(lesson.student);if(!student)return NextResponse.json({error:'student_not_found'},{status:404});
 const fallback=chooseLessonExperience(lesson,body.diagnosticCorrect!==false,body.subjectMastery,body.recentCreativeSuccess);
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({...fallback,engine:'local'});
 const books=getCurriculumSources(student.grade,lesson.subject).filter(x=>x.kind==='textbook').slice(0,3);
 const hasStore=Boolean(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID);
 try{
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});const tools:any[]=[];
  if(hasStore)tools.push({type:'file_search',vector_store_ids:[process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID],max_num_results:4});
  else tools.push({type:'web_search'});
  const instructions=`أنت مصمم تعلم للأطفال داخل منصة تعتمد كتاب الوزارة الفلسطيني مصدرًا أساسيًا. اختر فقط طريقة عرض مدعومة من هذه القائمة: slides,puzzle,game,experiment,story,challenge,sort. لا تغيّر محتوى الكتاب ولا هدف الدرس؛ أنت تختار طريقة تقديمه فقط. إذا كانت الطالبة ضعيفة أو كان نجاحها الأخير في الأنشطة الإبداعية أقل من 50%، فضّل طريقة موجهة تقلل الحمل المعرفي. إذا كان الأساس قويًا ونجاحها الأخير 75% فأكثر، فضّل التعلم بالمحاولة واللغز والتحدي. العلوم تناسبها التوقع/التجربة، اللغات تناسبها القصة وبناء الجملة والترتيب، والرياضيات تناسبها المحاولة البصرية والألغاز. استخدم مصدر الكتاب الفعلي قبل القرار. أعد JSON فقط: {"primary":"...","secondary":"...","label":"...","icon":"...","reason":"...","intensity":"guided|balanced|challenge","visualLabel":"..."}.`;
  const input=`الصف: ${student.grade}\nالمادة: ${lesson.subject}\nالدرس: ${lesson.title}\nملخص: ${lesson.summary}\nأهداف: ${lesson.learningPoints.join(' | ')}\nالفحص القبلي صحيح: ${body.diagnosticCorrect!==false?'نعم':'لا'}\nمتوسط إتقان المادة: ${body.subjectMastery??'غير معروف'}\nنسبة النجاح الأخيرة في الألعاب/الألغاز لهذه المادة: ${body.recentCreativeSuccess??'غير معروفة'}\nكتب الوزارة المسجلة:\n${books.map(x=>`- ${x.title} | ${x.url}`).join('\n')}`;
  const response=await client.responses.create({model:process.env.OPENAI_TUTOR_MODEL||'gpt-5',instructions,input,tools,max_output_tokens:450});
  const parsed=cleanJson(response.output_text||'');
  const primary=allowed.includes(parsed.primary)?parsed.primary:fallback.primary;const secondary=allowed.includes(parsed.secondary)?parsed.secondary:fallback.secondary;
  const output:any[]=Array.isArray((response as any).output)?(response as any).output:[];const grounded=output.some(x=>x?.type==='file_search_call'||x?.type==='web_search_call'||x?.type==='web_search_preview_call');
  if(!grounded)return NextResponse.json({...fallback,engine:'local_fallback'});
  return NextResponse.json({primary,secondary,label:String(parsed.label||fallback.label).slice(0,70),icon:String(parsed.icon||fallback.icon).slice(0,5),reason:String(parsed.reason||fallback.reason).slice(0,260),intensity:['guided','balanced','challenge'].includes(parsed.intensity)?parsed.intensity:fallback.intensity,visualLabel:String(parsed.visualLabel||fallback.visualLabel).slice(0,80),engine:'ai'});
 }catch(error){console.error('Experience selector failed',error);return NextResponse.json({...fallback,engine:'local_fallback'})}
}
