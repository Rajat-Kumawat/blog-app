const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  avatar: String,
  role: String
},{ timestamps: true })

const postsSchema = new mongoose.Schema({
    title: String,
    content: String,
    slug: { type: String, unique: true, sparse: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [String],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' }
},{ timestamps: true })

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: String
},{ timestamps: true })

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postsSchema);
const Comment = mongoose.model('Comment', commentSchema);

module.exports = { User, Post, Comment };