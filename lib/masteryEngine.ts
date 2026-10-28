import {lessons,getLessonUnit,getStudent,type Lesson} from './data';
import {gapSkills,lessonPrerequisites} from './skillGraph';
import {recoverySkills} from './recoverySkills';

export type MasteryStatus='unknown'|'check'|'blocked'|'ready'|'learning'|'mastered'|'secure'|'review';
export type MasteryEvidence={source:string;score:number;weight:number;at?:string;note?:string};
export type KnowledgeNode={
 id:string;kind:'foundation'|'lesson'|'assessment';title:string;subject:string;grade:number;unit?:string;
 prerequisiteIds:string[];score:number|null;status:MasteryStatus;readiness:number|null;readinessStatus:'ready'|'check'|'blocked';
 evidence:MasteryEvidence[];weakPrerequisites:Array<{id:string;title:string;score:number|null}>;
};
export type KnowledgeMap={student:string;nodes:KnowledgeNode[];nextRecommended?:KnowledgeNode;blockedNext?:KnowledgeNode;updatedAt:string};
export type TeacherEvidenceDecision={
 decision:'advance'|'review'|'targeted_reteach';
 reviewAt?:string;
 focus?:string;
 reason:string;
 confidence:number;
 evidence:{quiz:number|null;understanding:number|null;concept:number|null;objective:number|null;transfer:number|null;mastery:number|null};
 generatedAt:string;
 source:'combined_lesson_evidence';
};

const gapToRecovery:Record<string,string>={
 multiplication_facts:'math-mult-div',division_facts:'math-mult-div',factors:'math-mult-div',integer_number_line:'math-number-sense',fraction_basics:'math-fractions'
};

function broadPrerequisites(lesson:Lesson){
 const text=[lesson.title,lesson.summary,...lesson.learningPoints].join(' ').toLowerCase();const out:string[]=[];
 if(lesson.subject==='الرياضيات'){
   if(/fraction|كسر|proportion|تناسب|scale|مقياس/.test(text))out.push('math-fractions','math-mult-div');
   else if(/factor|prime|gcf|lcm|عامل|أولي|مضاعف/.test(text))out.push('math-mult-div');
   else if(/integer|صحيح|سالب|absolute|مطلق/.test(text))out.push('math-number-sense');
   else if(/mean|median|mode|frequency|data|وسط|وسيط|منوال|تكرار/.test(text))out.push('math-add-sub');
   else if(/area|volume|surface|مساحة|حجم/.test(text))out.push('math-mult-div');
 }else if(lesson.subject==='اللغة العربية'){
   if(/reading|قراءة|نص|شعري|فكرة|مقروء/.test(text))out.push('arabic-reading','arabic-vocabulary');
   if(/إملاء|همزة|تاء|لام شمسية|لام قمرية/.test(text))out.push('arabic-spelling');
   if(/قواعد|ضمير|اسم|فعل|مبني|معرب|إعراب/.test(text))out.push('arabic-grammar');
 }else if(lesson.subject==='English'){
   if(/reading|text|message|report|holiday|animal/.test(text))out.push('english-reading','english-vocabulary');
   if(/present|past|perfect|question|pronoun|comparative|frequency|stative|continuous|punctuation/.test(text))out.push('english-sentence','english-vocabulary');
 }else if(lesson.subject==='العلوم والحياة'){
   out.push('science-observation');
   if(/measure|speed|acceleration|distance|pressure|قياس|سرعة|تسارع|مسافة|ضغط/.test(text))out.push('science-measurement');
   if(/cause|effect|force|newton|reaction|change|سبب|نتيجة|قوة|نيوتن|تفاعل|تغير/.test(text))out.push('science-cause');
   if(/cell|atom|compound|matter|energy|motion|خلية|ذرة|مركب|مادة|طاقة|حركة/.test(text))out.push('science-core-concepts');
 }
 return [...new Set(out)];
}

function allPrerequisites(lesson:Lesson){
 const explicit=(lessonPrerequisites[lesson.id]||[]).map(x=>gapToRecovery[x]||x);
 return [...new Set([...explicit,...broadPrerequisites(lesson)])];
}

function readJson(key:string){if(typeof window==='undefined')return null;const raw=localStorage.getItem(key);if(!raw)return null;try{return JSON.parse(raw)}catch{return null}}
function finite(v:unknown){if(v===null||v===undefined||v==='')return null;return Number.isFinite(Number(v))?Number(v):null}
function clampScore(v:number|null){return v===null?null:Math.max(0,Math.min(100,Math.round(v)))}

