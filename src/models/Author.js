import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bio: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model('Author', authorSchema);
