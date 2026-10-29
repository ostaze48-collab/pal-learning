import type {Lesson} from './data';
import {buildEvidenceTasks,type EvidenceTask} from './evidenceDesign';

export type IndependentEvidenceNovelty='new_surface'|'reframed'|'generated_independent';
export type IndependentEvidenceTask=EvidenceTask&{stage:'independent';novelty:IndependentEvidenceNovelty;sourceQuestionId?:string|null};

function normalize(text:unknown){return String(text||'').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,' ').trim()}
function sameOptions(a?:string[],b?:string[]){if(!a?.length||!b?.length||a.length!==b.length)return false;return a.every((x,i)=>normalize(x)===normalize(b[i]))}
function substantialOverlap(a:string,b:string){const left=normalize(a);const right=normalize(b);if(!left||!right)return false;if(left===right)return true;const shorter=left.length<=right.length?left:right;const longer=left.length>right.length?left:right;return shorter.length>=12&&longer.includes(shorter)}

function independentPrompt(lesson:Lesson,objectiveId:number,kind:EvidenceTask['kind']){
 const objective=lesson.learningPoints[objectiveId-1]||lesson.summary;
 if(lesson.subject==='English'){
  if(kind==='compare')return `Create two new examples that show the difference in this skill: ${objective}`;
  if(kind==='explain')return `Explain this idea using a new situation that was not used in the lesson: ${objective}`;
  if(kind==='construct')return `Build one fresh example of your own that proves this skill: ${objective}`;
  if(kind==='correct_error')return `Invent a common wrong example for this skill, then correct it and explain the change: ${objective}`;
  return `Use this skill in a fresh example with different words, numbers, or context: ${objective}`;
 }
 if(lesson.subject==='الرياضيات'){
  if(kind==='compare')return `اصنعي مثالين جديدين يوضحان الفرق في هذه المهارة، ثم قارني بينهما: ${objective}`;
  if(kind==='explain')return `استخدمي أرقامًا أو شكلًا جديدًا، ثم اشرحي لماذا تعمل الفكرة: ${objective}`;
  if(kind==='correct_error')return `اصنعي حلًا خاطئًا محتملًا لهذه المهارة ثم صححيه واشرحي الخطأ: ${objective}`;
  return `طبقي المهارة بأرقام جديدة من عندك، واكتبي النتيجة أو الطريقة: ${objective}`;
 }
 if(lesson.subject==='العلوم والحياة'){
  if(kind==='compare')return `اختاري حالتين جديدتين لم نستخدمهما في الشرح، وقارني بينهما باستخدام هذه الفكرة: ${objective}`;
  if(kind==='explain')return `تخيلي ملاحظة جديدة مرتبطة بهذه الفكرة، ثم فسريها بدليل أو سبب: ${objective}`;
  if(kind==='correct_error')return `اكتبي تفسيرًا خاطئًا محتملًا لهذه الفكرة ثم صححيه بالدليل: ${objective}`;
  return `استخدمي هذه الفكرة في حالة جديدة واكتبي ما تتوقعين حدوثه ولماذا: ${objective}`;
 }
 if(lesson.subject==='اللغة العربية'){
  if(kind==='compare')return `اكتبي مثالين جديدين يوضحان الفرق في هذه المهارة، ثم بيني الفرق: ${objective}`;
  if(kind==='explain')return `استخدمي جملة أو سياقًا جديدًا ثم اشرحي الفكرة بأسلوبك: ${objective}`;
  if(kind==='correct_error')return `اكتبي مثالًا خاطئًا شائعًا في هذه المهارة ثم صححيه واذكري السبب: ${objective}`;
  return `اكتبي جملة أو مثالًا جديدًا من عندك يطبق هذه المهارة: ${objective}`;
 }
 return `استخدمي هذه الفكرة في مثال جديد مختلف عن أمثلة الدرس: ${objective}`;
}

function sourceReuse(lesson:Lesson,task:EvidenceTask){
 if(!task.questionId)return null;
 const q=lesson.questions.find(x=>x.id===task.questionId);if(!q)return null;
 const exactPrompt=substantialOverlap(task.prompt,q.text);
 const optionsReused=sameOptions(task.options,q.options);
 const statementReusesQuestion=Boolean(task.statement)&&substantialOverlap(String(task.statement),q.text);
 return {q,exactPrompt,optionsReused,statementReusesQuestion,reusesSurface:exactPrompt||optionsReused||statementReusesQuestion};
}

function makeIndependent(lesson:Lesson,task:EvidenceTask):IndependentEvidenceTask{
 const reuse=sourceReuse(lesson,task);
 if(!reuse?.reusesSurface){
  return {...task,stage:'independent',novelty:task.questionId?'reframed':'new_surface',sourceQuestionId:task.questionId};
 }
 return {
  id:`${task.id}:independent`,objectiveId:task.objectiveId,scope:'objective',kind:task.kind,
  interaction:'short_text',prompt:independentPrompt(lesson,task.objectiveId,task.kind),questionId:null,
  explanation:lesson.learningPoints[task.objectiveId-1]||task.explanation,quality:'direct',depth:'deep',
  stage:'independent',novelty:'generated_independent',sourceQuestionId:reuse.q.id
 };
}

export function buildIndependentEvidenceTasks(lesson:Lesson):IndependentEvidenceTask[]{
 return buildEvidenceTasks(lesson).filter(x=>x.scope==='objective').map(task=>makeIndependent(lesson,task));
}

export function auditIndependentEvidence(lessons:Lesson[]){
 const issues:Array<{lessonId:string;objectiveId:number;code:'SOURCE_QUESTION_REUSE';message:string}>=[];
 let total=0;let generated=0;let novel=0;
 for(const lesson of lessons){
  if(lesson.kind==='assessment')continue;
  const tasks=buildIndependentEvidenceTasks(lesson);total+=tasks.length;
  for(const task of tasks){
   if(task.novelty==='generated_independent')generated++;else novel++;
   const reuse=sourceReuse(lesson,task);
   if(reuse?.reusesSurface)issues.push({lessonId:lesson.id,objectiveId:task.objectiveId,code:'SOURCE_QUESTION_REUSE',message:'مهمة التطبيق المستقل ما زالت تعيد سطح سؤال الاختبار نفسه.'});
  }
 }
 return {total,generated,novel,issues};
}