function deriveTeacherEvidenceDecision(lesson:Lesson,report:any):TeacherEvidenceDecision|null{
 if(!report)return null;
 const quiz=clampScore(finite(report?.quizMastery));
 const understanding=clampScore(finite(report?.understandingScore));
 const concept=clampScore(finite(report?.conceptScore));
 const objective=clampScore(finite(report?.objectiveEvidenceScore));
 const transfer=clampScore(finite(report?.transferScore));
 const mastery=clampScore(finite(report?.mastery));
 const available=[quiz,understanding,concept,objective,transfer].filter(x=>x!==null).length;
 const reportConfidence=clampScore(finite(report?.masteryConfidence));
 const confidence=reportConfidence??(available>=4?94:available===3?88:available===2?78:64);
 const generatedAt=new Date().toISOString();
 const base={confidence,evidence:{quiz,understanding,concept,objective,transfer,mastery},generatedAt,source:'combined_lesson_evidence' as const};
 const misconception=understanding!==null&&understanding<=40;
 const weakConcept=concept!==null&&concept<70;
 const weakObjective=objective!==null&&objective<65;
 const weakTransfer=transfer!==null&&transfer<65;
 const evidenceConflict=quiz!==null&&quiz>=80&&([understanding,concept,objective,transfer].some(x=>x!==null&&Number(x)<65));
 if(misconception||weakConcept||weakObjective||weakTransfer||evidenceConflict){
   const focus=weakTransfer?`نقل فكرة ${lesson.title} إلى موقف جديد`:weakObjective?`مهارة محددة داخل ${lesson.title}`:misconception?`تفسير الفكرة في ${lesson.title}`:weakConcept?`فهم الفكرة عمليًا في ${lesson.title}`:`ربط الحل بالفهم في ${lesson.title}`;
   const reason=weakTransfer?'الفهم الأساسي أفضل من أداء النقل؛ المطلوب مثال جديد يغيّر السياق ثم إعادة قياس قصيرة.':weakObjective?'أدلة المهارات المباشرة كشفت نقطة لم تثبت بعد؛ المطلوب تدخل قصير موجه لها فقط.':misconception?'تفسير الطالبة كشف سوء فهم رغم بقية الأداء؛ المطلوب تغيير طريقة التمثيل قبل التقدم.':weakConcept?'المختبر التفاعلي أظهر أن الفكرة لم تثبت عمليًا؛ المطلوب تمثيل مختلف وممارسة موجهة قصيرة.':'هناك تعارض بين الإجابة الصحيحة ودليل الفهم؛ نحتاج تثبيت المعنى بدل تكرار نفس الأسئلة.';
   return {decision:'targeted_reteach',focus,reason,...base};
 }
 const partial= [understanding,concept,objective,transfer].some(x=>x!==null&&Number(x)<80);
 if(mastery!==null&&mastery>=80&&!partial){
   return {decision:'advance',reason:'الأدلة المتنوعة متوافقة: الاختبار والمهارات/التفاعل والنقل تدعم الانتقال إلى الخطوة التالية.',...base};
 }
 const reviewAt=String(report?.reviewDue||new Date(Date.now()+24*60*60*1000).toISOString());
 const reason=mastery!==null&&mastery>=80?'الإتقان جيد لكن إحدى قنوات الدليل ما زالت هشّة؛ نحتاج مراجعة قصيرة لاحقة للتأكد من الثبات.':'الإتقان الكلي لم يصل بعد إلى حد التقدم بثقة؛ نراجع نقطة قصيرة ثم نعيد القياس.';
 return {decision:'review',reviewAt,reason,...base};
}

function persistTeacherDecision(lesson:Lesson,report:any){
 if(typeof window==='undefined'||!report)return null;
 const existing=readJson(`lesson:${lesson.id}:teacherDecision`)||readJson(`teacherDecision:${lesson.id}`);
 if(existing?.manual===true||existing?.source==='objective_coverage'||existing?.source==='transfer_evidence')return existing;
 const decision=deriveTeacherEvidenceDecision(lesson,report);if(!decision)return existing;
 const packed=JSON.stringify(decision);localStorage.setItem(`lesson:${lesson.id}:teacherDecision`,packed);localStorage.setItem(`teacherDecision:${lesson.id}`,packed);return decision;
}

function foundationEvidence(student:string,id:string):MasteryEvidence[]{
 if(typeof window==='undefined')return [];
 const ev:MasteryEvidence[]=[];
 const broad=finite(localStorage.getItem(`recovery:${student}:${id}`));if(broad!==null)ev.push({source:'recovery_screen',score:broad,weight:0.45});
 const plan=readJson(`recoveryPlan:${student}:${id}`);if(Array.isArray(plan?.weak)&&plan.weak.length){const scores=plan.weak.map((x:any)=>finite(x.score)).filter((x:any)=>x!==null) as number[];if(scores.length)ev.push({source:'deep_diagnostic',score:Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),weight:0.7,note:'متوسط المهارات الفرعية المشخّصة'});}
 for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key||!key.startsWith(`recoveryDeep:${student}:${id}:`))continue;const s=finite(localStorage.getItem(key));if(s!==null)ev.push({source:'deep_subskill',score:s,weight:0.85});}
 return ev;
}

