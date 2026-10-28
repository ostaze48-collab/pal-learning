const pages=['https://elearn.edu.ps/c7/sc7-p1/','https://elearn.edu.ps/c7-old/sc7-p1/'];
for(const page of pages){
  try{
    const res=await fetch(page,{headers:{'user-agent':'Salma-Sama-Book-Link-Inspector/1.0'}});
    const html=await res.text();
    console.log(`SCIENCE7_RAW_PAGE | HTTP ${res.status} | ${page}`);
    const decoded=html.replace(/&amp;/g,'&').replace(/\\\//g,'/');
    const absolute=[...decoded.matchAll(/https?:[^\s"'<>]+/gi)].map(m=>m[0]);
    const quoted=[...decoded.matchAll(/["']([^"']*(?:Books\/|\.pdf|azureedge)[^"']*)["']/gi)].map(m=>m[1]);
    const urls=[...new Set([...absolute,...quoted])].filter(x=>/(Books\/|\.pdf|azureedge)/i.test(x));
    for(const raw of urls){let value=raw;try{value=new URL(raw,page).href}catch{}console.log(`SCIENCE7_RAW_LINK | ${value}`)}
    console.log(`SCIENCE7_RAW_COUNT | ${urls.length}`);
  }catch(error){console.log(`SCIENCE7_RAW_ERROR | ${page} | ${error.message}`)}
}
