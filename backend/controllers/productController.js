const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");

// Delete file utility
const deleteImage = (imgPath) => {
  const fullPath = path.resolve(__dirname, "..", imgPath.replace(/^\/+/, ""));
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

// Merge extraDetails into response for frontend
const mergeExtraDetails = (productObj) => {
  const obj = { ...productObj };
  obj.image = obj.images?.[0] || obj.image;
  obj.totalPrice = (obj.price || 0) - (obj.discount || 0);
  return obj;
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    const formatted = products.map(p => mergeExtraDetails(p.toObject()));
    res.json(formatted);
  } catch (err) {
    console.error("getProducts Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(mergeExtraDetails(product.toObject()));
  } catch (err) {
    console.error("getProductById Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const {
      name, price, discount = 0, stock, description, category, subCategory, subSubCategory,
      currency, size, color, material, fit, brand, warranty,
      ram, storage, processor, displaySize, battery, camera, screenSize, type,
      inchs, // ✅ Added inchs
      extraDetails, ...dynamicAttrs
    } = req.body;

    if (!name || !price || !stock || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Handle images
    let images = [];
    if (req.files?.length > 0) images = req.files.map(f => `/uploads/${f.filename}`);
    else if (req.file) images = [`/uploads/${req.file.filename}`];

    // Handle extraDetails
    let extras = {};
    if (extraDetails) {
      try {
        extras = typeof extraDetails === "string" ? JSON.parse(extraDetails) : extraDetails;
      } catch {
        extras = {};
      }
    }
    // Merge dynamicAttrs into extras
    for (let key in dynamicAttrs) {
      if (dynamicAttrs[key] !== undefined) extras[key] = dynamicAttrs[key];
    }

    // Handle size based on category
    let processedSize = [];
    if (category === "Clothing") {
      // For clothing, size should be an array
      processedSize = Array.isArray(size) ? size : (size ? String(size).split(",").map(s => s.trim()) : []);
    } else if (["Footwear", "Sports", "Fitness"].includes(category)) {
      // For these categories, size should be a string
      processedSize = size || "";
    } else {
      // For other categories, keep as is
      processedSize = Array.isArray(size) ? size : (size ? [size] : []);
    }

    const product = new Product({
      name,
      price,
      discount,
      totalPrice: price - discount,
      stock,
      description,
      category,
      subCategory,
      subSubCategory,
      images,
      image: images[0] || "",
      currency,
      size: processedSize,
      color,
      material,
      fit,
      brand,
      warranty,
      ram,
      storage,
      processor,
      displaySize,
      battery,
      camera,
      screenSize,
      type,
      inchs, // ✅ Added inchs
      extraDetails: extras,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("createProduct Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update existing product
exports.updateProduct = async (req, res) => {
  try {
    const {
      name, price, discount = 0, stock, description, category, subCategory, subSubCategory,
      currency, size, color, material, fit, brand, warranty,
      ram, storage, processor, displaySize, battery, camera, screenSize, type,
      inchs, // ✅ Added inchs
      extraDetails, ...dynamicAttrs
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Update images
    if (req.files?.length > 0) {
      product.images?.forEach(deleteImage);
      product.images = req.files.map(f => `/uploads/${f.filename}`);
      product.image = product.images[0];
    } else if (req.file) {
      product.images?.[0] && deleteImage(product.images[0]);
      product.images = [`/uploads/${req.file.filename}`];
      product.image = `/uploads/${req.file.filename}`;
    }

    // Handle size based on category
    let processedSize = product.size; // Keep existing size by default
    
    if (category === "Clothing") {
      // For clothing, size should be an array
      processedSize = Array.isArray(size) ? size : (size ? String(size).split(",").map(s => s.trim()) : []);
    } else if (["Footwear", "Sports", "Fitness"].includes(category)) {
      // For these categories, size should be a string
      processedSize = size || "";
    } else if (size !== undefined) {
      // For other categories, handle as appropriate
      processedSize = Array.isArray(size) ? size : (size ? [size] : []);
    }

    // Update fields
    Object.assign(product, {
      name,
      price,
      discount,
      totalPrice: price - discount,
      stock,
      description,
      category,
      subCategory,
      subSubCategory,
      currency,
      size: processedSize,
      color,
      material,
      fit,
      brand,
      warranty,
      ram,
      storage,
      processor,
      displaySize,
      battery,
      camera,
      screenSize,
      type,
      inchs, // ✅ Added inchs
    });

    // Handle extraDetails
    let extras = {};
    if (extraDetails) {
      try {
        extras = typeof extraDetails === "string" ? JSON.parse(extraDetails) : extraDetails;
      } catch {
        extras = {};
      }
    }
    for (let key in dynamicAttrs) {
      if (dynamicAttrs[key] !== undefined) extras[key] = dynamicAttrs[key];
    }
    product.extraDetails = extras;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("updateProduct Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    product.images?.forEach(deleteImage);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("deleteProduct Error:", err);
    res.status(500).json({ message: err.message });
  }
};