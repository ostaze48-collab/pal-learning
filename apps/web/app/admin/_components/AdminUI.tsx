import type {CSSProperties,ReactNode} from 'react';

const card:CSSProperties={background:'#fff',border:'1px solid #e6ebf2',borderRadius:16,padding:16,boxShadow:'0 6px 24px rgba(18,33,61,.05)'};
const baseButton:CSSProperties={display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,minHeight:44,padding:'10px 14px',borderRadius:11,fontWeight:800,textDecoration:'none',cursor:'pointer',fontSize:14};

export function AdminShell({eyebrow,title,description,children}:{eyebrow:string;title:string;description?:string;children:ReactNode}){
  return <main style={{maxWidth:1100,margin:'0 auto',padding:'22px 14px 44px'}}>
    <header style={{marginBottom:18}}>
      <div style={{fontSize:13,color:'#667085',fontWeight:700}}>{eyebrow}</div>
      <h1 style={{margin:'7px 0 6px',fontSize:'clamp(26px,5vw,38px)',lineHeight:1.2}}>{title}</h1>
      {description&&<p style={{margin:0,color:'#526071',lineHeight:1.7,maxWidth:820}}>{description}</p>}
    </header>
    {children}
  </main>;
}

export function Card({children,style}:{children:ReactNode;style?:CSSProperties}){
  return <section style={{...card,...style}}>{children}</section>;
}

export function MetricCard({label,value,detail,tone='neutral'}:{label:string;value:ReactNode;detail?:ReactNode;tone?:'neutral'|'good'|'warn'|'bad'}){
  const bg={neutral:'#fff',good:'#f2fbf5',warn:'#fff9ec',bad:'#fff4f4'}[tone];
  const border={neutral:'#e6ebf2',good:'#bfe4cb',warn:'#f0d89b',bad:'#efc0c0'}[tone];
  return <div style={{...card,background:bg,borderColor:border}}>
    <div style={{fontSize:12,color:'#667085',fontWeight:800,marginBottom:7}}>{label}</div>
    <div style={{fontSize:24,fontWeight:900,lineHeight:1.2}}>{value}</div>
    {detail&&<div style={{fontSize:12,color:'#667085',marginTop:7,lineHeight:1.5}}>{detail}</div>}
  </div>;
}

export function StatusPill({children,tone='neutral'}:{children:ReactNode;tone?:'neutral'|'good'|'warn'|'bad'|'info'}){
  const cfg={
    neutral:{bg:'#f2f4f7',fg:'#344054',bd:'#e4e7ec'},
    good:{bg:'#ecfdf3',fg:'#067647',bd:'#abefc6'},
    warn:{bg:'#fffaeb',fg:'#b54708',bd:'#fedf89'},
    bad:{bg:'#fef3f2',fg:'#b42318',bd:'#fecdca'},
    info:{bg:'#eff8ff',fg:'#175cd3',bd:'#b2ddff'},
  }[tone];
  return <span style={{display:'inline-flex',alignItems:'center',padding:'4px 8px',borderRadius:999,border:`1px solid ${cfg.bd}`,background:cfg.bg,color:cfg.fg,fontSize:12,fontWeight:800}}>{children}</span>;
}

export function ActionButton({children,onClick,disabled=false,tone='primary'}:{children:ReactNode;onClick?:()=>void;disabled?:boolean;tone?:'primary'|'secondary'|'danger'}){
  const cfg={primary:{bg:'#176b3a',fg:'#fff',bd:'#176b3a'},secondary:{bg:'#fff',fg:'#14213d',bd:'#cfd6df'},danger:{bg:'#fff',fg:'#b42318',bd:'#f0b7b2'}}[tone];
  return <button onClick={onClick} disabled={disabled} style={{...baseButton,border:`1px solid ${cfg.bd}`,background:disabled?'#eef1f4':cfg.bg,color:disabled?'#98a2b3':cfg.fg,cursor:disabled?'not-allowed':'pointer',flex:'0 1 auto'}}>{children}</button>;
}

export function ActionLink({children,href,tone='primary'}:{children:ReactNode;href:string;tone?:'primary'|'secondary'}){
  const cfg=tone==='primary'?{bg:'#176b3a',fg:'#fff',bd:'#176b3a'}:{bg:'#fff',fg:'#14213d',bd:'#cfd6df'};
  return <a href={href} style={{...baseButton,border:`1px solid ${cfg.bd}`,background:cfg.bg,color:cfg.fg}}>{children}</a>;
}

export function Notice({children,tone='info'}:{children:ReactNode;tone?:'info'|'good'|'warn'|'bad'}){
  const cfg={info:{bg:'#eff8ff',bd:'#b2ddff'},good:{bg:'#ecfdf3',bd:'#abefc6'},warn:{bg:'#fffaeb',bd:'#fedf89'},bad:{bg:'#fef3f2',bd:'#fecdca'}}[tone];
  return <div style={{padding:12,borderRadius:12,background:cfg.bg,border:`1px solid ${cfg.bd}`,lineHeight:1.6}}>{children}</div>;
}

export function SectionHeader({title,description,aside}:{title:string;description?:string;aside?:ReactNode}){
  return <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap',marginBottom:12}}>
    <div><h2 style={{margin:0,fontSize:20}}>{title}</h2>{description&&<p style={{margin:'5px 0 0',color:'#667085',fontSize:13,lineHeight:1.6}}>{description}</p>}</div>
    {aside}
  </div>;
}

export function StepRow({index,title,status,detail}:{index:number;title:string;status:'DONE'|'READY'|'BLOCKED';detail:string}){
  const tone=status==='DONE'?'good':status==='READY'?'info':'bad';
  const mark=status==='DONE'?'✓':status==='READY'?'→':'×';
  return <div style={{display:'grid',gridTemplateColumns:'38px minmax(0,1fr)',gap:10,padding:'11px 0',borderBottom:'1px solid #eef1f5'}}>
    <div style={{width:34,height:34,borderRadius:999,display:'grid',placeItems:'center',background:status==='DONE'?'#ecfdf3':status==='READY'?'#eff8ff':'#fef3f2',fontWeight:900}}>{mark}</div>
    <div>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong>{index}. {title}</strong><StatusPill tone={tone}>{status}</StatusPill></div>
      <div style={{fontSize:13,color:'#667085',marginTop:4,lineHeight:1.55}}>{detail}</div>
    </div>
  </div>;
}

export function ButtonRow({children}:{children:ReactNode}){
  return <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>{children}</div>;
}
