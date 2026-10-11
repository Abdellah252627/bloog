import express from 'express';
import mongoose from 'mongoose';
import Author from '../models/Author.js';
import Post from '../models/Post.js';

const router = express.Router();

// GET /posts — كل المقالات
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// GET /posts/author/:authorId  — لازم قبل /:id وإلا التقطها latter
router.get('/author/:authorId', async (req, res, next) => {
  try {
    const posts = await Post.find({ authorId: req.params.authorId });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// GET /posts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// POST /posts
router.post('/', async (req, res, next) => {
  try {
    const { title, content, authorId } = req.body;
    if (!title || !content || !authorId) {
      return res
        .status(400)
        .json({ error: 'title, content and authorId are required' });
    }

    if (!mongoose.isValidObjectId(authorId)) {
      return res.status(400).json({ error: 'Author not found' });
    }

    // تأكد إن الـ authorId يشير لكاتب موجود فعلاً
    const author = await Author.findById(authorId);
    if (!author) return res.status(400).json({ error: 'Author not found' });

    const post = await Post.create({ ...req.body, title, content, authorId, comments: [] });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// PUT /posts/:id
router.put('/:id', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// DELETE /posts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted', id: post._id });
  } catch (err) {
    next(err);
  }
});

// ===== Comments (Embedded) =====

// POST /posts/:id/comments — إضافة تعليق بـ $push
router.post('/:id/comments', async (req, res, next) => {
  try {
    const { user, text } = req.body;
    if (!user || !text) {
      return res.status(400).json({ error: 'user and text are required' });
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user, text, date: new Date() } } },
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// GET /posts/:id/comments — التعليقات فقط
router.get('/:id/comments', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post.comments);
  } catch (err) {
    next(err);
  }
});

// DELETE /posts/:id/comments/:commentId — حذف تعليق بـ $pull
router.delete('/:id/comments/:commentId', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

export default router;
