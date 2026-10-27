export default function Home(){
  return <main style={{minHeight:'100vh',background:'linear-gradient(180deg,#f4fbf6 0%,#f6f8fb 48%,#fff 100%)',color:'#14213d'}}>
    <div style={{maxWidth:1080,margin:'0 auto',padding:'28px 16px 56px'}}>
      <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:54}}><div style={{fontWeight:900,fontSize:19}}>Palestinian Learning OS</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><a href="/student/login" style={{padding:'9px 13px',borderRadius:11,border:'1px solid #ccd5df',color:'#14213d',textDecoration:'none',fontWeight:800}}>دخول الطالب</a><a href="/admin" style={{padding:'9px 13px',borderRadius:11,background:'#14213d',color:'#fff',textDecoration:'none',fontWeight:800}}>الإدارة</a></div></nav>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:28,alignItems:'center'}}>
        <div>
          <div style={{display:'inline-flex',padding:'6px 10px',borderRadius:999,background:'#fff8e6',border:'1px solid #f2d38a',fontSize:12,fontWeight:900,color:'#9a6700'}}>نسخة تجريبية · Beta</div>
          <h1 style={{fontSize:'clamp(38px,8vw,68px)',lineHeight:1.08,margin:'16px 0 14px'}}>تعلم العلوم<br/><span style={{color:'#176b3a'}}>بطريقة مختلفة</span></h1>
          <p style={{fontSize:18,lineHeight:1.85,color:'#526071',maxWidth:650}}>منصة تعلم فلسطينية تجريبية تحول الدرس إلى شرح تفاعلي، أسئلة تقيس المهارات، تقدم شخصي، مراجعة ذكية، ومساعد داخل الدرس.</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:22}}><a href="/student/register" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',minHeight:50,padding:'0 20px',borderRadius:13,background:'#176b3a',color:'#fff',textDecoration:'none',fontWeight:900,fontSize:16}}>جرّب المنصة الآن</a><a href="/student/login" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',minHeight:50,padding:'0 20px',borderRadius:13,background:'#fff',border:'1px solid #ccd5df',color:'#14213d',textDecoration:'none',fontWeight:900}}>لدي حساب</a></div>
          <p style={{fontSize:12,color:'#667085',marginTop:11}}>النطاق الحالي: الصف الخامس · العلوم والحياة · الفصل الأول · الدرس الأول فقط</p>
        </div>

        <div style={{background:'#fff',border:'1px solid #dfe6ed',borderRadius:24,padding:18,boxShadow:'0 24px 70px rgba(20,33,61,.12)'}}>
          <div style={{padding:16,borderRadius:18,background:'linear-gradient(135deg,#eef9f1,#f2f7ff)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>علوم الصف الخامس</div><h2 style={{margin:'6px 0 4px',fontSize:25}}>المجهر واكتشاف الخلية</h2><div style={{color:'#667085'}}>الوحدة الأولى: الخلية · 20 دقيقة</div></div><span style={{fontSize:42}}>🔬</span></div><div style={{height:9,background:'#dfe8e3',borderRadius:99,marginTop:18}}><div style={{width:'62%',height:'100%',background:'#176b3a',borderRadius:99}}/></div></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:9,marginTop:10}}>{[['7','محطات تعلم'],['5','أسئلة'],['4','مهارات'],['1','مساعد درس']].map(([v,l])=><div key={l} style={{padding:13,borderRadius:14,background:'#f8fafc',border:'1px solid #edf0f4'}}><strong style={{fontSize:22}}>{v}</strong><div style={{fontSize:12,color:'#667085'}}>{l}</div></div>)}</div>
        </div>
      </section>

      <section style={{marginTop:58}}><div style={{textAlign:'center',marginBottom:22}}><div style={{fontSize:12,color:'#176b3a',fontWeight:900}}>ما الذي نختبره؟</div><h2 style={{fontSize:30,margin:'6px 0'}}>منصة كاملة بمحتوى صغير</h2><p style={{color:'#667085',margin:0}}>بدل بناء عشرات الكتب قبل اختبار الفكرة، نختبر دورة التعلم كاملة على درس واحد.</p></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12}}>{[
        ['01','تعلم تفاعلي','شرح قصير، Timeline، أنشطة، ملخص، وتصميم مناسب للهاتف.'],
        ['02','Mastery','كل سؤال مرتبط بمهارة، والتقدم يتغير حسب أدلة التعلم.'],
        ['03','مراجعة ذكية','إذا ظهرت مهارة ضعيفة تحصل على مراجعة قصيرة موجهة.'],
        ['04','مساعد الدرس','مساعد تجريبي مقيد بمحتوى «المجهر واكتشاف الخلية».'],
      ].map(([n,t,d])=><div key={n} style={{background:'#fff',padding:18,borderRadius:17,border:'1px solid #e7ebf1'}}><div style={{fontSize:12,color:'#176b3a',fontWeight:900}}>{n}</div><h3 style={{margin:'7px 0'}}>{t}</h3><p style={{margin:0,color:'#667085',lineHeight:1.7}}>{d}</p></div>)}</div></section>

      <section style={{marginTop:46,padding:24,borderRadius:22,background:'#14213d',color:'#fff',display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',flexWrap:'wrap'}}><div><h2 style={{margin:'0 0 6px'}}>جاهز للتجربة؟</h2><div style={{opacity:.75}}>أنشئ حساب طالب وابدأ أول درس خلال أقل من دقيقة.</div></div><a href="/student/register" style={{padding:'12px 18px',borderRadius:12,background:'#fff',color:'#14213d',textDecoration:'none',fontWeight:900}}>إنشاء حساب تجريبي</a></section>
    </div>
  </main>;
}
