export type CreativeOutcome={attempts:number;successes:number;successRate:number;lastAt:string};
export type CreativeSignal={lessonId:string;title:string;attempts:number;successRate:number;lastAt:string};

export function recordCreativeOutcome(student:string,subject:string,lessonId:string,ok:boolean){
 if(typeof window==='undefined')return;
 const subjectKey=`creativeProfile:${student}:${subject}`;const conceptKey=`conceptStudio:${student}:${lessonId}`;
 const update=(key:string)=>{let x:{attempts:number;successes:number;lastAt?:string}={attempts:0,successes:0};try{const raw=localStorage.getItem(key);if(raw)x=JSON.parse(raw)}catch{}const attempts=Number(x.attempts||0)+1;const successes=Number(x.successes||0)+(ok?1:0);const value={attempts,successes,successRate:Math.round(successes/attempts*100),lastAt:new Date().toISOString()};localStorage.setItem(key,JSON.stringify(value));return value};
 update(subjectKey);update(conceptKey);
}

export function readCreativeOutcome(student:string,lessonId:string):CreativeOutcome|null{
 if(typeof window==='undefined')return null;const raw=localStorage.getItem(`conceptStudio:${student}:${lessonId}`);if(!raw)return null;try{const x=JSON.parse(raw);const attempts=Number(x.attempts||0);const successes=Number(x.successes||0);if(!attempts)return null;return {attempts,successes,successRate:Number.isFinite(Number(x.successRate))?Number(x.successRate):Math.round(successes/attempts*100),lastAt:String(x.lastAt||'')}}catch{return null}
}
