// const mongoose = require('mongoose');

// const bannerSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true
//   },
//   subtitle: {
//     type: String
//   },
//   image: {
//     type: String,
//     required: true
//   },
//   link: {
//     type: String
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Banner', bannerSchema);

// models/Banner.js
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String
  },
  image: {
    type: String,
    required: true
  },
  mobileImage: {
    type: String // Optional different image for mobile
  },
  link: {
    type: String
  },
  ingredients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient'
  }],
  bannerType: {
    type: String,
    enum: ['home_slider', 'beverage', 'smoothie', 'promo'],
    required: true
  },
  page: {
    type: String,
    enum: ['home', 'menu', 'about', 'contact', null],
    default: null
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Banner', bannerSchema);