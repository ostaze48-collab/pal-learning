import {curriculumSources,getRecoveryGradeBand} from './curriculumKnowledge';
import {getExternalResources} from './externalResources';

export type ResourceKind='current'|'recovery'|'summary'|'worksheet'|'guide'|'framework'|'external';
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
    else if(source.kind==='package')kind='summary';
    else if(source.kind==='textbook'||source.kind==='curriculum')kind=source.grades?.includes(currentGrade)?'current':'recovery';
    cards.push({
      id:source.id,title:source.title,url:source.url,kind,
      gradeLabel:source.grades?.includes(currentGrade)?`الصف ${currentGrade}`:source.grades?.filter(g=>previous.includes(g)).length?`مرجع للصفوف ${source.grades.filter(g=>previous.includes(g)).join('، ')}`:'مرجع عام',
      trust:source.kind==='textbook'?'كتاب وزاري — المصدر الأساسي':source.kind==='package'?'رزمة طوارئ — ملخص':source.authority==='official'?'رسمي':'داعم رسمي',description:source.note
    });
  }
  for(const source of getExternalResources(currentGrade)){
    cards.push({id:source.id,title:source.title,url:source.url,kind:'external',gradeLabel:`الصف ${currentGrade}`,trust:'خارجي مساند',description:`${source.note} · مستوى الثقة الداخلي ${source.trust}/100.`});
  }
  return [...new Map(cards.map(c=>[c.id,c])).values()];
}

export const resourceUsePolicy=[
  {label:'الكتاب الوزاري',description:'المصدر الأول للتعلم: منه نأخذ محتوى الدرس، المفاهيم، المصطلحات، التسلسل والمستوى العلمي المطلوب.'},
  {label:'دليل المعلم',description:'يساعد في اختيار أفضل طريقة للشرح والتقويم بعد تثبيت محتوى الدرس من الكتاب.'},
  {label:'الرزمة التعليمية',description:'ملخص طوارئ وحد أدنى للتعلم. تستخدم للمراجعة السريعة ولا تقود الشرح الموسع.'},
  {label:'أوراق العمل والاختبارات',description:'تستخدم للتدريب والتشخيص والتثبيت بعد الشرح، وليست بديلًا عن الكتاب.'},
  {label:'خارجي مساند',description:'اختبارات وشروح وحلول من مواقع تعليمية خارجية. نستخدمها للمقارنة والتدريب فقط، ولا ننسبها للوزارة.'},
  {label:'AI مساعد',description:'يبسط محتوى الكتاب ويولّد أمثلة وتمارين ووسائل شرح جديدة، لكنه لا يغيّر المفهوم المنهجي ولا يصف المحتوى المولد بأنه نص رسمي.'}
];
