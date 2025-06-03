// const Banner = require('../models/Banner');
// const asyncHandler = require('express-async-handler');


// const getBanners = asyncHandler(async (req, res) => {
//   const banners = await Banner.find({});
//   res.json(banners);
// });


// const getBannerById = asyncHandler(async (req, res) => {
//   const banner = await Banner.findById(req.params.id);

//   if (banner) {
//     res.json(banner);
//   } else {
//     res.status(404);
//     throw new Error('Banner not found');
//   }
// });


// const createBanner = asyncHandler(async (req, res) => {
//   const { title, subtitle, link } = req.body;
  
//   if (!req.file) {
//     res.status(400);
//     throw new Error('Please upload an image');
//   }

//   const banner = new Banner({
//     title,
//     subtitle,
//     image: req.file.path,
//     link
//   });

//   const createdBanner = await banner.save();
//   res.status(201).json(createdBanner);
// });


// const updateBanner = asyncHandler(async (req, res) => {
//   const { title, subtitle, link, isActive } = req.body;

//   const banner = await Banner.findById(req.params.id);

//   if (banner) {
//     banner.title = title || banner.title;
//     banner.subtitle = subtitle || banner.subtitle;
//     banner.link = link || banner.link;
//     banner.isActive = isActive !== undefined ? isActive : banner.isActive;
    
//     if (req.file) {
//       banner.image = req.file.path;
//     }

//     const updatedBanner = await banner.save();
//     res.json(updatedBanner);
//   } else {
//     res.status(404);
//     throw new Error('Banner not found');
//   }
// });


// const deleteBanner = asyncHandler(async (req, res) => {
//   const banner = await Banner.findById(req.params.id);

//   if (banner) {
//     await banner.remove();
//     res.json({ message: 'Banner removed' });
//   } else {
//     res.status(404);
//     throw new Error('Banner not found');
//   }
// });

// module.exports = {
//   getBanners,
//   getBannerById,
//   createBanner,
//   updateBanner,
//   deleteBanner
// };


// controllers/bannerController.js
const Banner = require('../models/Banner');
const asyncHandler = require('express-async-handler');

// @desc    Get all active banners by type and page
// @route   GET /api/banners
// @access  Public
const getBanners = asyncHandler(async (req, res) => {
  const { type, page } = req.query;
  
  const query = { isActive: true };
  if (type) query.bannerType = type;
  if (page) query.page = page;

  const banners = await Banner.find(query)
    .sort({ displayOrder: 1 })
    .populate('ingredients', 'name image');

  res.json(banners);
});

// @desc    Create new banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
  const { 
    title, 
    subtitle, 
    link, 
    ingredients, 
    bannerType, 
    page,
    displayOrder 
  } = req.body;

  if (!req.files || !req.files.image) {
    res.status(400);
    throw new Error('Please upload at least the main image');
  }

  const banner = new Banner({
    title,
    subtitle,
    image: req.files.image[0].path,
    mobileImage: req.files.mobileImage ? req.files.mobileImage[0].path : undefined,
    link,
    ingredients: JSON.parse(ingredients || '[]'),
    bannerType,
    page,
    displayOrder: displayOrder || 0
  });

  const createdBanner = await banner.save();
  res.status(201).json(createdBanner);
});

// @desc    Get home slider banners (max 2)
// @route   GET /api/banners/home-sliders
// @access  Public
const getHomeSliders = asyncHandler(async (req, res) => {
  const sliders = await Banner.find({
    bannerType: 'home_slider',
    isActive: true
  })
  .sort({ displayOrder: 1 })
  .limit(2)
  .populate('ingredients', 'name image');

  res.json(sliders);
});

module.exports = {
  getBanners,
  createBanner,
  getHomeSliders
};