import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/DeliveryManagement.css";
import {
  FaSearch, FaFilter, FaCheckCircle, FaTruck, FaBoxOpen,
  FaCheck, FaTimes, FaChevronDown, FaChevronUp, FaInfoCircle,
  FaShippingFast, FaClock, FaBox, FaImage, FaBars, FaTimesCircle,
  FaClipboardList, FaShoppingCart, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUser, FaSignOutAlt, FaFileExport
} from "react-icons/fa";

const DeliveryManagement = () => {
  const { logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("pending");
  const [deliveryEmployees, setDeliveryEmployees] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch ONLY shipping completed orders (these should automatically appear in delivery)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Use the correct endpoint that returns shipping completed orders
        const response = await axios.get(`${API_BASE_URL}/api/orders/delivery/all`);
        console.log("Fetched delivery orders:", response.data);
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching delivery orders:", error);
        console.error("Error details:", error.response?.data);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/deliveryEmployees`);
        setDeliveryEmployees(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  // ✅ Export incomplete delivery orders data to CSV with Product IDs
  const exportIncompleteDeliveryData = () => {
    const incompleteOrders = orders.filter(order => !order.deliveryCompleted);
    
    if (incompleteOrders.length === 0) {
      alert("No incomplete delivery orders to export!");
      return;
    }
    
    const headers = [
      "Order ID", 
      "Customer Name", 
      "Email", 
      "Phone", 
      "Total Amount", 
      "Payment Status", 
      "Payment Method",
      "Delivery Address",
      "Products", 
      "Product IDs",
      "Expected Delivery Date"
    ];
    
    const csvData = incompleteOrders.map(order => [
      order._id,
      order.userDetails?.name || "Unknown",
      order.userDetails?.email || "N/A",
      order.userDetails?.mobile || order.userDetails?.phone || "N/A",
      `${order.currency} ${order.totalAmount}`,
      order.paymentStatus,
      order.paymentMethod,
      `${order.userDetails?.houseNumber || ""}, ${order.userDetails?.region || ""}, ${order.userDetails?.district || ""}, ${order.userDetails?.state || ""} - ${order.userDetails?.pincode || ""}`,
      order.products?.map(p => p.name).join("; ") || "N/A",
      order.products?.map(p => p._id).join("; ") || "N/A",
      order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not specified"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(item => `"${item}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incomplete_delivery_orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Exported ${incompleteOrders.length} incomplete delivery orders!`);
  };

  // ✅ Mark order as delivered + send email + generate invoice
  const handleMarkDelivered = async (orderId) => {
    try {
      const order = orders.find((o) => o._id === orderId);

      const res = await axios.put(
        `${API_BASE_URL}/api/orders/admin/mark-delivered/${orderId}`
      );
      const updatedOrder = res.data.order;

      // Generate invoice
      const invoiceRes = await axios.post(
        `${API_BASE_URL}/api/invoices/generate/${orderId}`
      );
      const invoiceUrl = invoiceRes.data.invoiceUrl;

      // Send email notification using nodemailer endpoint
      if (order && order.userDetails?.email) {
        const emailData = {
          to: order.userDetails.email,
          userName: order.userDetails?.name || "Customer",
          orderId: order._id,
          products: order.products.map(p => ({
            name: p.name,
            quantity: p.qty,
            price: p.discountedPrice || p.originalPrice,
            total: p.total
          })),
          totalAmount: order.totalAmount,
          currency: order.currency,
          deliveryDate: new Date(updatedOrder.deliveredAt || new Date()).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          invoiceUrl: invoiceUrl,
          address: `${order.userDetails?.houseNumber || ""}, ${order.userDetails?.region || ""}, ${order.userDetails?.district || ""}, ${order.userDetails?.state || ""} - ${order.userDetails?.pincode || ""}`
        };

        // Fix the URL to avoid double slashes
        const emailEndpoint = `${API_BASE_URL.replace(/\/$/, "")}/api/email/send-order-completed`;
        
        console.log("Sending email to:", emailData.to);
        console.log("Email endpoint:", emailEndpoint);
        
        await axios.post(emailEndpoint, emailData);
        console.log("Email sent successfully");
      } else {
        console.warn("No email address found for order:", orderId);
      }

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === orderId
            ? {
              ...o,
              deliveryCompleted: true,
              invoiceUrl,
              paymentStatus: updatedOrder.paymentStatus,
              deliveredAt: updatedOrder.deliveredAt,
            }
            : o
        )
      );

      alert("Order marked as delivered, invoice generated & email sent!");
    } catch (error) {
      console.error("Error updating delivery status:", error);
      console.error("Error details:", error.response?.data || error.message);
      alert("Error updating delivery status. Please check console for details.");
    }
  };

  const assignDeliveryEmployee = async (orderId, employeeId) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/orders/assign-delivery/${orderId}`, { employeeId });
      const updatedOrder = res.data.order;

      setOrders(prevOrders =>
        prevOrders.map(o => o._id === orderId ? updatedOrder : o)
      );

      alert(`Assigned ${updatedOrder.assignedDeliveryEmployee?.name} to Order ${orderId}`);
    } catch (error) {
      console.error("Error assigning delivery employee:", error);
      alert("Failed to assign delivery employee. Check console for details.");
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

  // Close sidebar when clicking on overlay
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Stats
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(order => order.deliveryCompleted).length;
  const pendingOrders = orders.filter(order => !order.deliveryCompleted).length;

  const activeOrders = orders.filter(order => !order.deliveryCompleted);
  const completedOrders = orders.filter(order => order.deliveryCompleted);

  const filterOrders = (ordersList) => {
    return ordersList.filter(order => {
      if (filterStatus === "completed" && !order.deliveryCompleted) return false;
      if (filterStatus === "pending" && order.deliveryCompleted) return false;
      if (filterStatus === "all") return true;
      
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

  if (loading) {
    return <div className="smc-loading-spinner">Loading delivery orders...</div>;
  }

  const editDeliveryEmployee = async (orderId, employeeId) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/orders/edit-delivery/${orderId}`,
        { employeeId }
      );
      const updatedOrder = res.data.order;

      setOrders(prevOrders =>
        prevOrders.map(o => (o._id === orderId ? updatedOrder : o))
      );

      alert(`Reassigned Order ${orderId} to ${updatedOrder.assignedDeliveryEmployee?.name}`);
    } catch (error) {
      console.error("Error reassigning delivery employee:", error);
      alert("Failed to reassign delivery employee. Check console for details.");
    }
  };

  return (
    <div className="smc-container">
      {/* Mobile Header */}
      <div className="smc-mobile-header">
        <button
          className="smc-menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FaTimesCircle /> : <FaBars />}
        </button>
        <h2>Delivery Management</h2>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && <div className="smc-overlay" onClick={closeSidebar}></div>}

      <div className="smc-content-wrapper">
        {/* Sidebar */}
        <div className={`smc-sidebar ${sidebarOpen ? 'active' : ''}`}>
          <div className="smc-sidebar-header">
            <button
              className="smc-sidebar-close" id="toogleclose"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimesCircle />
            </button>
            <h3>Delivery Dashboard</h3>
          </div>

          <div className="smc-sidebar-stats">
            <div className="smc-stat-item">
              <div className="smc-stat-icon smc-stat-icon-total"><FaBox /></div>
              <div className="smc-stat-info">
                <span className="smc-stat-number">{totalOrders}</span>
                <span className="smc-stat-label">Total Orders</span>
              </div>
            </div>
            <div className="smc-stat-item">
              <div className="smc-stat-icon smc-stat-icon-completed"><FaCheckCircle /></div>
              <div className="smc-stat-info">
                <span className="smc-stat-number">{deliveredOrders}</span>
                <span className="smc-stat-label">Delivered</span>
              </div>
            </div>
            <div className="smc-stat-item">
              <div className="smc-stat-icon smc-stat-icon-pending"><FaClock /></div>
              <div className="smc-stat-info">
                <span className="smc-stat-number">{pendingOrders}</span>
                <span className="smc-stat-label">Pending</span>
              </div>
            </div>
          </div>

          <nav className="smc-sidebar-nav">
            <button
              className={`smc-nav-item ${activeSection === 'pending' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('pending');
                setFilterStatus('pending');
                setSidebarOpen(false);
              }}
            >
              <FaTruck /><span>Pending Delivery</span>
              <span className="smc-nav-badge">{pendingOrders}</span>
            </button>
            <button
              className={`smc-nav-item ${activeSection === 'completed' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('completed');
                setFilterStatus('completed');
                setSidebarOpen(false);
              }}
            >
              <FaCheckCircle /><span>Delivered Orders</span>
              <span className="smc-nav-badge">{deliveredOrders}</span>
            </button>
            <button
              className={`smc-nav-item ${activeSection === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('all');
                setFilterStatus('all');
                setSidebarOpen(false);
              }}
            >
              <FaClipboardList /><span>All Orders</span>
            </button>
            <button
              className={`smc-nav-item ${activeSection === 'employees' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('employees');
                setSidebarOpen(false);
                navigate("/deliverymanager");
              }}
            >
              <FaUser /><span>Employees</span>
            </button>

            <button
              className="smc-nav-item"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <FaSignOutAlt /><span>Logout</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="smc-main-content">
          <div className="smc-content-header">
            <h2>
              {filterStatus === 'completed' ? 'Delivered Orders' :
                filterStatus === 'pending' ? 'Pending Delivery' : 'All Orders'}
            </h2>
            <div className="smc-controls-container">
              <div className="smc-search-box">
                <FaSearch className="smc-search-icon" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Name or Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="smc-filter-box">
                <FaFilter className="smc-filter-icon" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="pending">Pending Delivery</option>
                  <option value="completed">Delivered</option>
                  <option value="all">All Orders</option>
                </select>
              </div>
              
              {/* Add Export Button for incomplete deliveries */}
              {activeSection === 'pending' && (
                <button 
                  className="smc-export-btn"
                  onClick={exportIncompleteDeliveryData}
                  disabled={pendingOrders === 0}
                  title="Export incomplete delivery orders to CSV"
                >
                  <FaFileExport /> Export Data
                </button>
              )}
            </div>
          </div>

          {/* Orders */}
          <div className="smc-orders-section">
            {filterStatus === 'pending' && filteredActiveOrders.length === 0 ? (
              <div className="smc-no-orders">
                <FaBoxOpen className="smc-no-orders-icon" />
                <p>No pending delivery orders found.</p>
                <p><small>Orders will appear here automatically when shipping is completed.</small></p>
              </div>
            ) : filterStatus === 'completed' && filteredCompletedOrders.length === 0 ? (
              <div className="smc-no-orders">
                <FaCheckCircle className="smc-no-orders-icon" />
                <p>No delivered orders yet.</p>
              </div>
            ) : filterStatus === 'all' && orders.length === 0 ? (
              <div className="smc-no-orders">
                <FaClipboardList className="smc-no-orders-icon" />
                <p>No orders found.</p>
                <p><small>Make sure orders are marked as 'Shipping Completed' in Shipping Management.</small></p>
              </div>
            ) : (
              <div className="smc-orders-grid">
                {(filterStatus !== 'completed' ? filteredActiveOrders : [])
                  .concat(filterStatus !== 'pending' ? filteredCompletedOrders : [])
                  .map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      expandedOrders={expandedOrders}
                      expandedProducts={expandedProducts}
                      toggleOrderDetails={toggleOrderDetails}
                      toggleProductDetails={toggleProductDetails}
                      handleMarkDelivered={handleMarkDelivered}
                      renderSize={renderSize}
                      employees={deliveryEmployees}
                      assignDeliveryEmployee={assignDeliveryEmployee} 
                      editDeliveryEmployee={editDeliveryEmployee} 
                      isCompleted={order.deliveryCompleted}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ OrderCard
const OrderCard = ({ order, expandedOrders, expandedProducts, toggleOrderDetails, toggleProductDetails, handleMarkDelivered, renderSize, employees, assignDeliveryEmployee, editDeliveryEmployee, isCompleted }) => {
  const addr = order.userDetails
    ? `${order.userDetails.houseNumber || ""}, ${order.userDetails.region || ""}, ${order.userDetails.district || ""}, ${order.userDetails.state || ""} - ${order.userDetails.pincode || ""}`
    : "N/A";
  const phone =
    order.userDetails?.mobile ||
    order.userDetails?.phone ||
    order.userDetails?.phoneNumber || "N/A";
  const isOrderExpanded = expandedOrders[order._id];

  return (
    <div className={`smc-order-card ${isCompleted ? 'completed' : ''}`}>
      <div className="smc-order-card-header" onClick={() => toggleOrderDetails(order._id)}>
        <div className="smc-order-id-status">
          <div className="smc-order-id">Order: {order._id}</div>
          <div className="smc-order-date">{new Date(order.createdAt).toLocaleDateString()}</div>
          <div className="smc-status-badges">
            <div className={`smc-status-badge ${order.deliveryCompleted ? "completed" : "pending"}`}>
              {order.deliveryCompleted ? <FaCheckCircle /> : <FaTruck />}
              {order.deliveryCompleted ? "Delivered" : "Pending Delivery"}
            </div>
            <div className="smc-status-badge shipping-completed">
              <FaShippingFast />
              Shipping Completed
            </div>
          </div>
        </div>
        <div className="smc-order-toggle">{isOrderExpanded ? <FaChevronUp /> : <FaChevronDown />}</div>
      </div>

      <div className="smc-order-card-summary">
        <div className="smc-customer-info">
          <div className="smc-customer-name"><FaUser className="smc-info-icon" />{order.userDetails?.name || "Unknown"}</div>
          <div className="smc-customer-email"><FaEnvelope className="smc-info-icon" />{order.userDetails?.email || "N/A"}</div>
          <div className="smc-customer-phone"><FaPhone className="smc-info-icon" />{order.userDetails?.regionCode ? `${order.userDetails.regionCode} ` : ""}{phone}</div>
        </div>
        <div className="smc-order-meta">
          <div className="smc-payment-info">
            <span className="smc-payment-method">{order.paymentMethod}</span>
            <span className={`smc-payment-status ${order.paymentStatus?.toLowerCase()}`}>{order.paymentStatus}</span>
          </div>
          <div className="smc-total-amount"><FaShoppingCart className="smc-amount-icon" />{order.currency} {order.totalAmount}</div>
        </div>
      </div>

      {isOrderExpanded && (
        <div className="smc-order-card-details">
          <div className="smc-contact-section">
            <h4><FaMapMarkerAlt className="smc-section-icon" />Delivery Address</h4>
            <div className="smc-contact-details"><div className="smc-contact-address">{addr}</div></div>
          </div>

          <div className="smc-products-section">
            <h4><FaBox className="smc-section-icon" />Products ({order.products?.length})</h4>
            <div className="smc-products-list">
              {order.products?.map((p, idx) => {
                const key = `${order._id}-${idx}`;
                const expanded = expandedProducts[key];
                return (
                  <div key={idx} className="smc-product-item">
                    <div className="smc-product-summary" onClick={() => toggleProductDetails(order._id, idx)}>
                      <div className="smc-product-info">
                        <div className="smc-product-name">{p.name}</div>
                        <div className="smc-product-price">{order.currency} {p.discountedPrice || p.originalPrice} × {p.qty}</div>
                      </div>
                      <div className="smc-product-toggle">{expanded ? <FaChevronUp /> : <FaChevronDown />}</div>
                    </div>
                    {expanded && (
                      <div className="smc-product-details-expanded">
                        <div className="smc-product-detail-grid">
                          <div className="smc-detail-item"><span className="smc-detail-label">Category:</span><span className="smc-detail-value">{p.category || "N/A"}</span></div>
                          <div className="smc-detail-item"><span className="smc-detail-label">Subcategory:</span><span className="smc-detail-value">{p.subCategory || "N/A"}</span></div>
                          <div className="smc-detail-item"><span className="smc-detail-label">Sub-Subcategory:</span><span className="smc-detail-value">{p.subSubCategory || "N/A"}</span></div>
                          <div className="smc-detail-item"><span className="smc-detail-label">Size:</span><span className="smc-detail-value">{renderSize(p)}</span></div>
                          <div className="smc-detail-item"><span className="smc-detail-label">Qty:</span><span className="smc-detail-value">{p.qty}</span></div>
                          <div className="smc-detail-item"><span className="smc-detail-label">Original Price:</span><span className="smc-detail-value">{order.currency} {p.originalPrice}</span></div>
                          <div className="smc-detail-item"><span className="smc-detail-label">Discount %:</span><span className="smc-detail-value">{p.discount || 0}%</span></div>
                          <div className="smc-detail-item"><span className="smc-detail-label">After Discount:</span><span className="smc-detail-value">{order.currency} {p.discountedPrice}</span></div>
                          <div className="smc-detail-item"><span className="smc-detail-label">Total:</span><span className="smc-detail-value">{order.currency} {p.total}</span></div>
                        </div>
                        {p.stock !== undefined && p.stock <= 0 && (
                          <div className="smc-out-of-stock-notice"><FaInfoCircle /><span>Out of Stock</span></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="smc-delivery-employee-section">
            <h4>Delivery Assignment</h4>
            {order.assignedDeliveryEmployee ? (
              <div className="smc-assigned-employee">
                <div className="assignment-info">
                  <span>Assigned to: </span>
                  <strong>{order.assignedDeliveryEmployee.name}</strong>
                  {order.assignedDeliveryEmployee.status && (
                    <span className={`employee-status ${order.assignedDeliveryEmployee.status}`}>
                      {order.assignedDeliveryEmployee.status}
                    </span>
                  )}
                </div>
                {order.assignedDeliveryEmployee.phone && (
                  <div className="employee-contact">
                    <span className="contact-info">{order.assignedDeliveryEmployee.phone}</span>
                  </div>
                )}

                {/* ✅ Edit Button */}
                {!isCompleted && (
                  <div className="edit-assignment">
                    <select
                      onChange={(e) => editDeliveryEmployee(order._id, e.target.value)}
                      defaultValue={order.assignedDeliveryEmployee._id}
                      className="employee-select"
                    >
                      {employees.map(emp => (
                        <option 
                          key={emp._id} 
                          value={emp._id}
                          data-status={emp.status}
                        >
                          {emp.name} {emp.status && `(${emp.status})`}
                        </option>
                      ))}
                    </select>
                    <small>You can reassign the employee here</small>
                  </div>
                )}
              </div>
            ) : (
              !isCompleted && (
                <div className="assignment-controls">
                  <select
                    onChange={(e) => assignDeliveryEmployee(order._id, e.target.value)}
                    defaultValue=""
                    className="employee-select"
                  >
                    <option value="" disabled>Select Delivery Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.status && `(${emp.status})`}
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}
          </div>

          {!isCompleted && (
            <div className="smc-action-buttons">
              <button onClick={() => handleMarkDelivered(order._id)} className="smc-btn smc-btn-complete">
                <FaTruck className="smc-btn-icon" />Mark as Delivered
              </button>
            </div>
          )}

          {!isCompleted && order.deliveryDate && (
            <div className="smc-delivery-info">
              <h4><FaClock className="smc-section-icon" />Expected Delivery</h4>
              <div className="smc-detail-item">
                <span className="smc-detail-label">Delivery Date:</span>
                <span className="smc-detail-value">
                  {new Date(order.deliveryDate).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default DeliveryManagement;