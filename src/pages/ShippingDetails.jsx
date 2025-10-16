import { useEffect, useState, useContext } from "react"; 
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import API_BASE_URL from "../config";
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
      const res = await axios.get(`${API_BASE_URL}/api/orders`, {
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

  const handleCompleteShipping = async (orderId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/orders/shipping/complete/${orderId}`,
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
  const processingOrders = orders.filter(order => !order.shippingCompleted).length;

  // Separate orders into active and completed
  const activeOrders = orders.filter(order => !order.shippingCompleted);
  const completedOrders = orders.filter(order => order.shippingCompleted);

  const filterOrders = (ordersList) => {
    return ordersList.filter(order => {
      // Filter by status
      if (filterStatus === "Active" && order.shippingCompleted) return false;
      if (filterStatus === "Completed" && !order.shippingCompleted) return false;
      
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
      imgSrc = `${API_BASE_URL}/${imgSrc}`;
    }

    if (imgSrc) {
      return <img src={imgSrc} alt={product.name} className="ship-product-image" />;
    }

    // Fallback placeholder
    return (
      <div className="ship-product-image-placeholder">
        <FaImage />
      </div>
    );
  };

  return (
    <div className="ship-management-container">
      <div className="ship-management-header">
        <h2>Shipping Management</h2>
        <p>Manage and track all customer orders</p>
      </div>

      {/* Summary Cards */}
      <div className="ship-summary-cards">
        <div className="ship-summary-card ship-total">
          <div className="ship-card-icon">
            <FaBox />
          </div>
          <div className="ship-card-content">
            <h3>{totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        
        <div className="ship-summary-card ship-delivered">
          <div className="ship-card-icon">
            <FaCheckCircle />
          </div>
          <div className="ship-card-content">
            <h3>{shippedOrders}</h3>
            <p>Delivered</p>
          </div>
        </div>
        
        <div className="ship-summary-card ship-processing">
          <div className="ship-card-icon">
            <FaShippingFast />
          </div>
          <div className="ship-card-content">
            <h3>{processingOrders}</h3>
            <p>Processing</p>
          </div>
        </div>
      </div>

      <div className="ship-controls-container">
        <div className="ship-search-box">
          <FaSearch className="ship-search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID, Name or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="ship-filter-box">
          <FaFilter className="ship-filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Orders</option>
            <option value="Active">Active Orders</option>
            <option value="Completed">Completed Orders</option>
          </select>
        </div>
      </div>

      {/* Active Orders Section */}
      <div className="ship-orders-section">
        <h3 className="ship-section-title">Active Orders</h3>
        {filteredActiveOrders.length === 0 ? (
          <div className="ship-no-orders">
            <FaBoxOpen className="ship-no-orders-icon" />
            <p>No active orders found.</p>
          </div>
        ) : (
          <div className="ship-orders-grid">
            {filteredActiveOrders.map((order) => (
              <OrderCard 
                key={order._id} 
                order={order} 
                expandedOrders={expandedOrders}
                expandedProducts={expandedProducts}
                toggleOrderDetails={toggleOrderDetails}
                toggleProductDetails={toggleProductDetails}
                handleCompleteShipping={handleCompleteShipping}
                renderSize={renderSize}
                renderProductImage={renderProductImage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders Section */}
      <div className="ship-orders-section ship-completed-section">
        <h3 className="ship-section-title">Completed Orders</h3>
        {filteredCompletedOrders.length === 0 ? (
          <div className="ship-no-orders">
            <FaCheckCircle className="ship-no-orders-icon" />
            <p>No completed orders yet.</p>
          </div>
        ) : (
          <div className="ship-orders-grid">
            {filteredCompletedOrders.map((order) => (
              <OrderCard 
                key={order._id} 
                order={order} 
                expandedOrders={expandedOrders}
                expandedProducts={expandedProducts}
                toggleOrderDetails={toggleOrderDetails}
                toggleProductDetails={toggleProductDetails}
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
    <div key={order._id} className={`ship-order-card ${isCompleted ? 'ship-completed' : ''}`}>
      <div 
        className="ship-order-card-header"
        onClick={() => toggleOrderDetails(order._id)}
      >
        <div className="ship-order-id-status">
          <div className="ship-order-id">Order: {order._id}</div>
          <div className="ship-order-date">{new Date(order.createdAt).toLocaleDateString()}</div>
          <div className="ship-status-badges">
            <div className={`ship-status-badge ${order.shippingCompleted ? "ship-delivered" : "ship-processing"}`}>
              {order.shippingCompleted ? <FaCheckCircle /> : <FaTruck />}
              {order.shippingCompleted ? "Delivered" : "Processing"}
            </div>
          </div>
        </div>
        
        <div className="ship-order-toggle">
          {isOrderExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </div>
      
      <div className="ship-order-card-summary">
        <div className="ship-customer-info">
          <div className="ship-customer-name">{order.userDetails?.name || "Unknown"}</div>
          <div className="ship-customer-email">{order.userDetails?.email || "N/A"}</div>
        </div>
        
        <div className="ship-order-meta">
          <div className="ship-payment-info">
            <span className="ship-payment-method">{order.paymentMethod}</span>
            <span className={`ship-payment-status ${order.paymentStatus?.toLowerCase()}`}>
              {order.paymentStatus}
            </span>
          </div>
          <div className="ship-total-amount">{order.currency} {order.totalAmount}</div>
        </div>
      </div>
      
      {isOrderExpanded && (
        <div className="ship-order-card-details">
          <div className="ship-contact-section">
            <h4>Contact Information</h4>
            <div className="ship-contact-details">
              <div className="ship-contact-phone">
                {order.userDetails?.regionCode ? `${order.userDetails.regionCode} ` : ""}
                {phone}
              </div>
              <div className="ship-contact-address">{addr}</div>
            </div>
          </div>
          
          <div className="ship-products-section">
            <h4>Products ({order.products?.length})</h4>
            <div className="ship-products-list">
              {order.products?.map((p, idx) => {
                const detailsKey = `${order._id}-${idx}`;
                const isExpanded = expandedProducts[detailsKey];
                
                return (
                  <div key={idx} className="ship-product-item">
                    <div 
                      className="ship-product-summary"
                      onClick={() => toggleProductDetails(order._id, idx)}
                    >
                      <div className="ship-product-image-container">
                        {renderProductImage(p)}
                      </div>
                      <div className="ship-product-info">
                        <div className="ship-product-name">{p.name}</div>
                        <div className="ship-product-price">{order.currency} {p.discountedPrice || p.originalPrice} × {p.qty}</div>
                      </div>
                      <div className="ship-product-toggle">
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="ship-product-details-expanded">
                        <div className="ship-product-detail-grid">
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">Product ID:</span>
                            <span className="ship-detail-value">{p._id || "N/A"}</span>
                          </div>
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">Category:</span>
                            <span className="ship-detail-value">{p.category || "N/A"}</span>
                          </div>
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">Subcategory:</span>
                            <span className="ship-detail-value">{p.subCategory || "N/A"}</span>
                          </div>
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">Sub-Subcategory:</span>
                            <span className="ship-detail-value">{p.subSubCategory || "N/A"}</span>
                          </div>
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">
                              {p.category?.toLowerCase().includes("home") ? "Inches" : "Size"}:
                            </span>
                            <span className="ship-detail-value">{renderSize(p)}</span>
                          </div>
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">Quantity:</span>
                            <span className="ship-detail-value">{p.qty}</span>
                          </div>
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">Original Price/unit:</span>
                            <span className="ship-detail-value">{order.currency} {p.originalPrice}</span>
                          </div>
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">Discount %:</span>
                            <span className="ship-detail-value">{p.discount || 0}%</span>
                          </div>
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">Price After Discount/unit:</span>
                            <span className="ship-detail-value">{order.currency} {p.discountedPrice}</span>
                          </div>
                          <div className="ship-detail-item">
                            <span className="ship-detail-label">Total:</span>
                            <span className="ship-detail-value">{order.currency} {p.total}</span>
                          </div>
                        </div>
                        {p.stock !== undefined && p.stock <= 0 && (
                          <div className="ship-out-of-stock-notice">
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
            <div className="ship-action-buttons">
              <button
                onClick={() => handleCompleteShipping(order._id)}
                className="ship-btn ship-complete-btn"
              >
                Mark as Shipped
              </button>
            </div>
          )}
          {isCompleted && (
            <span className="ship-completed-tag">Order Completed</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingDetails;