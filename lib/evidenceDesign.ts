import type {Lesson} from './data';
import {buildObjectiveQuestionMap} from './objectiveCoverage';
import {getExplicitEvidenceSpecs} from './evidenceSpecs';
import {getEvidenceSpecExtensions} from './evidenceSpecsExtensions';
import {getLanguageEvidenceSpecs} from './evidenceLanguageSpecs';
import {getPriorityEvidenceSpecs} from './evidencePrioritySpecs';
import {getMisconceptions} from './misconceptionLibrary';

export type EvidenceKind='recognize'|'apply'|'explain'|'construct'|'compare'|'correct_error'|'transfer';
export type EvidenceInteraction='choice'|'short_text'|'match'|'order'|'error_fix'|'experiment_choice';

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
 depth:'quick'|'deep';
 pairs?:Array<{item:string;target:string}>;
 targets?:string[];
 orderItems?:string[];
 statement?:string;
 observation?:string;
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

function objectiveDirectPrompt(lesson:Lesson,kind:EvidenceKind,objective:string){
 if(lesson.subject==='English'){
   if(kind==='compare')return `Show the difference in your own example: ${objective}`;
   if(kind==='explain')return `Explain this idea in one or two sentences: ${objective}`;
   if(kind==='construct')return `Write one new example that proves you can do this: ${objective}`;
   if(kind==='correct_error')return `Write a common wrong example, then correct it: ${objective}`;
   return `Use this skill in one new example and show your answer: ${objective}`;
 }
 if(kind==='compare')return `أظهري الفرق بمثال من عندك: ${objective}`;
 if(kind==='explain')return `اشرحي هذه الفكرة بجملة أو جملتين من عندك: ${objective}`;
 if(kind==='construct')return `اكتبي مثالًا جديدًا يثبت أنكِ تستطيعين هذا: ${objective}`;
 if(kind==='correct_error')return `اكتبي مثالًا خاطئًا شائعًا ثم صححيه لتوضحي هذه الفكرة: ${objective}`;
 if(kind==='recognize')return `اكتبي مثالًا واحدًا يدل مباشرة على فهمك لهذه الفكرة: ${objective}`;
 return `طبقي هذه المهارة في مثال جديد من عندك، واكتبي طريقتك أو النتيجة: ${objective}`;
}

function transferPrompt(lesson:Lesson){
 if(lesson.subject==='العلوم والحياة')return `تخيلي موقفًا جديدًا يختلف عن مثال الدرس في ${lesson.title}. ماذا تتوقعين أن يحدث؟ اكتبي توقعك واذكري الدليل أو السبب الذي تعتمدين عليه.`;
 if(lesson.subject==='الرياضيات')return `اصنعي مسألة جديدة بأرقام أو سياق مختلف تستخدم نفس الفكرة في ${lesson.title}، ثم اكتبي الحل أو الطريقة التي ستستخدمينها.`;
 if(lesson.subject==='اللغة العربية')return `استخدمي ما تعلمته في ${lesson.title} داخل جملة أو موقف جديد مختلف عن أمثلة الدرس، ثم وضحي باختصار لماذا استخدامك صحيح.`;
 if(lesson.subject==='English')return `Use the idea from ${lesson.title} in a completely new situation. Write your own example and briefly explain why it works.`;
 return `استخدمي فكرة الدرس في موقف جديد مختلف عن المثال السابق، ثم اشرحي كيف عرفتِ أنها تنطبق هنا.`;
}

function deepPriority(kind:EvidenceKind){
 if(kind==='explain'||kind==='compare'||kind==='correct_error')return 3;
 if(kind==='construct')return 2;
 if(kind==='apply')return 1;
 return 0;
}

function preferredStructuredInteraction(lesson:Lesson,objective:string,kind:EvidenceKind,deep:boolean,hasOptions:boolean):EvidenceInteraction{
 if(deep||!hasOptions)return 'short_text';
 const key=`${lesson.id} ${lesson.title} ${objective}`.toLowerCase();
 if(kind==='correct_error')return 'error_fix';
 if(lesson.subject==='العلوم والحياة'&&/سبب|نتيجة|تغير|تحول|قوة|ضغط|طاقة|تفاعل|حركة|سرعة|تسارع|استنتج|فسر|why|cause|effect|change|force|pressure|energy|reaction|motion|speed|acceleration/.test(key))return 'experiment_choice';
 if(lesson.subject==='اللغة العربية'&&/همز|إملاء|تاء|لام شمس|لام قمر|اسم|فعل|ضمير|معرب|مبني|إعراب|قاعدة/.test(key))return 'error_fix';
 if(lesson.subject==='English'&&/question|punctuation|present|past|perfect|continuous|adverb|stative|comparative|pronoun|tense|grammar/.test(key))return 'error_fix';
 return 'choice';
}

function explicitTasks(lesson:Lesson):EvidenceTask[]|null{
 const priority=getPriorityEvidenceSpecs(lesson.id)||[];
 const language=getLanguageEvidenceSpecs(lesson.id)||[];
 const extensions=getEvidenceSpecExtensions(lesson.id)||[];
 const base=getExplicitEvidenceSpecs(lesson.id)||[];
 const specs=[...priority,...language,...extensions,...base];if(!specs.length)return null;
 return specs.map(spec=>{
   const q=spec.questionId?lesson.questions.find(x=>x.id===spec.questionId):undefined;
   const deep=spec.interaction==='short_text';
   const structuredOptions=spec.options||(spec.interaction==='choice'?q?.options:undefined);
   const structuredCorrect=spec.correctIndex??(spec.interaction==='choice'?q?.correct:undefined);
   return {
    id:`${lesson.id}:evidence:${spec.objectiveId}`,
    objectiveId:spec.objectiveId,
    scope:'objective' as const,
    kind:spec.kind,
    interaction:spec.interaction,
    prompt:spec.prompt,
    questionId:q?.id||null,
    options:structuredOptions,
    correctIndex:structuredCorrect,
    explanation:spec.explanation||q?.explanation,
    quality:spec.quality,
    depth:deep?'deep' as const:'quick' as const,
    pairs:spec.pairs,
    targets:spec.targets,
    orderItems:spec.orderItems,
    statement:spec.statement,
    observation:spec.observation
   };
 });
}

