const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrdersByUser,
  getAllOrders,
  deleteOrder,
  approveShipping,
  completeShipping,
  getApprovedOrders,   // <-- ✅ Add this
  sendToDelivery,   // ✅ import here
  markDelivered,    // ✅ import here
  getDeliveryOrders,
} = require("../controllers/orderController");

// ✅ Create new order
router.post("/", createOrder);

// ✅ Get orders by user
router.get("/user/:userId", getOrdersByUser);

// ✅ Get all orders (admin) 
router.get("/", getAllOrders);

// ✅ Delete order by ID
router.delete("/:orderId", deleteOrder);

// ✅ Admin approves shipping
router.put("/admin/approve-shipping/:orderId", approveShipping);

// ✅ Get only shipping-approved orders
router.get("/approved/shipping", getApprovedOrders);

// ✅ Shipping team completes shipping
router.put("/shipping/complete/:orderId", completeShipping);

// ✅ Admin sends order to delivery
router.put("/admin/send-to-delivery/:orderId", sendToDelivery);

// ✅ Admin marks delivery as completed
router.put("/admin/mark-delivered/:orderId", markDelivered);
router.get("/delivery", getDeliveryOrders);

module.exports = router;
