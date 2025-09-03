const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userDetails: { type: Object, required: true },

    paymentMethod: { type: String, required: true },
    paymentId: { type: String },
    paymentStatus: { type: String, default: "Pending" },

    products: [
      {
        name: String,
        qty: Number,
        originalPrice: Number,
        discount: Number,
        discountedPrice: Number,
        total: Number,
        selectedSize: { type: String, default: null },
        sizeInches: { type: String, default: null },
        category: { type: String, default: "Uncategorized" },
        subCategory: { type: String, default: "N/A" },
        subSubCategory: { type: String, default: "N/A" },
      },
    ],

    totalAmount: { type: Number },
    currency: { type: String, default: "GBP" },

    orderStatus: {
      placeOrder: { type: Boolean, default: false },
      shipping: { type: Boolean, default: false },
      delivery: { type: Boolean, default: false },
    },

    shippingApproved: { type: Boolean, default: false },
    shippingCompleted: { type: Boolean, default: false },

    // ✅ Delivery management
    sentToDelivery: { type: Boolean, default: false },
    deliveryCompleted: { type: Boolean, default: false },
    deliveryDate: { type: Date },  // store delivered date

    // ✅ Invoice management
    invoiceNumber: { type: String, unique: true, sparse: true },
    invoiceUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
