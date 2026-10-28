import {grade5NumberTheoryLessons} from './grade5NumberTheory';
import {grade5FractionLessons} from './grade5Fractions';
import {grade5DecimalLessons} from './grade5Decimals';
import {grade5GeometryLessons} from './grade5Geometry';
import {grade5DataLessons} from './grade5Data';
import {grade7MathLessons} from './grade7Math';
import {grade7GeometryLessons} from './grade7Geometry';
import {grade7ProportionLessons} from './grade7Proportion';
import {grade7StatisticsLessons} from './grade7Statistics';

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
  ...grade7MathLessons,
  ...grade7GeometryLessons,
  ...grade7ProportionLessons,
  ...grade7StatisticsLessons
];

export function getStudent(slug:string){return students.find(s=>s.slug===slug)}
export function getLesson(id:string){return lessons.find(l=>l.id===id)}
export function getStudentLessons(slug:string){return lessons.filter(l=>l.student===slug)}

export function getLessonUnit(lesson:Lesson){
  const id=lesson.id;
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
