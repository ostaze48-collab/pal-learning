const candidates=[
  ['5','الرياضيات','https://elearn.azureedge.net/Books/c5/ma5-p1.pdf'],
  ['5','اللغة العربية','https://elearn.azureedge.net/Books/c5/ar5-p1.pdf'],
  ['5','English','https://elearn.azureedge.net/Books/c5/en5-p1.pdf'],
  ['5','English','https://elearn.azureedge.net/Books/c5/eng5-p1.pdf'],
  ['5','العلوم والحياة','https://elearn.azureedge.net/Books/c5/sc5-p1.pdf'],
  ['7','الرياضيات','https://elearn.azureedge.net/Books/c7/ma7-p1.pdf'],
  ['7','اللغة العربية','https://elearn.azureedge.net/Books/c7/ar7-p1.pdf'],
  ['7','English','https://elearn.azureedge.net/Books/c7/en7-p1.pdf'],
  ['7','English','https://elearn.azureedge.net/Books/c7/eng7-p1.pdf'],
  ['7','العلوم والحياة','https://elearn.azureedge.net/Books/c7/sc7-p1.pdf']
];
for(const [grade,subject,url] of candidates){
  try{
    const res=await fetch(url,{headers:{Range:'bytes=0-15','user-agent':'Salma-Sama-Book-Link-Validator/1.0'},redirect:'follow'});
    const buf=Buffer.from(await res.arrayBuffer());
    const signature=buf.subarray(0,5).toString();
    const type=String(res.headers.get('content-type')||'');
    const valid=res.ok&&signature==='%PDF-';
    console.log(`BOOK_CANDIDATE ${valid?'VALID':'INVALID'} | ${grade} | ${subject} | HTTP ${res.status} | ${type} | ${signature.replace(/\s+/g,'_')} | ${res.url}`);
  }catch(error){console.log(`BOOK_CANDIDATE ERROR | ${grade} | ${subject} | ${url} | ${error.message}`)}
}
