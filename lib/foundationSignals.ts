export type FoundationSignal={
 id:string;
 student:string;
 sourceLessonId:string;
 wrongQuestionIds:string[];
 count:number;
 lastAt:string;
};

type Target={skillId:string;focusId?:string};
const targets:Record<string,Target>={
 multiplication_facts:{skillId:'math-mult-div'},
 division_facts:{skillId:'math-mult-div',focusId:'division-inverse'},
 factors:{skillId:'math-mult-div'},
 fraction_basics:{skillId:'math-fractions',focusId:'fraction-meaning'},
 integer_number_line:{skillId:'math-number-sense'}
};

export function targetForFoundationSignal(id:string){return targets[id]||null}

export function recordFoundationSignal(student:string,id:string,sourceLessonId:string,wrongQuestionIds:string[]){
 if(typeof window==='undefined'||!id||!targets[id])return;
 const key=`foundationSignal:${student}:${id}`;let previous:FoundationSignal|null=null;try{const raw=localStorage.getItem(key);if(raw)previous=JSON.parse(raw)}catch{}
 const next:FoundationSignal={id,student,sourceLessonId,wrongQuestionIds:[...new Set([...(previous?.wrongQuestionIds||[]),...wrongQuestionIds])].slice(-12),count:Number(previous?.count||0)+1,lastAt:new Date().toISOString()};
 localStorage.setItem(key,JSON.stringify(next));
}

function targetMastered(student:string,target:Target){
 if(typeof window==='undefined')return false;
 if(target.focusId){const raw=localStorage.getItem(`recoveryDeep:${student}:${target.skillId}:${target.focusId}`);return raw!==null&&Number(raw)>=80}
 const broad=localStorage.getItem(`recovery:${student}:${target.skillId}`);return broad!==null&&Number(broad)>=80;
}

export function getOpenFoundationSignals(student:string){
 if(typeof window==='undefined')return [] as Array<FoundationSignal&{target:Target}>;
 const out:Array<FoundationSignal&{target:Target}>=[];
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);if(!key||!key.startsWith(`foundationSignal:${student}:`))continue;
  try{const signal=JSON.parse(localStorage.getItem(key)||'') as FoundationSignal;const target=targets[signal.id];if(!target)continue;if(targetMastered(student,target))continue;out.push({...signal,target})}catch{}
 }
 return out.sort((a,b)=>b.count-a.count||new Date(b.lastAt).getTime()-new Date(a.lastAt).getTime());
}
