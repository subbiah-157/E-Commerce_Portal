import { useEffect, useState, useContext } from "react"; 
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { FaSearch, FaFilter, FaCheckCircle, FaTruck, FaBox, FaShippingFast, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUser, FaMoneyBillWave, FaCreditCard, FaCheck, FaTimes, FaArrowRight, FaClock, FaSpinner, FaChartLine
  , FaChevronUp, FaChevronDown
 } from "react-icons/fa";
import "../styles/DeliveryDetails.css";

const DeliveryDetails = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [expandedProducts, setExpandedProducts] = useState({});

  // ✅ Fetch only shipping completed orders
  const fetchDeliveryOrders = async () => {
    if (!user?.isAdmin) return;
    try {
      const res = await axios.get(
        "http://localhost:5000/api/orders", 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // filter shippingCompleted orders
      const deliveryOrders = res.data.filter((o) => o.shippingCompleted);
      setOrders(deliveryOrders);
    } catch (err) {
      console.error("Failed to fetch delivery orders:", err);
    }
  };

  useEffect(() => {
    fetchDeliveryOrders();
  }, [user]);

  // ✅ Send order to delivery (admin action)
  const handleSendToDelivery = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/admin/send-to-delivery/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, sentToDelivery: true } : o
        )
      );

      alert("Order sent to Delivery Management ✅");
    } catch (err) {
      console.error("Failed to send to delivery:", err);
      alert(err.response?.data?.error || "Failed to send to delivery");
    }
  };

  // ✅ Mark delivery as completed
  const handleCompleteDelivery = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/admin/mark-delivered/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, deliveryCompleted: true } : o
        )
      );

      alert("Order marked as delivered ✅");
    } catch (err) {
      console.error("Failed to mark delivery as completed:", err);
      alert(err.response?.data?.error || "Failed to mark delivery completed");
    }
  };

  // Toggle product details expansion
  const toggleProductDetails = (orderId, productIndex) => {
    const key = `${orderId}-${productIndex}`;
    setExpandedProducts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userDetails?.email && order.userDetails.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.userDetails?.name && order.userDetails.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === "All" ||
      (filterStatus === "Waiting" && !order.sentToDelivery && !order.deliveryCompleted) ||
      (filterStatus === "In Progress" && order.sentToDelivery && !order.deliveryCompleted) ||
      (filterStatus === "Completed" && order.deliveryCompleted);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate delivery statistics
  const deliveryStats = {
    total: orders.length,
    waiting: orders.filter(o => !o.sentToDelivery && !o.deliveryCompleted).length,
    inProgress: orders.filter(o => o.sentToDelivery && !o.deliveryCompleted).length,
    completed: orders.filter(o => o.deliveryCompleted).length
  };

  return (
    <div className="delivery-container">
      <div className="delivery-header">
        <h2>Delivery Management</h2>
        <p>Track and manage all delivery orders</p>
      </div>

      {/* Delivery Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3>{deliveryStats.total}</h3>
            <p>Total Deliveries</p>
          </div>
        </div>
        
        <div className="stat-card waiting">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <h3>{deliveryStats.waiting}</h3>
            <p>Waiting</p>
          </div>
        </div>
        
        <div className="stat-card progress">
          <div className="stat-icon">
            <FaSpinner />
          </div>
          <div className="stat-content">
            <h3>{deliveryStats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </div>
        
        <div className="stat-card completed">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <h3>{deliveryStats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      <div className="controls-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID, Email or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Deliveries</option>
            <option value="Waiting">Waiting</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <FaBox className="no-orders-icon" />
          <p>No delivery orders found.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => {
            const addr = order.userDetails
              ? `${order.userDetails.houseNumber || ""}, ${order.userDetails.region || ""}, ${order.userDetails.district || ""}, ${order.userDetails.state || ""} - ${order.userDetails.pincode || ""}`
              : "N/A";
            const phone = order.userDetails?.mobile || "N/A";

            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-id">Order ID: {order._id}</div>
                  <div className={`status-badge ${
                    order.deliveryCompleted ? "completed" : 
                    order.sentToDelivery ? "in-progress" : "waiting"
                  }`}>
                    {order.deliveryCompleted ? "Completed" : 
                     order.sentToDelivery ? "In Progress" : "Waiting"}
                  </div>
                </div>

                <div className="customer-info">
                  <div className="info-item">
                    <FaUser className="info-icon" />
                    <span>{order.userDetails?.name || "Unknown"}</span>
                  </div>
                  <div className="info-item">
                    <FaEnvelope className="info-icon" />
                    <span>{order.userDetails?.email || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <FaPhone className="info-icon" />
                    <span>{phone}</span>
                  </div>
                  <div className="info-item">
                    <FaMapMarkerAlt className="info-icon" />
                    <span className="address">{addr}</span>
                  </div>
                </div>

                <div className="products-section">
                  <h4>Products ({order.products?.length || 0})</h4>
                  <div className="products-list">
                    {order.products?.map((p, idx) => {
                      const detailsKey = `${order._id}-${idx}`;
                      const isExpanded = expandedProducts[detailsKey];
                      
                      return (
                        <div key={idx} className="product-item">
                          <div 
                            className="product-summary"
                            onClick={() => toggleProductDetails(order._id, idx)}
                          >
                            <div className="product-name">{p.name}</div>
                            <div className="product-toggle">
                              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="product-details-expanded">
                              <div className="detail-row">
                                <span className="detail-label">Category:</span>
                                <span className="detail-value">{p.category || "N/A"}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Subcategory:</span>
                                <span className="detail-value">{p.subCategory || "N/A"}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Sub-Subcategory:</span>
                                <span className="detail-value">{p.subSubCategory || "N/A"}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Size/Inches:</span>
                                <span className="detail-value">{p.selectedSize || p.sizeInches || "N/A"}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Quantity:</span>
                                <span className="detail-value">{p.qty}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Original Price:</span>
                                <span className="detail-value">{order.currency} {p.originalPrice}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Discount:</span>
                                <span className="detail-value">{p.discount || 0}%</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Discounted Price:</span>
                                <span className="detail-value">{order.currency} {p.discountedPrice}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Total:</span>
                                <span className="detail-value">{order.currency} {p.total}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="order-summary">
                  <div className="summary-item">
                    <span>Subtotal:</span>
                    <span>{order.currency} {order.totalAmount}</span>
                  </div>
                  <div className="summary-item">
                    <span>Payment Method:</span>
                    <span className="payment-method">
                      <FaCreditCard /> {order.paymentMethod}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span>Payment Status:</span>
                    <span className={`payment-status ${order.paymentStatus?.toLowerCase()}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="action-buttons">
                  {!order.sentToDelivery && !order.deliveryCompleted && (
                    <button 
                      onClick={() => handleSendToDelivery(order._id)} 
                      className="btn send-btn"
                    >
                      <FaTruck /> Send to Delivery
                    </button>
                  )}
                  {order.sentToDelivery && !order.deliveryCompleted && (
                    <button 
                      onClick={() => handleCompleteDelivery(order._id)} 
                      className="btn complete-btn"
                    >
                      <FaCheckCircle /> Mark as Delivered
                    </button>
                  )}
                  {order.deliveryCompleted && (
                    <div className="completed-tag">
                      <FaCheck /> Delivery Completed
                    </div>
                  )}
                </div>

                <div className="delivery-progress">
                  <div className={`progress-step ${!order.sentToDelivery ? 'active' : 'completed'}`}>
                    <div className="step-icon">
                      <FaBox />
                    </div>
                    <span>Order Prepared</span>
                  </div>
                  
                  <div className="progress-arrow">
                    <FaArrowRight />
                  </div>
                  
                  <div className={`progress-step ${order.sentToDelivery && !order.deliveryCompleted ? 'active' : order.deliveryCompleted ? 'completed' : ''}`}>
                    <div className="step-icon">
                      <FaShippingFast />
                    </div>
                    <span>In Transit</span>
                  </div>
                  
                  <div className="progress-arrow">
                    <FaArrowRight />
                  </div>
                  
                  <div className={`progress-step ${order.deliveryCompleted ? 'completed' : ''}`}>
                    <div className="step-icon">
                      <FaCheckCircle />
                    </div>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeliveryDetails;