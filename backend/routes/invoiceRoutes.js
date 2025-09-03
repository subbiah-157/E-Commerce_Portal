const express = require("express");
const router = express.Router();
const { generateInvoice, getInvoice } = require("../controllers/invoiceController");

// Generate invoice after delivery
router.post("/generate/:orderId", generateInvoice);

// Download invoice
router.get("/:orderId", getInvoice);

module.exports = router;
