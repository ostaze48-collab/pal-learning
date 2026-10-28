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
  for(const goal of getFoundationGoals(student)){
    for(const subskillId of goal.subskillIds){
      const scoreRaw=localStorage.getItem(`recoveryDeep:${student}:${goal.skillId}:${subskillId}`);
      const score=scoreRaw===null?null:Number(scoreRaw);
      const reviewRaw=localStorage.getItem(`recoveryReview:${student}:${goal.skillId}:${subskillId}`);
      let retentionStable=false;
      if(reviewRaw){
        try{
          const review=JSON.parse(reviewRaw);
          retentionStable=Number(review.stage)>=2&&Number(review.score)>=80;
        }catch{}
      }
      // Unmeasured or not yet stable stays on the teacher's private verification list.
      if(score===null||!Number.isFinite(score)||score<80||!retentionStable){
        return {...goal,subskillId,score};
      }
    }
  }
  return null;
}
