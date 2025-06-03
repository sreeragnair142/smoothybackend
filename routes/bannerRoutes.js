// const express = require('express');
// const router = express.Router();
// const { protect, admin } = require('../middleware/auth');
// const upload = require('../middleware/upload');
// const {
//   getBanners,
//   getBannerById,
//   createBanner,
//   updateBanner,
//   deleteBanner
// } = require('../controllers/bannerController');

// router.route('/')
//   .get(getBanners)
//   .post(protect, admin, upload.single('image'), createBanner);

// router.route('/:id')
//   .get(getBannerById)
//   .put(protect, admin, upload.single('image'), updateBanner)
//   .delete(protect, admin, deleteBanner);

// module.exports = router;


// routes/bannerRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getBanners,
  createBanner,
  getHomeSliders
} = require('../controllers/bannerController');

// Configure upload to handle multiple files
const bannerUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 }
]);

router.route('/')
  .get(getBanners)
  .post(protect, admin, bannerUpload, createBanner);

router.get('/home-sliders', getHomeSliders);

module.exports = router;