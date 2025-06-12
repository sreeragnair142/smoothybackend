const Banner = require('../models/Banner');
const asyncHandler = require('express-async-handler');
const fs = require('fs').promises;
const path = require('path');

// @desc    Get all active banners by type and page
// @route   GET /api/banners
// @access  Public
const getBanners = asyncHandler(async (req, res) => {
  const { type, page } = req.query;

  const query = { isActive: true };
  if (type) query.bannerType = type;
  if (page) query.page = page;

  const banners = await Banner.find(query).sort({ displayOrder: 1 });
  res.json(banners);
});

// @desc    Get single banner
// @route   GET /api/banners/:id
// @access  Public
const getBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (banner) {
    res.json(banner);
  } else {
    res.status(404);
    throw new Error('Banner not found');
  }
});

// @desc    Create new banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
  console.log('Create banner request body:', req.body);
  console.log('Create banner files:', req.files);

  const {
    title,
    description,
    linkUrl,
    ingredients,
    bannerType,
    page,
    displayOrder,
    isActive,
    startDate,
    endDate,
    bannerImageTypes,
  } = req.body;

  // Validate required fields
  if (!title) {
    res.status(400);
    throw new Error('Title is required');
  }

  if (!req.files || !req.files.image || !req.files.image[0]) {
    res.status(400);
    throw new Error('Please upload at least the main image');
  }

  // Parse ingredients if it's a string
  let parsedIngredients = [];
  if (ingredients) {
    try {
      parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
      if (!Array.isArray(parsedIngredients)) {
        throw new Error('Ingredients must be an array');
      }
      parsedIngredients = parsedIngredients
        .filter(ing => ing.name && ing.name.trim() && ['primary', 'secondary'].includes(ing.type))
        .map(ing => ({
          name: String(ing.name).trim(),
          type: ing.type,
        }));
    } catch (error) {
      console.error('Error parsing ingredients:', error);
      res.status(400);
      throw new Error('Invalid ingredients format');
    }
  }

  // Parse bannerImageTypes
  let parsedBannerImageTypes = [];
  if (bannerImageTypes) {
    try {
      parsedBannerImageTypes = Array.isArray(bannerImageTypes)
        ? bannerImageTypes
        : typeof bannerImageTypes === 'string'
        ? [bannerImageTypes]
        : [];
    } catch (error) {
      console.error('Error parsing bannerImageTypes:', error);
      res.status(400);
      throw new Error('Invalid banner image types format');
    }
  }

  const bannerData = {
    title,
    description: description || '',
    image: `/Uploads/${req.files.image[0].filename}`,
    linkUrl: linkUrl || '',
    ingredients: parsedIngredients,
    bannerType: bannerType || 'home_slider',
    page: page || 'homepage',
    displayOrder: parseInt(displayOrder) || 0,
    isActive: isActive === 'true' || isActive === true,
    startDate: startDate || new Date(),
    endDate: endDate || new Date(new Date().setMonth(new Date().getMonth() + 1)),
    bannerImages: [],
  };

  // Add mobile image if provided
  if (req.files.mobileImage && req.files.mobileImage[0]) {
    bannerData.mobileImage = `/Uploads/${req.files.mobileImage[0].filename}`;
  }

  // Add fruit image if provided
  if (req.files.fruitImage && req.files.fruitImage[0]) {
    bannerData.fruitImage = `/Uploads/${req.files.fruitImage[0].filename}`;
  }

  // Add additional banner images if provided
  if (req.files.bannerImages) {
    const bannerImages = Array.isArray(req.files.bannerImages)
      ? req.files.bannerImages
      : [req.files.bannerImages];
    bannerData.bannerImages = bannerImages.map((file, index) => ({
      url: `/Uploads/${file.filename}`,
      type: parsedBannerImageTypes[index] || 'home-slider',
    }));
  }

  console.log('Creating banner with data:', bannerData);

  const banner = new Banner(bannerData);
  const createdBanner = await banner.save();

  res.status(201).json(createdBanner);
});

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res) => {
  console.log('Update banner request body:', req.body);
  console.log('Update banner files:', req.files);

  const {
    title,
    description,
    linkUrl,
    ingredients,
    bannerType,
    page,
    displayOrder,
    isActive,
    startDate,
    endDate,
    bannerImageTypes,
  } = req.body;

  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    res.status(404);
    throw new Error('Banner not found');
  }

  // Helper function to delete old image files
  const deleteOldImage = async (imagePath) => {
    if (imagePath && imagePath.startsWith('/Uploads/')) {
      const filePath = path.join(__dirname, '..', 'public', imagePath);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    }
  };

  // Parse ingredients if provided
  let parsedIngredients = banner.ingredients;
  if (ingredients !== undefined) {
    try {
      parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
      if (!Array.isArray(parsedIngredients)) {
        throw new Error('Ingredients must be an array');
      }
      parsedIngredients = parsedIngredients
        .filter(ing => ing.name && ing.name.trim() && ['primary', 'secondary'].includes(ing.type))
        .map(ing => ({
          name: String(ing.name).trim(),
          type: ing.type,
        }));
    } catch (error) {
      console.error('Error parsing ingredients:', error);
      res.status(400);
      throw new Error('Invalid ingredients format');
    }
  }

  // Parse bannerImageTypes
  let parsedBannerImageTypes = [];
  if (bannerImageTypes) {
    try {
      parsedBannerImageTypes = Array.isArray(bannerImageTypes)
        ? bannerImageTypes
        : typeof bannerImageTypes === 'string'
        ? [bannerImageTypes]
        : [];
    } catch (error) {
      console.error('Error parsing bannerImageTypes:', error);
      res.status(400);
      throw new Error('Invalid banner image types format');
    }
  }

  // Update fields
  banner.title = title !== undefined ? title : banner.title;
  banner.description = description !== undefined ? description : banner.description;
  banner.linkUrl = linkUrl !== undefined ? linkUrl : banner.linkUrl;
  banner.ingredients = parsedIngredients;
  banner.bannerType = bannerType !== undefined ? bannerType : banner.bannerType;
  banner.page = page !== undefined ? page : banner.page;
  banner.displayOrder = displayOrder !== undefined ? parseInt(displayOrder) : banner.displayOrder;
  banner.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : banner.isActive;
  banner.startDate = startDate !== undefined ? startDate : banner.startDate;
  banner.endDate = endDate !== undefined ? endDate : banner.endDate;

  // Handle image updates
  if (req.files) {
    if (req.files.image && req.files.image[0]) {
      await deleteOldImage(banner.image);
      banner.image = `/Uploads/${req.files.image[0].filename}`;
    }
    if (req.files.mobileImage && req.files.mobileImage[0]) {
      await deleteOldImage(banner.mobileImage);
      banner.mobileImage = `/Uploads/${req.files.mobileImage[0].filename}`;
    }
    if (req.files.fruitImage && req.files.fruitImage[0]) {
      await deleteOldImage(banner.fruitImage);
      banner.fruitImage = `/Uploads/${req.files.fruitImage[0].filename}`;
    }
    if (req.files.bannerImages) {
      for (const oldImage of banner.bannerImages) {
        await deleteOldImage(oldImage.url);
      }
      const bannerImages = Array.isArray(req.files.bannerImages)
        ? req.files.bannerImages
        : [req.files.bannerImages];
      banner.bannerImages = bannerImages.map((file, index) => ({
        url: `/Uploads/${file.filename}`,
        type: parsedBannerImageTypes[index] || 'home-slider',
      }));
    }
  }

  const updatedBanner = await banner.save();
  res.json(updatedBanner);
});

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    res.status(404);
    throw new Error('Banner not found');
  }

  // Helper function to delete image files
  const deleteImageFile = async (imagePath) => {
    if (imagePath && imagePath.startsWith('/Uploads/')) {
      const filePath = path.join(__dirname, '..', 'public', imagePath);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    }
  };

  // Delete associated image files
  await deleteImageFile(banner.image);
  if (banner.mobileImage) {
    await deleteImageFile(banner.mobileImage);
  }
  if (banner.fruitImage) {
    await deleteImageFile(banner.fruitImage);
  }
  for (const additionalImage of banner.bannerImages) {
    await deleteImageFile(additionalImage.url);
  }

  await Banner.findByIdAndDelete(req.params.id);
  res.json({ message: 'Banner removed successfully' });
});

// @desc    Get home slider banners (max 2)
// @route   GET /api/banners/home-sliders
// @access  Public
const getHomeSliders = asyncHandler(async (req, res) => {
  const currentDate = new Date();
  const sliders = await Banner.find({
    bannerType: 'home_slider',
    isActive: true,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
  })
    .sort({ displayOrder: 1 })
    .limit(2);

  res.json(sliders);
});

// @desc    Get all banners (including inactive) for admin
// @route   GET /api/banners/admin
// @access  Private/Admin
const getAllBannersAdmin = asyncHandler(async (req, res) => {
  const { type, page, isActive } = req.query;

  const query = {};
  if (type) query.bannerType = type;
  if (page) query.page = page;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const banners = await Banner.find(query).sort({ displayOrder: 1, createdAt: -1 });

  res.json(banners);
});

module.exports = {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  getHomeSliders,
  getAllBannersAdmin,
};