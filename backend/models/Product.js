const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }, // Original price
  discount: { type: Number, default: 0 }, // Discount amount
  totalPrice: { 
    type: Number, 
    default: function() { return this.price - this.discount } 
  }, // Computed price
  stock: { type: Number, required: true },
  image: { type: String },
  images: { type: [String] },
  description: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String },
  subSubCategory: { type: String },

  // ✅ Top-level fields
  currency: String,
  size: [String], // ✅ updated to array for Clothing checkboxes
  color: String,
  material: String,
  fit: String,
  brand: String,
  warranty: String, 
  ram: String,
  storage: String,
  processor: String,
  displaySize: String,
  battery: String,
  camera: String,
  screenSize: String,
  type: String, // ✅ remains string for Electronics (Mobile/Laptop)
  inchs: String, // ✅ Added for Home category
  skinType: String,
  hairType: String,
  fragranceType: String,
  language: String,
  author: String,
  genre: String,
  format: String,
  packSize: String,
  organic: String,
  model: String,
  power: String,
  capacity: String,
  weight: String,
  
  // ✅ Dynamic fields
  extraDetails: { type: Map, of: String, default: {} },
}, { timestamps: true });

// Middleware to calculate totalPrice before saving
productSchema.pre("save", function(next) {
  this.totalPrice = this.price - (this.discount || 0);
  next();
});

module.exports = mongoose.model("Product", productSchema);