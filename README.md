# سندك (Sanadak)

متجر تطبيقات سوداني يتيح للمستخدمين اكتشاف وتحميل التطبيقات السودانية، ويتيح
للمطورين رفع تطبيقاتهم بعد مراجعتها من الإدارة.

هذا الإصدار يعتمد بالكامل على بيانات تجريبية (Mock Data) داخل المشروع، وسيتم
لاحقًا ربطه بـ Supabase و Cloudflare R2.

## التقنيات

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- دعم كامل للغة العربية RTL
- تصميم Mobile First متجاوب بالكامل
- lucide-react للأيقونات

## التشغيل محليًا

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

### أوامر أخرى

```bash
npm run build   # بناء نسخة الإنتاج
npm run start   # تشغيل نسخة الإنتاج
npm run lint    # فحص الكود
```

## هيكلة المشروع

```
src/
  app/                      صفحات المشروع (App Router)
    page.tsx                 الصفحة الرئيسية "/"
    apps/                     "/apps" و "/apps/[slug]"
    categories/               "/categories"
    search/                   "/search"
    login/                    "/login"
    developer/
      register/                "/developer/register"
      dashboard/                "/developer/dashboard" و "/developer/dashboard/apps/new"
  components/
    layout/                   Header, Footer, MobileNav
    ui/                       AppCard, CategoryCard, SearchBar, HeroSection,
                              DownloadButton, Rating, وغيرها
    developer/                DeveloperSidebar, DeveloperTopbar, StatsCard, AppsTable
  data/                      بيانات تجريبية منظمة (apps, categories, developer) + types.ts
  lib/                       دوال مساعدة (utils.ts)
```

بيانات التطبيقات والتصنيفات والمطورين موجودة في `src/data/` بصيغة نمطية سهلة
الاستبدال لاحقًا بطلبات فعلية من Supabase.

## ملاحظات مهمة عن هذا الإصدار

- زر "تحميل APK" وزر "إرسال للمراجعة" في نموذج إضافة التطبيق تجريبيان ولا يقومان
  برفع أو تحميل أي ملفات فعلية.
- تسجيل الدخول وتسجيل المطور نماذج واجهة فقط بدون مصادقة فعلية.
- لا يوجد اتصال بأي قاعدة بيانات أو تخزين خارجي في هذه المرحلة.

## النشر على Vercel

المشروع جاهز للنشر مباشرة على [Vercel](https://vercel.com) بدون أي إعدادات إضافية.
