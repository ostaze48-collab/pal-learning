import {grade5NumberTheoryLessons} from './grade5NumberTheory';
import {grade5FractionLessons} from './grade5Fractions';
import {grade5DecimalLessons} from './grade5Decimals';
import {grade5GeometryLessons} from './grade5Geometry';
import {grade5DataLessons} from './grade5Data';
import {grade5ScienceLessons} from './grade5Science';
import {grade5ArabicLessons} from './grade5Arabic';
import {grade5ArabicExtraLessons} from './grade5ArabicExtra';
import {grade5EnglishLessons} from './grade5English';
import {grade7MathLessons} from './grade7Math';
import {grade7GeometryLessons} from './grade7Geometry';
import {grade7ProportionLessons} from './grade7Proportion';
import {grade7StatisticsLessons} from './grade7Statistics';
import {grade7ScienceLessons} from './grade7Science';
import {grade7ScienceChemistryLessons} from './grade7ScienceChemistry';
import {grade7SciencePressureLessons} from './grade7SciencePressure';
import {grade7ArabicLessons} from './grade7Arabic';
import {grade7ArabicExtraLessons} from './grade7ArabicExtra';
import {grade7EnglishLessons} from './grade7English';

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
  ...grade5ArabicExtraLessons,
  ...grade5EnglishLessons,
  ...grade7MathLessons,
  ...grade7GeometryLessons,
  ...grade7ProportionLessons,
  ...grade7StatisticsLessons,
  ...grade7ScienceLessons,
  ...grade7ScienceChemistryLessons,
  ...grade7SciencePressureLessons,
  ...grade7ArabicLessons,
  ...grade7ArabicExtraLessons,
  ...grade7EnglishLessons
];

export function getStudent(slug:string){return students.find(s=>s.slug===slug)}
export function getLesson(id:string){return lessons.find(l=>l.id===id)}
export function getStudentLessons(slug:string){return lessons.filter(l=>l.student===slug)}

export function getLessonUnit(lesson:Lesson){
  const id=lesson.id;

  if(lesson.subject==='English'){
    if(lesson.student==='salma'){
      if(['g5-en-new-friends-present-simple','g5-en-country-present-continuous'].includes(id)) return 'Unit 1 · Present tenses';
      if(['g5-en-mini-olympics-ordinals','g5-en-holidays-palestine'].includes(id)) return 'Unit 2 · Reading and vocabulary';
      if(['g5-en-which-or','g5-en-basketball-punctuation'].includes(id)) return 'Unit 3 · Questions and punctuation';
      if(id==='g5-en-comparatives') return 'Unit 4 · Comparisons';
      return 'English review';
    }
    if(['g7-en-adverbs-frequency','g7-en-stative-verbs','g7-en-question-order','g7-en-present-continuous'].includes(id)) return 'Unit 1 · Core grammar';
    if(['g7-en-animal-magic-linking','g7-en-keep-in-touch'].includes(id)) return 'Unit 2 · Reading and linking';
    if(['g7-en-present-perfect','g7-en-present-perfect-questions','g7-en-just-already-yet'].includes(id)) return 'Unit 3 · Present perfect';
    if(['g7-en-sport-report','g7-en-directions','g7-en-reflexive-pronouns','g7-en-message-friend'].includes(id)) return 'Unit 4 · Communication and writing';
    return 'English review';
  }

  if(lesson.subject==='اللغة العربية'){
    if(lesson.student==='salma'){
      if(['g5-ar-reading-blessings','g5-ar-poem-call-you','g5-ar-reading-horse-regret','g5-ar-poem-nurse','g5-ar-reading-memory','g5-ar-poem-refugee-cry'].includes(id)) return 'الوحدة 1 · قراءة ونصوص';
      if(['g5-ar-noun-types','g5-ar-pronouns','g5-ar-verb-tenses'].includes(id)) return 'الوحدة 2 · القواعد اللغوية';
      if(['g5-ar-solar-lunar-l','g5-ar-ta-spelling','g5-ar-ta-marbuta-haa'].includes(id)) return 'الوحدة 3 · الإملاء';
      return 'مراجعة العربية';
    }
    if(['g7-ar-reading-mercy','g7-ar-reading-palestine-heart','g7-ar-reading-student-mother','g7-ar-reading-prisoners','g7-ar-reading-men-in-sun','g7-ar-poem-we-return','g7-ar-reading-caliph-governor','g7-ar-reading-watchman','g7-ar-teacher-merit'].includes(id)) return 'الوحدة 1 · القراءة والنصوص';
    if(['g7-ar-middle-hamza','g7-ar-final-hamza'].includes(id)) return 'الوحدة 2 · الإملاء';
    if(['g7-ar-definite-indefinite','g7-ar-sound-verbs','g7-ar-weak-verbs','g7-ar-built-nouns','g7-ar-inflected-built-nouns','g7-ar-sub-inflection-signs','g7-ar-building-signs'].includes(id)) return 'الوحدة 3 · القواعد اللغوية';
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
