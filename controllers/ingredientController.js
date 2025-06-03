const Ingredient = require('../models/Ingredient');
const asyncHandler = require('express-async-handler');

// @desc    Get all ingredients
// @route   GET /api/ingredients
// @access  Public
const getIngredients = asyncHandler(async (req, res) => {
  const ingredients = await Ingredient.find({});
  res.json(ingredients);
});

// @desc    Get single ingredient
// @route   GET /api/ingredients/:id
// @access  Public
const getIngredientById = asyncHandler(async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);

  if (ingredient) {
    res.json(ingredient);
  } else {
    res.status(404);
    throw new Error('Ingredient not found');
  }
});

// @desc    Create an ingredient
// @route   POST /api/ingredients
// @access  Private/Admin
const createIngredient = asyncHandler(async (req, res) => {
  const { name, description, nutritionalInfo } = req.body;
  
  const ingredientExists = await Ingredient.findOne({ name });

  if (ingredientExists) {
    res.status(400);
    throw new Error('Ingredient already exists');
  }

  const ingredient = new Ingredient({
    name,
    description,
    nutritionalInfo: nutritionalInfo ? JSON.parse(nutritionalInfo) : undefined,
    image: req.file ? req.file.path : undefined
  });

  const createdIngredient = await ingredient.save();
  res.status(201).json(createdIngredient);
});

// @desc    Update an ingredient
// @route   PUT /api/ingredients/:id
// @access  Private/Admin
const updateIngredient = asyncHandler(async (req, res) => {
  const { name, description, nutritionalInfo, isActive } = req.body;

  const ingredient = await Ingredient.findById(req.params.id);

  if (ingredient) {
    ingredient.name = name || ingredient.name;
    ingredient.description = description || ingredient.description;
    ingredient.isActive = isActive !== undefined ? isActive : ingredient.isActive;
    
    if (nutritionalInfo) {
      ingredient.nutritionalInfo = JSON.parse(nutritionalInfo);
    }
    
    if (req.file) {
      ingredient.image = req.file.path;
    }

    const updatedIngredient = await ingredient.save();
    res.json(updatedIngredient);
  } else {
    res.status(404);
    throw new Error('Ingredient not found');
  }
});

// @desc    Delete an ingredient
// @route   DELETE /api/ingredients/:id
// @access  Private/Admin
const deleteIngredient = asyncHandler(async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);

  if (ingredient) {
    await ingredient.remove();
    res.json({ message: 'Ingredient removed' });
  } else {
    res.status(404);
    throw new Error('Ingredient not found');
  }
});

module.exports = {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient
};