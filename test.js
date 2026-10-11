// اختبار كامل بالترتيب المطلوب — تشغيل: node test.js
const BASE = 'http://localhost:4000';

let pass = 0;
let fail = 0;

const check = (label, cond, extra = '') => {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label} ${extra}`);
  }
};

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

const run = async () => {
  // ---------- 1) إنشاء كاتبين ----------
  console.log('\n1) POST /authors — إنشاء كاتبين');
  const a1 = await req('POST', '/authors', {
    name: 'أحمد علي',
    email: 'ahmed@test.com',
    bio: 'كاتب تقني',
  });
  check('إنشاء Author 1 → 201', a1.status === 201, JSON.stringify(a1.data));
  console.log(`     _id = ${a1.data?._id}`);

  const a2 = await req('POST', '/authors', {
    name: 'سارة حسن',
    email: 'sara@test.com',
  });
  check('إنشاء Author 2 → 201', a2.status === 201, JSON.stringify(a2.data));
  console.log(`     _id = ${a2.data?._id}`);

  const A1 = a1.data._id;
  const A2 = a2.data._id;

  // ---------- 2) إنشاء 3 مقالات ----------
  console.log('\n2) POST /posts — 3 مقالات (2 لـ Author 1، 1 لـ Author 2)');
  const p1 = await req('POST', '/posts', {
    title: 'مقال 1',
    content: 'محتوى المقال الأول',
    authorId: A1,
    tags: ['node', 'api'],
  });
  check('Post 1 (Author 1) → 201', p1.status === 201, JSON.stringify(p1.data));

  const p2 = await req('POST', '/posts', {
    title: 'مقال 2',
    content: 'محتوى المقال الثاني',
    authorId: A1,
  });
  check('Post 2 (Author 1) → 201', p2.status === 201, JSON.stringify(p2.data));

  const p3 = await req('POST', '/posts', {
    title: 'مقال 3',
    content: 'محتوى المقال الثالث',
    authorId: A2,
  });
  check('Post 3 (Author 2) → 201', p3.status === 201, JSON.stringify(p3.data));

  const P1 = p1.data._id;
  check('التعليقات تبدأ كمصفوفة فارغة []', Array.isArray(p1.data.comments) && p1.data.comments.length === 0);

  // ---------- 3) GET /posts ----------
  console.log('\n3) GET /posts — يجب أن ترى 3 مقالات');
  const all = await req('GET', '/posts');
  check('عدد المقالات = 3', all.data?.length === 3, `العدد: ${all.data?.length}`);

  // ---------- 4) GET /posts/author/:authorId ----------
  console.log('\n4) GET /posts/author/:authorId — مقالات Author 1 فقط');
  const byAuthor = await req('GET', `/posts/author/${A1}`);
  check('مقالات Author 1 = 2', byAuthor.data?.length === 2, `العدد: ${byAuthor.data?.length}`);
  check('كلهم إليهم نفس authorId', byAuthor.data?.every((p) => p.authorId === A1));

  const byAuthor2 = await req('GET', `/posts/author/${A2}`);
  check('مقالات Author 2 = 1', byAuthor2.data?.length === 1, `العدد: ${byAuthor2.data?.length}`);

  // ---------- 5) إضافة تعليقين ----------
  console.log('\n5) POST /posts/:id/comments — إضافة تعليقين');
  const c1 = await req('POST', `/posts/${P1}/comments`, {
    user: 'سارة',
    text: 'تعليق أول ممتاز',
  });
  check('تعليق 1 → 201', c1.status === 201, JSON.stringify(c1.data));
  check('عدد التعليقات صار 1', c1.data?.comments?.length === 1);

  const c2 = await req('POST', `/posts/${P1}/comments`, {
    user: 'خالد',
    text: 'تعليق ثانٍ',
  });
  check('تعليق 2 → 201', c2.status === 201, JSON.stringify(c2.data));
  check('عدد التعليقات صار 2', c2.data?.comments?.length === 2);
  check('التعليقات Embedded (داخل الـ Post)', Array.isArray(c2.data?.comments));

  // ---------- 6) GET التعليقات ----------
  console.log('\n6) GET /posts/:id/comments — يجب أن ترى التعليقين');
  const getC = await req('GET', `/posts/${P1}/comments`);
  check('عدد التعليقات = 2', getC.data?.length === 2, `العدد: ${getC.data?.length}`);
  check('كل تعليق فيه user + text + date',
    getC.data?.every((c) => c.user && c.text && c.date && c._id));

  // ---------- 7) حذف تعليق ----------
  console.log('\n7) DELETE /posts/:id/comments/:commentId — حذف تعليق واحد');
  const C1 = getC.data[0]._id;
  const delC = await req('DELETE', `/posts/${P1}/comments/${C1}`);
  check('الحذف → 200', delC.status === 200, JSON.stringify(delC.data));
  check('بقي تعليق واحد', delC.data?.comments?.length === 1);

  // ---------- 8) التأكد ----------
  console.log('\n8) GET /posts/:id/comments — يجب أن ترى تعليق واحد فقط');
  const getC2 = await req('GET', `/posts/${P1}/comments`);
  check('عدد التعليقات = 1', getC2.data?.length === 1, `العدد: ${getC2.data?.length}`);
  check('و هو الثاني وليس المحذوف', getC2.data?.[0]?.text === 'تعليق ثانٍ');

  // ---------- 9) authorId خاطئ ----------
  console.log('\n9) POST /posts بـ authorId غير موجود → 400 "Author not found"');
  const bad = await req('POST', '/posts', {
    title: 'مقال خطأ',
    content: 'محتوى',
    authorId: '507f1f77bcf86cd799439011',
  });
  check('يرجع 400', bad.status === 400, `الحالة: ${bad.status}`);
  check('الرسالة "Author not found"', bad.data?.error === 'Author not found', JSON.stringify(bad.data));

  const malformedAuthorId = await req('POST', '/posts', {
    title: 'مقال خطأ',
    content: 'محتوى',
    authorId: 'not-an-id',
  });
  check('authorId بصيغة غير صالحة → 400 "Author not found"',
    malformedAuthorId.status === 400 && malformedAuthorId.data?.error === 'Author not found',
    JSON.stringify(malformedAuthorId.data));

  const noFields = await req('POST', '/posts', { title: 'ناقص' });
  check('بدون content → 400', noFields.status === 400, `الحالة: ${noFields.status}`);

  // ---------- 10) حذف كاتب له مقالات ----------
  console.log('\n10) DELETE /authors/:id لكاتب له مقالات → سلوك Cascade');
  const delAuthor = await req('DELETE', `/authors/${A1}`);
  check('الحذف → 200', delAuthor.status === 200, JSON.stringify(delAuthor.data));
  check('حذف مقالاته أيضاً (cascade)', delAuthor.data?.deletedPosts === 2,
    `محذوف: ${delAuthor.data?.deletedPosts}`);
  console.log(`     الرد: ${JSON.stringify(delAuthor.data)}`);

  const afterDel = await req('GET', '/posts');
  check('بقي مقال واحد فقط في النظام', afterDel.data?.length === 1, `العدد: ${afterDel.data?.length}`);

  // ---------- إضافي: 404 ----------
  console.log('\nإضافي) حالات 404');
  const nf = await req('GET', '/authors/507f1f77bcf86cd799439011');
  check('GET /authors/:id غير موجود → 404', nf.status === 404, `الحالة: ${nf.status}`);

  const badId = await req('GET', '/posts/not-an-id');
  check('ObjectId غير صالح → 400', badId.status === 400, `الحالة: ${badId.status}`);

  // ---------- النتيجة ----------
  console.log(`\n${'='.repeat(45)}`);
  console.log(`النتيجة النهائية:  ✅ نجح ${pass}  |  ❌ فشل ${fail}`);
  console.log('='.repeat(45));
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((e) => {
  console.error('💥 خطأ في السكربت:', e.message);
  process.exit(1);
});
