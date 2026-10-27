import type {Metadata,Viewport} from 'next';
import RegisterSW from './register-sw';

export const metadata:Metadata={
  title:{default:'منصة التعلم الفلسطينية — Beta',template:'%s | منصة التعلم الفلسطينية'},
  description:'نسخة تجريبية لتعلم علوم الصف الخامس: المجهر واكتشاف الخلية.',
  applicationName:'منصة التعلم الفلسطينية',
  manifest:'/manifest.webmanifest',
};

export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#176b3a'};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ar" dir="rtl"><body style={{fontFamily:'Arial, sans-serif',margin:0,background:'#f6f8fb',color:'#14213d'}}><RegisterSW/>{children}</body></html>
}