function generatedEvidenceTasks(lesson:Lesson):EvidenceTask[]{
 const objectives=lesson.learningPoints.length?lesson.learningPoints:[lesson.summary];
 const map=buildObjectiveQuestionMap(lesson);
 const prepared=objectives.map((objective,index)=>{
   const kind=kindFor(lesson.subject,objective);
   const directLink=map[index]?.links.find(x=>x.quality==='direct');
   const fallbackLink=map[index]?.links[0];
   const selectedLink=directLink||fallbackLink;
   const q=selectedLink?lesson.questions.find(x=>x.id===selectedLink.questionId):lesson.questions[index%Math.max(1,lesson.questions.length)];
   return {objective,index,kind,directLink,q};
 });
 const openBudget=lesson.student==='salma'?1:2;
 const deepIndexes=new Set(prepared.filter(x=>Boolean(x.directLink)).map(x=>({index:x.index,priority:deepPriority(x.kind),hasQuestion:Boolean(x.q?.options?.length)})).sort((a,b)=>b.priority-a.priority||Number(a.hasQuestion)-Number(b.hasQuestion)||a.index-b.index).slice(0,openBudget).map(x=>x.index));
 return prepared.map(({objective,index,kind,directLink,q})=>{
   if(!directLink){
     return {id:`${lesson.id}:evidence:${index+1}`,objectiveId:index+1,scope:'objective',kind,interaction:'short_text',prompt:objectiveDirectPrompt(lesson,kind,objective),questionId:null,explanation:objective,quality:'direct',depth:'deep'};
   }
   const mustWrite=!q?.options?.length;const deep=mustWrite||deepIndexes.has(index);const naturalInteraction=preferredStructuredInteraction(lesson,objective,kind,deep,Boolean(q?.options?.length));
   const knownWrongChoice=q?getMisconceptions(lesson.id,index+1).flatMap(spec=>spec.detection).find(d=>d.signal==='wrong_choice'&&d.questionId===q.id&&Boolean(d.wrongOptionIndexes?.length)):undefined;
   const interaction=naturalInteraction==='choice'&&knownWrongChoice?'error_fix':naturalInteraction;
   if(interaction==='error_fix'&&q?.options?.length){
     const mappedWrong=knownWrongChoice?.wrongOptionIndexes?.find(i=>i>=0&&i<q.options.length&&i!==q.correct);
     const wrongIndex=mappedWrong??q.options.findIndex((_,i)=>i!==q.correct);const wrong=wrongIndex>=0?q.options[wrongIndex]:q.options[0];
     const prompt=lesson.subject==='English'?`A learner chose an answer for this situation: ${q.text} Which option corrects the idea?`:`في هذا الموقف: ${q.text} أي اختيار يصحح الفكرة؟`;
     const statement=lesson.subject==='English'?`The learner chose: ${wrong}`:`اختارت زميلة: ${wrong}`;
     return {id:`${lesson.id}:evidence:${index+1}`,objectiveId:index+1,scope:'objective',kind,interaction,prompt,questionId:q.id,options:q.options,correctIndex:q.correct,explanation:q.explanation,quality:'direct',depth:'quick',statement};
   }
   if(interaction==='experiment_choice'&&q?.options?.length){
     return {id:`${lesson.id}:evidence:${index+1}`,objectiveId:index+1,scope:'objective',kind,interaction,prompt:'بعد قراءة الموقف، أي اختيار يطابق الدليل أو يفسره أفضل؟',questionId:q.id,options:q.options,correctIndex:q.correct,explanation:q.explanation,quality:'direct',depth:'quick',observation:q.text};
   }
   return {id:`${lesson.id}:evidence:${index+1}`,objectiveId:index+1,scope:'objective',kind,interaction,prompt:interaction==='choice'?(q?.text||textPrompt(lesson,kind)):textPrompt(lesson,kind,q?.text),questionId:q?.id||null,options:interaction==='choice'?q?.options:undefined,correctIndex:interaction==='choice'?q?.correct:undefined,explanation:q?.explanation,quality:'direct',depth:interaction==='short_text'?'deep':'quick'};
 });
}

export function buildEvidenceTasks(lesson:Lesson):EvidenceTask[]{
 const generated=generatedEvidenceTasks(lesson);
 const explicit=explicitTasks(lesson);
 if(!explicit)return generated;
 const byObjective=new Map<number,EvidenceTask>();
 for(const task of explicit){if(task.objectiveId>=1&&task.objectiveId<=generated.length&&!byObjective.has(task.objectiveId))byObjective.set(task.objectiveId,task)}
 return generated.map(task=>byObjective.get(task.objectiveId)||task);
}

export function buildTransferTask(lesson:Lesson):EvidenceTask{
 return {id:`${lesson.id}:transfer`,objectiveId:0,scope:'transfer',kind:'transfer',interaction:'short_text',prompt:transferPrompt(lesson),questionId:null,quality:'direct',depth:'deep'};
}