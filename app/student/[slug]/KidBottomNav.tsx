import Link from 'next/link';

type Tab='today'|'practice'|'library';

export default function KidBottomNav({slug,active}:{slug:string;active:Tab}){
 const items:[Tab,string,string,string][]=[
  ['today',`/student/${slug}`,'🏠','اليوم'],
  ['practice',`/student/${slug}/practice`,'🎯','تحدي'],
  ['library',`/student/${slug}/resources`,'📚','مكتبتي']
 ];
 return <nav className="kidBottomNav" aria-label="التنقل الرئيسي">{items.map(([id,href,icon,label])=><Link key={id} href={href} className={active===id?'active':''} aria-current={active===id?'page':undefined}><span>{icon}</span><strong>{label}</strong></Link>)}</nav>;
}
