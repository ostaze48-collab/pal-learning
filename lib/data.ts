import {grade5NumberTheoryLessons} from './grade5NumberTheory';
import {grade5FractionLessons} from './grade5Fractions';
import {grade5DecimalLessons} from './grade5Decimals';
import {grade5GeometryLessons} from './grade5Geometry';
import {grade5DataLessons} from './grade5Data';
import {grade5ScienceLessons} from './grade5Science';
import {grade5ArabicLessons} from './grade5Arabic';
import {grade7MathLessons} from './grade7Math';
import {grade7GeometryLessons} from './grade7Geometry';
import {grade7ProportionLessons} from './grade7Proportion';
import {grade7StatisticsLessons} from './grade7Statistics';
import {grade7ScienceLessons} from './grade7Science';
import {grade7ScienceChemistryLessons} from './grade7ScienceChemistry';
import {grade7SciencePressureLessons} from './grade7SciencePressure';
import {grade7ArabicLessons} from './grade7Arabic';

export type Student={slug:string;name:string;grade:number;semester:number;emoji:string};
export type Question={id:string;text:string;options:string[];correct:number;explanation:string};
export type Lesson={id:string;student:string;subject:string;title:string;minutes:number;summary:string;learningPoints:string[];example:string;questions:Question[];kind?:string};

export const students:Student[]=[
  {slug:'salma',name:'سلمى',grade:5,semester:1,emoji:'👧'},
  {slug:'sama',name:'سما',grade:7,semester:1,emoji:'👩‍🎓'}
];

export const lessons:Lesson[]=[
  ...grade5NumberTheoryLessons,
  ...grade5FractionLessons,
  ...grade5DecimalLessons,
  ...grade5GeometryLessons,
  ...grade5DataLessons,
  ...grade5ScienceLessons,
  ...grade5ArabicLessons,
  ...grade7MathLessons,
  ...grade7GeometryLessons,
  ...grade7ProportionLessons,
  ...grade7StatisticsLessons,
  ...grade7ScienceLessons,
  ...grade7ScienceChemistryLessons,
  ...grade7SciencePressureLessons,
  ...grade7ArabicLessons
];

export function getStudent(slug:string){return students.find(s=>s.slug===slug)}
export function getLesson(id:string){return lessons.find(l=>l.id===id)}
export function getStudentLessons(slug:string){return lessons.filter(l=>l.student===slug)}

export function getLessonUnit(lesson:Lesson){
  const id=lesson.id;

  if(lesson.subject==='اللغة العربية'){
    if(lesson.student==='salma'){
      if(id==='g5-ar-reading-blessings' || id==='g5-ar-poem-call-you') return 'الوحدة 1 · قراءة ونصوص';
      if(id==='g5-ar-noun-types' || id==='g5-ar-pronouns') return 'الوحدة 2 · القواعد اللغوية';
      if(id==='g5-ar-solar-lunar-l' || id==='g5-ar-ta-spelling') return 'الوحدة 3 · الإملاء';
      return 'مراجعة العربية';
    }
    if(id==='g7-ar-reading-mercy' || id==='g7-ar-reading-palestine-heart' || id==='g7-ar-reading-student-mother') return 'الوحدة 1 · القراءة والفهم';
    if(id==='g7-ar-middle-hamza') return 'الوحدة 2 · الإملاء';
    if(id==='g7-ar-definite-indefinite' || id==='g7-ar-sound-verbs' || id==='g7-ar-weak-verbs') return 'الوحدة 3 · القواعد اللغوية';
    return 'مراجعة العربية';
  }

  if(lesson.subject==='العلوم والحياة'){
    if(lesson.student==='salma'){
      if(id.startsWith('g5-science-cell')) return 'الوحدة 1 · الخلية';
      if(['g5-science-materials-properties','g5-science-separation-methods','g5-science-physical-chemical-changes','g5-science-materials-check'].includes(id)) return 'الوحدة 2 · المادة';
      return 'الوحدة 3 · الطاقة';
    }
    if(id.startsWith('g7-science-atom') || id.includes('important-compounds') || id.includes('chemical-reactions') || id.includes('chemistry-check')) return 'الوحدة 2 · الذرة والمركبات والتفاعلات';
    if(id.includes('atmospheric-pressure') || id.includes('pressure-check')) return 'الوحدة 3 · الضغط الجوي';
    return 'الوحدة 1 · الحركة وقوانين نيوتن';
  }

  if(lesson.student==='salma'){
    if(['g5-math-prime-numbers','g5-math-prime-factorization','g5-math-gcf','g5-math-lcm','g5-math-unit1-check'].includes(id)) return 'الوحدة 1 · الأعداد والعوامل';
    if(id.includes('fraction') || id==='g5-math-whole-times-fraction' || id==='g5-math-whole-div-fraction') return 'الوحدة 2 · ضرب الكسور العادية وقسمتها';
    if(id.includes('decimal')) return 'الوحدة 3 · الكسور العشرية';
    if(['g5-math-triangles','g5-math-area-units','g5-math-rectangle-square-area','g5-math-nets','g5-math-prism-surface-area','g5-math-geometry-check'].includes(id)) return 'الوحدة 4 · الهندسة والمساحة';
    return 'الوحدة 5 · تنظيم البيانات وتمثيلها';
  }

  if(['g7-math-integers','g7-math-integer-order','g7-math-absolute-value','g7-math-add-subtract-integers','g7-math-multiply-divide-integers','g7-math-integer-properties','g7-math-unit1-check'].includes(id)) return 'الوحدة 1 · الأعداد الصحيحة';
  if(['g7-math-cartesian-plane','g7-math-reflection-translation','g7-math-prism-cube-volume','g7-math-quadrilateral-pyramid','g7-math-pyramid-surface-area','g7-math-pyramid-volume','g7-math-unit2-check'].includes(id)) return 'الوحدة 2 · الهندسة والقياس';
  if(id.includes('proportion') || id==='g7-math-scale') return 'الوحدة 3 · التناسب ومقياس الرسم';
  return 'الوحدة 4 · الإحصاء';
}
