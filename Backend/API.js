const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const { User, Post, Comment } = require('./db_schema');

app.use(express.json());

// For user registration
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            avatar: '',
            role: 'user'
        });
        await newUser.save();
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// For user login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// For user profile update
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = {};

    if (req.body.username !== undefined) updates.username = req.body.username;
    if (req.body.email !== undefined)    updates.email = req.body.email;
    if (req.body.avatar !== undefined)   updates.avatar = req.body.avatar;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or Email is already taken' });
    }
    res.status(500).json({ error: error.message });
  }
});

// For fetching the blog post
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username avatar')
            .sort({ timestamps: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// For posting the blog post (C)
app.post('/api/posts', async (req, res) => {
    const { title, content, author, tags, status } = req.body;
    try {
        if (!title || !content || !author) {
            return res.status(400).json({ message: 'Title, content, and author ID are required' });
        }
        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');

        const newPost = new Post({
            title,
            slug,
            content,
            author,
            tags: tags || [],
            status: status || 'draft'
        });
        await newPost.save();
        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


// For fetching a single blog post (R)
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug })
      .populate('author', 'username avatar');
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// for updating the blog post (U)
app.put('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content, tags, status } = req.body;
    const updates = {};
    if (content !== undefined) updates.content = content;
    if (tags    !== undefined) updates.tags    = tags;
    if (status  !== undefined) updates.status  = status;
    if (title !== undefined) {
      updates.title = title;
      updates.slug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') 
        .replace(/\s+/g, '-');        
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: updates },
      { new: true, runValidators: true } 
    );

    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({
      message: 'Post updated successfully!',
      post: updatedPost
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A post with a similar title already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// for deleting the blog post (D)
app.delete('/api/posts/:id', async (req, res) => {
    const postId = req.params.id;
    try {
        const deletedPost = await Post.findByIdAndDelete(postId);
        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// for adding a comment to a blog post
app.post('/api/comments', async (req, res) => {
  try {
    const { post, author, content } = req.body;
    if (!post || !author || !content) {
      return res.status(400).json({ message: 'Post ID, Author ID, and Content are required.' });
    }
    const newComment = new Comment({
      post,
      author,
      content
    });
    const savedComment = await newComment.save();
    await savedComment.populate('author', 'username avatar');
    res.status(201).json({
      message: 'Comment added successfully! 💬',
      comment: savedComment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// for fetching comments of a blog post
app.get('/api/posts/:id/comments', async (req, res) => {
    const postId = req.params.id;
    try {
        const comments = await Comment.find({ post: postId })
            .populate('author', 'username avatar')
            .sort({ timestamps: -1 });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// for deleting a comment
app.delete('/api/comments/:id', async (req, res) => {
    const commentId = req.params.id;
    try {
        const deletedComment = await Comment.findByIdAndDelete(commentId);
        if (!deletedComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const MONGO_URI = process.env.ConnectionString;
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully via environment variables! 🎉')
        app.listen(PORT, () => console.log(`Server running securely on port ${PORT}`))
    })
    .catch(err => {
        console.error('Database connection error:', err.message);
    })