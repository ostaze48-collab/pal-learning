import {getLesson} from './data';
import {
 detectMisconceptionFromChoice as detectBaseChoice,
 getMisconceptions as getBaseMisconceptions,
 validateMisconceptionLibrary as validateBaseLibrary,
 type MisconceptionSpec
} from './misconceptionLibrary';
import {misconceptionExtensions} from './misconceptionExtensions';

export type {MisconceptionDetection,MisconceptionExperience,MisconceptionRecheck,MisconceptionSpec} from './misconceptionLibrary';

function extensionsFor(lessonId:string,objectiveId?:number){
 return misconceptionExtensions.filter(x=>x.lessonId===lessonId&&(objectiveId===undefined||x.objectiveId===objectiveId));
}

export function getMisconceptions(lessonId:string,objectiveId?:number){
 return [...getBaseMisconceptions(lessonId,objectiveId),...extensionsFor(lessonId,objectiveId)];
}

export function getPrimaryMisconception(lessonId:string,objectiveId:number){
 return getMisconceptions(lessonId,objectiveId)[0]||null;
}

export function detectMisconceptionFromChoice(lessonId:string,questionId:string,selectedIndex:number){
 const extended=misconceptionExtensions.find(spec=>spec.lessonId===lessonId&&spec.detection.some(d=>d.signal==='wrong_choice'&&d.questionId===questionId&&(!d.wrongOptionIndexes||d.wrongOptionIndexes.includes(selectedIndex))));
 return extended||detectBaseChoice(lessonId,questionId,selectedIndex)||null;
}

function validateExtensions(){
 const issues:string[]=[];const ids=new Set<string>();
 for(const spec of misconceptionExtensions){
  if(ids.has(spec.id))issues.push(`duplicate extension misconception id: ${spec.id}`);ids.add(spec.id);
  const lesson=getLesson(spec.lessonId);if(!lesson){issues.push(`${spec.id}: missing lesson ${spec.lessonId}`);continue}
  const objectiveCount=Math.max(1,lesson.learningPoints.length);
  if(spec.objectiveId<1||spec.objectiveId>objectiveCount)issues.push(`${spec.id}: objective ${spec.objectiveId} outside 1..${objectiveCount}`);
  for(const detection of spec.detection){
   if(detection.questionId&&!lesson.questions.some(q=>q.id===detection.questionId))issues.push(`${spec.id}: missing question ${detection.questionId}`);
   if(detection.questionId&&detection.wrongOptionIndexes?.length){
    const question=lesson.questions.find(q=>q.id===detection.questionId);
    if(question)for(const index of detection.wrongOptionIndexes)if(index<0||index>=question.options.length||index===question.correct)issues.push(`${spec.id}: invalid wrong option ${index} for ${detection.questionId}`);
   }
  }
  if(spec.recheck.options&&(!Number.isInteger(spec.recheck.correctIndex)||Number(spec.recheck.correctIndex)<0||Number(spec.recheck.correctIndex)>=spec.recheck.options.length))issues.push(`${spec.id}: invalid recheck correctIndex`);
 }
 return {count:misconceptionExtensions.length,issues};
}

export function validateMisconceptionLibrary(){
 const base=validateBaseLibrary();const extensions=validateExtensions();
 return {count:base.count+extensions.count,issues:[...base.issues,...extensions.issues]};
}

export function getAllExtendedMisconceptions():MisconceptionSpec[]{return [...misconceptionExtensions]}
