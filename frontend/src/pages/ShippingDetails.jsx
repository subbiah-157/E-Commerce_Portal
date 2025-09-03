import { useEffect, useState, useContext } from "react"; 
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { 
  FaSearch, FaFilter, FaCheckCircle, FaTruck, FaBoxOpen, 
  FaCheck, FaTimes, FaChevronDown, FaChevronUp, FaInfoCircle,
  FaShippingFast, FaClock, FaBox, FaImage
} from "react-icons/fa";
import "../styles/ShippingDetails.css";

const ShippingDetails = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  const fetchOrders = async () => {
    if (!user?.isAdmin) return;
    try {
      const res = await axios.get("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleApproveShipping = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/admin/approve-shipping/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("Shipping approved successfully!");
      fetchOrders();
    } catch (err) {
      console.error("Failed to approve shipping:", err);
      alert("Failed to approve shipping");
    }
  };

  const handleCompleteShipping = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/shipping/complete/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("Shipping marked as completed!");
      fetchOrders();
    } catch (err) {
      console.error("Failed to complete shipping:", err);
      alert("Failed to complete shipping");
    }
  };

  const toggleProductDetails = (orderId, productIndex) => {
    const key = `${orderId}-${productIndex}`;
    setExpandedProducts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const shippedOrders = orders.filter(order => order.shippingCompleted).length;
  const pendingApproval = orders.filter(order => !order.shippingApproved).length;
  const processingOrders = orders.filter(order => order.shippingApproved && !order.shippingCompleted).length;

  // Separate orders into active and completed
  const activeOrders = orders.filter(order => !order.shippingCompleted);
  const completedOrders = orders.filter(order => order.shippingCompleted);

  const filterOrders = (ordersList) => {
    return ordersList.filter(order => {
      // Filter by status
      if (filterStatus === "Approved" && !order.shippingApproved) return false;
      if (filterStatus === "Pending" && order.shippingApproved) return false;
      
      // Filter by search term
      const matchesSearch =
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const filteredActiveOrders = filterOrders(activeOrders);
  const filteredCompletedOrders = filterOrders(completedOrders);

  const renderSize = (product) => {
    const category = product.category?.toLowerCase() || "";
    if (category.includes("home")) {
      const inchesValue = product.sizeInches || product.inches || product.dimensions;
      return inchesValue ? `${inchesValue} inches` : "N/A";
    }
    return product.selectedSize || product.size || "N/A";
  };

  const renderProductImage = (product) => {
    let imgSrc = null;

    // Handle multiple possible image fields
    if (product.image) {
      imgSrc = product.image;
    } else if (product.imageUrl) {
      imgSrc = product.imageUrl;
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      imgSrc = product.images[0];
    }

    // If backend returns relative path, prepend server URL
    if (imgSrc && !imgSrc.startsWith("http")) {
      imgSrc = `http://localhost:5000/${imgSrc}`;
    }

    if (imgSrc) {
      return <img src={imgSrc} alt={product.name} className="product-image" />;
    }

    // Fallback placeholder
    return (
      <div className="product-image-placeholder">
        <FaImage />
      </div>
    );
  };

  return (
    <div className="shipping-container">
      <div className="shipping-header">
        <h2>Shipping Management</h2>
        <p>Manage and track all customer orders</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-icon">
            <FaBox />
          </div>
          <div className="card-content">
            <h3>{totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        
        <div className="summary-card shipped">
          <div className="card-icon">
            <FaCheckCircle />
          </div>
          <div className="card-content">
            <h3>{shippedOrders}</h3>
            <p>Shipped</p>
          </div>
        </div>
        
        <div className="summary-card pending">
          <div className="card-icon">
            <FaClock />
          </div>
          <div className="card-content">
            <h3>{pendingApproval}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
        
        <div className="summary-card processing">
          <div className="card-icon">
            <FaShippingFast />
          </div>
          <div className="card-content">
            <h3>{processingOrders}</h3>
            <p>Processing</p>
          </div>
        </div>
      </div>

      <div className="controls-container">
        <div className="search-box" style={{border:"none"}}>
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID, Name or Email..."
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
            <option value="All">All Orders</option>
            <option value="Approved">Approved Shipping</option>
            <option value="Pending">Pending Approval</option>
          </select>
        </div>
      </div>

      {/* Active Orders Section */}
      <div className="orders-section">
        <h3 className="section-title">Active Orders</h3>
        {filteredActiveOrders.length === 0 ? (
          <div className="no-orders">
            <FaBoxOpen className="no-orders-icon" />
            <p>No active orders found.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredActiveOrders.map((order) => (
              <OrderCard 
                key={order._id} 
                order={order} 
                expandedOrders={expandedOrders}
                expandedProducts={expandedProducts}
                toggleOrderDetails={toggleOrderDetails}
                toggleProductDetails={toggleProductDetails}
                handleApproveShipping={handleApproveShipping}
                handleCompleteShipping={handleCompleteShipping}
                renderSize={renderSize}
                renderProductImage={renderProductImage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders Section */}
      <div className="orders-section completed-section">
        <h3 className="section-title">Completed Orders</h3>
        {filteredCompletedOrders.length === 0 ? (
          <div className="no-orders">
            <FaCheckCircle className="no-orders-icon" />
            <p>No completed orders yet.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredCompletedOrders.map((order) => (
              <OrderCard 
                key={order._id} 
                order={order} 
                expandedOrders={expandedOrders}
                expandedProducts={expandedProducts}
                toggleOrderDetails={toggleOrderDetails}
                toggleProductDetails={toggleProductDetails}
                handleApproveShipping={handleApproveShipping}
                handleCompleteShipping={handleCompleteShipping}
                renderSize={renderSize}
                renderProductImage={renderProductImage}
                isCompleted={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// OrderCard component for better code organization
const OrderCard = ({ 
  order, 
  expandedOrders, 
  expandedProducts, 
  toggleOrderDetails, 
  toggleProductDetails, 
  handleApproveShipping, 
  handleCompleteShipping, 
  renderSize,
  renderProductImage,
  isCompleted = false 
}) => {
  const addr = order.userDetails
    ? `${order.userDetails.houseNumber || ""}, ${order.userDetails.region || ""}, ${order.userDetails.district || ""}, ${order.userDetails.state || ""} - ${order.userDetails.pincode || ""}`
    : "N/A";

  const phone =
    order.userDetails?.mobile ||
    order.userDetails?.phone ||
    order.userDetails?.phoneNumber ||
    "N/A";
    
  const isOrderExpanded = expandedOrders[order._id];

  return (
    <div key={order._id} className={`order-card ${isCompleted ? 'completed' : ''}`}>
      <div 
        className="order-card-header"
        onClick={() => toggleOrderDetails(order._id)}
      >
        <div className="order-id-status">
          <div className="order-id">Order: {order._id}</div>
          <div className="order-date">{new Date(order.createdAt).toLocaleDateString()}</div>
          <div className="status-badges">
            <div className={`status-badge ${order.shippingApproved ? "approved" : "pending"}`}>
              {order.shippingApproved ? <FaCheck /> : <FaTimes />}
              {order.shippingApproved ? "Approved" : "Pending"}
            </div>
            <div className={`status-badge ${order.shippingCompleted ? "completed" : "processing"}`}>
              {order.shippingCompleted ? <FaCheckCircle /> : <FaTruck />}
              {order.shippingCompleted ? "Delivered" : "Processing"}
            </div>
          </div>
        </div>
        
        <div className="order-toggle">
          {isOrderExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </div>
      
      <div className="order-card-summary">
        <div className="customer-info">
          <div className="customer-name">{order.userDetails?.name || "Unknown"}</div>
          <div className="customer-email">{order.userDetails?.email || "N/A"}</div>
        </div>
        
        <div className="order-meta">
          <div className="payment-info">
            <span className="payment-method">{order.paymentMethod}</span>
            <span className={`payment-status ${order.paymentStatus?.toLowerCase()}`}>
              {order.paymentStatus}
            </span>
          </div>
          <div className="total-amount">{order.currency} {order.totalAmount}</div>
        </div>
      </div>
      
      {isOrderExpanded && (
        <div className="order-card-details">
          <div className="contact-section">
            <h4>Contact Information</h4>
            <div className="contact-details">
              <div className="contact-phone">
                {order.userDetails?.regionCode ? `${order.userDetails.regionCode} ` : ""}
                {phone}
              </div>
              <div className="contact-address">{addr}</div>
            </div>
          </div>
          
          <div className="products-section">
            <h4>Products ({order.products?.length})</h4>
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
                      <div className="product-image-container">
                        {renderProductImage(p)}
                      </div>
                      <div className="product-info">
                        <div className="product-name">{p.name}</div>
                        <div className="product-price">{order.currency} {p.discountedPrice || p.originalPrice} × {p.qty}</div>
                      </div>
                      <div className="product-toggle">
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="product-details-expanded">
                        <div className="product-detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Category:</span>
                            <span className="detail-value">{p.category || "N/A"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Subcategory:</span>
                            <span className="detail-value">{p.subCategory || "N/A"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Sub-Subcategory:</span>
                            <span className="detail-value">{p.subSubCategory || "N/A"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">
                              {p.category?.toLowerCase().includes("home") ? "Inches" : "Size"}:
                            </span>
                            <span className="detail-value">{renderSize(p)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Quantity:</span>
                            <span className="detail-value">{p.qty}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Original Price/unit:</span>
                            <span className="detail-value">{order.currency} {p.originalPrice}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Discount %:</span>
                            <span className="detail-value">{p.discount || 0}%</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Price After Discount/unit:</span>
                            <span className="detail-value">{order.currency} {p.discountedPrice}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Total:</span>
                            <span className="detail-value">{order.currency} {p.total}</span>
                          </div>
                        </div>
                        {p.stock !== undefined && p.stock <= 0 && (
                          <div className="out-of-stock-notice">
                            <FaInfoCircle />
                            <span>Out of Stock</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {!isCompleted && (
            <div className="action-buttons">
              {!order.shippingApproved && (
                <button
                  onClick={() => handleApproveShipping(order._id)}
                  className="btn approve-btn"
                >
                  Approve Shipping
                </button>
              )}
              {order.shippingApproved && !order.shippingCompleted && (
                <button
                  onClick={() => handleCompleteShipping(order._id)}
                  className="btn complete-btn"
                >
                  Mark as Delivered
                </button>
              )}
              {order.shippingCompleted && (
                <span className="completed-tag">Order Completed</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingDetails;
