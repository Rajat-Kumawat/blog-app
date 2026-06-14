const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  avatar: String,
  role: String,
  timestamps: { type: Date, default: Date.now }
})

const postsSchema = new mongoose.Schema({
    title: String,
    content: String,
    slug: { type: String, unique: true, sparse: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [String],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    timestamps: { type: Date, default: Date.now }
})

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  timestamps: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postsSchema);
const Comment = mongoose.model('Comment', commentSchema);

module.exports = { User, Post, Comment };