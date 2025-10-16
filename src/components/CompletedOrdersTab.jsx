import React, { useState } from "react";
import {
  FaSearch,
  FaBox,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCreditCard,
  FaMoneyBillWave,
  FaCheckCircle,
  FaShippingFast,
  FaUserTie,
  FaCalendarAlt,
  FaIdCard,
  FaTag,
  FaRuler,
  FaWeight,
  FaPalette,
  FaLayerGroup,
  FaWarehouse,
  FaTimes,
  FaExpand,
  FaCompress,
  FaBarcode,
  FaInfoCircle
} from "react-icons/fa";
import "../styles/CompletedOrdersTab.css";

const CompletedOrdersTab = ({ completedOrders, warehouseId, employees }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter to show only Main Warehouse completed orders
  const mainWarehouseCompletedOrders = completedOrders.filter(order => 
    order.products.some(product => 
      product.warehouseAllocations?.some(alloc => 
        alloc.warehouseId?.toString() === warehouseId && 
        alloc.warehouseType === "Main Warehouse"
      )
    )
  );

  // Enhanced search to include product IDs
  const filteredOrders = mainWarehouseCompletedOrders.filter(order =>
    order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.userDetails?.mobile?.includes(searchTerm) ||
    // Search in product IDs and names
    order.products?.some(product => 
      product._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Function to render product details similar to DeliveryTab
  const renderProductDetails = (product, currency) => {
    const details = [];
    
    // Product ID - Similar to DeliveryTab
    if (product._id) {
      details.push(
        <div key="product-id" className="detail-item">
          <FaBarcode className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Product ID</span>
            <span className="detail-value product-id">{product._id}</span>
          </div>
        </div>
      );
    }

    // Basic product info
    details.push(
      <div key="quantity" className="detail-item">
        <FaBox className="detail-icon" />
        <div className="detail-content">
          <span className="detail-label">Quantity</span>
          <span className="detail-value">Qty: {product.qty}</span>
        </div>
      </div>
    );

    // Pricing information
    details.push(
      <div key="pricing" className="detail-item">
        <FaMoneyBillWave className="detail-icon" />
        <div className="detail-content">
          <span className="detail-label">Price</span>
          <span className="detail-value">
            {product.discountedPrice} {currency}
            {product.originalPrice && product.originalPrice !== product.discountedPrice && (
              <span className="original-price">(Was: {product.originalPrice} {currency})</span>
            )}
          </span>
        </div>
      </div>
    );

    // Product attributes from schema - Similar to DeliveryTab
    const attributes = [
      { key: 'brand', label: 'Brand', icon: FaBarcode },
      { key: 'color', label: 'Color', icon: FaPalette },
      { key: 'material', label: 'Material', icon: FaInfoCircle },
      { key: 'weight', label: 'Weight', icon: FaWeight },
      { key: 'dimensions', label: 'Dimensions', icon: FaRuler },
      { key: 'selectedSize', label: 'Size', icon: FaRuler },
      { key: 'sizeInches', label: 'Size (Inches)', icon: FaRuler },
      { key: 'category', label: 'Category', icon: FaTag },
      { key: 'subCategory', label: 'Sub Category', icon: FaLayerGroup },
      { key: 'subSubCategory', label: 'Sub Sub Category', icon: FaLayerGroup }
    ];

    attributes.forEach(({ key, label, icon: Icon }) => {
      if (product[key] && product[key] !== "N/A" && product[key] !== "Uncategorized") {
        details.push(
          <div key={key} className="detail-item">
            <Icon className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label">{label}</span>
              <span className="detail-value">{product[key]}</span>
            </div>
          </div>
        );
      }
    });

    return details;
  };

  const renderOrderCard = (order) => {
    const assignedEmployee = order.assignedDeliveryEmployee 
      ? employees.find(emp => emp._id === order.assignedDeliveryEmployee)
      : null;

    const deliveryDate = order.deliveryDate 
      ? new Date(order.deliveryDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : "Not specified";

    return (
      <div key={order._id} className="completed-order-card">
        <div className="order-card-header">
          <div className="order-id-section">
            <FaIdCard className="order-id-icon" />
            <div>
              <h3>Order Id #{order._id}</h3>
              <div className="order-date">
                <FaCalendarAlt className="date-icon" />
                Completed on {deliveryDate}
              </div>
            </div>
          </div>
          <div className="status-badges">
            <span className="status-badge completed">
              <FaCheckCircle className="badge-icon" />
              Completed
            </span>
          </div>
        </div>

        <div className="order-card-content">
          {/* Customer Summary */}
          <div className="customer-summary">
            <div className="customer-avatar">
              <FaUser className="avatar-icon" />
            </div>
            <div className="customer-info">
              <h4>{order.userDetails?.name || "N/A"}</h4>
              <p className="customer-contact">
                <FaEnvelope className="contact-icon" />
                {order.userDetails?.email || "N/A"}
              </p>
              <p className="customer-contact">
                <FaPhone className="contact-icon" />
                {order.userDetails?.regionCode || ""} {order.userDetails?.mobile || "N/A"}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary-grid">
            <div className="summary-item">
              <FaBox className="summary-icon" />
              <div className="summary-content">
                <span className="summary-label">Products</span>
                <span className="summary-value">{order.products?.length || 0} Items</span>
              </div>
            </div>
            <div className="summary-item">
              <FaMoneyBillWave className="summary-icon" />
              <div className="summary-content">
                <span className="summary-label">Total Amount</span>
                <span className="summary-value">{order.totalAmount} {order.currency}</span>
              </div>
            </div>
            <div className="summary-item">
              <FaCreditCard className="summary-icon" />
              <div className="summary-content">
                <span className="summary-label">Payment</span>
                <span className="summary-value">{order.paymentMethod}</span>
              </div>
            </div>
            {assignedEmployee && (
              <div className="summary-item">
                <FaUserTie className="summary-icon" />
                <div className="summary-content">
                  <span className="summary-label">Delivered By</span>
                  <span className="summary-value">{assignedEmployee.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Quick Product Preview with Product IDs */}
          <div className="products-preview">
            <h5>Products Delivered</h5>
            <div className="preview-list">
              {order.products.slice(0, 3).map((p, idx) => (
                <div key={idx} className="preview-item">
                  <div className="preview-item-content">
                    <span className="product-name">{p.name}</span>
                    {p._id && (
                      <span className="product-id-preview">ID: {p._id}</span>
                    )}
                    <span className="product-qty">Qty: {p.qty}</span>
                  </div>
                </div>
              ))}
              {order.products.length > 3 && (
                <div className="more-items">
                  +{order.products.length - 3} more items
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="order-card-actions">
          <button
            className="view-details-btn"
            onClick={() => openOrderModal(order)}
          >
            <FaExpand className="btn-icon" />
            View Full Details
          </button>
        </div>
      </div>
    );
  };

  const renderOrderModal = () => {
    if (!selectedOrder) return null;

    const assignedEmployee = selectedOrder.assignedDeliveryEmployee 
      ? employees.find(emp => emp._id === selectedOrder.assignedDeliveryEmployee)
      : null;

    const deliveryDate = selectedOrder.deliveryDate 
      ? new Date(selectedOrder.deliveryDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : "Not specified";

    return (
      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} onClick={closeOrderModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-section">
              <FaCheckCircle className="modal-title-icon" />
              <div>
                <h2>Completed Order #{selectedOrder._id}</h2>
                <p className="modal-subtitle">Delivery completed on {deliveryDate}</p>
              </div>
            </div>
            <button className="close-modal" onClick={closeOrderModal}>
              <FaTimes />
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-grid">
              {/* First Row: Customer Information & Payment Information */}
              <div className="info-card customer-card">
                <div className="card-header">
                  <FaUser className="card-icon" />
                  <h3>Customer Information</h3>
                </div>
                <div className="card-content">
                  <div className="customer-details">
                    <div className="detail-item">
                      <FaUser className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Full Name</span>
                        <span className="detail-value">{selectedOrder.userDetails?.name || "N/A"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FaEnvelope className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Email</span>
                        <span className="detail-value email">{selectedOrder.userDetails?.email || "N/A"}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FaPhone className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Mobile</span>
                        <span className="detail-value">
                          {selectedOrder.userDetails?.regionCode || ""} {selectedOrder.userDetails?.mobile || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item full-width">
                      <FaMapMarkerAlt className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Delivery Address</span>
                        <div className="address-content">
                          <p>{selectedOrder.userDetails?.houseNumber || ""}, {selectedOrder.userDetails?.district || ""}</p>
                          <p>{selectedOrder.userDetails?.state || ""}, {selectedOrder.userDetails?.region || ""} - {selectedOrder.userDetails?.pincode || ""}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-card payment-card">
                <div className="card-header">
                  <FaCreditCard className="card-icon" />
                  <h3>Payment Information</h3>
                </div>
                <div className="card-content">
                  <div className="payment-grid">
                    <div className="payment-item">
                      <div className="payment-label">Payment Method</div>
                      <div className="payment-method">{selectedOrder.paymentMethod}</div>
                    </div>
                    <div className="payment-item">
                      <div className="payment-label">Payment Status</div>
                      <div className="payment-status completed">{selectedOrder.paymentStatus}</div>
                    </div>
                    <div className="payment-item full-width">
                      <div className="payment-label">Total Amount</div>
                      <div className="amount-display">
                        <FaMoneyBillWave className="amount-icon" />
                        <span className="amount">{selectedOrder.totalAmount}</span>
                        <span className="currency">{selectedOrder.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row: Delivery Information (full width) */}
              <div className="info-card delivery-card">
                <div className="card-header">
                  <FaShippingFast className="card-icon" />
                  <h3>Delivery Information</h3>
                </div>
                <div className="card-content">
                  <div className="delivery-details">
                    <div className="status-item">
                      <FaCheckCircle className="status-icon completed" />
                      <div className="status-content">
                        <span className="status-label">Shipping Status</span>
                        <span className="status-value">Completed</span>
                      </div>
                    </div>
                    <div className="status-item">
                      <FaCheckCircle className="status-icon completed" />
                      <div className="status-content">
                        <span className="status-label">Delivery Status</span>
                        <span className="status-value">Completed</span>
                      </div>
                    </div>
                    <div className="delivery-date">
                      <FaCalendarAlt className="date-icon" />
                      <span>Delivered on: {deliveryDate}</span>
                    </div>
                    {assignedEmployee && (
                      <div className="delivery-employee">
                        <FaUserTie className="employee-icon" />
                        <div className="employee-details">
                          <span className="employee-name">{assignedEmployee.name}</span>
                          <div className="employee-contact">
                            {assignedEmployee.phone && (
                              <span className="employee-phone">
                                <FaPhone className="contact-icon" />
                                {assignedEmployee.phone}
                              </span>
                            )}
                            {assignedEmployee.email && (
                              <span className="employee-email">
                                <FaEnvelope className="contact-icon" />
                                {assignedEmployee.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Products Information with Product IDs */}
              <div className="info-card products-card">
                <div className="card-header">
                  <FaBox className="card-icon" />
                  <h3>Products Delivered ({selectedOrder.products?.length || 0})</h3>
                </div>
                <div className="card-content">
                  <div className="products-list">
                    {selectedOrder.products.map((p, idx) => (
                      <div key={idx} className="product-item">
                        <div className="product-header">
                          <div className="product-basic-info">
                            <div className="product-title-section">
                              <h4>{p.name}</h4>
                              {p._id && (
                                <div className="product-id-display">
                                  <FaBarcode className="id-icon" />
                                  <span className="product-id-text">ID: {p._id}</span>
                                </div>
                              )}
                            </div>
                            <div className="product-meta">
                              <span className="product-quantity">
                                <FaBox className="meta-icon" />
                                Qty: {p.qty}
                              </span>
                              <span className="product-category">
                                <FaTag className="meta-icon" />
                                {p.category}
                              </span>
                              {p.subCategory && (
                                <span className="product-subcategory">
                                  <FaLayerGroup className="meta-icon" />
                                  {p.subCategory}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="product-pricing">
                            <div className="price-breakdown">
                              {p.originalPrice && p.originalPrice !== p.discountedPrice && (
                                <div className="original-price">
                                  {p.originalPrice} {selectedOrder.currency}
                                </div>
                              )}
                              <div className="discounted-price">
                                {p.discountedPrice} {selectedOrder.currency}
                              </div>
                              {p.discount > 0 && (
                                <span className="discount-badge">{p.discount}% OFF</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Product Details with structured layout */}
                        <div className="product-details">
                          <div className="product-details-grid">
                            {renderProductDetails(p, selectedOrder.currency)}
                          </div>

                          {p.description && (
                            <div className="product-description">
                              <div className="description-header">
                                <FaInfoCircle className="description-icon" />
                                <strong>Description:</strong>
                              </div>
                              <p>{p.description}</p>
                            </div>
                          )}
                        </div>

                        {/* Warehouse Allocations */}
                        {p.warehouseAllocations && p.warehouseAllocations.length > 0 && (
                          <div className="allocations-section">
                            <h5>
                              <FaWarehouse className="section-icon" />
                              Warehouse Allocations
                            </h5>
                            <div className="allocations-list">
                              {p.warehouseAllocations
                                .filter(alloc => alloc.warehouseId?.toString() === warehouseId && alloc.warehouseType === "Main Warehouse")
                                .map((alloc, allocIdx) => (
                                  <div
                                    key={allocIdx}
                                    className="allocation-item main-warehouse"
                                  >
                                    <FaWarehouse className="allocation-icon" />
                                    <div className="allocation-details">
                                      <span className="allocation-type">{alloc.warehouseType}</span>
                                      <span className="allocation-name">{alloc.name}</span>
                                      <span className="allocation-address">
                                        {alloc.city && `${alloc.city}, `}{alloc.state}
                                      </span>
                                    </div>
                                    <div className="allocation-meta">
                                      <span className="allocation-qty">Qty: {alloc.qty}</span>
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button className="close-btn" onClick={closeOrderModal}>
              <FaCompress className="btn-icon" />
              Close Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="completed-orders-tab">
      <div className="tab-header">
        <div className="header-content">
          <FaCheckCircle className="header-icon" />
          <div>
            <h1>Completed Orders</h1>
            <p>Successfully delivered orders from Main Warehouse</p>
          </div>
        </div>
        <div className="orders-stats">
          <span className="stat-number" id="stat-label">{filteredOrders.length}</span>
          <span className="stat-label" id="stat-label">Completed Orders</span>
        </div>
      </div>

      {/* Enhanced Search Bar */}
      <div className="search-section">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search orders by ID, customer name, email, phone, or product ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input" id="serachinp"
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <FaBox className="empty-icon" />
            <h3>No Completed Orders Found</h3>
            <p>
              {searchTerm ? 
                "No orders match your search criteria. Try different keywords." :
                "Completed delivery orders from Main Warehouse will appear here."
              }
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => renderOrderCard(order))
        )}
      </div>

      {/* Order Details Modal */}
      {renderOrderModal()}
    </div>
  );
};

export default CompletedOrdersTab;