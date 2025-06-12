const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  getHomeSliders,
  getAllBannersAdmin,
} = require('../controllers/bannerController');

// Configure upload to handle multiple files
const bannerUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 },
  { name: 'bannerImages', maxCount: 10 },
]);

// Public routes
router.get('/home-sliders', getHomeSliders);
router.get('/', getBanners);

// Admin routes
router.get('/admin', protect, admin, getAllBannersAdmin);

// CRUD routes
router
  .route('/:id')
  .get(getBanner)
  .put(protect, admin, bannerUpload, updateBanner)
  .delete(protect, admin, deleteBanner);

// Create route
router.post('/', protect, admin, bannerUpload, createBanner);

module.exports = router;