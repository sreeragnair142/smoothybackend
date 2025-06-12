const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');
const fs = require('fs').promises;
const path = require('path');

// Helper to get image URL
const getImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  
  // Get the relative path from the project root
  const relativePath = path.relative(path.join(__dirname, '..'), imagePath)
    .replace(/\\/g, '/');
  
  // Remove 'public/' from the beginning of the path if it exists
  const cleanPath = relativePath.startsWith('public/') 
    ? relativePath.substring(7) // Remove 'public/' (7 characters)
    : relativePath;
  
  return `${req.protocol}://${req.get('host')}/${cleanPath}`;
};

// @desc    Get all categories with optional product page filtering
// @route   GET /api/categories?productPageUrl=<url>
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.productPageUrl) {
    query.selectedPages = req.query.productPageUrl.toString();
    console.log(`Filtering categories for productPageUrl: ${query.selectedPages}`);
  }

  const categories = await Category.find(query);
  console.log(`Found ${categories.length} categories`);

  if (req.query.productPageUrl && categories.length === 0) {
    res.status(404);
    throw new Error('No categories found for the specified product page');
  }

  const categoriesWithUrls = categories.map(category => {
    const categoryObj = category.toObject();
    if (categoryObj.image) {
      categoryObj.image = getImageUrl(req, categoryObj.image);
    }
    return categoryObj;
  });

  res.json(categoriesWithUrls);
});

// @desc    Get all unique product pages
// @route   GET /api/product-pages
// @access  Public
const getProductPages = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).select('productPages selectedPages');
  const productPages = [];
  const seenUrls = new Set();

  categories.forEach(category => {
    // Include productPages
    if (category.productPages) {
      category.productPages.forEach(page => {
        if (!seenUrls.has(page.url)) {
          seenUrls.add(page.url);
          productPages.push(page);
        }
      });
    }
    // Include selectedPages
    if (category.selectedPages) {
      category.selectedPages.forEach(url => {
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          productPages.push({ name: url.split('/').pop().replace('.html', '').replace(/-/g, ' '), url });
        }
      });
    }
  });

  res.json(productPages);
});