function lessonEvidence(lesson:Lesson):MasteryEvidence[]{
 if(typeof window==='undefined')return [];
 const ev:MasteryEvidence[]=[];const report=readJson(`lesson:${lesson.id}:report`);const mastery=finite(report?.mastery);if(mastery!==null)ev.push({source:'lesson_mastery',score:mastery,weight:1,at:String(report?.completedAt||'')});
 const creative=readJson(`conceptStudio:${lesson.student}:${lesson.id}`)||readJson(`creativeProfile:${lesson.student}:${lesson.id}`);const c=finite(creative?.successRate);if(c!==null)ev.push({source:'concept_studio',score:c,weight:0.55,at:String(creative?.lastAt||creative?.at||'')});
 const decision=persistTeacherDecision(lesson,report)||readJson(`lesson:${lesson.id}:teacherDecision`)||readJson(`teacherDecision:${lesson.id}`);if(decision?.decision==='targeted_reteach')ev.push({source:'teacher_decision',score:55,weight:0.75,note:String(decision.focus||'')});else if(decision?.decision==='review')ev.push({source:'teacher_decision',score:78,weight:0.45,note:String(decision.reason||'')});else if(decision?.decision==='advance')ev.push({source:'teacher_decision',score:92,weight:0.35,note:String(decision.reason||'')});
 return ev;
}

function evidenceScore(ev:MasteryEvidence[]){if(!ev.length)return null;const w=ev.reduce((s,x)=>s+x.weight,0);return Math.round(ev.reduce((s,x)=>s+x.score*x.weight,0)/Math.max(.01,w))}
function statusFor(score:number|null,done:boolean,due:boolean):MasteryStatus{if(score===null)return done?'learning':'unknown';if(due&&score>=80)return'review';if(score>=92)return'secure';if(score>=80)return'mastered';if(done)return'learning';return score<60?'blocked':'check'}

export function buildKnowledgeMap(student:string):KnowledgeMap{
 const s=getStudent(student);if(!s)return {student,nodes:[],updatedAt:new Date().toISOString()};
 const nodes:KnowledgeNode[]=[];const foundationIds=[...new Set(recoverySkills.map(x=>x.id))];
 for(const id of foundationIds){const skill=recoverySkills.find(x=>x.id===id)!;const ev=foundationEvidence(student,id);const score=evidenceScore(ev);nodes.push({id:`foundation:${id}`,kind:'foundation',title:skill.title,subject:skill.subject,grade:Math.max(1,s.grade-1),prerequisiteIds:[],score,status:statusFor(score,score!==null,false),readiness:100,readinessStatus:'ready',evidence:ev,weakPrerequisites:[]});}
 const own=lessons.filter(l=>l.student===student);const byUnit=new Map<string,Lesson[]>();for(const l of own){const key=`${l.subject}::${getLessonUnit(l)}`;if(!byUnit.has(key))byUnit.set(key,[]);byUnit.get(key)!.push(l)}
 for(const [,unitLessons] of byUnit){for(let i=0;i<unitLessons.length;i++){
   const lesson=unitLessons[i];const prereqs=allPrerequisites(lesson).map(x=>`foundation:${x}`);
   if(lesson.kind==='assessment')for(const prev of unitLessons.slice(0,i).filter(x=>x.kind!=='assessment'))prereqs.push(`lesson:${prev.id}`);else if(i>0){const prev=[...unitLessons.slice(0,i)].reverse().find(x=>x.kind!=='assessment');if(prev)prereqs.push(`lesson:${prev.id}`)}
   const ev=lessonEvidence(lesson);const score=evidenceScore(ev);const done=typeof window!=='undefined'&&localStorage.getItem(`lesson:${lesson.id}`)==='done';let due=false;const review=readJson(`lesson:${lesson.id}:review`);if(review?.dueAt)due=new Date(review.dueAt).getTime()<=Date.now();
   nodes.push({id:`lesson:${lesson.id}`,kind:lesson.kind==='assessment'?'assessment':'lesson',title:lesson.title,subject:lesson.subject,grade:s.grade,unit:getLessonUnit(lesson),prerequisiteIds:[...new Set(prereqs)],score,status:statusFor(score,done,due),readiness:null,readinessStatus:'check',evidence:ev,weakPrerequisites:[]});
 }}
 const map=new Map(nodes.map(n=>[n.id,n]));for(const node of nodes.filter(n=>n.kind!=='foundation')){const deps=node.prerequisiteIds.map(id=>map.get(id)).filter(Boolean) as KnowledgeNode[];const known=deps.filter(d=>d.score!==null);node.readiness=known.length?Math.min(...known.map(d=>d.score as number)):null;node.weakPrerequisites=deps.filter(d=>d.score===null||Number(d.score)<80).map(d=>({id:d.id,title:d.title,score:d.score}));node.readinessStatus=deps.some(d=>d.score!==null&&Number(d.score)<65)?'blocked':deps.some(d=>d.score===null||Number(d.score)<80)?'check':'ready';}
 const lessonNodes=nodes.filter(n=>n.kind==='lesson');const unfinished=lessonNodes.filter(n=>n.score===null||Number(n.score)<80);const blockedNext=unfinished.find(n=>n.readinessStatus==='blocked');const nextRecommended=unfinished.find(n=>n.readinessStatus==='ready')||unfinished.find(n=>n.readinessStatus==='check');
 return {student,nodes,nextRecommended,blockedNext,updatedAt:new Date().toISOString()};
}

export function getLessonReadiness(student:string,lessonId:string){return buildKnowledgeMap(student).nodes.find(n=>n.id===`lesson:${lessonId}`)||null}
