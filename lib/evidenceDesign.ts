import type {Lesson} from './data';
import {buildObjectiveQuestionMap} from './objectiveCoverage';

export type EvidenceKind='recognize'|'apply'|'explain'|'construct'|'compare'|'correct_error'|'transfer';
export type EvidenceInteraction='choice'|'short_text';

export type EvidenceTask={
 id:string;
 objectiveId:number;
 scope:'objective'|'transfer';
 kind:EvidenceKind;
 interaction:EvidenceInteraction;
 prompt:string;
 questionId:string|null;
 options?:string[];
 correctIndex?:number;
 explanation?:string;
 quality:'direct'|'inferred';
};

const has=(text:string,re:RegExp)=>re.test(text.toLowerCase());

function kindFor(subject:string,objective:string):EvidenceKind{
 if(has(objective,/فسر|اشرح|علل|explain|why|reason|justify/))return 'explain';
 if(has(objective,/قارن|فرق|ميز|compare|distinguish|differentiate/))return 'compare';
 if(has(objective,/اكتب|كون|انشئ|صغ|write|create|compose|sentence/))return 'construct';
 if(has(objective,/صحح|خطأ|error|correct/))return 'correct_error';
 if(has(objective,/طبق|حل|استخدم|احسب|apply|solve|calculate|use/))return 'apply';
 if(subject==='اللغة العربية'||subject==='English')return 'construct';
 if(subject==='العلوم والحياة')return 'explain';
 if(subject==='الرياضيات')return 'apply';
 return 'recognize';
}

function textPrompt(lesson:Lesson,kind:EvidenceKind,qText?:string){
 if(kind==='explain')return qText?`فسّري إجابتك بطريقتك: ${qText}`:'اكتبي تفسيرًا قصيرًا يوضح لماذا تحدث هذه النتيجة.';
 if(kind==='compare')return qText?`قارني بين فكرتين في هذا الموقف: ${qText}`:'اذكري فرقًا واضحًا بين الحالتين، ومتى نستخدم كل واحدة.';
 if(kind==='construct'){
   if(lesson.subject==='English')return qText?`Write your own example for this idea. You may use this situation as a guide: ${qText}`:'Write one new sentence that uses the pattern correctly.';
   return qText?`اكتبي مثالًا جديدًا من عندك يطبق الفكرة الموجودة في هذا الموقف: ${qText}`:'اكتبي مثالًا جديدًا من عندك يطبق الفكرة.';
 }
 if(kind==='correct_error')return qText?`تخيلي أن زميلة أجابت عن هذا الموقف إجابة خاطئة: ${qText} اكتبي التصحيح وسبب الخطأ.`:'صححي الفكرة الخاطئة واكتبي السبب باختصار.';
 if(kind==='apply')return qText?`حلّي أو طبقي الفكرة بنفسك، ثم اكتبي طريقتك أو النتيجة: ${qText}`:'استخدمي الفكرة في مثال جديد واكتبي كيف وصلتِ للنتيجة.';
 return qText||'اختاري الإجابة التي تدل على فهم الفكرة.';
}

function transferPrompt(lesson:Lesson){
 if(lesson.subject==='العلوم والحياة')return `تخيلي موقفًا جديدًا يختلف عن مثال الدرس في ${lesson.title}. ماذا تتوقعين أن يحدث؟ اكتبي توقعك واذكري الدليل أو السبب الذي تعتمدين عليه.`;
 if(lesson.subject==='الرياضيات')return `اصنعي مسألة جديدة بأرقام أو سياق مختلف تستخدم نفس الفكرة في ${lesson.title}، ثم اكتبي الحل أو الطريقة التي ستستخدمينها.`;
 if(lesson.subject==='اللغة العربية')return `استخدمي ما تعلمته في ${lesson.title} داخل جملة أو موقف جديد مختلف عن أمثلة الدرس، ثم وضحي باختصار لماذا استخدامك صحيح.`;
 if(lesson.subject==='English')return `Use the idea from ${lesson.title} in a completely new situation. Write your own example and briefly explain why it works.`;
 return `استخدمي فكرة الدرس في موقف جديد مختلف عن المثال السابق، ثم اشرحي كيف عرفتِ أنها تنطبق هنا.`;
}

export function buildEvidenceTasks(lesson:Lesson):EvidenceTask[]{
 const objectives=lesson.learningPoints.length?lesson.learningPoints:[lesson.summary];
 const map=buildObjectiveQuestionMap(lesson);
 return objectives.map((objective,index)=>{
   const kind=kindFor(lesson.subject,objective);
   const direct=map[index]?.links.find(x=>x.quality==='direct')||map[index]?.links[0];
   const q=direct?lesson.questions.find(x=>x.id===direct.questionId):lesson.questions[index%Math.max(1,lesson.questions.length)];
   const quality=direct?.quality==='direct'?'direct':'inferred';
   const useChoice=kind==='recognize'&&Boolean(q?.options?.length);
   return {
     id:`${lesson.id}:evidence:${index+1}`,
     objectiveId:index+1,
     scope:'objective',
     kind,
     interaction:useChoice?'choice':'short_text',
     prompt:textPrompt(lesson,kind,q?.text),
     questionId:q?.id||null,
     options:useChoice?q?.options:undefined,
     correctIndex:useChoice?q?.correct:undefined,
     explanation:q?.explanation,
     quality
   };
 });
}

export function buildTransferTask(lesson:Lesson):EvidenceTask{
 return {
   id:`${lesson.id}:transfer`,
   objectiveId:0,
   scope:'transfer',
   kind:'transfer',
   interaction:'short_text',
   prompt:transferPrompt(lesson),
   questionId:null,
   quality:'direct'
 };
}
