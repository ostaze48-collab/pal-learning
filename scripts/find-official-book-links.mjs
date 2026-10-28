import fsp from 'node:fs/promises';
import path from 'node:path';

const cfg=JSON.parse(await fsp.readFile(path.join(process.cwd(),'curriculum/source-pages.json'),'utf8'));
const pages=cfg.pages.filter(x=>x.captureHtml&&x.subject&&x.semester===1);
function clean(text){return text.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim()}
for(const page of pages){
  console.log(`BOOK_SCAN_PAGE ${page.grades?.[0]} | ${page.subject} | ${page.url}`);
  try{
    const res=await fetch(page.url,{headers:{'user-agent':'Salma-Sama-Book-Link-Scanner/1.0'}});
    const html=await res.text();
    const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;let count=0;
    while((m=re.exec(html))){
      const label=clean(m[2]);
      if(!/(حمّ?ل|تحميل|كتاب|book)/i.test(label))continue;
      let url;try{url=new URL(m[1].replace(/&amp;/g,'&'),page.url).href}catch{continue}
      console.log(`BOOK_LINK ${page.grades?.[0]} | ${page.subject} | ${label} | ${url}`);count++;
    }
    console.log(`BOOK_SCAN_COUNT ${page.grades?.[0]} | ${page.subject} | ${count}`);
  }catch(error){console.log(`BOOK_SCAN_ERROR ${page.url} | ${error.message}`)}
}
