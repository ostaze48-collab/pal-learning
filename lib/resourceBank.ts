import {curriculumSources,getRecoveryGradeBand} from './curriculumKnowledge';
import {getExternalResources} from './externalResources';

export type ResourceKind='current'|'recovery'|'worksheet'|'guide'|'framework'|'external';
export type ResourceCard={id:string;title:string;url:string;kind:ResourceKind;gradeLabel:string;trust:string;description:string};

export function getResourceBank(currentGrade:number):ResourceCard[]{
  const previous=getRecoveryGradeBand(currentGrade);
  const grades=[...previous,currentGrade];
  const cards:ResourceCard[]=[];
  for(const source of curriculumSources){
    if(!source.grades?.some(g=>grades.includes(g))&&!['elearn-worksheets','elearn-framework','elearn-curriculum-docs'].includes(source.id))continue;
    let kind:ResourceKind='framework';
    if(source.kind==='worksheet')kind='worksheet';
    else if(source.kind==='teacher-guide')kind='guide';
    else if(source.kind==='curriculum'||source.kind==='package')kind=source.grades?.includes(currentGrade)?'current':'recovery';
    cards.push({
      id:source.id,title:source.title,url:source.url,kind,
      gradeLabel:source.grades?.includes(currentGrade)?`الصف ${currentGrade}`:source.grades?.filter(g=>previous.includes(g)).length?`مرجع للصفوف ${source.grades.filter(g=>previous.includes(g)).join('، ')}`:'مرجع عام',
      trust:source.authority==='official'?'رسمي':'داعم رسمي',description:source.note
    });
  }
  for(const source of getExternalResources(currentGrade)){
    cards.push({id:source.id,title:source.title,url:source.url,kind:'external',gradeLabel:`الصف ${currentGrade}`,trust:'خارجي مساند',description:`${source.note} · مستوى الثقة الداخلي ${source.trust}/100.`});
  }
  return [...new Map(cards.map(c=>[c.id,c])).values()];
}

export const resourceUsePolicy=[
  {label:'رسمي',description:'الكتاب، الرزمة، فهرس المنهاج والإطار الوطني: المرجع الأعلى للمعلومة.'},
  {label:'داعم رسمي',description:'دليل المعلم وأوراق العمل: تستخدم للشرح والتدريب والتقويم.'},
  {label:'خارجي مساند',description:'اختبارات وشروح وحلول من مواقع تعليمية خارجية. نستخدمها للمقارنة والتدريب فقط، ولا ننسبها للوزارة.'},
  {label:'AI مساعد',description:'ينشئ أمثلة وتمارين جديدة مشابهة، ولا يصفها بأنها نص أو حل رسمي.'}
];
