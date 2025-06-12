const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      required: true,
    },
    mobileImage: {
      type: String,
    },
    fruitImage: {
      type: String,
    },
    bannerImages: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['home-slider', 'inner-page'],
          required: true,
        },
      },
    ],
    linkUrl: {
      type: String,
    },
    ingredients: [
      {
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['primary', 'secondary'],
          required: true,
        },
      },
    ],
    bannerType: {
      type: String,
      enum: ['home_slider', 'inner_page'],
      required: true,
    },
    page: {
      type: String,
      enum: ['homepage', 'menu', 'about', 'contact', null],
      default: 'homepage',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('Banner', bannerSchema);