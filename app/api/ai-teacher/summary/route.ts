import OpenAI from 'openai';
import {NextResponse} from 'next/server';
import {getLesson,getStudent} from '../../../../lib/data';

type Body={lessonId?:string;mastery?:number;wrongQuestionIds?:string[];gapTitle?:string|null;learnerModel?:any};
type Summary={headline:string;mastered:string;needsWork:string;nextStep:string;reviewQuestion:string};

function fallback(lessonId:string,mastery:number):Summary|null{
  const lesson=getLesson(lessonId);if(!lesson)return null;
  return {headline:mastery>=80?'أحسنتِ، يمكنك البناء على هذا الدرس':'أنجزتِ الدرس، ونحتاج تثبيت نقطة أو نقطتين',mastered:`تعلمتِ الفكرة الأساسية في ${lesson.title}.`,needsWork:mastery>=80?'لا توجد فجوة واضحة من النتيجة الحالية.':'راجعي النقاط التي أخطأتِ فيها قبل المراجعة القادمة.',nextStep:mastery>=80?'انتقلي للدرس التالي مع مراجعة قصيرة لاحقًا.':'أعيدي تدريبًا قصيرًا على الأخطاء فقط، ثم تحققي من الفهم.',reviewQuestion:lesson.questions[0]?.text||'اشرحي أهم فكرة من الدرس بكلماتك.'};
}
function cleanJson(text:string){return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}
function valid(x:any):Summary|null{if(!x||typeof x.headline!=='string'||typeof x.mastered!=='string'||typeof x.needsWork!=='string'||typeof x.nextStep!=='string'||typeof x.reviewQuestion!=='string')return null;return {headline:x.headline.slice(0,180),mastered:x.mastered.slice(0,700),needsWork:x.needsWork.slice(0,700),nextStep:x.nextStep.slice(0,700),reviewQuestion:x.reviewQuestion.slice(0,500)}}

export async function POST(request:Request){
  let body:Body;try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const lessonId=String(body.lessonId||'');const lesson=getLesson(lessonId);if(!lesson)return NextResponse.json({error:'lesson_not_found'},{status:404});const student=getStudent(lesson.student);if(!student)return NextResponse.json({error:'student_not_found'},{status:404});const mastery=Math.max(0,Math.min(100,Number(body.mastery)||0));const backup=fallback(lessonId,mastery);
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({summary:backup,mode:'local'});
  const wrong=(body.wrongQuestionIds||[]).map(id=>lesson.questions.find(q=>q.id===id)).filter(Boolean).map(q=>`- ${q!.text}: ${q!.explanation}`).join('\n');
  const model=body.learnerModel||{};const recentMis=(model.misconceptions||[]).slice(0,5).map((m:any)=>`- ${String(m.misconception||'').slice(0,300)}`).join('\n');const gaps=(model.gaps||[]).slice(0,5).map((g:any)=>`- ${String(g.title||'')}: ${Number(g.score)||0}%`).join('\n');
  const instructions=`أنت معلم شخصي يختتم درسًا لطفلة في المنهاج الفلسطيني. لخص التقدم تربويًا لا إداريًا. لا تجامل إذا بقي ضعف، ولا تثقل الطفلة بتفاصيل كثيرة. ركز على: ما أتقنته، نقطة واحدة أو اثنتين تحتاجان تثبيتًا، الخطوة التالية الأقصر، وسؤال مراجعة واحد. لا تعرض تفاصيل تقنية أو نسب ثقة أو مصادر. أعد JSON فقط: {"headline":"...","mastered":"...","needsWork":"...","nextStep":"...","reviewQuestion":"..."}.`;
  const prompt=`الطالبة: ${student.name}\nالصف: ${student.grade}\nالمادة: ${lesson.subject}\nالدرس: ${lesson.title}\nالإتقان النهائي: ${mastery}%\nالفجوة المحتملة: ${body.gapTitle||'لا توجد'}\n\nالأخطاء المتبقية في هذا الدرس:\n${wrong||'- لا توجد أخطاء متبقية.'}\n\nفجوات المادة الأقدم:\n${gaps||'- لا توجد فجوات مسجلة.'}\n\nسوء فهم رُصد سابقًا:\n${recentMis||'- لا يوجد.'}\n\nهدف الدرس:\n${lesson.learningPoints.join('\n')}`;
  try{const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});const tools:any[]=[];if(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID)tools.push({type:'file_search',vector_store_ids:[process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID],max_num_results:4});const response=await client.responses.create({model:process.env.OPENAI_TUTOR_MODEL||'gpt-5',instructions,input:prompt,...(tools.length?{tools}:{}),max_output_tokens:750});const summary=valid(cleanJson(response.output_text||''));if(!summary)throw new Error('invalid_summary');return NextResponse.json({summary,mode:'ai'})}catch(error){console.error('AI lesson summary failed',error);return NextResponse.json({summary:backup,mode:'local_fallback'})}
}
