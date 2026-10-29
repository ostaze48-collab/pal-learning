import type {ReactNode} from 'react';
import {getLesson} from '../../../lib/data';
import LessonRouteJourneyTracker from './LessonRouteJourneyTracker';

export default async function LessonLayout({children,params}:{children:ReactNode;params:Promise<{lessonId:string}>}){
 const {lessonId}=await params;const lesson=getLesson(lessonId);
 return <>{lesson&&<LessonRouteJourneyTracker student={lesson.student} lessonId={lesson.id}/>} {children}</>;
}
