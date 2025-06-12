const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getCategories,
  getProductPages,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addProductPagesToCategory
} = require('../controllers/categoryController');

router.route('/')
  .get(getCategories)
  .post(protect, admin, upload.single('image'), createCategory);

router.route('/product-pages')
  .get(getProductPages);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, admin, upload.single('image'), updateCategory)
  .delete(protect, admin, deleteCategory);

router.route('/:id/product-pages')
  .post(protect, admin, addProductPagesToCategory);

module.exports = router;