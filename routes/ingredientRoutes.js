const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient
} = require('../controllers/ingredientController');

router.route('/')
  .get(getIngredients)
  .post(protect, admin, upload.single('image'), createIngredient);

router.route('/:id')
  .get(getIngredientById)
  .put(protect, admin, upload.single('image'), updateIngredient)
  .delete(protect, admin, deleteIngredient);

module.exports = router;