const fs = require("fs");       
const path = require("path");
const PDFDocument = require("pdfkit");
const Order = require("../models/Order");
const Company = require("../models/CompanyDetails"); // Import company model

// Currency symbols mapping
const currencySymbols = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
};

// Tax configuration per currency
const TAX_CONFIG = {
  INR: 18,
  USD: 10,
  GBP: 15,
  EUR: 12,
  DEFAULT: 0
};

// File system utility
const ensureDirectoryExists = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });
};

// Format date and currency
const formatDate = (date, timezone = "Asia/Kolkata") => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-IN", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatCurrency = (amount, currency = "INR") => {
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${(amount || 0).toFixed(2)}`;
};

// ---------------- PDF Content Helpers ----------------
const addHeader = (doc, order, company) => {
  // Company Logo
  if (company.logo) {
    const logoPath = path.join(__dirname, "..", company.logo); // Ensure path is correct
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 50, height: 50 });
    }
  }

  doc.font("Helvetica-Bold").fontSize(20).text("INVOICE", 0, 50, { align: "center" });
  doc.font("Helvetica").fontSize(12);
  doc.moveDown(2);
  
const leftSpace = 50;
const topSpace = 110;

// Company Info (start at x=leftSpace, y=topSpace)
doc.fontSize(12)
   .text(`Name: ${company.name}` || "Your Company Pvt Ltd", leftSpace, topSpace)
   .text(`Address: ${company.street}` || "123 Business Street", leftSpace, topSpace + 20)
   .text(company.city || "City, Country", leftSpace, topSpace + 40)
   .text(company.district ? `${company.district}, ${company.state || ""}, ${company.country || ""}` : "", leftSpace, topSpace + 60)
    .text(`Email: ${company.email || "support@yourcompany.com"}`,leftSpace, topSpace + 80)
    .text(`Website: ${company.website || "www.yourcompany.com"}`, leftSpace, topSpace + 100)
    .moveDown();

  const invoiceNumber = `INV-${order._id}-${Date.now()}`;
  doc.text(`Invoice No: ${invoiceNumber}`,leftSpace, topSpace + 120)
     .text(`Date: ${formatDate(new Date())}`, leftSpace, topSpace + 140)
     .moveDown();
  return invoiceNumber;
};

const addCustomerInfo = (doc, order) => {
  const customer = order.userDetails || {};
  const address = order.shippingAddress || customer;

  const phoneWithRegion = (customer.regionCode || "+91") + (customer.mobile || "N/A");

  doc.fontSize(12)
    .text(`Invoice for Order ID: ${order._id}`,leftSpace, topSpace + 160)
    .text(`Customer: ${customer.name || "N/A"}`, leftSpace, topSpace + 180)
    .text(`Email: ${customer.email || "N/A"}`, leftSpace, topSpace + 200)
    .text(`Phone: ${phoneWithRegion}`, leftSpace, topSpace + 220)
    .text(`Address: ${address.houseNumber || ""}, ${address.street || ""}, ${address.city || ""}, ${address.state || ""}, District: ${address.district || "N/A"} - ${address.pincode || ""}`, leftSpace, topSpace + 240)
    .text(`Country: ${address.country || "India"}`, leftSpace, topSpace + 260)
    .moveDown();
  doc.text(`Order Date: ${formatDate(order.createdAt)}`, leftSpace, topSpace + 280)
     .text(`Delivered Date: ${formatDate(order.deliveryDate)}`, leftSpace, topSpace + 300)
     .moveDown();
};

const leftSpace = 50;
const topSpace = 110;
// ---------------- Product Table -----------------
const addProductTableHeader = (doc) => {
  doc.fontSize(12).text("Product Details", 50, doc.y, leftSpace, topSpace + 340, { underline: true });
  doc.moveDown(0.5);
};

const addProductRow = (doc, product, taxRate) => {
  const currency = product.currency || "INR";
  const unitPrice = product.originalPrice || 0;
  const discountedPrice = product.discountedPrice || unitPrice;
  const discountAmount = unitPrice - discountedPrice;
  const qty = product.qty || 0;
  const totalPrice = discountedPrice * qty;
  const taxAmount = (totalPrice * taxRate) / 100;
  const totalWithTax = totalPrice + taxAmount;
  
  const rowY = doc.y + 15;

  doc.text(`Product Name: ${product.name || "N/A"}`, 50, topSpace + 370)
     .text(`Category: ${product.category || "N/A"}`, 250, topSpace + 370)
     .text(`SubCategory: ${product.subCategory || "N/A"}`, 400, topSpace + 370)
     .text(`Sub-SubCategory: ${product.subSubCategory || "N/A"}`, 50, rowY, topSpace + 390)
     .text(`Size/Inch: ${product.sizeInches || product.selectedSize || "N/A"}`, 250, rowY, topSpace + 390);
  doc.moveDown(0.5);

  doc.text(`Quantity: ${qty}`, 50).moveDown(0.5);
  doc.text(`Original Price: ${formatCurrency(unitPrice, currency)}`, 50).moveDown(0.5);
  doc.text(`Discount: ${formatCurrency(discountAmount, currency)}`, 50).moveDown(0.5);
  doc.text(`Total Price: ${formatCurrency(totalPrice, currency)}`, 50).moveDown(0.5);
  doc.text(`Tax (${taxRate}%): ${formatCurrency(taxAmount, currency)}`, 50).moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(13).text(`Total with Tax: ${formatCurrency(totalWithTax, currency)}`, 50, doc.y);
  doc.font("Helvetica").fontSize(12);
  doc.moveDown(0.2);

  return { lineTotal: totalPrice, lineTax: taxAmount };
};

// ---------------- Totals -----------------
const addTotals = (doc, subtotal, totalTax, currency, taxRate) => {
  const subtotalMinusTax = subtotal - totalTax;
  const grandTotal = subtotal;

  doc.moveDown(0.5);
  doc.fontSize(12)
     doc.text(`Total: ${formatCurrency(subtotal, currency)}`).moveDown(0.5);
     doc.text(`Tax (${taxRate}%): ${formatCurrency(totalTax, currency)}`).moveDown(0.5);
     doc.text(`Subtotal (Total - Tax): ${formatCurrency(subtotalMinusTax, currency)}`).moveDown(0.5);
     doc.text(`Original Total: ${formatCurrency(subtotalMinusTax, currency)} + ${formatCurrency(totalTax, currency)}`).moveDown(0.5);
     doc.font("Helvetica-Bold").fontSize(13).text(`Grand Total: ${formatCurrency(grandTotal, currency)}`);
};

const addFooter = (doc) => {
  doc.moveDown(2);
  doc.fontSize(10)
     .text("Thank you for shopping with us!", { align: "center" });
};

// ------------------- EXPORTS -------------------
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("userDetails");
    if (!order) throw new Error("Order not found");
    if (!order.products || order.products.length === 0) throw new Error("Order has no products");

    // Fetch company details
    const company = await Company.findOne() || {};

    const invoiceDir = path.join(__dirname, "../invoices");
    ensureDirectoryExists(invoiceDir);

    const invoicePath = path.join(invoiceDir, `${orderId}.pdf`);
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const writeStream = fs.createWriteStream(invoicePath);
    doc.pipe(writeStream);

    const customer = order.userDetails || {};
    const address = order.shippingAddress || customer;
    const currency = order.currency || "INR";
    const taxRate = TAX_CONFIG[currency] !== undefined ? TAX_CONFIG[currency] : TAX_CONFIG.DEFAULT;

    // Generate PDF content
    addHeader(doc, order, company);
    addCustomerInfo(doc, order);
    doc.fontSize(13).text("Order Details:", { underline: true });
    doc.moveDown(0.5);
    addProductTableHeader(doc);

    let subtotal = 0;
    let totalTax = 0;
    for (const product of order.products) {
      const { lineTotal, lineTax } = addProductRow(doc, product, taxRate);
      subtotal += lineTotal;
      totalTax += lineTax;
    }

    // Totals outside table
    addTotals(doc, subtotal, totalTax, currency, taxRate);
    addFooter(doc);
    doc.end();

    writeStream.on("finish", () => {
      res.json({ success: true, message: "Invoice generated successfully", path: `/api/invoices/${orderId}`, downloadUrl: `/api/invoices/${orderId}/download` });
    });
    writeStream.on("error", (error) => { throw new Error(`Failed to write invoice file: ${error.message}`); });

  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(error.message === "Order not found" ? 404 : 500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const invoicePath = path.join(__dirname, "../invoices", `${orderId}.pdf`);
    if (!fs.existsSync(invoicePath)) return res.status(404).json({ success: false, message: "Invoice not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${orderId}.pdf`);
    fs.createReadStream(invoicePath).pipe(res);

  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
