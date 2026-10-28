export type UnderstandingOutcome='understood'|'partial'|'misconception';
export type MasteryEvidenceInput={
 quizPercent:number;
 understanding?:UnderstandingOutcome|null;
 conceptSuccess?:number|null;
 conceptAttempts?:number|null;
 objectiveEvidencePercent?:number|null;
 objectiveEvidenceCount?:number|null;
 transferSuccess?:boolean|null;
};
export type MasteryEvidenceResult={
 mastery:number;
 confidence:number;
 quizScore:number;
 understandingScore:number|null;
 conceptScore:number|null;
 objectiveEvidenceScore:number|null;
 transferScore:number|null;
 status:'mastered'|'review_needed';
 reason:string;
};

function understandingScore(outcome:UnderstandingOutcome|undefined|null){
 if(outcome==='understood')return 100;
 if(outcome==='partial')return 65;
 if(outcome==='misconception')return 35;
 return null;
}
function validScore(value:unknown){return value!==null&&value!==undefined&&Number.isFinite(Number(value))?Math.max(0,Math.min(100,Math.round(Number(value)))):null}

export function combineMasteryEvidence(input:MasteryEvidenceInput):MasteryEvidenceResult{
 const quiz=Math.max(0,Math.min(100,Math.round(input.quizPercent)));
 const explain=understandingScore(input.understanding);
 const concept=Number(input.conceptAttempts||0)>=2?validScore(input.conceptSuccess):null;
 const objective=Number(input.objectiveEvidenceCount||0)>0?validScore(input.objectiveEvidencePercent):null;
 const transfer=input.transferSuccess===true?100:input.transferSuccess===false?35:null;

 const parts:Array<{score:number;weight:number;channel:string}>=[{score:quiz,weight:.35,channel:'quiz'}];
 if(objective!==null)parts.push({score:objective,weight:.3,channel:'objective'});
 if(transfer!==null)parts.push({score:transfer,weight:.2,channel:'transfer'});
 if(explain!==null)parts.push({score:explain,weight:.15,channel:'explain'});
 if(concept!==null)parts.push({score:concept,weight:.15,channel:'concept'});
 const totalWeight=parts.reduce((s,p)=>s+p.weight,0);
 const mastery=Math.round(parts.reduce((s,p)=>s+p.score*p.weight,0)/totalWeight);
 const channels=parts.length;
 const confidence=Math.min(96,55+Math.max(0,channels-1)*10+Math.min(6,Number(input.objectiveEvidenceCount||0)*2));
 const conceptualBlock=input.understanding==='misconception';
 const objectiveBlock=objective!==null&&objective<65;
 const transferBlock=input.transferSuccess===false;
 const status:MasteryEvidenceResult['status']=mastery>=80&&!conceptualBlock&&!objectiveBlock&&!transferBlock?'mastered':'review_needed';
 let reason:string;
 if(conceptualBlock)reason='تفسير الفكرة كشف سوء فهم؛ لا تكفي الإجابات الصحيحة وحدها.';
 else if(objectiveBlock)reason='أدلة المهارات المباشرة أظهرت أن جزءًا من الدرس لم يثبت بعد.';
 else if(transferBlock)reason='الفهم الأساسي موجود لكن استخدام الفكرة في موقف جديد ما زال يحتاج تثبيتًا.';
 else if(objective!==null&&transfer!==null&&status==='mastered')reason='الاختبار وأدلة المهارات ونقل التعلم تعطي صورة متوافقة على الإتقان.';
 else if(explain===null&&concept===null&&objective===null)reason='الإتقان مبني حاليًا على الاختبار فقط، لذلك الثقة محدودة حتى تتوفر أدلة متنوعة.';
 else reason=status==='mastered'?'توجد أدلة متعددة ومتوافقة على الإتقان.':'بعض قنوات الدليل ما زالت غير مستقرة وتحتاج تثبيتًا قصيرًا.';
 return {mastery,confidence,quizScore:quiz,understandingScore:explain,conceptScore:concept,objectiveEvidenceScore:objective,transferScore:transfer,status,reason};
}
