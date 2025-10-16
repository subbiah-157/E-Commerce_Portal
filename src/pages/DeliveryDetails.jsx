import { useEffect, useState, useContext } from "react"; 
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import API_BASE_URL from "../config";
import { FaSearch, FaFilter, FaCheckCircle, FaTruck, FaBox, FaShippingFast, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUser, FaMoneyBillWave, FaCreditCard, FaCheck, FaTimes, FaArrowRight, FaClock, FaSpinner, FaChartLine, FaChevronUp, FaChevronDown
 } from "react-icons/fa";
import "../styles/DeliveryDetails.css";

const DeliveryDetails = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [expandedProducts, setExpandedProducts] = useState({});

  // ✅ Fetch only shipping completed orders for delivery team
  const fetchDeliveryOrders = async () => {
    if (!user?.isAdmin) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/orders/delivery/all`, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // All orders here are already shippingCompleted (filtered in backend)
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch delivery orders:", err);
    }
  };

  useEffect(() => {
    fetchDeliveryOrders();
  }, [user]);

  // ✅ Mark delivery as completed (Delivery team action)
  const handleCompleteDelivery = async (orderId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/orders/admin/mark-delivered/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, deliveryCompleted: true } : o
        )
      );

      alert("Order marked as delivered!");
    } catch (err) {
      console.error("Failed to mark delivery as completed:", err);
      alert(err.response?.data?.error || "Failed to mark delivery completed");
    }
  };

  // ✅ Assign delivery employee
  const handleAssignEmployee = async (orderId, employeeId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/orders/assign-delivery/${orderId}`,
        { employeeId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { 
            ...o, 
            assignedDeliveryEmployee: employeeId,
            sentToDelivery: true 
          } : o
        )
      );

      alert("Delivery employee assigned!");
    } catch (err) {
      console.error("Failed to assign delivery employee:", err);
      alert("Failed to assign delivery employee");
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
      (filterStatus === "Waiting" && !order.deliveryCompleted) ||
      (filterStatus === "In Progress" && order.sentToDelivery && !order.deliveryCompleted) ||
      (filterStatus === "Completed" && order.deliveryCompleted);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate delivery statistics
  const deliveryStats = {
    total: orders.length,
    waiting: orders.filter(o => !o.deliveryCompleted).length,
    inProgress: orders.filter(o => o.sentToDelivery && !o.deliveryCompleted).length,
    completed: orders.filter(o => o.deliveryCompleted).length
  };

  return (
    <div className="delivery-management-wrapper">
      <div className="delivery-management-header">
        <h2>Delivery Management</h2>
        <p>Track and manage all delivery orders (Shipping Completed Orders Only)</p>
      </div>

      {/* Delivery Statistics Cards */}
      <div className="delivery-stats-grid">
        <div className="delivery-stat-item total-deliveries">
          <div className="stat-visual-icon">
            <FaChartLine />
          </div>
          <div className="stat-content-data">
            <h3>{deliveryStats.total}</h3>
            <p>Total Deliveries</p>
          </div>
        </div>
        
        <div className="delivery-stat-item waiting-deliveries">
          <div className="stat-visual-icon">
            <FaClock />
          </div>
          <div className="stat-content-data">
            <h3>{deliveryStats.waiting}</h3>
            <p>Pending</p>
          </div>
        </div>
        
        <div className="delivery-stat-item progress-deliveries">
          <div className="stat-visual-icon">
            <FaSpinner />
          </div>
          <div className="stat-content-data">
            <h3>{deliveryStats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </div>
        
        <div className="delivery-stat-item completed-deliveries">
          <div className="stat-visual-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-content-data">
            <h3>{deliveryStats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      <div className="delivery-controls-panel">
        <div className="delivery-search-container">
          <FaSearch className="search-input-icon" />
          <input
            type="text"
            placeholder="Search by Order ID, Email or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="delivery-filter-container">
          <FaFilter className="filter-select-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Deliveries</option>
            <option value="Waiting">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="delivery-empty-state">
          <FaBox className="empty-state-icon" />
          <p>No delivery orders found.</p>
        </div>
      ) : (
        <div className="delivery-orders-layout">
          {filteredOrders.map((order) => {
            const addr = order.userDetails
              ? `${order.userDetails.houseNumber || ""}, ${order.userDetails.region || ""}, ${order.userDetails.district || ""}, ${order.userDetails.state || ""} - ${order.userDetails.pincode || ""}`
              : "N/A";
            const phone = order.userDetails?.mobile || "N/A";

            return (
              <div key={order._id} className="delivery-order-card">
                <div className="order-card-header">
                  <div className="order-identifier">Order ID: {order._id}</div>
                  <div className={`delivery-status-indicator ${
                    order.deliveryCompleted ? "delivery-completed" : 
                    order.sentToDelivery ? "delivery-in-progress" : "delivery-waiting"
                  }`}>
                    {order.deliveryCompleted ? "Completed" : 
                     order.sentToDelivery ? "In Progress" : "Pending"}
                  </div>
                </div>

                <div className="customer-details-section">
                  <div className="customer-detail-item">
                    <FaUser className="detail-item-icon" />
                    <span>{order.userDetails?.name || "Unknown"}</span>
                  </div>
                  <div className="customer-detail-item">
                    <FaEnvelope className="detail-item-icon" />
                    <span>{order.userDetails?.email || "N/A"}</span>
                  </div>
                  <div className="customer-detail-item">
                    <FaPhone className="detail-item-icon" />
                    <span>{phone}</span>
                  </div>
                  <div className="customer-detail-item">
                    <FaMapMarkerAlt className="detail-item-icon" />
                    <span className="customer-address">{addr}</span>
                  </div>
                </div>

                <div className="order-products-section">
                  <h4>Products ({order.products?.length || 0})</h4>
                  <div className="products-container">
                    {order.products?.map((p, idx) => {
                      const detailsKey = `${order._id}-${idx}`;
                      const isExpanded = expandedProducts[detailsKey];
                      
                      return (
                        <div key={idx} className="product-list-item">
                          <div 
                            className="product-basic-info"
                            onClick={() => toggleProductDetails(order._id, idx)}
                          >
                            <div className="product-title">{p.name}</div>
                            <div className="product-expand-toggle">
                              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="product-detailed-info">
                              <div className="product-detail-row">
                                <span className="detail-category-label">Category:</span>
                                <span className="detail-category-value">{p.category || "N/A"}</span>
                              </div>
                              <div className="product-detail-row">
                                <span className="detail-category-label">Subcategory:</span>
                                <span className="detail-category-value">{p.subCategory || "N/A"}</span>
                              </div>
                              <div className="product-detail-row">
                                <span className="detail-category-label">Sub-Subcategory:</span>
                                <span className="detail-category-value">{p.subSubCategory || "N/A"}</span>
                              </div>
                              <div className="product-detail-row">
                                <span className="detail-category-label">Size/Inches:</span>
                                <span className="detail-category-value">{p.selectedSize || p.sizeInches || "N/A"}</span>
                              </div>
                              <div className="product-detail-row">
                                <span className="detail-category-label">Quantity:</span>
                                <span className="detail-category-value">{p.qty}</span>
                              </div>
                              <div className="product-detail-row">
                                <span className="detail-category-label">Original Price:</span>
                                <span className="detail-category-value">{order.currency} {p.originalPrice}</span>
                              </div>
                              <div className="product-detail-row">
                                <span className="detail-category-label">Discount:</span>
                                <span className="detail-category-value">{p.discount || 0}%</span>
                              </div>
                              <div className="product-detail-row">
                                <span className="detail-category-label">Discounted Price:</span>
                                <span className="detail-category-value">{order.currency} {p.discountedPrice}</span>
                              </div>
                              <div className="product-detail-row">
                                <span className="detail-category-label">Total:</span>
                                <span className="detail-category-value">{order.currency} {p.total}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="order-summary-section">
                  <div className="summary-line-item">
                    <span>Subtotal:</span>
                    <span>{order.currency} {order.totalAmount}</span>
                  </div>
                  <div className="summary-line-item">
                    <span>Payment Method:</span>
                    <span className="payment-method-display">
                      <FaCreditCard /> {order.paymentMethod}
                    </span>
                  </div>
                  <div className="summary-line-item">
                    <span>Payment Status:</span>
                    <span className={`payment-status-display ${order.paymentStatus?.toLowerCase()}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="delivery-action-buttons">
                  {!order.deliveryCompleted && (
                    <button 
                      onClick={() => handleCompleteDelivery(order._id)} 
                      className="action-button complete-delivery-button"
                    >
                      <FaCheckCircle /> Mark as Delivered
                    </button>
                  )}
                  {order.deliveryCompleted && (
                    <div className="delivery-completed-label">
                      <FaCheck /> Delivery Completed
                    </div>
                  )}
                </div>

                <div className="delivery-timeline">
                  <div className="timeline-step step-completed">
                    <div className="step-visual-icon">
                      <FaBox />
                    </div>
                    <span>Order Prepared</span>
                  </div>
                  
                  <div className="timeline-connector">
                    <FaArrowRight />
                  </div>
                  
                  <div className={`timeline-step ${!order.deliveryCompleted ? 'step-active' : 'step-completed'}`}>
                    <div className="step-visual-icon">
                      <FaShippingFast />
                    </div>
                    <span>In Transit</span>
                  </div>
                  
                  <div className="timeline-connector">
                    <FaArrowRight />
                  </div>
                  
                  <div className={`timeline-step ${order.deliveryCompleted ? 'step-completed' : ''}`}>
                    <div className="step-visual-icon">
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