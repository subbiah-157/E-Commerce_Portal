import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import API_BASE_URL from "../config";
import {
    FaUser,
    FaTasks,
    FaCheckCircle,
    FaSignOutAlt,
    FaChevronLeft,
    FaChevronRight,
    FaBox,
    FaClock,
    FaCheck,
    FaChevronDown,
    FaChevronUp,
    FaMapMarkerAlt,
    FaPhone,
    FaHome,
    FaCity,
    FaMapPin,
    FaEnvelope,
    FaIdCard,
    FaCalendarAlt,
    FaBriefcase,
    FaDollarSign,
    FaTruck,
    FaShoppingCart,
    FaInfoCircle
} from "react-icons/fa";
import "../styles/DeliveryEmployeeDashboard.css";

const DeliveryEmployeeDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("assigned");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [employeeData, setEmployeeData] = useState({
        // Personal Information
        name: "",
        email: "",
        employeeId: "",
        dateOfJoining: "",
        department: "",
        designation: "",
        
        // Contact Information
        regionCode: "+91",
        mobile: "",
        
        // Address Details
        houseNumber: "",
        region: "",
        district: "",
        state: "",
        pincode: "",
        
        // Employment Details
        salary: "",
        employmentType: "",
        shiftTimings: "",
        vehicleNumber: "",
        supervisor: "",
        
        // Performance Metrics
        totalDeliveries: 0,
        completedDeliveries: 0,
        pendingDeliveries: 0,
        averageRating: 0,
        lastActive: ""
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Fetch assigned orders
    useEffect(() => {
        if (!user?.id) return;

        const fetchAssignedOrders = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/orders/assigned/${user.id}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setOrders(res.data);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch orders");
            } finally {
                setLoading(false);
            }
        };

        fetchAssignedOrders();
    }, [user]);

    // Fetch employee profile data
    useEffect(() => {
        if (user?.id) {
            const fetchEmployeeProfile = async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/deliveryEmployees/profile/${user.id}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    
                    if (res.data) {
                        setEmployeeData(prev => ({
                            ...prev,
                            ...res.data,
                            // Ensure address fields are properly set
                            ...(res.data.address || {}),
                            supervisor: res.data.supervisor || "",
                            employeeId: res.data.deliveryEmployee?.employeeId || res.data.employeeId || "",
                            // Set performance metrics
                            totalDeliveries: orders.length,
                            completedDeliveries: orders.filter(order => order.deliveryCompleted).length,
                            pendingDeliveries: orders.filter(order => !order.deliveryCompleted).length,
                            // Set basic user info
                            name: res.data.name || user.name,
                            email: res.data.email || user.email
                        }));
                    }
                } catch (err) {
                    console.error("Failed to fetch employee profile:", err);
                    // Fallback to basic user data
                    setEmployeeData(prev => ({
                        ...prev,
                        name: user.name,
                        email: user.email,
                        totalDeliveries: orders.length,
                        completedDeliveries: orders.filter(order => order.deliveryCompleted).length,
                        pendingDeliveries: orders.filter(order => !order.deliveryCompleted).length
                    }));
                }
            };
            fetchEmployeeProfile();
        }
    }, [user, orders]);

    // Mark order as delivered and send email
    // Mark order as delivered and send email
