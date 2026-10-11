# Blog System API

REST API بسيط لإدارة الكتّاب، المقالات، والتعليقات المضمّنة (Embedded Comments) — مُبنى بـ **Node.js + Express + MongoDB (Mongoose)**.

---

## الميزات

| المورد | العمليات |
|----------|----------|
| **Authors** | `GET /authors`, `GET /authors/:id`, `POST /authors`, `PUT /authors/:id`, `DELETE /authors/:id` (Cascade — يحذف مقالاته أيضاً) |
| **Posts** | `GET /posts`, `GET /posts/:id`, `GET /posts/author/:authorId`, `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id` |
| **Comments (Embedded)** | `POST /posts/:id/comments`, `GET /posts/:id/comments`, `DELETE /posts/:id/comments/:commentId` |

---

## البنية (Structure)

```
blog-api/
├── src/
│   ├── server.js                 # نقطة الدخول
│   ├── config/
│   │   └── database.js           # اتصال MongoDB
│   ├── middleware/
│   │   └── logger.js             # logRequest + errorHandler
│   ├── models/
│   │   ├── Author.js             # Schema: name, bio, email(unique)
│   │   └── Post.js               # Schema: title, content, authorId, tags[], comments[]
│   └── routes/
│       ├── authorRoutes.js
│       └── postRoutes.js
├── test.js                       # اختبارات الـ 10 خطوات
├── .env                          # متغيرات البيئة
├── .gitignore
└── package.json
```

---

## المتطلبات

- **Node.js** ≥ 18
- **MongoDB** يعمل محلياً أو حساب MongoDB Atlas

---

## التثبيت والتشغيل

```bash
# 1) استنساخ / الدخول للمجلد
cd blog-api

# 2) تثبيت الحزم
npm install

# 3) تعديل .env — ضع رابط MongoDB الخاص بك
# المحلي (افتراضي):
MONGO_URI=mongodb://127.0.0.1:27017/blogDB
PORT=4000

# أو لـ Atlas (أزل التعليق وعدّل):
# MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/blogDB?retryWrites=true&w=majority

# 4) تشغيل السيرفر
npm start        # production
npm run dev      # development مع nodemon
```

السيرفر سيعمل على: **http://localhost:4000**

---

## أمثلة الطلبات (cURL)

### Authors

```bash
# إنشاء كاتب
curl -X POST http://localhost:4000/authors \
  -H "Content-Type: application/json" \
  -d '{"name":"أحمد","email":"ahmed@test.com","bio":"كاتب تقني"}'

# كل الكتّاب
curl http://localhost:4000/authors

# كاتب واحد
curl http://localhost:4000/authors/<AUTHOR_ID>

# تحديث
curl -X PUT http://localhost:4000/authors/<AUTHOR_ID> \
  -H "Content-Type: application/json" \
  -d '{"bio":"محدث"}'

# حذف (Cascade)
curl -X DELETE http://localhost:4000/authors/<AUTHOR_ID>
```

### Posts

```bash
# إنشاء مقال (يتطلب authorId صالح)
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"مقالتي","content":"محتوى...","authorId":"<AUTHOR_ID>","tags":["node","api"]}'

# كل المقالات
curl http://localhost:4000/posts

# مقال واحد
curl http://localhost:4000/posts/<POST_ID>

# مقالات كاتب معين
curl http://localhost:4000/posts/author/<AUTHOR_ID>

# تحديث
curl -X PUT http://localhost:4000/posts/<POST_ID> \
  -H "Content-Type: application/json" \
  -d '{"title":"عنوان جديد"}'

# حذف
curl -X DELETE http://localhost:4000/posts/<POST_ID>
```

### Comments (مضمّنة داخل Post)

```bash
# إضافة تعليق
curl -X POST http://localhost:4000/posts/<POST_ID>/comments \
  -H "Content-Type: application/json" \
  -d '{"user":"سارة","text":"مقال ممتاز!"}'

# جلب التعليقات
curl http://localhost:4000/posts/<POST_ID>/comments

# حذف تعليق (بـ _id الخاص بالتعليق)
curl -X DELETE http://localhost:4000/posts/<POST_ID>/comments/<COMMENT_ID>
```

---

## تشغيل الاختبارات

```bash
node test.js
```

سينفّذ 10 خطوات بالترتيب:

1. إنشاء كاتبين
2. إنشاء 3 مقالات (2 للأول، 1 للثاني)
3. `GET /posts` → 3 مقالات
4. `GET /posts/author/:id` → فلترة حسب الكاتب
5. إضافة تعليقين لمقال
6. قراءة التعليقات
7. حذف تعليق واحد
8. التأكد من بقاء تعليق واحد
9. محاولة إنشاء مقال بـ `authorId` غير موجود → `400 Author not found`
10. حذف كاتب له مقالات → Cascade (يحذف المقالات أيضاً)

---

## تفاصيل التنفيذ

| الملف | نقطة مهمة |
|------|----------|
| `models/Post.js` | `comments` كـ **Sub-schema** مع `_id: true` — ضروري لعمل `$pull` في الحذف |
| `postRoutes.js:25` | مسار `/author/:authorId` مسجّل **قبل** `/:id` لتجنب التضارب |
| `middleware/logger.js` | `errorHandler` بـ 4 معاملات — يلتقط `ValidationError`, `CastError`, `11000` (unique) |
| `authorRoutes.js:49` | `DELETE` يستخدم `Post.deleteMany({ authorId })` — سلوك **Cascade** |
| `postRoutes.js:49` | `POST` يتحقق من وجود `authorId` بـ `Author.findById()` قبل الإنشاء |

---

## استجابة خطأ موحّدة

```json
// ValidationError (حقول ناقصة/غير صالحة)
{ "error": "Validation Error", "details": ["Path `email` is required."] }

// Duplicate unique field
{ "error": "Duplicate field", "field": "email" }

// Invalid ObjectId
{ "error": "Invalid id" }

// Not found
{ "error": "Author not found" }
// أو
{ "error": "Post not found" }

// Route not found
{ "error": "Route not found: GET /unknown" }
```

---

## الترخيص

MIT