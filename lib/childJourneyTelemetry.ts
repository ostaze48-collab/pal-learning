export type ChildJourneyEventName='today_view'|'world_view'|'lesson_view'|'lesson_complete';
export type ChildJourneyEvent={sessionId:string;student:string;event:ChildJourneyEventName;at:string;lessonId?:string;subjectKey?:string};

type JourneySession={id:string;lastAt:number};
const SESSION_MS=30*60*1000;
const MAX_EVENTS=500;

function eventKey(student:string){return `childJourney:${student}`}
function sessionKey(student:string){return `childJourneySession:${student}`}

function getSession(student:string):JourneySession|null{
 if(typeof window==='undefined')return null;
 const now=Date.now();
 try{
  const raw=localStorage.getItem(sessionKey(student));
  if(raw){const saved=JSON.parse(raw) as JourneySession;if(saved?.id&&Number.isFinite(saved.lastAt)&&now-saved.lastAt<SESSION_MS){const next={...saved,lastAt:now};localStorage.setItem(sessionKey(student),JSON.stringify(next));return next}}
 }catch{}
 const next={id:`${student}-${now.toString(36)}-${Math.random().toString(36).slice(2,7)}`,lastAt:now};
 try{localStorage.setItem(sessionKey(student),JSON.stringify(next))}catch{}
 return next;
}

export function recordChildJourneyEvent(student:string,event:ChildJourneyEventName,meta:{lessonId?:string;subjectKey?:string}={}){
 if(typeof window==='undefined')return;
 const session=getSession(student);if(!session)return;
 try{
  const raw=localStorage.getItem(eventKey(student));const old=raw?JSON.parse(raw):[];const list:Array<ChildJourneyEvent>=Array.isArray(old)?old:[];
  const duplicate=[...list].reverse().find(item=>item?.sessionId===session.id&&item?.event===event&&(meta.lessonId?item?.lessonId===meta.lessonId:true)&&(meta.subjectKey?item?.subjectKey===meta.subjectKey:true));
  if(duplicate)return;
  const next=list.slice(-(MAX_EVENTS-1));next.push({sessionId:session.id,student,event,at:new Date().toISOString(),...meta});localStorage.setItem(eventKey(student),JSON.stringify(next));
 }catch{}
}

export function readChildJourneyEvents(student:string):ChildJourneyEvent[]{
 if(typeof window==='undefined')return [];
 try{const raw=localStorage.getItem(eventKey(student));const parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[]}catch{return []}
}
