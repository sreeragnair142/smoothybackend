const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: ''
  },
  ingredients: {
    type: String,
    trim: true,
    default: ''
  },
  instructions: {
    type: String,
    trim: true,
    default: ''
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    unique: true,
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'SKU cannot be empty'
    }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
    default: undefined
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true // Keep sparse to allow missing barcodes
  },
  volume: {
    type: Number,
    min: [0, 'Volume cannot be negative'],
    default: undefined
  },
  volumeUnit: {
    type: String,
    default: undefined,
    enum: ['mL', 'L', 'oz', null]
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
    default: undefined
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  images: [{ type: String, trim: true }],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{ type: String, trim: true }],
  recipes: [recipeSchema],
  ratings: {
    average: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  selectedPages: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', 'recipes.name': 'text', 'recipes.ingredients': 'text', 'recipes.instructions': 'text' });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ selectedPages: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;