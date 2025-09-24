# Jellyfin PR Preparation Workflow

## الخطوات:
1. التأكد من أن الفرع محدث مع upstream/master:
   ```bash
   git fetch --all
   git rebase upstream/master
   ```

2. تشغيل جميع الفحوصات:
   ```bash
   npm run lint
   npm run build:production
   npm test
   npm run stylelint
   ```

3. مراجعة التغييرات:
   - فحص جميع الملفات المعدلة
   - التأكد من عدم وجود console.log أو debugging code
   - مراجعة commit messages

4. تنظيف commit history:
   - دمج commits الصغيرة والإصلاحات
   - التأكد من وضوح commit messages
   - استخدام صيغة الأمر

5. إنشاء PR description:
   - شرح سبب التغييرات
   - ربط بـ Issues ذات الصلة
   - وصف كيفية الاختبار

6. مراجعة أخيرة قبل الإرسال