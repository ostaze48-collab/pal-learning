import fs from 'node:fs';
import path from 'node:path';

const roots=['app/student','app/lesson'];
const extensions=new Set(['.tsx','.ts','.jsx','.js']);
const banned=[
 'فحص الفجوات',
 'خريطة الفجوات',
 'خريطة فجوات',
 'تشخيص دقيق',
 'تشخيص متفرع',
 'نتيجة الفحص',
 'حد الإتقان',
 'مستوى الفجوة',
 'مهارة سابقة',
 'الأساس غير ثابت',
 'آخر قياس',
 'إعادة القياس',
 'نعيد القياس',
 'التمثيل المستخدم',
 'استدراك ذكي',
 'السبب الأقرب:',
 'أخطاء محددة:',
 'نقيس الآن:',
 'أدلة جيدة على فهم',
 'تثبيت موجه',
 'تقدمك في المحتوى المتاح',
 'اسم المهارة',
 'أي درجة',
 'المرحلة 1 ·',
 'المرحلة 2 ·',
 'المرحلة 3 ·',
 'المرحلة 4 ·'
];

function walk(dir,files=[]){
 if(!fs.existsSync(dir))return files;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())walk(full,files);
  else if(extensions.has(path.extname(entry.name)))files.push(full);
 }
 return files;
}

const hits=[];
for(const root of roots){
 for(const file of walk(root)){
  const text=fs.readFileSync(file,'utf8');
  const lines=text.split(/\r?\n/);
  for(const phrase of banned){
   lines.forEach((line,index)=>{if(line.includes(phrase))hits.push({file,line:index+1,phrase})});
  }
 }
}

if(hits.length){
 console.error('\nChild-facing copy guard found internal/system language:\n');
 for(const hit of hits)console.error(`- ${hit.file}:${hit.line}  "${hit.phrase}"`);
 console.error('\nMove these concepts behind the child UI or rewrite them as an action the child can take.\n');
 process.exit(1);
}

console.log('✓ Child-facing copy guard passed.');
