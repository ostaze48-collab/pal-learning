import type {Metadata,Viewport} from 'next';
import './globals.css';

export const metadata:Metadata={title:'تعلم سلمى وسما',description:'منصة تعليم منزلية للرزم التعليمية الفلسطينية — الفصل الأول'};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#244b45'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
