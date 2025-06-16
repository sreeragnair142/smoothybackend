const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');
const fs = require('fs').promises;
const path = require('path');

// Helper to get image URLs
const getImageUrls = (req, imagePaths) => {
  if (!imagePaths || imagePaths.length === 0) return [];
  const urls = imagePaths.map(imagePath => {
    // Extract just the filename
    const filename = path.basename(imagePath);
    const url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    console.log(`Generated image URL: ${url} from path: ${imagePath}`);
    return url;
  });
  return urls;
};

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    active,
    search,
    sort,
    page = 1,
    limit = 10,
    productPageUrl
  } = req.query;

  let query = {};
  let sortOption = {};

  if (category) {
    query.category = category;
    console.log(`Filtering products by category ID: ${category}`);
  }

  if (active === 'true' || active === 'false') {
    query.isActive = active === 'true';
    console.log(`Filtering products by isActive: ${query.isActive}`);
  }

  if (productPageUrl) {
    query.selectedPages = productPageUrl;
    console.log(`Filtering products by productPageUrl: ${productPageUrl}`);
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
      { 'recipes.name': { $regex: search, $options: 'i' } },
      { 'recipes.ingredients': { $regex: search, $options: 'i' } },
      { 'recipes.instructions': { $regex: search, $options: 'i' } }
    ];
    console.log(`Searching products with query: ${search}`);
  }

  if (sort) {
    const sortFields = sort.split(',');
    sortFields.forEach(field => {
      const [key, value] = field.split(':');
      sortOption[key] = value === 'desc' ? -1 : 1;
    });
  } else {
    sortOption = { createdAt: -1 };
  }

  const startIndex = (page - 1) * limit;
  const total = await Product.countDocuments(query);

  const products = await Product.find(query)
    .populate('category', 'name')
    .sort(sortOption)
    .limit(limit)
    .skip(startIndex);

  console.log(`Found ${products.length} products for query:`, query);

  const productsWithUrls = products.map(product => {
    const productObj = product.toObject();
    if (productObj.images) {
      productObj.images = getImageUrls(req, productObj.images);
    }
    if (productObj.category) {
      productObj.category = {
        _id: productObj.category._id.toString(),
        name: productObj.category.name
      };
    }
    return productObj;
  });

  res.json({
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    limit: Number(limit),
    products: productsWithUrls
  });
});

// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const productObj = product.toObject();
  if (productObj.images) {
    productObj.images = getImageUrls(req, productObj.images);
  }
  if (productObj.category) {
    productObj.category = {
      _id: productObj.category._id.toString(),
      name: productObj.category.name
    };
  }

  res.json(productObj);
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    description,
    price,
    costPrice,
    category,
    stock,
    barcode,
    weight,
    dimensions,
    isActive,
    tags,
    recipes,
    selectedPages,
    existingImages
  } = req.body;

  if (!name || !sku || !price || !category || !stock) {
    res.status(400);
    throw new Error('Name, SKU, price, category, and stock are required');
  }

  const productExists = await Product.findOne({ name });
  if (productExists) {
    res.status(400);
    throw new Error('Product with this name already exists');
  }

  const skuExists = await Product.findOne({ sku });
  if (skuExists) {
    res.status(400);
    throw new Error('SKU already exists');
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error('Category not found');
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map(file => {
      const relativePath = `uploads/${file.filename}`;
      console.log(`Uploaded file path: ${relativePath}`);
      return relativePath;
    });
  }

  if (existingImages) {
    try {
      images = [...images, ...JSON.parse(existingImages)];
    } catch (err) {
      console.error('Error parsing existingImages:', err);
    }
  }

  const parsedRecipes = recipes ? JSON.parse(recipes) : [];
  const parsedSelectedPages = selectedPages ? JSON.parse(selectedPages) : [];
  const parsedDimensions = dimensions ? JSON.parse(dimensions) : undefined;

  const productData = {
    name,
    sku,
    description,
    price: Number(price),
    costPrice: costPrice ? Number(costPrice) : undefined,
    category,
    stock: Number(stock),
    volume: req.body.volume ? Number(req.body.volume) : undefined,
    volumeUnit: req.body.volume ? 'L' : undefined,
    weight: weight ? Number(weight) : undefined,
    dimensions: parsedDimensions,
    images,
    isActive: isActive !== 'false',
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    recipes: parsedRecipes,
    selectedPages: parsedSelectedPages
  };

  // Only include barcode if it’s provided and not an empty string
  if (barcode && barcode.trim()) {
    productData.barcode = barcode.trim();
  }

  const product = new Product(productData);

  try {
    const createdProduct = await product.save();
    const populatedProduct = await Product.findById(createdProduct._id).populate('category', 'name');

    const responseProduct = populatedProduct.toObject();
    if (responseProduct.images) {
      responseProduct.images = getImageUrls(req, responseProduct.images);
    }
    if (responseProduct.category) {
      responseProduct.category = {
        _id: responseProduct.category._id.toString(),
        name: responseProduct.category.name
      };
    }

    res.status(201).json(responseProduct);
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.sku) {
        res.status(400);
        throw new Error('SKU already exists');
      }
      if (error.keyPattern && error.keyPattern.name) {
        res.status(400);
        throw new Error('Product name already exists');
      }
    }
    throw error;
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    description,
    price,
    costPrice,
    category,
    stock,
    volume,
    barcode,
    weight,
    dimensions,
    isActive,
    tags,
    recipes,
    selectedPages,
    existingImages
  } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(400);
    throw new Error('Product not found');
  }

  if (!name || !sku || !price || !category || !stock) {
    res.status(400);
    throw new Error('Name, SKU, price, category, and stock are required');
  }

  if (name !== product.name) {
    const productExists = await Product.findOne({ name });
    if (productExists) {
      res.status(400);
      throw new Error('Product with this name already exists');
    }
  }

  if (sku !== product.sku) {
    const skuExists = await Product.findOne({ sku });
    if (skuExists) {
      res.status(400);
      throw new Error('SKU already exists');
    }
  }

  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      res.status(400);
      throw new Error('Category not found');
    }
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    // Delete old images only if new images are uploaded
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          const absolutePath = path.join(__dirname, '..', image);
          await fs.access(absolutePath);
          await fs.unlink(absolutePath);
          console.log(`Deleted old image: ${image}`);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error('Error deleting old image:', err);
          }
        }
      }
    }
    images = req.files.map(file => {
      const relativePath = `uploads/${file.filename}`;
      console.log(`Uploaded file path during update: ${relativePath}`);
      return relativePath;
    });
  } else {
    // Preserve existing images if no new files are uploaded
    images = existingImages ? JSON.parse(existingImages) : product.images;
  }

  product.name = name || product.name;
  product.sku = sku || product.sku;
  product.description = description !== undefined ? description : product.description;
  product.price = price !== undefined ? Number(price) : product.price;
  product.costPrice = costPrice !== undefined ? Number(costPrice) : product.costPrice;
  product.category = category || product.category;
  product.stock = stock !== undefined ? Number(stock) : product.stock;
  product.volume = volume !== undefined ? Number(volume) : product.volume;
  product.volumeUnit = volume !== undefined ? 'L' : product.volumeUnit;
  product.weight = weight !== undefined ? Number(weight) : product.weight;
  product.dimensions = dimensions ? JSON.parse(dimensions) : product.dimensions;
  product.isActive = isActive !== undefined ? isActive !== 'false' : product.isActive;
  product.tags = tags ? tags.split(',').map(tag => tag.trim()) : product.tags;
  product.recipes = recipes ? JSON.parse(recipes) : product.recipes;
  product.selectedPages = selectedPages ? JSON.parse(selectedPages) : product.selectedPages;
  product.images = images;

  // Only update barcode if it’s provided and not an empty string
  if (barcode !== undefined && barcode.trim()) {
    product.barcode = barcode.trim();
  } else {
    product.barcode = undefined; // Remove barcode if not provided
  }

  try {
    const updatedProduct = await product.save();
    const populatedProduct = await Product.findById(updatedProduct._id).populate('category', 'name');

    const responseProduct = populatedProduct.toObject();
    if (responseProduct.images) {
      responseProduct.images = getImageUrls(req, responseProduct.images);
    }
    if (responseProduct.category) {
      responseProduct.category = {
        _id: responseProduct.category._id.toString(),
        name: responseProduct.category.name
      };
    }

    res.json(responseProduct);
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.sku) {
        res.status(400);
        throw new Error('SKU already exists');
      }
      if (error.keyPattern && error.keyPattern.name) {
        res.status(400);
        throw new Error('Product name already exists');
      }
    }
    throw error;
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.images && product.images.length > 0) {
    for (const image of product.images) {
      try {
        const absolutePath = path.join(__dirname, '..', image);
        await fs.access(absolutePath);
        await fs.unlink(absolutePath);
        console.log(`Deleted image: ${image}`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Error deleting image:', err);
        }
      }
    }
  }

  await product.deleteOne();
  res.status(204).json({ message: 'Product removed' });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};