import express from 'express';
import Author from '../models/Author.js';
import Post from '../models/Post.js';

const router = express.Router();

// GET /authors — كل الكتّاب
router.get('/', async (req, res, next) => {
  try {
    const authors = await Author.find();
    res.json(authors);
  } catch (err) {
    next(err);
  }
});

// GET /authors/:id
router.get('/:id', async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ error: 'Author not found' });
    res.json(author);
  } catch (err) {
    next(err);
  }
});

// POST /authors
router.post('/', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    const author = await Author.create({ ...req.body, name, email });
    res.status(201).json(author);
  } catch (err) {
    next(err);
  }
});

// PUT /authors/:id
router.put('/:id', async (req, res, next) => {
  try {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!author) return res.status(404).json({ error: 'Author not found' });
    res.json(author);
  } catch (err) {
    next(err);
  }
});

// DELETE /authors/:id  — السلوك: Cascade (يحذف مقالات الكاتب أيضاً)
router.delete('/:id', async (req, res, next) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) return res.status(404).json({ error: 'Author not found' });

    const deletedPosts = await Post.deleteMany({ authorId: author._id });
    res.json({
      message: 'Author and their posts deleted',
      deletedAuthor: author._id,
      deletedPosts: deletedPosts.deletedCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
