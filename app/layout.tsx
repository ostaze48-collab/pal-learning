import type {Metadata,Viewport} from 'next';
import './globals.css';
import './learning.css';
import './recovery.css';
import PwaClient from './PwaClient';

export const metadata:Metadata={title:'تعلم سلمى وسما',description:'منصة تعليم منزلية للرزم التعليمية الفلسطينية — الفصل الأول',manifest:'/manifest.webmanifest',icons:{icon:'/icon-192.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#244b45'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="ar" dir="rtl"><body><PwaClient/>{children}</body></html>;
}
