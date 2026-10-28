import type {DeepSubskill} from './deepDiagnostics';

export type AdaptiveStatus='mastered'|'application_gap'|'fragile_foundation'|'foundation_gap'|'needs_verification';
export type AdaptiveEvidence={questionId:string;correct:boolean;mode:'entry'|'verify'|'supported';responseMs:number};
export type AdaptiveResult={
  subskillId:string;
  score:number;
  status:AdaptiveStatus;
  label:string;
  cause:string;
  nextAction:string;
  confidence:'high'|'medium'|'low';
  evidence:AdaptiveEvidence[];
};

export function evaluateAdaptiveSubskill(sub:DeepSubskill,evidence:AdaptiveEvidence[],priorScore?:number):AdaptiveResult{
  const entry=evidence.find(x=>x.mode==='entry');
  const verify=evidence.find(x=>x.mode==='verify'||x.mode==='supported');
  const only=evidence[0];
  let status:AdaptiveStatus='needs_verification';
  let score=50;
  let confidence:'high'|'medium'|'low'='medium';

  if(entry&&verify){
    if(entry.correct&&verify.correct){status='mastered';score=100;confidence='high'}
    else if(entry.correct&&!verify.correct){status='application_gap';score=65;confidence='high'}
    else if(!entry.correct&&verify.correct){status='fragile_foundation';score=65;confidence='high'}
    else {status='foundation_gap';score=25;confidence='high'}
  }else if(only){
    if(only.correct&&typeof priorScore==='number'&&priorScore>=90){status='mastered';score=100;confidence='medium'}
    else if(only.correct){status='needs_verification';score=80;confidence='low'}
    else {status='foundation_gap';score=35;confidence='medium'}
  }

  const labels:Record<AdaptiveStatus,string>={
    mastered:'متقنة',
    application_gap:'الأساس موجود لكن التطبيق غير ثابت',
    fragile_foundation:'المعلومة موجودة لكنها تحتاج تثبيتًا',
    foundation_gap:'فجوة تأسيسية واضحة',
    needs_verification:'تحتاج سؤال تحقق إضافي'
  };
  const causes:Record<AdaptiveStatus,string>={
    mastered:'الإجابات تشير إلى فهم ثابت وقدرة على التطبيق.',
    application_gap:'نجحت في الأساس ثم أخطأت في التحقق؛ الاحتمال الأقرب هو ضعف نقل القاعدة إلى مثال جديد أو الانتباه للخطوات.',
    fragile_foundation:'الإجابة الأولى كانت خاطئة ثم تحسن الأداء بعد التلميح؛ هذا يشير إلى أن الأساس موجود لكنه غير مستقر أو بطيء الاستدعاء.',
    foundation_gap:`الأداء يشير إلى أن مفهوم «${sub.title}» نفسه يحتاج إعادة بناء قصيرة قبل الاستمرار.`,
    needs_verification:'لدينا دليل واحد فقط، لذلك لا نريد الحكم على المهارة بسرعة.'
  };
  const next:Record<AdaptiveStatus,string>={
    mastered:'انتقلي إلى المهارة التالية دون علاج إضافي.',
    application_gap:`طبقي ${sub.title} على مثالين جديدين ثم سؤال تحقق دون مساعدة.`,
    fragile_foundation:`راجعي الفكرة الأساسية في ${sub.title} ثم تدربي على 3 أسئلة قصيرة للاستدعاء السريع.`,
    foundation_gap:`ابدئي بالشرح المصغر، ثم ${sub.treatmentSteps[0]||'تدريب أساسي قصير'}، ثم أعيدي سؤال تحقق.`,
    needs_verification:'أجيبي عن سؤال تحقق آخر قبل تحديد الخطة.'
  };
  return {subskillId:sub.id,score,status,label:labels[status],cause:causes[status],nextAction:next[status],confidence,evidence};
}

export function shouldStartWithVerification(priorScore:number|undefined,questionCount:number){
  return typeof priorScore==='number'&&priorScore>=90&&questionCount>1;
}
