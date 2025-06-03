const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');

router.route('/')
  .get(getBlogs)
  .post(protect, admin, upload.single('featuredImage'), createBlog);

router.route('/:id')
  .get(getBlogById)
  .put(protect, admin, upload.single('featuredImage'), updateBlog)
  .delete(protect, admin, deleteBlog);

module.exports = router;