import {lessons,type Lesson} from './data';
import {getObjectiveIncomingRelations} from './objectiveKnowledgeGraph';
import {buildStudentObjectiveMasteryMap,type ObjectiveMasteryRecord} from './objectiveMastery';

export type InterleavedConnection={
 sourceLessonId:string;
 sourceObjectiveId:number;
 sourceText:string;
 sourceStatus:ObjectiveMasteryRecord['status'];
 relation:string;
 prompt:string;
 bridge:string;
};

function lessonIndex(lessonId:string){return lessons.findIndex(x=>x.id===lessonId)}
function usable(record:ObjectiveMasteryRecord){return ['mastered','secure','review_due'].includes(record.status)}
function score(record:ObjectiveMasteryRecord,relation:string){let value=record.status==='review_due'?5:record.status==='secure'?4:3;if(relation==='prerequisite_of')value+=4;else if(relation==='extends_to'||relation==='applies_to')value+=2;value+=Math.min(2,record.confidence/50);return value}

export function getInterleavedConnection(lesson:Lesson,currentObjectiveId=1):InterleavedConnection|null{
 if(typeof window==='undefined'||lesson.kind==='assessment'||currentObjectiveId!==1)return null;
 const mastery=buildStudentObjectiveMasteryMap(lesson.student);const byKey=new Map(mastery.objectives.map(x=>[`${x.lessonId}:${x.objectiveId}`,x]));const candidates:Array<{record:ObjectiveMasteryRecord;relation:string;score:number}>=[];
 for(const item of getObjectiveIncomingRelations(lesson.student,lesson.id,currentObjectiveId)){
  const node=item.node;if(!node||node.kind!=='objective'||!node.lessonId||!node.objectiveId||node.lessonId===lesson.id)continue;const record=byKey.get(`${node.lessonId}:${node.objectiveId}`);if(record&&usable(record))candidates.push({record,relation:item.edge.relation,score:score(record,item.edge.relation)});
 }
 if(!candidates.length){
  const currentIndex=lessonIndex(lesson.id);for(const record of mastery.objectives){if(record.subject!==lesson.subject||record.lessonId===lesson.id||!usable(record))continue;const idx=lessonIndex(record.lessonId);if(idx<0||idx>=currentIndex)continue;candidates.push({record,relation:'subject_recall',score:score(record,'subject_recall')-(currentIndex-idx)*.08})}
 }
 const picked=candidates.sort((a,b)=>b.score-a.score)[0];if(!picked)return null;const source=picked.record;
 const english=lesson.subject==='English';return {sourceLessonId:source.lessonId,sourceObjectiveId:source.objectiveId,sourceText:source.objectiveText,sourceStatus:source.status,relation:picked.relation,prompt:english?'Without opening the old lesson, what do you remember about this idea?':'من دون فتح الدرس السابق، ماذا تتذكرين عن هذه الفكرة؟',bridge:english?'How might that idea help with what you are discovering now?':'كيف يمكن أن تساعدك هذه الفكرة في ما تكتشفينه الآن؟'};
}
