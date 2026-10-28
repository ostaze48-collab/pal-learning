import {grade5NumberTheoryLessons} from './grade5NumberTheory';
import {grade5FractionLessons} from './grade5Fractions';
import {grade7MathLessons} from './grade7Math';
import {grade7GeometryLessons} from './grade7Geometry';

export type Student={slug:string;name:string;grade:number;semester:number;emoji:string};
export type Question={id:string;text:string;options:string[];correct:number;explanation:string};
export type Lesson={id:string;student:string;subject:string;title:string;minutes:number;summary:string;learningPoints:string[];example:string;questions:Question[];kind?:'lesson'|'assessment'};

export const students:Student[]=[
  {slug:'salma',name:'سلمى',grade:5,semester:1,emoji:'👧'},
  {slug:'sama',name:'سما',grade:7,semester:1,emoji:'👩‍🎓'}
];

export const lessons:Lesson[]=[
  ...grade5NumberTheoryLessons,
  ...grade5FractionLessons,
  ...grade7MathLessons,
  ...grade7GeometryLessons
];

export function getStudent(slug:string){return students.find(s=>s.slug===slug)}
export function getLesson(id:string){return lessons.find(l=>l.id===id)}
export function getStudentLessons(slug:string){return lessons.filter(l=>l.student===slug)}
