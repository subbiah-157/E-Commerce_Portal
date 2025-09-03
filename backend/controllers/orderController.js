const Order = require("../models/Order");
const Product = require("../models/Product"); // Import Product model for stock updates

// 📌 Create new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData || !orderData.products || !Array.isArray(orderData.products)) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    // ✅ Transform products to include prices, sizes, inches
    const products = orderData.products.map((item) => {
      const originalPrice = Number(item.originalPrice || item.price || 0);
      const qty = Number(item.qty) || 1;

      const discountedPrice = item.discount
        ? parseFloat((originalPrice * (1 - item.discount / 100)).toFixed(2))
        : originalPrice;

      let selectedSize = null;
      if (
        item.category?.toLowerCase() === "footwear" ||
        item.category?.toLowerCase() === "clothing"
      ) {
        selectedSize = item.selectedSize || item.size || null;
      }

      return {
        name: item.name || "Unnamed Product",
        qty,
        originalPrice,
        discount: Number(item.discount) || 0,
        discountedPrice,
        total: parseFloat((discountedPrice * qty).toFixed(2)),
        selectedSize,
        size: null,
        sizeInches:
          item.category?.toLowerCase() === "home"
            ? item.sizeInches || item.selectedSize || item.size || null
            : null,
        category: item.category || "Uncategorized",
        subCategory: item.subCategory || "N/A",       // ✅ added
        subSubCategory: item.subSubCategory || "N/A", // ✅ added
        
      };
    });

    // 1️⃣ Decrease stock for each product
    for (const item of products) {
      if (!item.name) continue; // Skip invalid products
      const product = await Product.findOne({ name: item.name });
      if (!product) return res.status(404).json({ error: `${item.name} not found` });

      if (product.stock < item.qty) {
        return res.status(400).json({
          error: `Insufficient stock for ${item.name}`,
        });
      }

      product.stock -= item.qty;
      await product.save();
    }

    // 2️⃣ Calculate totalAmount
    const totalAmount = products.reduce((sum, p) => sum + p.total, 0);

    // 3️⃣ Create order document safely
    const newOrder = new Order({
      userId: orderData.userId,
      userDetails: orderData.userDetails || {},
      paymentMethod: orderData.paymentMethod || "cod",
      paymentId: orderData.paymentId || null,
      paymentStatus: orderData.paymentStatus || "Pending",
      products,
      totalAmount,
      currency: orderData.currency || "GBP",
      orderStatus: {
        placeOrder: orderData.paymentMethod === "cod",
        shipping: false,
        delivery: false,
      },
      shippingApproved: false,
      shippingCompleted: false,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// 📌 Get orders by user
exports.getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    res.json(orders);
  } catch (err) {
    console.error("Get Orders By User Error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// 📌 Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error("Get All Orders Error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// 📌 Delete order by ID
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.orderStatus?.shipping || order.orderStatus?.delivery) {
      return res.status(400).json({
        error: "Cannot delete order that has been shipped or delivered",
      });
    }

    await Order.deleteOne({ _id: req.params.orderId });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete Order Error:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
};

// 📌 Admin approves shipping
exports.approveShipping = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.shippingApproved = true;
    await order.save();
    res
      .status(200)
      .json({ message: "Shipping approved successfully", order });
  } catch (err) {
    console.error("Approve Shipping Error:", err);
    res.status(500).json({ error: "Failed to approve shipping" });
  }
};

// 📌 Shipping team completes shipping
exports.completeShipping = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (!order.shippingApproved) {
      return res
        .status(400)
        .json({ error: "Shipping not approved by admin yet" });
    }

    order.shippingCompleted = true;
    order.orderStatus.shipping = true;
    await order.save();
    res
      .status(200)
      .json({ message: "Shipping completed successfully", order });
  } catch (err) {
    console.error("Complete Shipping Error:", err);
    res.status(500).json({ error: "Failed to complete shipping" });
  }
};

// 📌 Get only shipping-approved orders (for Shipping Management page)
exports.getApprovedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ shippingApproved: true });
    res.json(orders);
  } catch (err) {
    console.error("Get Approved Orders Error:", err);
    res.status(500).json({ error: "Failed to fetch approved orders" });
  }

};

// Send order to delivery
exports.sendToDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (!order.shippingCompleted) {
      return res.status(400).json({ error: "Shipping not completed yet" });
    }

    order.sentToDelivery = true;
    await order.save();
    console.log(order);
    res.status(200).json({ message: "Order sent to delivery", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send order to delivery" });
  }
};

// Mark delivery as completed
exports.markDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (!order.sentToDelivery) {
      return res.status(400).json({ error: "Order not sent to delivery yet" });
    }

    // ✅ Set delivery flags
    order.deliveryCompleted = true;
    order.orderStatus.delivery = true;

    // ✅ Save exact delivery date
    const indiaTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    order.deliveryDate = indiaTime;

    // ✅ Update paymentStatus if COD
    if (order.paymentMethod.toLowerCase() === "cod") {
      order.paymentStatus = "Completed";
    }

    await order.save();

    res.status(200).json({
      message: "Delivery completed successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete delivery" });
  }
};


// Get orders ready for delivery
exports.getDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      shippingCompleted: true, // ready for delivery
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch delivery orders" });
  }
};