// @desc    Get a single category by ID with optional product page filtering
// @route   GET /api/categories/:id?productPageUrl=<url>
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.query.productPageUrl) {
    query.selectedPages = req.query.productPageUrl.toString();
    console.log(`Filtering category ID ${req.params.id} for productPageUrl: ${query.selectedPages}`);
  }

  const category = await Category.findOne(query);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const categoryObj = category.toObject();
  if (categoryObj.image) {
    categoryObj.image = getImageUrl(req, categoryObj.image);
  }
  res.json(categoryObj);
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive, productPages, selectedPages } = req.body;

  console.log('Creating category with:', { name, description, isActive, productPages, selectedPages, file: req.file });

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  let parsedProductPages = [];
  if (productPages) {
    try {
      parsedProductPages = Array.isArray(productPages) ? productPages : JSON.parse(productPages || '[]');
      if (!parsedProductPages.every(page => page.name && page.url)) {
        res.status(400);
        throw new Error('Each product page must have a name and URL');
      }
    } catch (err) {
      res.status(400);
      throw new Error('Invalid productPages format');
    }
  }

  let parsedSelectedPages = [];
  if (selectedPages) {
    try {
      parsedSelectedPages = Array.isArray(selectedPages) ? selectedPages : JSON.parse(selectedPages || '[]');
      if (!Array.isArray(parsedSelectedPages) || !parsedSelectedPages.every(url => typeof url === 'string')) {
        res.status(400);
        throw new Error('selectedPages must be an array of strings');
      }
    } catch (err) {
      res.status(400);
      throw new Error('Invalid selectedPages format');
    }
  }

  const category = new Category({
    name,
    description,
    isActive: isActive !== 'false',
    image: req.file ? req.file.path : undefined,
    productPages: parsedProductPages,
    selectedPages: parsedSelectedPages
  });

  const createdCategory = await category.save();
  const responseObj = createdCategory.toObject();
  if (responseObj.image) {
    responseObj.image = getImageUrl(req, responseObj.image);
  }

  console.log('Category created:', responseObj);
  res.status(201).json(responseObj);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive, removeImage, productPages, selectedPages } = req.body;

  console.log('Updating category with:', { name, description, isActive, removeImage, productPages, selectedPages, file: req.file });

  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if ((req.file || removeImage === 'true') && category.image) {
    try {
      await fs.access(category.image);
      await fs.unlink(category.image);
      console.log('Old image deleted:', category.image);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error deleting old image:', err);
      }
    }
  }

  if (name && name !== category.name) {
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      res.status(400);
      throw new Error('Category name already exists');
    }
    category.name = name;
  }

  category.description = description !== undefined ? description : category.description;
  category.isActive = isActive !== undefined ? isActive !== 'false' : category.isActive;

  if (req.file) {
    category.image = req.file.path;
  } else if (removeImage === 'true') {
    category.image = undefined;
  }

  if (productPages !== undefined) {
    try {
      const parsedProductPages = Array.isArray(productPages) ? productPages : JSON.parse(productPages || '[]');
      if (!parsedProductPages.every(page => page.name && page.url)) {
        res.status(400);
        throw new Error('Each product page must have a name and URL');
      }
      category.productPages = parsedProductPages;
    } catch (err) {
      res.status(400);
      throw new Error('Invalid productPages format');
    }
  }

  if (selectedPages !== undefined) {
    try {
      const parsedSelectedPages = Array.isArray(selectedPages) ? selectedPages : JSON.parse(selectedPages || '[]');
      if (!Array.isArray(parsedSelectedPages) || !parsedSelectedPages.every(url => typeof url === 'string')) {
        res.status(400);
        throw new Error('selectedPages must be an array of strings');
      }
      category.selectedPages = parsedSelectedPages;
    } catch (err) {
      res.status(400);
      throw new Error('Invalid selectedPages format');
    }
  }

  const updatedCategory = await category.save();
  const responseObj = updatedCategory.toObject();
  if (responseObj.image) {
    responseObj.image = getImageUrl(req, responseObj.image);
  }

  console.log('Category updated:', responseObj);
  res.json(responseObj);
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  if (category.image) {
    try {
      await fs.access(category.image);
      await fs.unlink(category.image);
      console.log('Image deleted:', category.image);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error deleting image:', err);
      }
    }
  }

  await Category.deleteOne({ _id: req.params.id });
  console.log(`Category ${req.params.id} deleted`);
  res.json({ message: 'Category removed' });
});

// @desc    Add product pages to a category
// @route   POST /api/categories/:id/product-pages
// @access  Private/Admin
const addProductPagesToCategory = asyncHandler(async (req, res) => {
  const { productPages } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  let parsedProductPages = [];
  try {
    parsedProductPages = Array.isArray(productPages) ? productPages : JSON.parse(productPages || '[]');
    if (!parsedProductPages.every(page => page.name && page.url)) {
      res.status(400);
      throw new Error('Each product page must have a name and URL');
    }
  } catch (err) {
    res.status(400);
    throw new Error('Invalid productPages format');
  }

  // Add only new product pages (avoid duplicates by name or URL)
  const existingPages = new Set(category.productPages.map(page => `${page.name}:${page.url}`));
  const newPages = parsedProductPages.filter(page => !existingPages.has(`${page.name}:${page.url}`));
  category.productPages.push(...newPages);

  const updatedCategory = await category.save();
  const responseObj = updatedCategory.toObject();
  if (responseObj.image) {
    responseObj.image = getImageUrl(req, responseObj.image);
  }

  console.log('Product pages added to category:', responseObj);
  res.json(responseObj);
});

module.exports = {
  getCategories,
  getProductPages,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addProductPagesToCategory
};