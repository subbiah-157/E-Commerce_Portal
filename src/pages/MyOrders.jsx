import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import API_BASE_URL from "../config";
import Navbar from "../components/Navbar";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiDownload,
  FiTrash2,
  FiUser,
  FiMail,
  FiPhone,
  FiShoppingBag,
  FiEye,
  FiX,
  FiUpload,
  FiFile
} from "react-icons/fi";
import "../styles/MyOrder.css";
import Chatbot from "../components/Chatbot";

const MyOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [emailFormData, setEmailFormData] = useState({
    name: "",
    email: "",
    message: "",
    subject: "Product Delivery Confirmation",
    reason: "",
    otherReason: ""
  });

  // ✅ Fetch orders
  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/orders/user/${user.id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setOrders(res.data);

      // ✅ Auto-generate invoice if order is delivered but no invoice yet
      res.data.forEach(async (order) => {
        if (order.deliveryCompleted && !order.invoiceBuffer) {
          try {
            await axios.post(
              `${API_BASE_URL}/api/invoices/generate/${order._id}`,
              {},
              { headers: { Authorization: `Bearer ${user.token}` } }
            );
          } catch (err) {
            console.error(`Failed to generate invoice for ${order._id}:`, err);
          }
        }
      });
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // ✅ Delete order
  const handleDeleteOrder = async (orderId, orderStatus) => {
    if (!user) return alert("User not found");
    if (orderStatus?.shipping || orderStatus?.delivery)
      return alert("Cannot delete shipped or delivered order");
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      alert("Order deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete order");
    }
  };

  // ✅ Download invoice PDF
  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/invoices/${orderId}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download invoice:", error);
      alert("Invoice not found. Please try again later.");
    }
  };

  // ✅ View product details
  const handleViewProduct = (product) => {
    // This would navigate to the product details page in a real application
    alert(`Viewing product: ${product.name}\nID: ${product._id || product.productId}`);
    // In a real app, you would use: navigate(`/product/${product._id || product.productId}`);
  };

  // ✅ Open email modal
  const handleOpenEmailModal = (order) => {
    setSelectedOrder(order);
    setEmailFormData({
      name: user.name || "",
      email: user.email || "",
      message: `I would like to request a return for my order (ID: ${order._id}).\n\nOrder Details:\n- Total Amount: ${order.currency} ${order.totalAmount}\n- Products: ${order.products.map(p => `${p.name} (ID: ${p._id || p.productId})`).join(', ')}\n\nKindly guide me through the return process as per the product return policy.\n\nThank you!`,
      subject: `Product Return Request - Order #${order._id}`,
      reason: "",
      otherReason: ""
    });
    setShowEmailModal(true);
  };

  // ✅ Close email modal
  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setSelectedOrder(null);
    setEmailFormData({
      name: "",
      email: "",
      message: "",
      subject: "Product Delivery Confirmation",
      reason: "",
      otherReason: ""
    });
  };

  // ✅ Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ Submit email form using Web3Forms
  const handleSubmitEmail = async (e) => {
    e.preventDefault();

    // Validate reason selection
    if (!emailFormData.reason) {
      alert("Please select a reason for return");
      return;
    }

    // If "Other" is selected, validate otherReason
    if (emailFormData.reason === "Other" && !emailFormData.otherReason) {
      alert("Please specify your reason for return");
      return;
    }

    try {
      // Create FormData for submission
      setLoading(true); // ✅ start loading
      const formData = new FormData();
      formData.append('access_key', '4094ad1a-e4ef-405a-9844-848aa6e6141b'); // Replace with your actual access key
      formData.append('name', emailFormData.name);
      formData.append('email', emailFormData.email);
      formData.append('subject', emailFormData.subject);

      // Include reason in the message
      const finalReason = emailFormData.reason === "Other"
        ? emailFormData.otherReason
        : emailFormData.reason;

      const finalMessage = `I would like to request a return for my order (ID: ${selectedOrder._id}).\n\nOrder Details:\n- Total Amount: ${selectedOrder.currency} ${selectedOrder.totalAmount}\n- Products: ${selectedOrder.products.map(p => `${p.name} (ID: ${p._id || p.productId})`).join(', ')}\n\nReason for Return: ${finalReason}\n\n${emailFormData.message}`;

      formData.append('message', finalMessage);
      formData.append('order_id', selectedOrder._id);
      formData.append('order_details', JSON.stringify(selectedOrder));
      formData.append('return_reason', finalReason);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert("Return request submitted successfully!");
        handleCloseEmailModal();
      } else {
        alert("Failed to submit return request. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting return request:", error);
      alert("An error occurred while submitting the return request.");
    }
    finally {
      setLoading(false); // ✅ stop loading
    }
  };

  // ✅ Render product details based on category
  const renderProductDetails = (product) => {
    const category = product.category?.toLowerCase() || "";

    if (category.includes("electronic")) {
      return (
        <>
          {product.ram && <p>RAM: {product.ram}</p>}
          {product.rom && <p>ROM: {product.rom}</p>}
          {product.processor && <p>Processor: {product.processor}</p>}
        </>
      );
    } else if (category.includes("clothing") || category.includes("fashion")) {
      return (
        <>
          {product.size && <p>Size: {product.size}</p>}
          {product.color && <p>Color: {product.color}</p>}
          {product.material && <p>Material: {product.material}</p>}
        </>
      );
    } else if (category.includes("home") || category.includes("furniture")) {
      return (
        <>
          {product.dimensions && <p>Dimensions: {product.dimensions}</p>}
          {product.inches && <p>Inches: {product.inches}</p>}
          {product.material && <p>Material: {product.material}</p>}
        </>
      );
    } else {
      return (
        <>
          {product.specifications && <p>Specifications: {product.specifications}</p>}
          {product.features && <p>Features: {product.features}</p>}
        </>
      );
    }
  };

  return (
    <><Navbar />
    <div className="my-orders-container">
      <h2 className="page-title">My Orders</h2>

      {orders.length === 0 && (
        <div className="no-orders">
          <FiShoppingBag size={48} />
          <p>No orders found</p>
        </div>
      )}

      {orders.map((order) => (
        <div key={order._id} className="order-card">
          <div className="order-header">
            <div className="order-id-status">
              <h3>Order ID: {order._id}</h3>
              <span className={`status-badge ${order.deliveryCompleted ? 'completed' : 'processing'}`}>
                {order.deliveryCompleted ? 'Delivered' : 'Processing'}
              </span>
            </div>

            <div className="order-info">
              <p><strong>Total:</strong> {order.currency} {order.totalAmount}</p>
              <p><strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus})</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="customer-info">
            <h4>Customer Information</h4>
            <div className="info-item">
              <FiUser className="info-icon" />
              <span>{order.customerName || user.name}</span>
            </div>
            <div className="info-item">
              <FiMail className="info-icon" />
              <span>{order.customerEmail || user.email}</span>
            </div>
            {order.customerPhone && (
              <div className="info-item">
                <FiPhone className="info-icon" />
                <span>{order.customerPhone}</span>
              </div>
            )}
          </div>

          {order.products?.length > 0 && (
            <div className="products-section">
              <h4>Products ({order.products.length})</h4>
              <div className="products-list">
                {order.products.map((p, idx) => (
                  <div key={idx} className="product-item">
                    <div className="product-header">
                      <span className="product-name">{p.name || "Balman Paris"}</span>
                      <span className="product-price">{order.currency} {p.total || 90}</span>
                    </div>
                    <div className="product-details">
                      <p>Product ID: {p._id || p.productId || "N/A"}</p>
                      <p>Quantity: {p.qty || 1}</p>
                      {p.category && <p>Category: {p.category}</p>}
                      {p.subCategory && <p>Subcategory: {p.subCategory}</p>}
                      {p.subSubCategory && <p>Sub-Subcategory: {p.subSubCategory}</p>}

                      {/* Category-specific details */}
                      {renderProductDetails(p)}

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Order Progress */}
          <div className="order-progress">
            <h4>Order Status</h4>
            <div className="progress-tracker">
              <div className={`progress-step ${order.orderStatus?.placeOrder ? 'completed' : ''}`}>
                <div className="step-icon">
                  <FiPackage />
                </div>
                <span className="step-label">Order Prepared</span>
              </div>

              <div className={`progress-connector ${order.orderStatus?.shipping ? 'completed' : ''}`}></div>

              <div className={`progress-step ${order.orderStatus?.shipping ? 'completed' : ''}`}>
                <div className="step-icon">
                  <FiTruck />
                </div>
                <span className="step-label">In Transit</span>
              </div>

              <div className={`progress-connector ${order.orderStatus?.delivery ? 'completed' : ''}`}></div>

              <div className={`progress-step ${order.orderStatus?.delivery ? 'completed' : ''}`}>
                <div className="step-icon">
                  <FiCheckCircle />
                </div>
                <span className="step-label">Delivered</span>
              </div>
            </div>
          </div>

          {/* ✅ Action Buttons */}
          <div className="order-actions">
            {order.deliveryCompleted && (
              <>
                <button
                  className="btn-download-invoice"
                  onClick={() => handleDownloadInvoice(order._id)}
                >
                  <FiDownload className="btn-icon" />
                  Download Invoice
                </button>
                <button
                  className="btn-email"
                  onClick={() => handleOpenEmailModal(order)}
                >
                  <FiMail className="btn-icon" />
                  Return Policy
                </button>
              </>
            )}

            <button
              className={`btn-delete-order ${order.orderStatus?.shipping || order.orderStatus?.delivery ? 'disabled' : ''}`}
              disabled={order.orderStatus?.shipping || order.orderStatus?.delivery}
              onClick={() => handleDeleteOrder(order._id, order.orderStatus)}
            >
              <FiTrash2 className="btn-icon" />
              Delete Order
            </button>
          </div>
        </div>
      ))}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Return Policy Request</h3>
              <button className="modal-close" onClick={handleCloseEmailModal}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmitEmail} className="email-form">
              <div className="form-group">
                <label>Your Name </label>
                <input
                  type="text"
                  name="name"
                  value={emailFormData.name}
                  onChange={handleInputChange}
                  required
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Your Email </label>
                <input
                  type="email"
                  name="email"
                  value={emailFormData.email}
                  onChange={handleInputChange}
                  required
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={emailFormData.subject}
                  onChange={handleInputChange}
                  required
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Reason for Return </label>
                <select
                  name="reason"
                  value={emailFormData.reason}
                  onChange={handleInputChange}
                  required
                  className="reason-select"
                >
                  <option value="">Select a reason</option>
                  <option value="Product damaged">Product damaged</option>
                  <option value="Wrong product received">Wrong product received</option>
                  <option value="Product not as described">Product not as described</option>
                  <option value="Size issue">Size issue</option>
                  <option value="Color issue">Color issue</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* If "Other" is selected → show extra input box */}
              {emailFormData.reason === "Other" && (
                <div className="form-group">
                  <label>Please specify your reason *</label>
                  <input
                    type="text"
                    name="otherReason"
                    value={emailFormData.otherReason || ""}
                    onChange={handleInputChange}
                    placeholder="Write your reason here..."
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Details</label>
                <textarea
                  name="message"
                  value={emailFormData.message}
                  onChange={handleInputChange}
                  rows="6"
                  required
                  disabled
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCloseEmailModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Sending...
                    </>
                  ) : (
                    "Submit Return Request"
                  )}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      <Chatbot />
    </div>
    </>
  );
};

export default MyOrders;