export type FoundationGoal={
  student:string;
  subject:string;
  skillId:string;
  subskillIds:string[];
  title:string;
  reason:string;
};

// Private teacher/parent goals. These are not labels shown to the child as a "gap".
// A goal disappears naturally as each exact subskill reaches mastery and retention.
export const foundationGoals:FoundationGoal[]=[
  {
    student:'salma',
    subject:'الرياضيات',
    skillId:'math-mult-div',
    subskillIds:['tables-2-5-10','tables-3-4','tables-6-7','tables-8-9'],
    title:'سرعة حقائق الضرب',
    reason:'إتقان حقائق الضرب يخفف الحمل الذهني في العوامل والقسمة والكسور والمسائل متعددة الخطوات.'
  }
];

export function getFoundationGoals(student:string){
  return foundationGoals.filter(g=>g.student===student);
}

export function getNextOpenFoundationGoal(student:string){
  if(typeof window==='undefined')return null;
  const now=Date.now();
  for(const goal of getFoundationGoals(student)){
    for(const subskillId of goal.subskillIds){
      const scoreRaw=localStorage.getItem(`recoveryDeep:${student}:${goal.skillId}:${subskillId}`);
      const score=scoreRaw===null?null:Number(scoreRaw);
      const reviewRaw=localStorage.getItem(`recoveryReview:${student}:${goal.skillId}:${subskillId}`);
      let review:{stage?:number;score?:number;dueAt?:string;status?:string}|null=null;
      if(reviewRaw){try{review=JSON.parse(reviewRaw)}catch{}}

      // Never measured, invalid, or still below mastery: keep it on the private goal list now.
      if(score===null||!Number.isFinite(score)||score<80)return {...goal,subskillId,score};

      // Mastered once: let spaced review scheduling decide when it comes back.
      // While the retention check is in the future, move on to another open subskill.
      if(review){
        const stage=Number(review.stage||0);const reviewScore=Number(review.score||score);const due=review.dueAt?new Date(review.dueAt).getTime():NaN;
        if(stage>=2&&reviewScore>=80)continue;
        if(Number.isFinite(due)&&due>now)continue;
        // A due retention check is handled by DailyPlan's retention queue, so do not duplicate it here.
        if(review.status==='retention_check'&&Number.isFinite(due)&&due<=now)continue;
      }

      // Mastery exists but review metadata is missing/incomplete: verify once so the goal is not silently lost.
      return {...goal,subskillId,score};
    }
  }
  return null;
}