const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

router.route('/')
  .get(getCategories)
  .post(protect, admin, upload.single('image'), createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, admin, upload.single('image'), updateCategory)
  .delete(protect, admin, deleteCategory);

module.exports = router;