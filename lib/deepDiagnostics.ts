import {mathDeepDiagnostics} from './deepDiagnosticsMath';
import {arabicDeepDiagnostics} from './deepDiagnosticsArabic';
import {englishDeepDiagnostics} from './deepDiagnosticsEnglish';
import {scienceDeepDiagnostics} from './deepDiagnosticsScience';

export type DeepQuestion={
  id:string;
  text:string;
  options:string[];
  correct:number;
  explanation:string;
};

export type DeepSubskill={
  id:string;
  title:string;
  gradeAnchor:string;
  minCurrentGrade?:number;
  why:string;
  miniLesson:string;
  treatmentSteps:string[];
  questions:DeepQuestion[];
};

export type DeepDiagnostic={
  skillId:string;
  title:string;
  subject:'الرياضيات'|'اللغة العربية'|'English'|'العلوم والحياة';
  subskills:DeepSubskill[];
};

export const deepDiagnostics:DeepDiagnostic[]=[
  ...mathDeepDiagnostics,
  ...arabicDeepDiagnostics,
  ...englishDeepDiagnostics,
  ...scienceDeepDiagnostics
];

export function getDeepDiagnostic(skillId:string){return deepDiagnostics.find(d=>d.skillId===skillId)}
export function getApplicableSubskills(skillId:string,currentGrade:number){
  const diagnostic=getDeepDiagnostic(skillId);
  return diagnostic?.subskills.filter(s=>!s.minCurrentGrade||currentGrade>=s.minCurrentGrade)??[];
}
