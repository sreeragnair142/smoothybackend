const Blog = require('../models/Blog');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({}).populate('author', 'name email').populate('categories', 'name');
  res.json(blogs);
});

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate('author', 'name email').populate('categories', 'name');

  if (blog) {
    res.json(blog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private/Admin
const createBlog = asyncHandler(async (req, res) => {
  const { title, content, excerpt, categories, isPublished } = req.body;
  
  const slug = slugify(title, { lower: true, strict: true });
  
  const blogExists = await Blog.findOne({ slug });

  if (blogExists) {
    res.status(400);
    throw new Error('Blog with this title already exists');
  }

  const blog = new Blog({
    title,
    slug,
    content,
    excerpt,
    featuredImage: req.file ? req.file.path : undefined,
    author: req.user._id,
    categories: categories ? JSON.parse(categories) : [],
    isPublished,
    publishedAt: isPublished ? Date.now() : null
  });

  const createdBlog = await blog.save();
  res.status(201).json(createdBlog);
});

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
const updateBlog = asyncHandler(async (req, res) => {
  const { title, content, excerpt, categories, isPublished } = req.body;

  const blog = await Blog.findById(req.params.id);

  if (blog) {
    blog.title = title || blog.title;
    if (title) blog.slug = slugify(title, { lower: true, strict: true });
    blog.content = content || blog.content;
    blog.excerpt = excerpt || blog.excerpt;
    blog.categories = categories ? JSON.parse(categories) : blog.categories;
    blog.isPublished = isPublished !== undefined ? isPublished : blog.isPublished;
    
    if (isPublished && !blog.publishedAt) {
      blog.publishedAt = Date.now();
    }
    
    if (req.file) {
      blog.featuredImage = req.file.path;
    }

    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (blog) {
    await blog.remove();
    res.json({ message: 'Blog removed' });
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

module.exports = {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog
};