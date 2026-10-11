// يسجّل كل طلب وارد + زمن معالجته
export const logRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`
    );
  });
  next();
};

// يلتقط أي خطأ ويحوّله لاستجابة JSON موحّدة
// لازم يكون له 4 معاملات حتى يعرفه Express كـ error handler
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // خطأ من Mongoose: حقل ناقص أو قيمة غير صالحة
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // خطأ تكرار في حقل unique (مثل email)
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate field',
      field: Object.keys(err.keyValue || {})[0],
    });
  }

  // ObjectId غير صالح في الرابط
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
};
