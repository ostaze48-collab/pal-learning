# Palestinian Learning OS — Single-Lesson Experimental Beta

منصة تعلم فلسطينية تجريبية مبنية لاختبار دورة تعلم كاملة قبل التوسع في بقية المنهاج.

## نطاق النسخة الحالية

المحتوى المتاح للطالب مقفول عمدًا على عنصر واحد فقط:

- الصف: الخامس
- المادة: العلوم والحياة
- الفصل: الأول
- الوحدة الأولى: الخلية
- الدرس الأول: **المجهر واكتشاف الخلية**
- Lesson code: `PS.G05.SCI.S1.U01.L01`

بقية بنية المنهاج ومصنع المحتوى موجودة في النظام، لكنها ليست ضمن نطاق الطالب في هذه النسخة التجريبية.

## ما يعمل End-to-End

### الطالب
- إنشاء حساب طالب وتسجيل الدخول.
- صفحة رئيسية وخطة تعلم قصيرة.
- Lesson Player عربي RTL مناسب للهاتف.
- 7 محطات تعلم داخل الدرس.
- محتوى نصي وبطاقات معلومات وخط زمني ونشاط مطابقة وملخص.
- 5 أسئلة مرتبطة بمهارات محددة.
- حفظ المحاولات.
- تحديث Skill Mastery والثقة بعد كل إجابة.
- صفحة تقدم حسب المهارة.
- مراجعة ذكية لأضعف مهارة مقاسة.
- مساعد درس تجريبي مقيد بموضوع «المجهر واكتشاف الخلية».
- PWA / Service Worker كأساس للعمل على الهاتف.

### الإدارة
- تسجيل دخول Admin.
- لوحة Beta Operations.
- Demo Health آلي.
- مؤشرات الطلاب، بدء الدرس، المحاولات، الإكمال، Correct Rate وAverage Mastery.
- قياس طلبات مساعد الدرس.
- Curriculum / Source Import / Source Review / Skill Mapping / Generation / QA / Staging / Release infrastructure.
- Production Readiness منفصلة عن جاهزية الـBeta.

## فصل Beta عن Production

المحتوى التجريبي يستخدم حالة مستقلة `BETA` ولا يستخدم `PUBLISHED`.

هذا مقصود: يمكننا اختبار تجربة الطالب كاملة من دون التحايل على بوابات الجودة الخاصة بالإصدار الإنتاجي. نشر المحتوى الحقيقي يظل خاضعًا لـ:

`Source → Scope/Edition Verification → Admin Source Verify → Skill Mapping → Generation → Candidate QA → Staging → Academic QA → Final Release Gate → Audited Release Transaction`

## مصدر الفصل الحالي

المسار الحالي هو:

- Book: `PS.G05.SCI.S1`
- Package: `PS-G05-SCI-S1-2026`
- Ministry catalog candidate: `https://moe.edu.ps/m/4070`

الرابط الرسمي يبدأ كـ`CATALOG_CANDIDATE`. كونه مصدر وزارة لا يعني تلقائيًا أن Scope أو Edition تم التحقق منهما. التحقق من النطاق والطبعة مستقلان قبل الاستخدام الإنتاجي.

## Source Authority Policy

- `STUDENT_BOOK`: يمكنه factual grounding بعد تحقق الشروط.
- `OFFICIAL_PACKAGE`: يمكنه factual grounding بعد تحقق النطاق/الطبعة.
- `SOLUTIONS`: للتحقق من الإجابات فقط، وليس مصدر شرح أساسي.
- `CURRICULUM_PLAN`: لإثبات أن الدرس ما زال ضمن النطاق الحالي، وليس مصدرًا للحقائق التعليمية.
- أي نوع غير معروف: Fail-closed.

كما أن Lesson Generation وSkill Mapping لا يستخدمان Teaching Source Link إلا إذا راجعه Admin وأصبح `VERIFIED`.

## التشغيل المحلي

### API

```bash
cd apps/api
pip install -r requirements.txt
export DATABASE_URL="sqlite:///./pal_learning.db"
export EXPERIMENTAL_DEMO="true"
export BOOTSTRAP_ADMIN_EMAIL="admin@example.test"
export BOOTSTRAP_ADMIN_PASSWORD="replace-with-a-strong-password"
python -m app.db.seed
uvicorn app.main:app --reload
```

### Web

```bash
cd apps/web
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

ثم افتح:

- `/` الصفحة العامة
- `/student/register` إنشاء طالب
- `/student` تجربة الطالب
- `/admin/login` دخول الإدارة
- `/admin/beta` لوحة تشغيل الـBeta

## الاختبارات

GitHub CI يشغّل:

- Alembic migration head verification
- API test suite
- Single-lesson pilot journey tests
- npm production dependency audit
- Next.js production build

## الاستضافة الحالية

- Web: `https://pal-learning-web.onrender.com`
- API: `https://pal-learning-api.onrender.com`

ملاحظة: الـBeta يمكن أن يعمل على SQLite للتجربة، لكن Production Readiness تبقى Fail-closed حتى استخدام قاعدة PostgreSQL دائمة واستيفاء بقية متطلبات الإنتاج.

## القرار الحالي

**لا نضيف درسًا ثانيًا الآن.**

نثبت جودة وتجربة المنصة كاملة على «المجهر واكتشاف الخلية»، نجمع بيانات الاستخدام والتعلم، نصلح المشكلات، وبعد نجاح الـPilot نوسع المحتوى تدريجيًا.
