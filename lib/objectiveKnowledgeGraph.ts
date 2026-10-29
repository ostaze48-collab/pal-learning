import {getLessonUnit,lessons,type Lesson} from './data';
import {gapSkills,lessonPrerequisites} from './skillGraph';

export type ObjectiveRelation='prerequisite_of'|'part_of'|'extends_to'|'applies_to'|'contrasts_with';
export type ObjectiveGraphNode={
 id:string;
 kind:'objective'|'lesson'|'foundation';
 title:string;
 student:string;
 subject:string;
 lessonId?:string;
 objectiveId?:number;
 unit?:string;
};
export type ObjectiveGraphEdge={
 from:string;
 to:string;
 relation:ObjectiveRelation;
 confidence:number;
 source:'explicit'|'lesson_sequence'|'curriculum_sequence'|'objective_language';
};
export type ObjectiveKnowledgeGraph={student:string;nodes:ObjectiveGraphNode[];edges:ObjectiveGraphEdge[];updatedAt:string};

function lessonNodeId(lessonId:string){return `lesson:${lessonId}`}
export function objectiveNodeId(lessonId:string,objectiveId:number){return `objective:${lessonId}:${objectiveId}`}
function foundationNodeId(skillId:string){return `foundation:${skillId}`}
function objectivesOf(lesson:Lesson){return lesson.learningPoints.length?lesson.learningPoints:[lesson.summary]}
function applicationObjective(text:string){return /طبق|استخدم|حل|احسب|كوّن|اكتب|جرب|apply|use|solve|calculate|write|create|build/i.test(text)}
function contrastObjective(text:string){return /قارن|فرق|ميز|اختلاف|compare|different|distinguish|contrast/i.test(text)}

export function buildObjectiveKnowledgeGraph(student:string):ObjectiveKnowledgeGraph{
 const own=lessons.filter(lesson=>lesson.student===student&&lesson.kind!=='assessment');const nodes:ObjectiveGraphNode[]=[];const edges:ObjectiveGraphEdge[]=[];const nodeIds=new Set<string>();
 const pushNode=(node:ObjectiveGraphNode)=>{if(nodeIds.has(node.id))return;nodeIds.add(node.id);nodes.push(node)};
 const pushEdge=(edge:ObjectiveGraphEdge)=>{if(edge.from===edge.to)return;if(edges.some(x=>x.from===edge.from&&x.to===edge.to&&x.relation===edge.relation))return;edges.push(edge)};
 for(const lesson of own){
  const unit=getLessonUnit(lesson);const lId=lessonNodeId(lesson.id);pushNode({id:lId,kind:'lesson',title:lesson.title,student,subject:lesson.subject,lessonId:lesson.id,unit});
  const objectives=objectivesOf(lesson);
  objectives.forEach((title,index)=>{const id=objectiveNodeId(lesson.id,index+1);pushNode({id,kind:'objective',title,student,subject:lesson.subject,lessonId:lesson.id,objectiveId:index+1,unit});pushEdge({from:id,to:lId,relation:'part_of',confidence:1,source:'explicit'});if(index>0){const previous=objectiveNodeId(lesson.id,index);const relation=applicationObjective(title)?'applies_to':contrastObjective(title)?'contrasts_with':'extends_to';pushEdge({from:previous,to:id,relation,confidence:relation==='extends_to'?.82:.76,source:'objective_language'})}});
  for(const skillId of lessonPrerequisites[lesson.id]||[]){const fId=foundationNodeId(skillId);pushNode({id:fId,kind:'foundation',title:gapSkills[skillId]?.title||skillId,student,subject:lesson.subject});for(let i=0;i<objectives.length;i++)pushEdge({from:fId,to:objectiveNodeId(lesson.id,i+1),relation:'prerequisite_of',confidence:.8,source:'explicit'})}
 }
 const groups=new Map<string,Lesson[]>();for(const lesson of own){const key=`${lesson.subject}::${getLessonUnit(lesson)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(lesson)}
 for(const unitLessons of groups.values())for(let i=1;i<unitLessons.length;i++){const previous=unitLessons[i-1],current=unitLessons[i];const previousCount=Math.max(1,objectivesOf(previous).length);pushEdge({from:objectiveNodeId(previous.id,previousCount),to:objectiveNodeId(current.id,1),relation:'extends_to',confidence:.62,source:'curriculum_sequence'})}
 return {student,nodes,edges,updatedAt:new Date().toISOString()};
}

export function getObjectiveIncomingRelations(student:string,lessonId:string,objectiveId:number){const graph=buildObjectiveKnowledgeGraph(student);const target=objectiveNodeId(lessonId,objectiveId);const byId=new Map(graph.nodes.map(node=>[node.id,node]));return graph.edges.filter(edge=>edge.to===target&&edge.relation!=='part_of').map(edge=>({edge,node:byId.get(edge.from)||null})).filter(x=>x.node)}

function readJson(key:string){if(typeof window==='undefined')return null;const raw=localStorage.getItem(key);if(!raw)return null;try{return JSON.parse(raw)}catch{return null}}
function objectiveEvidence(lessonId:string,objectiveId:number){const saved=readJson(`lessonEvidence:${lessonId}`);const rows=Array.isArray(saved?.results)?saved.results:[];const matches=rows.filter((x:any)=>x?.scope==='objective'&&Number(x?.objectiveId)===objectiveId);return matches.length?matches[matches.length-1]:null}

export function getObservedPrerequisiteRisks(student:string,lessonId:string,objectiveId:number){
 const incoming=getObjectiveIncomingRelations(student,lessonId,objectiveId);const risks:Array<{id:string;title:string;kind:'objective'|'foundation';relation:ObjectiveRelation;confidence:number;reason:string}>=[];
 for(const item of incoming){const node=item.node!;if(node.kind==='objective'&&node.lessonId&&node.objectiveId){const evidence=objectiveEvidence(node.lessonId,node.objectiveId);if(evidence?.correct===false)risks.push({id:node.id,title:node.title,kind:'objective',relation:item.edge.relation,confidence:Math.min(.95,item.edge.confidence+.08),reason:'هناك دليل سابق مباشر أن هذه الفكرة لم تثبت بعد.'})}else if(node.kind==='foundation'){const scoreRaw=typeof window!=='undefined'?localStorage.getItem(`recovery:${student}:${node.id.replace('foundation:','')}`):null;const score=scoreRaw===null?null:Number(scoreRaw);if(Number.isFinite(score)&&Number(score)<65)risks.push({id:node.id,title:node.title,kind:'foundation',relation:item.edge.relation,confidence:.9,reason:'قياس تأسيسي سابق أظهر أن هذه المهارة تحتاج دعمًا.'})}}
 return risks.sort((a,b)=>b.confidence-a.confidence);
}
