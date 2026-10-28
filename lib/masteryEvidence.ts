export type UnderstandingOutcome='understood'|'partial'|'misconception';
export type MasteryEvidenceInput={quizPercent:number;understanding?:UnderstandingOutcome|null;conceptSuccess?:number|null;conceptAttempts?:number|null};
export type MasteryEvidenceResult={mastery:number;quizScore:number;understandingScore:number|null;conceptScore:number|null;status:'mastered'|'review_needed';reason:string};

function understandingScore(outcome:UnderstandingOutcome|undefined|null){
 if(outcome==='understood')return 100;
 if(outcome==='partial')return 65;
 if(outcome==='misconception')return 35;
 return null;
}

export function combineMasteryEvidence(input:MasteryEvidenceInput):MasteryEvidenceResult{
 const quiz=Math.max(0,Math.min(100,Math.round(input.quizPercent)));
 const explain=understandingScore(input.understanding);
 const concept=Number(input.conceptAttempts||0)>=2&&Number.isFinite(Number(input.conceptSuccess))?Math.max(0,Math.min(100,Math.round(Number(input.conceptSuccess)))):null;
 const parts:Array<{score:number;weight:number}>= [{score:quiz,weight:.6}];
 if(explain!==null)parts.push({score:explain,weight:.25});
 if(concept!==null)parts.push({score:concept,weight:.15});
 const totalWeight=parts.reduce((s,p)=>s+p.weight,0);const mastery=Math.round(parts.reduce((s,p)=>s+p.score*p.weight,0)/totalWeight);
 const conceptualBlock=input.understanding==='misconception';
 const status:MasteryEvidenceResult['status']=mastery>=80&&!conceptualBlock?'mastered':'review_needed';
 const reason=conceptualBlock?'الإجابات وحدها لا تكفي لأن تفسير الفكرة كشف سوء فهم.':explain===null&&concept===null?'الإتقان مبني حاليًا على التدريب فقط وسيزداد دقة عند توفر تفسير أو مختبر.':status==='mastered'?'التمارين والفهم/التفاعل تعطي أدلة متوافقة على الإتقان.':'يوجد اختلاف أو ضعف بين التمارين والتفسير/التفاعل ويحتاج تثبيتًا قصيرًا.';
 return {mastery,quizScore:quiz,understandingScore:explain,conceptScore:concept,status,reason};
}
