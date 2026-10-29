import type {Lesson} from './data';

type SavedLessonSession={version?:number;questionCount?:number;objectiveCount?:number;phase?:string;updatedAt?:string};
export type ActiveLessonSession={lesson:Lesson;updatedAt:number};

const resumablePhases=new Set(['discover','build','practice','quiz','gap','remediate','retest']);

function objectiveCount(lesson:Lesson){return lesson.learningPoints.length||1}

export function readActiveLessonSession(lesson:Lesson):ActiveLessonSession|null{
 if(typeof window==='undefined')return null;
 if(localStorage.getItem(`lesson:${lesson.id}`)==='done')return null;
 try{
  const raw=localStorage.getItem(`lesson:${lesson.id}:session`);if(!raw)return null;
  const saved=JSON.parse(raw) as SavedLessonSession;
  const compatible=saved?.version===1&&saved.questionCount===lesson.questions.length&&saved.objectiveCount===objectiveCount(lesson)&&typeof saved.phase==='string'&&resumablePhases.has(saved.phase);
  if(!compatible)return null;
  const updatedAt=Date.parse(String(saved.updatedAt||''));if(!Number.isFinite(updatedAt))return null;
  return {lesson,updatedAt};
 }catch{return null}
}

export function findMostRecentActiveLesson(lessons:Lesson[]){
 const candidates=lessons.map(readActiveLessonSession).filter((item):item is ActiveLessonSession=>Boolean(item));
 candidates.sort((a,b)=>b.updatedAt-a.updatedAt);
 return candidates[0]?.lesson||null;
}
