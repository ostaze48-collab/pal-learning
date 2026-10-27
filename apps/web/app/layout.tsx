import RegisterSW from './register-sw';
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ar" dir="rtl"><body style={{fontFamily:'Arial, sans-serif',margin:0,background:'#f6f8fb',color:'#14213d'}}><RegisterSW/>{children}</body></html>
}
