import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: true,
    },
    tags: { type: [String], default: [] },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Post', postSchema);
