const Cart = require("../models/Cart");

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("products.product");
    if (!cart) {
      cart = new Cart({ user: req.user._id, products: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add product to cart
exports.addToCart = async (req, res) => {
  const { productId, qty, selectedSize } = req.body;

  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ 
        user: req.user._id, 
        products: [{ product: productId, qty, selectedSize: selectedSize || "" }] 
      });
    } else {
      // Check if product with same size already exists
      const existing = cart.products.find(p => 
        p.product.toString() === productId && p.selectedSize === (selectedSize || "")
      );
      
      if (existing) {
        existing.qty += qty;
      } else {
        cart.products.push({ product: productId, qty, selectedSize: selectedSize || "" });
      }
    }

    await cart.save();
    cart = await cart.populate("products.product");
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove product from cart
exports.removeFromCart = async (req, res) => {
  const { productId, selectedSize } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = cart.products.filter(p => 
      !(p.product.toString() === productId && p.selectedSize === (selectedSize || ""))
    );
    
    await cart.save();
    const updatedCart = await cart.populate("products.product");
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quantity
exports.updateQty = async (req, res) => {
  const { productId, qty, selectedSize } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const product = cart.products.find(p => 
      p.product.toString() === productId && p.selectedSize === (selectedSize || "")
    );
    
    if (product) product.qty = qty;

    await cart.save();
    const updatedCart = await cart.populate("products.product");
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};