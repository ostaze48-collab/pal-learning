export type FoundationSignal={
 id:string;
 student:string;
 sourceLessonId:string;
 wrongQuestionIds:string[];
 count:number;
 lastAt:string;
};

type Target={skillId:string;focusId?:string};
// Only persist a foundation signal when there is a real, targeted recovery route.
// Current-grade concept mistakes (for example the concept of factors itself) stay inside lesson remediation.
const targets:Record<string,Target>={
 multiplication_facts:{skillId:'math-mult-div'},
 division_facts:{skillId:'math-mult-div',focusId:'division-inverse'},
 fraction_basics:{skillId:'math-fractions',focusId:'fraction-meaning'}
};

export function targetForFoundationSignal(id:string){return targets[id]||null}

function signalMirrorKey(signal:FoundationSignal){return `lesson:${signal.sourceLessonId}:foundationSignal:${signal.id}`}

export function recordFoundationSignal(student:string,id:string,sourceLessonId:string,wrongQuestionIds:string[]){
 if(typeof window==='undefined'||!id||!targets[id])return;
 const key=`foundationSignal:${student}:${id}`;let previous:FoundationSignal|null=null;try{const raw=localStorage.getItem(key);if(raw)previous=JSON.parse(raw)}catch{}
 const next:FoundationSignal={id,student,sourceLessonId,wrongQuestionIds:[...new Set([...(previous?.wrongQuestionIds||[]),...wrongQuestionIds])].slice(-12),count:Number(previous?.count||0)+1,lastAt:new Date().toISOString()};
 const packed=JSON.stringify(next);localStorage.setItem(key,packed);localStorage.setItem(signalMirrorKey(next),packed);
}

function targetMastered(student:string,target:Target){
 if(typeof window==='undefined')return false;
 if(target.focusId){
  const raw=localStorage.getItem(`recoveryDeep:${student}:${target.skillId}:${target.focusId}`);
  if(raw===null||Number(raw)<80)return false;
  const planRaw=localStorage.getItem(`recoveryPlan:${student}:${target.skillId}`);try{if(planRaw){const plan=JSON.parse(planRaw);if(Array.isArray(plan?.weak)&&plan.weak.some((x:any)=>x.id===target.focusId&&Number(x.score)<80))return false}}catch{}
  return true;
 }
 const broad=localStorage.getItem(`recovery:${student}:${target.skillId}`);if(broad===null||Number(broad)<80)return false;
 const planRaw=localStorage.getItem(`recoveryPlan:${student}:${target.skillId}`);try{if(planRaw){const plan=JSON.parse(planRaw);if(Array.isArray(plan?.weak)&&plan.weak.some((x:any)=>Number(x.score)<80))return false}}catch{}
 return true;
}

export function getOpenFoundationSignals(student:string){
 if(typeof window==='undefined')return [] as Array<FoundationSignal&{target:Target}>;
 const byId=new Map<string,FoundationSignal>();
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);if(!key)continue;
  const canonical=key.startsWith(`foundationSignal:${student}:`);
  const mirrored=key.startsWith('lesson:')&&key.includes(':foundationSignal:');
  if(!canonical&&!mirrored)continue;
  try{const signal=JSON.parse(localStorage.getItem(key)||'') as FoundationSignal;if(signal.student!==student)continue;const previous=byId.get(signal.id);if(!previous||new Date(signal.lastAt).getTime()>new Date(previous.lastAt).getTime())byId.set(signal.id,signal)}catch{}
 }
 const out:Array<FoundationSignal&{target:Target}>=[];
 for(const signal of byId.values()){
  const target=targets[signal.id];if(!target||targetMastered(student,target))continue;out.push({...signal,target});
 }
 return out.sort((a,b)=>b.count-a.count||new Date(b.lastAt).getTime()-new Date(a.lastAt).getTime());
}
