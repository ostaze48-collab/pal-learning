import LessonPlayer from '../../../_components/LessonPlayer';
import {findLesson,students,StudentSlug} from '../../../../../lib/familyLearning';

export default async function FamilyLessonPage({params}:{params:Promise<{student:string;lesson:string}>}){
  const {student,lesson}=await params;
  if(!(student in students)) return <main style={{padding:30}}>الطالبة غير موجودة.</main>;
  const profile=students[student as StudentSlug];
  const selected=findLesson(profile.slug,lesson);
  if(!selected) return <main style={{padding:30}}>الدرس غير موجود.</main>;
  return <LessonPlayer student={profile} lesson={selected}/>;
}
