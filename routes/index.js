const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/banners', require('./bannerRoutes'));
router.use('/blogs', require('./blogRoutes'));
router.use('/ingredients', require('./ingredientRoutes'));

module.exports = router;