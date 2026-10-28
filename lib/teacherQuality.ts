export type TeacherQuality={score:number;pass:boolean;issues:string[]};

type CardLike={title?:string;body?:string;kind?:string};
type PayloadLike={title?:string;intro?:string;cards?:CardLike[];checkQuestion?:{text?:string;hint?:string}};

function normalize(text:string){return text.toLowerCase().replace(/[\s،,.!?؟:;()\-]/g,'').slice(0,500)}

export function evaluateTeacherQuality(payload:PayloadLike,mode:string):TeacherQuality{
  const issues:string[]=[];let score=100;
  const cards=Array.isArray(payload.cards)?payload.cards:[];
  const explain=cards.filter(c=>c.kind==='explain');
  const examples=cards.filter(c=>c.kind==='example');
  const tips=cards.filter(c=>c.kind==='tip');
  const totalText=[payload.intro||'',...cards.map(c=>c.body||'')].join(' ').trim();

  if((payload.intro||'').trim().length<55){issues.push('المقدمة قصيرة ولا تبني المعنى بما يكفي.');score-=14}
  if(!explain.length){issues.push('لا توجد بطاقة تفسير للمفهوم.');score-=25}
  if(mode!=='check'&&!examples.length){issues.push('لا يوجد مثال تطبيقي واضح.');score-=25}
  if(['overview','deep','step_by_step','real_world','analogy'].includes(mode)&&examples.length<2){issues.push('يحتاج مثالًا ثانيًا مختلفًا لتثبيت انتقال الفهم.');score-=10}
  if(!payload.checkQuestion?.text?.trim()){issues.push('لا يوجد سؤال تحقق من الفهم.');score-=18}
  if(totalText.length<320&&mode!=='check'){issues.push('الشرح أقصر من المطلوب لفهم متين.');score-=12}

  const bodies=cards.map(c=>normalize(c.body||'')).filter(Boolean);
  let duplicates=0;
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++)if(bodies[i].length>35&&bodies[i]===bodies[j])duplicates++;
  if(duplicates){issues.push('توجد بطاقات تكرر نفس الشرح بدل تغيير التمثيل.');score-=Math.min(20,duplicates*10)}

  const misleadingPhrases=['كما ورد حرفيًا في الوزارة','نص الوزارة يقول','وفق الوزارة حرفيًا'];
  if(misleadingPhrases.some(p=>totalText.includes(p))){issues.push('صياغة قد توحي بنسبة نص مولد للوزارة.');score-=25}

  if(mode==='deep'&&!tips.length){issues.push('الشرح الموسع يحتاج تنبيهًا أو ربطًا يساعد على تنظيم المعلومات.');score-=6}
  score=Math.max(0,Math.min(100,score));
  return {score,pass:score>=72&&!issues.some(x=>x.includes('لا توجد بطاقة تفسير')||x.includes('لا يوجد مثال تطبيق')),issues};
}
