import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCreditCard,
  FaBox,
  FaTag,
  FaWarehouse,
  FaUserTie,
  FaCheckCircle,
  FaShippingFast,
  FaIdCard,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaSpinner,
  FaSearch,
  FaInfoCircle,
  FaWeight,
  FaRuler,
  FaPalette,
  FaLayerGroup,
  FaBarcode,
  FaEye,
  FaEyeSlash,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaUsers
} from "react-icons/fa";
import "../styles/DeliveryTab.css";

const DeliveryTab = ({ 
  deliveredOrders, 
  warehouseId, 
  user, 
  employees, 
  onRefresh 
}) => {
  const [warehouseName, setWarehouseName] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigningEmployee, setAssigningEmployee] = useState(null);
  const [searchTerms, setSearchTerms] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [emailStatus, setEmailStatus] = useState({});

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const toggleDropdown = (orderId) => {
    setDropdownOpen(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
    // Clear search when opening dropdown
    if (!dropdownOpen[orderId]) {
      setSearchTerms(prev => ({ ...prev, [orderId]: "" }));
    }
  };

  const closeAllDropdowns = () => {
    setDropdownOpen({});
  };

  useEffect(() => {
  const nameFromSession = sessionStorage.getItem("warehouseName");
  if (nameFromSession) setWarehouseName(nameFromSession);
}, []);

  const handleMarkAsDelivered = async (orderId) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/warehouse-management/delivery/complete/${orderId}/${warehouseId}`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      // Show appropriate message based on email status
      if (response.data.emailSent) {
        setEmailStatus(prev => ({
          ...prev,
          [orderId]: { success: true, message: "Order marked as delivered and email sent to user!" }
        }));
        alert("Order marked as delivered and email sent to user!");
      } else {
        setEmailStatus(prev => ({
          ...prev,
          [orderId]: { 
            success: false, 
            message: "Order marked as delivered but email failed to send." 
          }
        }));
        alert("Order marked as delivered but email failed to send.");
      }
      
      onRefresh();
    } catch (err) {
      console.error("Delivery Complete Error:", err);
      setEmailStatus(prev => ({
        ...prev,
        [orderId]: { success: false, message: "Failed to mark as delivered. Please try again." }
      }));
      alert("Failed to mark as delivered. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEmployee = async (orderId, employeeId) => {
    try {
      setAssigningEmployee(orderId);
      await axios.put(
        `${API_BASE_URL}/api/warehouse-management/orders/${orderId}/assign-delivery-employee`,
        { 
          deliveryEmployeeId: employeeId,
          warehouseId: warehouseId 
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      alert("Delivery employee assigned successfully!");
      onRefresh();
      // Close dropdown after assignment
      closeAllDropdowns();
    } catch (err) {
      console.error("Assign Employee Error:", err);
      alert("Failed to assign delivery employee. Please try again.");
    } finally {
      setAssigningEmployee(null);
      setSearchTerms(prev => ({ ...prev, [orderId]: "" }));
    }
  };

  // Filter delivered orders to only show main warehouse orders
  const mainWarehouseDeliveredOrders = deliveredOrders.filter(order => 
    order.products?.some(product => 
      product.warehouseAllocations?.some(alloc => 
        alloc.warehouseId?.toString() === warehouseId && 
        alloc.warehouseType === "Main Warehouse"
      )
    )
  );

  const handleSearchChange = (orderId, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [orderId]: value
    }));
  };

  // Get filtered employees for a specific order
  const getFilteredEmployees = (orderId) => {
    const searchTerm = searchTerms[orderId] || "";
    if (!searchTerm) return employees;
    
    return employees.filter(employee =>
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone?.includes(searchTerm)
    );
  };

  const renderProductDetails = (product, currency) => {
    const details = [];
    
    // Basic product info
    details.push(
      <div key="quantity" className="detail-item">
        <FaBox className="detail-icon" />
        <span><strong>Quantity:</strong> {product.qty}</span>
      </div>
    );

    // Pricing information
    details.push(
      <div key="pricing" className="detail-item">
        <FaMoneyBillWave className="detail-icon" />
        <span><strong>Price:</strong> {product.discountedPrice} {currency}</span>
        {product.originalPrice && product.originalPrice !== product.discountedPrice && (
          <span className="original-price">(Was: {product.originalPrice} {currency})</span>
        )}
      </div>
    );

    // Product attributes from schema
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
            <span><strong>{label}:</strong> {product[key]}</span>
          </div>
        );
      }
    });

    return details;
  };

  const renderOrderSummary = (order) => {
    const assignedEmployee = order.assignedDeliveryEmployee 
      ? employees.find(emp => emp._id === order.assignedDeliveryEmployee)
      : null;

    return (
      <div className="order-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <FaUser className="summary-icon" />
            <div className="summary-content">
              <span className="summary-label">Customer</span>
              <span className="summary-value">{order.userDetails?.name || "N/A"}</span>
            </div>
          </div>
          
          <div className="summary-item">
            <FaBox className="summary-icon" />
            <div className="summary-content">
              <span className="summary-label">Products</span>
              <span className="summary-value">{order.products?.length || 0} items</span>
            </div>
          </div>
          
          <div className="summary-item">
            <FaUserTie className="summary-icon" />
            <div className="summary-content">
              <span className="summary-label">Delivery Employee</span>
              <span className={`summary-value ${assignedEmployee ? 'assigned' : 'not-assigned'}`}>
                {assignedEmployee ? assignedEmployee.name : "Not Assigned"}
              </span>
            </div>
          </div>
          
          <div className="summary-item">
            <FaCreditCard className="summary-icon" />
            <div className="summary-content">
              <span className="summary-label">Payment</span>
              <span className="summary-value">{order.paymentMethod} • {order.paymentStatus}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmployeeDropdown = (order) => {
    const isOpen = dropdownOpen[order._id];
    const filteredEmployees = getFilteredEmployees(order._id);
    const searchTerm = searchTerms[order._id] || "";

    return (
      <div className="custom-dropdown-container">
        <button
          className="dropdown-trigger"
          onClick={() => toggleDropdown(order._id)}
          disabled={assigningEmployee === order._id}
        >
          <FaUserTie className="trigger-icon" />
          <span>Select Delivery Employee</span>
          <FaChevronDown className={`dropdown-chevron ${isOpen ? 'open' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="dropdown-backdrop" onClick={closeAllDropdowns}></div>
            <div className="dropdown-modal">
              <div className="modal-header">
                <div className="modal-title">
                  <FaUsers className="title-icon" />
                  <h3>Assign Delivery Employee</h3>
                </div>
                <button
                  className="modal-close"
                  onClick={closeAllDropdowns}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-content">
                {/* Search Bar */}
                <div className="dropdown-search">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search employees by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(order._id, e.target.value)}
                    className="search-input"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      className="clear-search"
                      onClick={() => handleSearchChange(order._id, "")}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>

                {/* Employee List */}
                <div className="employee-list">
                  {filteredEmployees.length === 0 ? (
                    <div className="no-employees">
                      <FaUsers className="no-employees-icon" />
                      <p>{searchTerm ? "No employees found matching your search" : "No delivery employees available"}</p>
                      {searchTerm && (
                        <button
                          className="clear-search-btn"
                          onClick={() => handleSearchChange(order._id, "")}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <div
                        key={employee._id}
                        className="employee-option"
                        onClick={() => handleAssignEmployee(order._id, employee._id)}
                      >
                        <div className="employee-option-avatar">
                          <FaUserTie />
                        </div>
                        <div className="employee-option-info">
                          <span className="employee-option-name">{employee.name}</span>
                          <div className="employee-option-details">
                            {employee.phone && (
                              <span className="employee-option-phone">
                                <FaPhone className="detail-icon" />
                                {employee.phone}
                              </span>
                            )}
                            {employee.email && (
                              <span className="employee-option-email">
                                <FaEnvelope className="detail-icon" />
                                {employee.email}
                              </span>
                            )}
                          </div>
                        </div>
                        {assigningEmployee === order._id && (
                          <FaSpinner className="option-spinner" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Dropdown Footer */}
                <div className="dropdown-footer">
                  <div className="employee-count">
                    <span className="count-number">{filteredEmployees.length}</span>
                    <span className="count-label">
                      {filteredEmployees.length === 1 ? 'employee' : 'employees'} found
                      {searchTerm && ` for "${searchTerm}"`}
                    </span>
                  </div>
                  <button
                    className="close-dropdown"
                    onClick={closeAllDropdowns}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderOrderDetails = (order) => {
    const assignedEmployee = order.assignedDeliveryEmployee 
      ? employees.find(emp => emp._id === order.assignedDeliveryEmployee)
      : null;

    return (
      <div className="order-details">
        {/* Main Grid Layout */}
        <div className="order-grid">
          {/* Customer Information */}
          <div className="grid-section customer-section">
            <div className="section-header">
              <FaUser className="section-icon" />
              <h4>Customer Information</h4>
            </div>
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span className="info-value">{order.userDetails?.name || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value email">{order.userDetails?.email || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mobile</span>
                  <span className="info-value">
                    {order.userDetails?.regionCode || ""} {order.userDetails?.mobile || "N/A"}
                  </span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Delivery Address</span>
                  <div className="address-content">
                    <p>{order.userDetails?.houseNumber || ""}, {order.userDetails?.district || ""}</p>
                    <p>{order.userDetails?.state || ""}, {order.userDetails?.region || ""} - {order.userDetails?.pincode || ""}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid-section payment-section">
            <div className="section-header">
              <FaCreditCard className="section-icon" />
              <h4>Payment Information</h4>
            </div>
            <div className="section-content">
              <div className="payment-grid">
                <div className="payment-item">
                  <span className="payment-label">Method</span>
                  <span className="payment-method">{order.paymentMethod}</span>
                </div>
                <div className="payment-item">
                  <span className="payment-label">Status</span>
                  <span className={`payment-status ${order.paymentStatus?.toLowerCase()}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="payment-item full-width">
                  <span className="payment-label">Total Amount</span>
                  <span className="amount-value">
                    {order.totalAmount} {order.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Information */}
          <div className="grid-section products-section">
            <div className="section-header">
              <FaBox className="section-icon" />
              <h4>Products ({order.products?.length || 0})</h4>
            </div>
            <div className="section-content">
              <div className="products-grid">
                {order.products?.map((product, index) => (
                  <div key={index} className="product-card">
                    <div className="product-header">
                      <div className="product-basic">
                        <h5 className="product-name">{product.name}</h5>
                        <div className="product-meta">
                          <span className="product-id">SKU: {product._id || `ITEM-${index + 1}`}</span>
                          {product.category && (
                            <span className="product-category-tag">{product.category}</span>
                          )}
                        </div>
                      </div>
                      <div className="product-pricing">
                        <div className="price-main">{product.discountedPrice} {order.currency}</div>
                        {product.discount > 0 && (
                          <div className="discount-badge">
                            {product.discount}% OFF
                            {product.originalPrice && (
                              <span className="original-price-line">{product.originalPrice} {order.currency}</span>
                            )}
                          </div>
                        )}
                        <div className="product-total">
                          Total: {(product.discountedPrice * product.qty).toFixed(2)} {order.currency}
                        </div>
                      </div>
                    </div>

                    {/* Complete Product Details */}
                    <div className="product-details-container">
                      <div className="product-details-grid">
                        {renderProductDetails(product, order.currency)}
                      </div>

                      {product.description && (
                        <div className="product-description">
                          <strong>Description:</strong> 
                          <p>{product.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Warehouse Allocations */}
                    {product.warehouseAllocations && product.warehouseAllocations.length > 0 && (
                      <div className="allocations-section">
                        <h6 className="allocations-title">
                          <FaWarehouse className="title-icon" />
                          Warehouse Allocations
                        </h6>
                        <div className="allocations-grid">
                          {product.warehouseAllocations.map((alloc, allocIdx) => (
                            <div
                              key={allocIdx}
                              className={`allocation-card ${alloc.warehouseType.toLowerCase().replace(' ', '-')}`}
                            >
                              <div className="allocation-header">
                                <FaWarehouse className="allocation-icon" />
                                <div className="allocation-info">
                                  <span className="allocation-type">{alloc.warehouseType}</span>
                                  <span className="allocation-name">{alloc.name}</span>
                                  <span className="allocation-address">
                                    {alloc.street && `${alloc.street}, `}
                                    {alloc.city && `${alloc.city}, `}
                                    {alloc.district && `${alloc.district}, `}
                                    {alloc.postalCode}
                                  </span>
                                </div>
                              </div>
                              <div className="allocation-meta">
                                <span className="allocation-qty">Qty: {alloc.qty}</span>
                                {alloc.warehouseType !== "Main Warehouse" && (
                                  <span className={`allocation-status ${alloc.notificationStatus?.toLowerCase()}`}>
                                    {alloc.notificationStatus || "Allocated"}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Assignment */}
          <div className="grid-section assignment-section">
            <div className="section-header">
              <FaUserTie className="section-icon" />
              <h4>Delivery Assignment</h4>
            </div>
            <div className="section-content">
              <div className="assignment-content">
                {assignedEmployee ? (
                  <div className="assigned-employee-card">
                    <div className="employee-avatar">
                      <FaUserTie />
                    </div>
                    <div className="employee-info">
                      <span className="employee-name">{assignedEmployee.name}</span>
                      <div className="employee-contacts">
                        {assignedEmployee.phone && (
                          <span className="employee-phone">{assignedEmployee.phone}</span>
                        )}
                        {assignedEmployee.email && (
                          <span className="employee-email">{assignedEmployee.email}</span>
                        )}
                      </div>
                    </div>
                    <span className="assigned-badge">Assigned</span>
                  </div>
                ) : (
                  <div className="not-assigned-card">
                    <FaUserTie className="warning-icon" />
                    <span>No delivery employee assigned</span>
                  </div>
                )}

                <div className="employee-assignment-section">
                  <label className="assignment-label">Assign Delivery Employee</label>
                  {renderEmployeeDropdown(order)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderCard = (order) => {
    const isMainWarehouseOrder = order.products?.some(product => 
      product.warehouseAllocations?.some(alloc => 
        alloc.warehouseId?.toString() === warehouseId && 
        alloc.warehouseType === "Main Warehouse"
      )
    );
    
    if (!isMainWarehouseOrder) {
      return null;
    }

    const isExpanded = expandedOrders[order._id];
    const currentEmailStatus = emailStatus[order._id];

    return (
      <div key={order._id} className="delivery-order-card">
        {/* Order Header */}
        <div className="order-card-header">
          <div className="order-id-section">
            <div className="order-info">
               <FaIdCard className="order-id-icon" />
              <h3>OrderId: #{order._id}</h3>
              <span className="order-date" style={{marginLeft:"2rem"}}>
                <FaCalendarAlt className="date-icon" />
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          <div className="header-right">
            <span className="status-badge delivered">
              Ready for Delivery
            </span>
            <div className="total-amount">
              {order.totalAmount} {order.currency}
            </div>
          </div>
        </div>

        {/* Email Status Alert */}
        {currentEmailStatus && (
          <div className={`email-status-alert ${currentEmailStatus.success ? 'success' : 'error'}`}>
            <FaEnvelope className="alert-icon" />
            <span>{currentEmailStatus.message}</span>
          </div>
        )}

        {/* Order Summary (Always Visible) */}
        {renderOrderSummary(order)}

        {/* Expand/Collapse Button */}
        <div className="expand-section">
          <button
            className="expand-btn"
            onClick={() => toggleOrderDetails(order._id)}
          >
            {isExpanded ? (
              <>
                <FaEyeSlash className="btn-icon" />
                Hide Details
                <FaChevronUp className="chevron-icon" />
              </>
            ) : (
              <>
                <FaEye className="btn-icon" />
                View Details
                <FaChevronDown className="chevron-icon" />
              </>
            )}
          </button>
        </div>

        {/* Detailed Information (Conditional) */}
        {isExpanded && renderOrderDetails(order)}

        {/* Actions */}
        <div className="order-card-actions">
          <button
            className="deliver-btn primary-action"
            onClick={() => handleMarkAsDelivered(order._id)}
            disabled={loading || !order.assignedDeliveryEmployee}
          >
            <FaCheckCircle className="btn-icon" />
            {loading ? "Processing..." : "Mark as Delivered"}
          </button>
          {!order.assignedDeliveryEmployee && (
            <div className="assignment-warning">
              Please assign a delivery employee first
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="delivery-tab">
      <div className="delivery-header">
        <div className="header-content">
          <FaShippingFast className="header-icon" />
          <div className="header-text">
            <h2>Delivery Management</h2>
            <p>Manage orders ready for delivery from {warehouseName} warehouse</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{mainWarehouseDeliveredOrders.length}</span>
            <span className="stat-label" style={{color:"white"}}>Orders Ready</span>
          </div>
        </div>
      </div>

      <div className="delivery-content">
        {mainWarehouseDeliveredOrders.length === 0 ? (
          <div className="empty-state">
            <FaBox className="empty-icon" />
            <h3>No Orders for Delivery</h3>
            <p style={{textAlign:"center"}}>There are no shipped orders ready for delivery from the main warehouse.</p>
          </div>
        ) : (
          <div className="orders-container">
            {mainWarehouseDeliveredOrders.map((order) => renderOrderCard(order))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryTab;