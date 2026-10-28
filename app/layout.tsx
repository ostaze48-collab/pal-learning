import type {Metadata,Viewport} from 'next';
import './globals.css';
import './learning.css';
import './recovery.css';
import './adaptive.css';
import './ai-teacher.css';
import './kids.css';
import './kid-journey.css';
import './lesson-play.css';
import './teacher-companion.css';
import './teacher-dock.css';
import './creative-learning.css';
import './concept-studio.css';
import './advanced-concept-studio.css';
import './science-simulation.css';
import './data-concept-studio.css';
import './chemistry-simulation.css';
import './language-concept-studio.css';
import './dashboard-progress.css';
import './learning-path.css';
import './live-rail.css';
import './child-experience-v3.css';
import PwaClient from './PwaClient';

export const metadata:Metadata={title:'تعلم سلمى وسما',description:'منصة تعليم منزلية ذكية تعتمد كتب المنهاج الفلسطيني الرسمية — الفصل الأول',manifest:'/manifest.webmanifest',icons:{icon:'/icon-192.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#7557e8'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="ar" dir="rtl"><body><PwaClient/>{children}</body></html>;
}
