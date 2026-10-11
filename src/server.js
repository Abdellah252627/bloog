import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './config/database.js';
import { logRequest, errorHandler } from './middleware/logger.js';
import authorRoutes from './routes/authorRoutes.js';
import postRoutes from './routes/postRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(logRequest);

app.use('/authors', authorRoutes);
app.use('/posts', postRoutes);

// 404 لأي مسار غير موجود
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// لازم أخيراً
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

export default app;