const handleMarkDelivered = async (orderId) => {
    try {
        const res = await axios.put(
            `${API_BASE_URL}/api/orders/admin/mark-delivered/${orderId}`
        );
        const updatedOrder = res.data.order;

        setOrders((prevOrders) =>
            prevOrders.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );

        // Construct the delivery address from user details
        const userDetails = updatedOrder.userDetails || {};
        const deliveryAddress = userDetails.houseNumber || userDetails.region || userDetails.district || userDetails.state || userDetails.pincode 
            ? `${userDetails.houseNumber || ""}, ${userDetails.region || ""}, ${userDetails.district || ""}, ${userDetails.state || ""} - ${userDetails.pincode || ""}`.replace(/, ,/g, ', ').replace(/, $/, '')
            : "N/A";

        const emailPayload = {
            to: updatedOrder.userDetails?.email,
            userName: updatedOrder.userDetails?.name,
            orderId: updatedOrder._id,
            products: updatedOrder.products.map(p => ({
                name: p.name,
                quantity: p.qty,
                price: p.discountedPrice,
                total: p.qty * p.discountedPrice
            })),
            totalAmount: updatedOrder.totalAmount,
            currency: updatedOrder.currency,
            deliveryDate: new Date().toLocaleDateString(),
            invoiceUrl: updatedOrder.invoiceUrl || "",
            address: deliveryAddress // Use the constructed address here
        };

        await axios.post(
            `${API_BASE_URL}/api/email/order-completed`,
            emailPayload
        );

        alert("Order marked as delivered and email sent successfully!");
    } catch (err) {
        console.error("Failed to mark order delivered or send email:", err);
        alert("Failed to update order or send email");
    }
};

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            logout();
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_BASE_URL}/api/deliveryEmployees/profile/${user.id}`, 
                {
                    ...employeeData,
                    address: {
                        regionCode: employeeData.regionCode,
                        mobile: employeeData.mobile,
                        houseNumber: employeeData.houseNumber,
                        region: employeeData.region,
                        district: employeeData.district,
                        state: employeeData.state,
                        pincode: employeeData.pincode
                    }
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            alert("Profile updated successfully!");
            setIsEditingProfile(false);
        } catch (err) {
            console.error("Failed to update profile:", err);
            alert("Failed to update profile");
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setEmployeeData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Filter orders based on active tab
    const pendingOrders = orders.filter(order => !order.deliveryCompleted);
    const completedOrders = orders.filter(order => order.deliveryCompleted);

    // Function to render product size correctly
    const renderSize = (product) => {
        const category = product.category?.toLowerCase() || "";
        if (category.includes("home")) {
            const inchesValue = product.sizeInches || product.inches || product.dimensions;
            return inchesValue ? `${inchesValue} inches` : "N/A";
        }
        return product.selectedSize || product.size || "N/A";
    };

    if (loading) return (
        <div className="delivery-dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading orders...</p>
        </div>
    );

    if (error) return <div className="delivery-dashboard-error">{error}</div>;

    return (
        <div className="delivery-dashboard-container">
            {/* Sidebar */}
            <div className={`delivery-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                <div className="sidebar-header">
                    <h2>Delivery Portal</h2>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <span className="toggle-icon">
                            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
                        </span>
                    </button>
                </div>

                <div className="sidebar-content">
                    <div className="user-welcome">
                        <div className="user-avatar">
                            <FaUser className="avatar-icon" />
                        </div>
                        <div className="user-info">
                            <p className="welcome-text">Welcome back,</p>
                            <p className="username">{employeeData.name || user?.name || 'Employee'}</p>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <button
                            className={`nav-item ${activeTab === 'assigned' ? 'nav-item-active' : ''}`}
                            onClick={() => setActiveTab('assigned')}
                        >
                            <FaTasks className="nav-icon" />
                            {sidebarOpen && <span>Assigned Tasks</span>}
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'completed' ? 'nav-item-active' : ''}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            <FaCheckCircle className="nav-icon" />
                            {sidebarOpen && <span>Completed Orders</span>}
                        </button>

                        <button
                            className={`nav-item ${activeTab === 'profile' ? 'nav-item-active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <FaUser className="nav-icon" />
                            {sidebarOpen && <span>My Profile</span>}
                        </button>
                    </nav>
                </div>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt className="logout-icon" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="delivery-main-content">
                {/* Stats Cards */}
                <div className="delivery-stats-cards">
                    <div className="stats-card pending-orders-card">
                        <div className="stats-icon">
                            <FaClock className="card-icon" />
                        </div>
                        <div className="stats-content">
                            <h3>{pendingOrders.length}</h3>
                            <p>Pending Deliveries</p>
                        </div>
                    </div>

                    <div className="stats-card completed-orders-card">
                        <div className="stats-icon">
                            <FaCheck className="card-icon" />
                        </div>
                        <div className="stats-content">
                            <h3>{completedOrders.length}</h3>
                            <p>Completed Deliveries</p>
                        </div>
                    </div>

                    <div className="stats-card total-orders-card">
                        <div className="stats-icon">
                            <FaBox className="card-icon" />
                        </div>
                        <div className="stats-content">
                            <h3>{orders.length}</h3>
                            <p>Total Assigned</p>
                        </div>
                    </div>
                </div>

                {/* Content based on active tab */}
                <div className="delivery-content-area">
                    {activeTab === 'assigned' && (
                        <div className="tab-content">
                            <h2 className="tab-title">My Assigned Tasks</h2>
                            {pendingOrders.length === 0 ? (
                                <div className="no-orders-message">
                                    <FaBox className="no-orders-icon" />
                                    <p>No pending orders assigned yet.</p>
                                </div>
                            ) : (
                                <div className="orders-grid">
                                    {pendingOrders.map((order) => (
                                        <OrderCard
                                            key={order._id}
                                            order={order}
                                            onMarkDelivered={handleMarkDelivered}
                                            renderSize={renderSize}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'completed' && (
                        <div className="tab-content">
                            <h2 className="tab-title">Completed Orders</h2>
                            {completedOrders.length === 0 ? (
                                <div className="no-orders-message">
                                    <FaCheckCircle className="no-orders-icon" />
                                    <p>No completed orders yet.</p>
                                </div>
                            ) : (
                                <div className="orders-grid">
                                    {completedOrders.map((order) => (
                                        <OrderCard
                                            key={order._id}
                                            order={order}
                                            onMarkDelivered={handleMarkDelivered}
                                            renderSize={renderSize}
                                            isCompleted={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="tab-content">
                            <h2 className="tab-title">My Profile</h2>
                            <div className="profile-card">
                                <div className="profile-header">
                                    <div className="profile-avatar">
                                        <FaUser className="avatar-large" />
                                    </div>
                                    <div className="profile-info">
                                        <h3>{employeeData.name || 'Delivery Employee'}</h3>
                                        <p className="profile-email">
                                            <FaEnvelope className="info-icon" />
                                            {employeeData.email || user?.email || 'N/A'}
                                        </p>
                                        <p className="profile-role">
                                            <FaBriefcase className="info-icon" />
                                            {employeeData.designation || 'Delivery Personnel'}
                                        </p>
                                        <p className="profile-id">
                                            <FaIdCard className="info-icon" />
                                            ID: {employeeData.employeeId || 'N/A'}
                                        </p>
                                    </div>
                                    <button
                                        className="edit-profile-btn"
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    >
                                        {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                                    </button>
                                </div>

                                {!isEditingProfile ? (
                                    <div className="profile-details-view">

                                        {/* Personal Information */}
                                        <div className="info-section">
                                            <h4 className="section-title">
                                                <FaUser className="section-icon" />
                                                Personal Information
                                            </h4>
                                            <div className="info-grid">
                                                <div className="info-item">
                                                    <span className="info-label">Employee ID:</span>
                                                    <span className="info-value">
  {employeeData.employeeId || 'N/A'}
</span>

                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Date of Joining:</span>
                                                    <span className="info-value">
                                                        {employeeData.dateOfJoining ? 
                                                            new Date(employeeData.dateOfJoining).toLocaleDateString() : 'N/A'
                                                        }
                                                    </span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Department:</span>
                                                    <span className="info-value">{employeeData.department || 'Delivery'}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Designation:</span>
                                                    <span className="info-value">{employeeData.designation || 'Delivery Executive'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="info-section">
                                            <h4 className="section-title">
                                                <FaPhone className="section-icon" />
                                                Contact Information
                                            </h4>
                                            <div className="info-grid">
                                                <div className="info-item">
                                                    <span className="info-label">Mobile:</span>
                                                    <span className="info-value">
                                                        {employeeData.regionCode} {employeeData.mobile || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Email:</span>
                                                    <span className="info-value">{employeeData.email || user?.email || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address Details */}
                                        <div className="info-section">
                                            <h4 className="section-title">
                                                <FaHome className="section-icon" />
                                                Address Details
                                            </h4>
                                            <div className="info-grid">
                                                <div className="info-item full-width">
                                                    <span className="info-label">Address:</span>
                                                    <span className="info-value">
                                                        {employeeData.houseNumber ? 
                                                            `${employeeData.houseNumber}, ${employeeData.region || ''}, ${employeeData.district || ''}, ${employeeData.state || ''} - ${employeeData.pincode || ''}`.replace(/, ,/g, ', ').replace(/, $/, '')
                                                            : 'N/A'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Employment Details */}
                                        <div className="info-section">
                                            <h4 className="section-title">
                                                <FaBriefcase className="section-icon" />
                                                Employment Details
                                            </h4>
                                            <div className="info-grid">
                                                <div className="info-item">
                                                    <span className="info-label">Employment Type:</span>
                                                    <span className="info-value">{employeeData.employmentType || 'Full-time'}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Shift Timings:</span>
                                                    <span className="info-value">{employeeData.shiftTimings || '9:00 AM - 6:00 PM'}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Vehicle Number:</span>
                                                    <span className="info-value">{employeeData.vehicleNumber || 'N/A'}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Supervisor:</span>
                                                    <span className="info-value">{employeeData.supervisor || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form className="profile-form" onSubmit={handleProfileUpdate}>
                                        {/* Contact Information */}
                                        <div className="form-section">
                                            <h4 className="form-section-title">
                                                <FaPhone className="section-icon" />
                                                Contact Information
                                            </h4>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Region Code</label>
                                                    <select
                                                        name="regionCode"
                                                        value={employeeData.regionCode}
                                                        onChange={handleProfileChange}
                                                        className="form-input"
                                                    >
                                                        <option value="+91">+91 (India)</option>
                                                        <option value="+1">+1 (USA)</option>
                                                        <option value="+44">+44 (UK)</option>
                                                        <option value="+61">+61 (Australia)</option>
                                                        <option value="+81">+81 (Japan)</option>
                                                        <option value="+49">+49 (Germany)</option>
                                                        <option value="+86">+86 (China)</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>Mobile Number</label>
                                                    <input
                                                        type="text"
                                                        name="mobile"
                                                        value={employeeData.mobile}
                                                        onChange={handleProfileChange}
                                                        className="form-input"
                                                        placeholder="Enter mobile number"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address Details */}
                                        <div className="form-section">
                                            <h4 className="form-section-title">
                                                <FaHome className="section-icon" />
                                                Address Details
                                            </h4>
                                            <div className="form-group">
                                                <label>House/Apartment Number</label>
                                                <input
                                                    type="text"
                                                    name="houseNumber"
                                                    value={employeeData.houseNumber}
                                                    onChange={handleProfileChange}
                                                    className="form-input"
                                                    placeholder="Enter house number"
                                                />
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Region/Area</label>
                                                    <input
                                                        type="text"
                                                        name="region"
                                                        value={employeeData.region}
                                                        onChange={handleProfileChange}
                                                        className="form-input"
                                                        placeholder="Enter region"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>District</label>
                                                    <input
                                                        type="text"
                                                        name="district"
                                                        value={employeeData.district}
                                                        onChange={handleProfileChange}
                                                        className="form-input"
                                                        placeholder="Enter district"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>State</label>
                                                    <input
                                                        type="text"
                                                        name="state"
                                                        value={employeeData.state}
                                                        onChange={handleProfileChange}
                                                        className="form-input"
                                                        placeholder="Enter state"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Pincode</label>
                                                    <input
                                                        type="text"
                                                        name="pincode"
                                                        value={employeeData.pincode}
                                                        onChange={handleProfileChange}
                                                        className="form-input"
                                                        placeholder="Enter pincode"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <button type="submit" className="save-profile-btn">
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Updated Order Card Component with complete product details
const OrderCard = ({ order, onMarkDelivered, renderSize, isCompleted = false }) => {
    const [expanded, setExpanded] = useState(false);
    const [expandedProducts, setExpandedProducts] = useState({});

    const toggleProductDetails = (orderId, index) => {
        const key = `${orderId}-${index}`;
        setExpandedProducts(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const addr = order.userDetails
        ? `${order.userDetails.houseNumber || ""}, ${order.userDetails.region || ""}, ${order.userDetails.district || ""}, ${order.userDetails.state || ""} - ${order.userDetails.pincode || ""}`
        : "N/A";

    const phone =
        order.userDetails?.mobile ||
        order.userDetails?.phone ||
        order.userDetails?.phoneNumber || "N/A";

    return (
        <div className={`delivery-order-card ${isCompleted ? 'order-completed' : ''}`}>
            <div className="order-card-header" onClick={() => setExpanded(!expanded)}>
                <div className="order-basic-info">
                    <h4>Order ID: {order._id}</h4>
                    <p className="order-date">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <div className="order-meta">
                        <span className="payment-method">{order.paymentMethod}</span>
                        <span className={`payment-status ${order.paymentStatus?.toLowerCase()}`}>
                            {order.paymentStatus}
                        </span>
                    </div>
                </div>
                <div className="order-status-section">
                    <span className={`status-badge ${isCompleted ? 'status-completed' : 'status-pending'}`}>
                        {isCompleted ? 'Delivered' : 'Pending Delivery'}
                    </span>
                    <span className="total-amount">
                        <FaShoppingCart className="amount-icon" />
                        {order.currency} {order.totalAmount}
                    </span>
                    <span className="expand-icon">{expanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                </div>
            </div>

            {expanded && (
                <div className="order-card-details">
                    {/* User Details Section */}
                    <div className="user-details-section">
                        <h5 className="section-title">
                            <FaUser className="section-icon" />
                            Customer Details
                        </h5>
                        <div className="customer-info-grid">
                            <div className="customer-detail">
                                <strong>Name:</strong> {order.userDetails?.name || "N/A"}
                            </div>
                            <div className="customer-detail">
                                <strong>Email:</strong> {order.userDetails?.email || "N/A"}
                            </div>
                            <div className="customer-detail">
                                <strong>Phone:</strong> {phone}
                            </div>
                            <div className="customer-detail full-width">
                                <strong>Address:</strong> {addr}
                            </div>
                        </div>
                    </div>

                    {/* Products Section */}
                    <div className="products-section">
                        <h5 className="section-title">
                            <FaBox className="section-icon" />
                            Products ({order.products?.length || 0})
                        </h5>
                        <div className="products-list">
                            {order.products?.map((p, idx) => {
                                const key = `${order._id}-${idx}`;
                                const isExpanded = expandedProducts[key];
                                return (
                                    <div key={idx} className="product-item">
                                        <div 
                                            className="product-summary" 
                                            onClick={() => toggleProductDetails(order._id, idx)}
                                        >
                                            <div className="product-basic">
                                                <span className="product-name">{p.name}</span>
                                                <span className="product-quantity-price">
                                                    {p.qty} × {order.currency} {p.discountedPrice || p.originalPrice}
                                                </span>
                                            </div>
                                            <span className="product-toggle">
                                                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                            </span>
                                        </div>
                                        {isExpanded && (
                                            <div className="product-details-expanded">
                                                <div className="product-detail-grid">
                                                    <div className="product-detail-item">
                                                        <span className="detail-label">Product ID:</span>
                                                        <span className="detail-value">{p._id || "N/A"}</span>
                                                    </div>
                                                    <div className="product-detail-item">
                                                        <span className="detail-label">Category:</span>
                                                        <span className="detail-value">{p.category || "N/A"}</span>
                                                    </div>
                                                    <div className="product-detail-item">
                                                        <span className="detail-label">Subcategory:</span>
                                                        <span className="detail-value">{p.subCategory || "N/A"}</span>
                                                    </div>
                                                    <div className="product-detail-item">
                                                        <span className="detail-label">Sub-Subcategory:</span>
                                                        <span className="detail-value">{p.subSubCategory || "N/A"}</span>
                                                    </div>
                                                    <div className="product-detail-item">
                                                        <span className="detail-label">Size:</span>
                                                        <span className="detail-value">{renderSize(p)}</span>
                                                    </div>
                                                    <div className="product-detail-item">
                                                        <span className="detail-label">Quantity:</span>
                                                        <span className="detail-value">{p.qty}</span>
                                                    </div>
                                                    <div className="product-detail-item">
                                                        <span className="detail-label">Original Price:</span>
                                                        <span className="detail-value">{order.currency} {p.originalPrice}</span>
                                                    </div>
                                                    <div className="product-detail-item">
                                                        <span className="detail-label">Discount %:</span>
                                                        <span className="detail-value">{p.discount || 0}%</span>
                                                    </div>
                                                    <div className="product-detail-item">
                                                        <span className="detail-label">Price After Discount:</span>
                                                        <span className="detail-value">{order.currency} {p.discountedPrice}</span>
                                                    </div>
                                                    <div className="product-detail-item">
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

                    {/* Order Summary */}
                    <div className="order-summary-section">
                        <h5 className="section-title">
                            <FaDollarSign className="section-icon" />
                            Order Summary
                        </h5>
                        <div className="summary-details">
                            <div className="summary-item">
                                <span>Subtotal:</span>
                                <span>{order.currency} {order.totalAmount}</span>
                            </div>
                            <div className="summary-item">
                                <span>Payment Method:</span>
                                <span className="payment-method-display">{order.paymentMethod}</span>
                            </div>
                            <div className="summary-item">
                                <span>Payment Status:</span>
                                <span className={`payment-status-display ${order.paymentStatus?.toLowerCase()}`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mark Delivered or Completed Tag */}
                    {!isCompleted && (
                        <div className="order-actions">
                            <button 
                                onClick={() => onMarkDelivered(order._id)} 
                                className="mark-delivered-btn"
                            >
                                <FaCheck className="btn-icon" />
                                Mark as Delivered
                            </button>
                        </div>
                    )}
                    {isCompleted && (
                        <div className="delivery-completed-tag">
                            <FaCheckCircle className="completed-icon" />
                            Delivered on {new Date(order.updatedAt).toLocaleDateString()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeliveryEmployeeDashboard;