import { useState, useEffect, useContext } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import NotificationsTab from "../components/NotificationsTab";
import DeliveryTab from "../components/DeliveryTab";
import CompletedOrdersTab from "../components/CompletedOrdersTab";
import { useNavigate } from "react-router-dom";
import {
  FaShippingFast,
  FaTruck,
  FaCheckCircle,
  FaBell,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaBox,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCreditCard,
  FaWarehouse,
  FaUserTie,
  FaCalendarAlt,
  FaIdCard,
  FaTag,
  FaEye,
  FaTimesCircle,
  FaBarcode,
  FaHashtag
} from "react-icons/fa";
import "../styles/WarehouseManagement.css";

const WarehouseManagement = () => {
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("incomplete");
  const [activeTab, setActiveTab] = useState("orders");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const storedUser = JSON.parse(sessionStorage.getItem("user"));
  const warehouseId =
    user?.warehouseId ||
    storedUser?.warehouseId ||
    sessionStorage.getItem("warehouseId") ||
    null;

  const [isMainWarehouse, setIsMainWarehouse] = useState(false);
  const [warehouseName, setWarehouseName] = useState("");

  useEffect(() => {
    if (warehouseId && !sessionStorage.getItem("warehouseId")) {
      sessionStorage.setItem("warehouseId", warehouseId);
    }

    if (!warehouseId) {
      setError("Warehouse ID not found. Please login again.");
      return;
    }

    const fetchWarehouseName = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/warehouse/${warehouseId}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });

        if (res.data?.name) {
          setWarehouseName(res.data.name);
          sessionStorage.setItem("warehouseName", res.data.name);
        }
      } catch (err) {
        console.error("Failed to fetch warehouse name:", err);
      }
    };

    fetchWarehouseName();
  }, [user, warehouseId]);

  const fetchOrders = async () => {
    if (!warehouseId) {
      setError("Warehouse ID not found. Please login again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/warehouse-management/status/${warehouseId}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      if (res.data) {
        const allOrders = res.data.incomplete.concat(res.data.completed || []);

        const mainOrders = [];
        const remainingOrders = [];
        const deliveredList = [];
        const completedList = [];
        let mainWarehouseDetected = false;

        allOrders.forEach((order) => {
          if (order.shippingCompleted && !order.deliveryCompleted) {
            deliveredList.push(order);
          }

          if (order.deliveryCompleted) {
            completedList.push(order);
          }

          let hasMain = false;
          let hasRemaining = false;

          order.products.forEach((p) => {
            p.warehouseAllocations.forEach((w) => {
              if (w.warehouseId.toString() === warehouseId) {
                if (w.warehouseType === "Main Warehouse") {
                  hasMain = true;
                  mainWarehouseDetected = true;

                  const updatedProducts = order.products
                    .map((prod) => {
                      const mainAlloc = prod.warehouseAllocations.find(
                        (alloc) =>
                          alloc.warehouseId.toString() === warehouseId &&
                          alloc.warehouseType === "Main Warehouse"
                      );
                      if (!mainAlloc) return null;

                      const remainingAlloc = prod.warehouseAllocations.find(
                        (alloc) => alloc.warehouseType === "Remaining Warehouse"
                      );

                      return {
                        ...prod,
                        notificationMsg: remainingAlloc
                          ? `Request from ${remainingAlloc.name} Warehouse for ${mainAlloc.qty} of ${prod.name}`
                          : `Product allocation for ${mainAlloc.qty} of ${prod.name}`,
                        notificationStatus: mainAlloc.notificationStatus || "Allocated",
                        allocationId: mainAlloc._id,
                        isMainWarehouse: true,
                      };
                    })
                    .filter(Boolean);

                  if (updatedProducts.length > 0) {
                    const existingOrderIndex = remainingOrders.findIndex(o => o._id === order._id);
                    if (existingOrderIndex === -1) {
                      remainingOrders.push({
                        ...order,
                        products: updatedProducts,
                        isMainWarehouseOrder: true
                      });
                    }
                  }
                }

                if (w.warehouseType === "Remaining Warehouse") hasRemaining = true;
              }
            });
          });

          if (!order.shippingCompleted && hasMain) {
            const filteredOrder = {
              ...order,
              products: order.products.map(p => ({
                ...p,
                warehouseAllocations: p.warehouseAllocations ? p.warehouseAllocations.map(alloc => ({
                  ...alloc,
                  displayStatus: alloc.warehouseType === "Main Warehouse" ? false : true
                })) : p.warehouseAllocations
              }))
            };
            mainOrders.push(filteredOrder);
          }

          if (hasRemaining) {
            const updatedProducts = order.products
              .map((p) => {
                const remainingAlloc = p.warehouseAllocations.find(
                  (w) =>
                    w.warehouseId.toString() === warehouseId &&
                    w.warehouseType === "Remaining Warehouse"
                );
                if (!remainingAlloc) return null;

                const mainAlloc = p.warehouseAllocations.find(
                  (w) => w.warehouseType === "Main Warehouse"
                );

                return {
                  ...p,
                  notificationMsg: mainAlloc
                    ? `${mainAlloc.name} Warehouse requested ${remainingAlloc.qty} of ${p.name}`
                    : `Main warehouse requested ${remainingAlloc.qty} of ${p.name}`,
                  notificationStatus: remainingAlloc.notificationStatus || "Requested",
                  allocationId: remainingAlloc._id,
                  isRemainingWarehouse: true,
                };
              })
              .filter(Boolean);

            const existingOrderIndex = remainingOrders.findIndex(o => o._id === order._id);
            if (existingOrderIndex === -1) {
              remainingOrders.push({
                ...order,
                products: updatedProducts,
                isRemainingWarehouseOrder: true
              });
            } else {
              const existingProducts = remainingOrders[existingOrderIndex].products;
              const newProducts = [...existingProducts, ...updatedProducts];
              remainingOrders[existingOrderIndex].products = newProducts;
            }
          }
        });

        setIsMainWarehouse(mainWarehouseDetected);
        setOrders(mainOrders);
        setDeliveredOrders(deliveredList);
        setCompletedOrders(completedList);
        setNotifications(remainingOrders);
      }
    } catch (err) {
      console.error("Fetch Warehouse Orders Error:", err);
      setError("Failed to fetch orders. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, warehouseId]);

  const handleCompleteShipping = async (orderId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/warehouse-management/shipping/complete/${orderId}/${warehouseId}`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      alert("Shipping marked as completed for this warehouse!");
      fetchOrders();
    } catch (err) {
      console.error("Complete Shipping Error:", err);
      alert("Failed to complete shipping. Try again.");
    }
  };

  const handleAcceptRequest = async (orderId, allocationId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/warehouse-management/notification/accept/${orderId}/${warehouseId}/${allocationId}`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      alert("Request accepted!");
      fetchOrders();
    } catch (err) {
      console.error("Accept Request Error:", err);
      alert("Failed to accept request. Try again.");
    }
  };

  const fetchDeliveryEmployees = async () => {
    if (!warehouseId) return;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/warehouse-management/delivery-employees/${warehouseId}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to fetch delivery employees:", err);
    }
  };

  useEffect(() => {
    fetchDeliveryEmployees();
  }, [warehouseId]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const sidebarItems = [
    { id: "orders", label: "Shipping Orders", icon: <FaShippingFast /> },
    { id: "delivery", label: "Delivery Orders", icon: <FaTruck /> },
    { id: "completed", label: "Completed Orders", icon: <FaCheckCircle /> },
    { id: "notifications", label: "Notifications", icon: <FaBell /> },
    { id: "employees", label: "Employees", icon: <FaUsers /> },
  ];

  if (loading) {
    return (
      <div className="pageLoadingOverlay">
        <div className="pageSpinner"></div>
        <p>Loading Orders...</p>
      </div>
    );
  }

  const renderOrderCard = (order) => {
    // Calculate total quantity across all products
    const totalQuantity = order.products?.reduce((sum, product) => sum + (product.qty || 0), 0) || 0;

    return (
      <div key={order._id} className="warehouseManagement-orderCard" onClick={() => openOrderModal(order)}>
        <div className="order-card-header">
          <div className="order-id-section">
            <FaIdCard className="order-id-icon" />
            <h3>Order #{order._id}</h3> {/* Show last 8 chars for better readability */}
          </div>
          <span className={`status-badge ${order.shippingCompleted ? 'completed' : 'pending'}`}>
            {order.shippingCompleted ? 'Completed' : 'Pending'}
          </span>
        </div>

        <div className="order-card-content">
          {/* Row-wise information display */}
          <div className="order-info-row">
            <div className="info-row-item">
              <FaUser className="info-row-icon" />
              <div className="info-row-content">
                <span className="info-row-label">Customer</span>
                <span className="info-row-value">{order.userDetails?.name || "N/A"}</span>
              </div>
            </div>

            <div className="info-row-item">
              <FaBox className="info-row-icon" />
              <div className="info-row-content">
                <span className="info-row-label">Products</span>
                <span className="info-row-value">{order.products?.length || 0} Items</span>
              </div>
            </div>

            <div className="info-row-item">
              <FaHashtag className="info-row-icon" />
              <div className="info-row-content">
                <span className="info-row-label">Total Quantity</span>
                <span className="info-row-value">{totalQuantity} Units</span>
              </div>
            </div>

            <div className="info-row-item">
              <FaMoneyBillWave className="info-row-icon" />
              <div className="info-row-content">
                <span className="info-row-label">Total Amount</span>
                <span className="info-row-value">{order.totalAmount} {order.currency}</span>
              </div>
            </div>
          </div>

          <div className="order-card-footer">
            <button className="view-details-btn">
              <FaEye className="view-icon" />
              View Full Details
            </button>
            <div className="order-date">
              <FaCalendarAlt className="date-icon" />
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} onClick={closeOrderModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-section">
              <FaIdCard className="modal-title-icon" />
              <div>
                <h2>Order #{selectedOrder._id}</h2>
                <p id="order-date">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <button className="close-modal" onClick={closeOrderModal}>
              <FaTimes />
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-grid">
              <div className="info-card customer-card">
                <div className="card-header">
                  <FaUser className="card-icon" />
                  <h3>Customer Information</h3>
                </div>
                <div className="card-content">
                  <div className="customer-columns">
                    <div className="customer-column">
                      <div className="detail-item">
                        <strong>Full Name</strong>
                        <span>{selectedOrder.userDetails?.name || "N/A"}</span>
                      </div>
                      <div className="detail-item">
                        <strong>Email</strong>
                        <span className="email-value">{selectedOrder.userDetails?.email || "N/A"}</span>
                      </div>
                      <div className="detail-item">
                        <strong>Mobile</strong>
                        <span>
                          <FaPhone className="inline-icon" />
                          {selectedOrder.userDetails?.regionCode || ""} {selectedOrder.userDetails?.mobile || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="customer-column">
                      <div className="detail-item full-width">
                        <strong>Delivery Address</strong>
                        <div className="address-box">
                          <FaMapMarkerAlt className="address-icon" />
                          <div className="address-content">
                            <p>{selectedOrder.userDetails?.houseNumber || ""}, {selectedOrder.userDetails?.district || ""}</p>
                            <p>{selectedOrder.userDetails?.state || ""}, {selectedOrder.userDetails?.region || ""} - {selectedOrder.userDetails?.pincode || ""}</p>
                          </div>
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
                  <div className="detail-row">
                    <div className="detail-item">
                      <strong>Payment Method</strong>
                      <span className="payment-method">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Status</strong>
                      <span className={`payment-status ${selectedOrder.paymentStatus?.toLowerCase()}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item full-width">
                    <strong>Total Amount</strong>
                    <div className="amount-display">
                      <span className="amount">{selectedOrder.totalAmount}</span>
                      <span className="currency">{selectedOrder.currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-card products-card">
                <div className="card-header">
                  <FaBox className="card-icon" />
                  <h3>Products ({selectedOrder.products?.length || 0})</h3>
                </div>
                <div className="card-content">
                  <div className="products-list">
                    {selectedOrder.products.map((p, idx) => (
                      <div key={idx} className="product-card">
                        <div className="product-header">
                          <div className="product-basic-info">
                            <h4 className="pro">{p.name}</h4>
                            <div className="product-id-section">
                              <FaBarcode className="product-id-icon" />
                              <span className="product-id">ID: {p._id ? p._id : `PROD-${idx + 1}`}</span>
                            </div>
                            <span className="product-quantity">Qty: {p.qty || 0}</span>
                          </div>
                          <div className="product-price">
                            {p.discountedPrice} {selectedOrder.currency}
                            {p.discount > 0 && (
                              <span className="discount-badge">{p.discount}% OFF</span>
                            )}
                          </div>
                        </div>

                        <div className="product-details">
                          <div className="product-meta">
                            <span><FaTag className="meta-icon" /> {p.category}</span>
                            {p.subCategory && <span>• {p.subCategory}</span>}
                            {p.subSubCategory && <span>• {p.subSubCategory}</span>}
                            {p.selectedSize && <span>• Size: {p.selectedSize}</span>}
                          </div>

                          <div className="product-attributes">
                            <div className="attribute">
                              <strong>Product ID:</strong> {p._id || `N/A-${idx + 1}`}
                            </div>
                            <div className="attribute">
                              <strong>Quantity:</strong> {p.qty || 0}
                            </div>
                            {p.originalPrice && (
                              <div className="attribute">
                                <strong>Original Price:</strong> {p.originalPrice} {selectedOrder.currency}
                              </div>
                            )}
                            {p.discountedPrice && (
                              <div className="attribute">
                                <strong>Discounted Price:</strong> {p.discountedPrice} {selectedOrder.currency}
                              </div>
                            )}
                            {p.total && (
                              <div className="attribute">
                                <strong>Line Total:</strong> {p.total} {selectedOrder.currency}
                              </div>
                            )}
                            {p.brand && <div className="attribute"><strong>Brand:</strong> {p.brand}</div>}
                            {p.color && <div className="attribute"><strong>Color:</strong> {p.color}</div>}
                            {p.material && <div className="attribute"><strong>Material:</strong> {p.material}</div>}
                            {p.weight && <div className="attribute"><strong>Weight:</strong> {p.weight}</div>}
                            {p.dimensions && <div className="attribute"><strong>Dimensions:</strong> {p.dimensions}</div>}
                            {p.sizeInches && <div className="attribute"><strong>Size (Inches):</strong> {p.sizeInches}</div>}
                            {p.description && (
                              <div className="attribute full-width">
                                <strong>Description:</strong> {p.description}
                              </div>
                            )}
                          </div>

                          {p.warehouseAllocations && p.warehouseAllocations.length > 0 && (
                            <div className="allocations-section">
                              <h5>Warehouse Allocations</h5>
                              <div className="allocations-list">
                                {p.warehouseAllocations.map((alloc, allocIdx) => (
                                  <div
                                    key={allocIdx}
                                    className={`allocation-item ${alloc.warehouseType.toLowerCase().replace(' ', '-')}`}
                                  >
                                    <FaWarehouse className="allocation-icon" />
                                    <div className="allocation-details">
                                      <span className="allocation-type">{alloc.warehouseType}</span>
                                      <span className="allocation-name">{alloc.name}</span>
                                      <span className="allocation-id">ID: {alloc.warehouseId || "N/A"}</span>
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="info-card delivery-card">
                <div className="card-header">
                  <FaUserTie className="card-icon" />
                  <h3>Delivery Information</h3>
                </div>
                <div className="card-content">
                  <div className="delivery-status">
                    <div className="status-item">
                      <strong>Shipping Status</strong>
                      <span className={`status-badge large ${selectedOrder.shippingCompleted ? 'completed' : 'pending'}`}>
                        {selectedOrder.shippingCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="status-item">
                      <strong>Delivery Status</strong>
                      <span className={`status-badge large ${selectedOrder.deliveryCompleted ? 'completed' : 'pending'}`}>
                        {selectedOrder.deliveryCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="delivery-assignment">
                    <strong>Assigned Employee</strong>
                    <div className={`employee-assignment ${selectedOrder.assignedDeliveryEmployee ? "assigned" : "not-assigned"}`}>
                      {selectedOrder.assignedDeliveryEmployee ? (
                        <div className="assigned-employee">
                          <FaUserTie className="employee-icon" />
                          <span>
                            {employees.find(emp => emp._id === selectedOrder.assignedDeliveryEmployee)?.name || "Assigned Employee"}
                          </span>
                        </div>
                      ) : (
                        <span className="not-assigned-text">Not assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            {!selectedOrder.shippingCompleted && (
              <button
                className="completeShippingBtn primary-action"
                onClick={() => {
                  handleCompleteShipping(selectedOrder._id);
                  closeOrderModal();
                }}
              >
                <FaCheckCircle className="btn-icon" />
                Mark Shipping as Completed
              </button>
            )}
            <button id="closebtn" onClick={closeOrderModal}>
              <FaTimesCircle className="close-icon" />
              Close Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="warehouseManagement-container">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h3>Warehouse Manager</h3>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="sidebar-content">
          <div className="warehouse-info">
            <h4>{warehouseName}</h4>
          </div>

          <nav className="sidebar-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'employees') {
                    navigate('/deliverymanager');
                  } else {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }
                }}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            ))}

            <button className="sidebar-item logout-btn" onClick={handleLogout}>
              <span className="sidebar-icon"><FaSignOutAlt /></span>
              <span className="sidebar-label">Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="content-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)} style={{ color: "black" }}>
            <FaBars />
          </button>
          <div className="header-title">
            <h2>Warehouse Management</h2>
            {warehouseName && <p>Welcome to {warehouseName}</p>}
          </div>
        </header>

        <div className="content-body">
          {/* Mobile Tabs */}
          <div className="mobile-tabs">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                className={`mobile-tab ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'employees') {
                    navigate('/deliverymanager');
                  } else {
                    setActiveTab(item.id);
                  }
                }}
              >
                <span className="mobile-tab-icon">{item.icon}</span>
                <span className="mobile-tab-label">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop Tabs */}
          <div className="desktop-tabs">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                className={`desktop-tab ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'employees') {
                    navigate('/deliverymanager');
                  } else {
                    setActiveTab(item.id);
                  }
                }}
              >
                <span className="desktop-tab-icon">{item.icon}</span>
                <span className="desktop-tab-label">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Content Areas */}
          {activeTab === "orders" && (
            <div className="warehouseManagement-orders">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <FaBox />
                  <p>No orders pending shipping.</p>
                </div>
              ) : (
                <div className="orders-grid">
                  {orders.map((order) => renderOrderCard(order))}
                </div>
              )}
            </div>
          )}

          {activeTab === "delivery" && (
            <DeliveryTab
              deliveredOrders={deliveredOrders}
              warehouseId={warehouseId}
              user={user}
              employees={employees}
              onRefresh={fetchOrders}
            />
          )}

          {activeTab === "completed" && (
            <CompletedOrdersTab
              completedOrders={completedOrders}
              warehouseId={warehouseId}
              employees={employees}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={notifications}
              onAcceptRequest={handleAcceptRequest}
              onRefresh={fetchOrders}
              warehouseId={warehouseId}
              user={user}
            />
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {renderOrderModal()}
    </div>
  );
};

export default WarehouseManagement;