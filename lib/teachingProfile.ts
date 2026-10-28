export type TeachingMode='overview'|'simplify'|'step_by_step'|'analogy'|'real_world'|'deep'|'check';
export type ModeStats={uses:number;understood:number;partial:number;misconception:number;score:number};
export type TeachingProfile={student:string;subject:string;updatedAt:string;modes:Partial<Record<TeachingMode,ModeStats>>;preferredMode?:TeachingMode};

const defaultStats=():ModeStats=>({uses:0,understood:0,partial:0,misconception:0,score:0});

export function profileKey(student:string,subject:string){return `aiTeachingProfile:${student}:${subject}`}

export function readTeachingProfile(student:string,subject:string):TeachingProfile{
  if(typeof window==='undefined')return {student,subject,updatedAt:new Date(0).toISOString(),modes:{}};
  const raw=localStorage.getItem(profileKey(student,subject));
  if(raw){try{const parsed=JSON.parse(raw);if(parsed&&parsed.student===student&&parsed.subject===subject)return parsed}catch{}}
  return {student,subject,updatedAt:new Date().toISOString(),modes:{}};
}

function effectiveness(s:ModeStats){
  if(!s.uses)return 0;
  const quality=(s.understood*3+s.partial-s.misconception*2)/Math.max(1,s.uses);
  const evidence=Math.min(1,s.uses/4);
  return Math.round(quality*evidence*100)/100;
}

export function recordTeachingUse(student:string,subject:string,mode:TeachingMode){
  const profile=readTeachingProfile(student,subject);const stats={...(profile.modes[mode]||defaultStats())};stats.uses+=1;stats.score=effectiveness(stats);profile.modes={...profile.modes,[mode]:stats};profile.updatedAt=new Date().toISOString();localStorage.setItem(profileKey(student,subject),JSON.stringify(profile));return profile;
}

export function recordTeachingOutcome(student:string,subject:string,mode:TeachingMode,outcome:'understood'|'partial'|'misconception'){
  const profile=readTeachingProfile(student,subject);const stats={...(profile.modes[mode]||defaultStats())};if(outcome==='understood')stats.understood+=1;else if(outcome==='partial')stats.partial+=1;else stats.misconception+=1;stats.score=effectiveness(stats);profile.modes={...profile.modes,[mode]:stats};
  const candidates=(Object.entries(profile.modes) as Array<[TeachingMode,ModeStats]>).filter(([,s])=>s.uses>=2).sort((a,b)=>b[1].score-a[1].score);
  profile.preferredMode=candidates[0]?.[0]||profile.preferredMode;profile.updatedAt=new Date().toISOString();localStorage.setItem(profileKey(student,subject),JSON.stringify(profile));return profile;
}

export function chooseTeachingMode(student:string,subject:string,diagnosticCorrect:boolean,weakestScore?:number):TeachingMode{
  if(!diagnosticCorrect)return 'simplify';
  if(typeof weakestScore==='number'&&weakestScore<50)return 'simplify';
  if(typeof weakestScore==='number'&&weakestScore<80)return 'step_by_step';
  const preferred=readTeachingProfile(student,subject).preferredMode;
  if(preferred&&preferred!=='check')return preferred;
  return 'overview';
}
