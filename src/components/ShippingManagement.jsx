import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CurrencyContext } from "../context/CurrencyContext";
import axios from "axios";
import API_BASE_URL from "../config";
import {
  FaSearch, FaFilter, FaCheckCircle, FaTruck, FaBoxOpen,
  FaCheck, FaTimes, FaChevronDown, FaChevronUp, FaInfoCircle,
  FaShippingFast, FaClock, FaBox, FaImage, FaBars, FaTimesCircle,
  FaClipboardList, FaShoppingCart, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaUser, FaSignOutAlt, FaFileExport, FaProductHunt, FaBoxes,
  FaExchangeAlt
} from "react-icons/fa";
import "../styles/ShippingManagement.css";

const getImageUrl = (img) => {
  if (!img) return "/placeholder.png";

  if (typeof img === "string") {
    if (img.startsWith("http") || img.startsWith("https")) return img;
    if (img.startsWith("data:")) return img;
    return `${API_BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
  }

  return "/placeholder.png";
};

const ShippingManagement = () => {
  const { logout } = useContext(AuthContext);
  const { currency: currentCurrency, changeCurrency } = useContext(CurrencyContext);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("incomplete");
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("incomplete");
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const navigate = useNavigate();

  // FIXED: Correct currency conversion rates (GBP as base)
  const currencyRates = {
    GBP: 1,
    INR: 101.5,    // 1 GBP = 101.5 INR
    USD: 1.3,      // 1 GBP = 1.3 USD
    EUR: 1.15,     // 1 GBP = 1.15 EUR
    AUD: 1.78,     // 1 GBP = 1.78 AUD
    CAD: 1.69,     // 1 GBP = 1.69 CAD
    JPY: 178.5,    // 1 GBP = 178.5 JPY
  };

  // Currency symbols
  const currencySymbols = {
    GBP: "£",
    INR: "₹",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
  };

  // FIXED: Correct price conversion function
  const convertPrice = (price) => {
    if (!price || isNaN(price)) return "0.00";
    
    // Convert from stored GBP to selected currency
    const rate = currencyRates[currentCurrency] || 1;
    const converted = Number(price) * rate;
    return converted.toFixed(2);
  };

  // ✅ Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/orders/shipping/all`
        );
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching shipping orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ✅ Fetch products based on search term
  const fetchProducts = async (searchTerm = "") => {
    setProductsLoading(true);
    try {
      const url = searchTerm
        ? `${API_BASE_URL}/api/products/search?q=${searchTerm}`
        : `${API_BASE_URL}/api/products`;

      const response = await axios.get(url);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  // ✅ Filter products based on search term
  useEffect(() => {
    if (productSearchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product._id.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(productSearchTerm.toLowerCase())) ||
        (product.subCategory && product.subCategory.toLowerCase().includes(productSearchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [productSearchTerm, products]);

  // ✅ Mark order as shipped
  const handleMarkShipped = async (orderId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/orders/shipping/complete/${orderId}`
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? {
              ...order,
              shippingCompleted: true,
              orderStatus: { ...order.orderStatus, shipping: true },
            }
            : order
        )
      );
    } catch (error) {
      console.error("Error updating order shipping status:", error);
    }
  };

  // ✅ Export incomplete orders data to CSV
  const exportIncompleteOrdersData = () => {
    const incompleteOrders = orders.filter(order => !order.shippingCompleted);

    if (incompleteOrders.length === 0) return;

    const headers = ["Order ID", "Customer Name", "Email", "Phone", "Total Amount", "Payment Status", "Products", "Product IDs"];
    const csvData = incompleteOrders.map(order => [
      order._id,
      order.userDetails?.name || "Unknown",
      order.userDetails?.email || "N/A",
      order.userDetails?.mobile || order.userDetails?.phone || "N/A",
      `${order.currency} ${order.totalAmount}`,
      order.paymentStatus,
      order.products?.map(p => p.name).join("; ") || "N/A",
      order.products?.map(p => p._id).join("; ") || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(item => `"${item}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incomplete_orders.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
  const shippedOrders = orders.filter(order => order.shippingCompleted).length;
  const pendingOrders = orders.filter(order => !order.shippingCompleted).length;

  const activeOrders = orders.filter(order => !order.shippingCompleted);
  const completedOrders = orders.filter(order => order.shippingCompleted);

  const filterOrders = (ordersList) => {
    return ordersList.filter(order => {
      if (filterStatus === "completed" && !order.shippingCompleted) return false;
      if (filterStatus === "incomplete" && order.shippingCompleted) return false;
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
    const src = getImageUrl(product.image);
    return (
      <img
        src={src}
        alt={product.name || "Product Image"}
        className="smc-product-image"
      />
    );
  };

  if (loading) {
    return <div className="smc-loading-spinner">Loading shipping orders...</div>;
  }

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
        <h2>Shipping Management</h2>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && <div className="smc-overlay active" onClick={closeSidebar}></div>}

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
            <h3>Shipping Dashboard</h3>
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
                <span className="smc-stat-number">{shippedOrders}</span>
                <span className="smc-stat-label">Completed</span>
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
              className={`smc-nav-item ${activeSection === 'incomplete' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('incomplete');
                setFilterStatus('incomplete');
                setSidebarOpen(false);
              }}
            >
              <FaTruck /><span>Incomplete Orders</span>
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
              <FaCheckCircle /><span>Completed Orders</span>
              <span className="smc-nav-badge">{shippedOrders}</span>
            </button>

            {/* Products Section Button */}
            <button
              className={`smc-nav-item ${activeSection === 'products' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('products');
                setSidebarOpen(false);
                fetchProducts();
              }}
            >
              <FaBoxes /><span>Products</span>
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
              {activeSection === 'completed' ? 'Completed Orders' :
                activeSection === 'products' ? 'Products Management' :
                  'Incomplete Orders'}
            </h2>

            {activeSection !== 'products' ? (
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
                    <option value="incomplete">Incomplete</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                {activeSection === 'incomplete' && (
                  <button
                    className="smc-export-btn"
                    onClick={exportIncompleteOrdersData}
                    disabled={pendingOrders === 0}
                  >
                    <FaFileExport /> Export Data
                  </button>
                )}
              </div>
            ) : (
              <div className="smc-controls-container">
                <div className="smc-search-box">
                  <FaSearch className="smc-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Product ID, Name, Category..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                </div>

                {/* Currency Converter Toggle */}
                <button
                  className="smc-currency-toggle"
                  onClick={() => setShowCurrencyConverter(!showCurrencyConverter)}
                >
                  <FaExchangeAlt /> Currency
                </button>
              </div>
            )}
          </div>

          {/* Currency Converter */}
          {activeSection === 'products' && showCurrencyConverter && (
            <div className="smc-currency-converter">
              <div className="smc-currency-header">
                <h4>Select Currency</h4>
                <button
                  className="smc-currency-close"
                  onClick={() => setShowCurrencyConverter(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="smc-currency-options">
                {Object.entries(currencySymbols).map(([code, symbol]) => (
                  <button
                    key={code}
                    className={`smc-currency-option ${currentCurrency === code ? 'active' : ''}`}
                    onClick={() => changeCurrency(code)}
                  >
                    {code} ({symbol})
                  </button>
                ))}
              </div>
              <div className="smc-current-currency">
                Current: {currentCurrency} ({currencySymbols[currentCurrency]})
              </div>
            </div>
          )}

          {/* Content based on active section */}
          {activeSection !== 'products' ? (
            <div className="smc-orders-section">
              {filterStatus !== 'completed' && filteredActiveOrders.length === 0 ? (
                <div className="smc-no-orders">
                  <FaBoxOpen className="smc-no-orders-icon" />
                  <p>No active orders found.</p>
                </div>
              ) : filterStatus !== 'incomplete' && filteredCompletedOrders.length === 0 ? (
                <div className="smc-no-orders">
                  <FaCheckCircle className="smc-no-orders-icon" />
                  <p>No completed orders yet.</p>
                </div>
              ) : (
                <div className="smc-orders-grid">
                  {(filterStatus !== 'completed' ? filteredActiveOrders : [])
                    .concat(filterStatus !== 'incomplete' ? filteredCompletedOrders : [])
                    .map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        expandedOrders={expandedOrders}
                        expandedProducts={expandedProducts}
                        toggleOrderDetails={toggleOrderDetails}
                        toggleProductDetails={toggleProductDetails}
                        handleMarkShipped={handleMarkShipped}
                        renderSize={renderSize}
                        renderProductImage={renderProductImage}
                        isCompleted={order.shippingCompleted}
                        convertPrice={convertPrice}
                        currencySymbol={currencySymbols[currentCurrency]}
                      />
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="smc-products-section">
              {productsLoading ? (
                <div className="smc-loading-spinner">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="smc-no-products">
                  <FaBoxOpen className="smc-no-products-icon" />
                  <p>No products found. {productSearchTerm && `Try a different search term.`}</p>
                  {productSearchTerm && (
                    <button
                      className="smc-btn smc-btn-primary"
                      onClick={() => fetchProducts('')}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="smc-products-info">
                    <p>Showing {filteredProducts.length} of {products.length} products</p>
                    {productSearchTerm && (
                      <button
                        className="smc-btn smc-btn-secondary"
                        onClick={() => {
                          setProductSearchTerm('');
                          fetchProducts('');
                        }}
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                  <div className="smc-products-grid">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        convertPrice={convertPrice}
                        currencySymbol={currencySymbols[currentCurrency]}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ OrderCard
const OrderCard = ({
  order,
  expandedOrders,
  expandedProducts,
  toggleOrderDetails,
  toggleProductDetails,
  handleMarkShipped,
  renderSize,
  renderProductImage,
  isCompleted,
  convertPrice,
  currencySymbol
}) => {
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
            <div className={`smc-status-badge ${order.shippingCompleted ? "completed" : "pending"}`}>
              {order.shippingCompleted ? <FaCheckCircle /> : <FaTruck />}
              {order.shippingCompleted ? "Delivered" : "Processing"}
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
          {/* FIXED: Display original currency and amount, plus converted amount */}
          <div className="smc-total-amount">
            <FaShoppingCart className="smc-amount-icon" />
            {order.currency} {order.totalAmount} 
          </div>
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
                        <div className="smc-product-id">ID: {p._id}</div>
                        {/* FIXED: Display original currency and converted price */}
                        <div className="smc-product-price">
                          {order.currency} {p.discountedPrice || p.originalPrice} × {p.qty}
                          {order.currency !== 'GBP' && (
                            <span className="smc-converted-price">
                              ({currencySymbol} {convertPrice(p.discountedPrice || p.originalPrice)} × {p.qty})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="smc-product-toggle">{expanded ? <FaChevronUp /> : <FaChevronDown />}</div>
                    </div>
                    {expanded && (
                      <div className="smc-product-details-expanded">
                        <div className="smc-product-detail-grid">
                          <div className="smc-detail-item"><span className="smc-detail-label">Category:</span><span className="smc-detail-value">{p.category || "N/A"}</span></div>
                          <div className="smc-detail-item"><span className="smc-detail-label">Subcategory:</span><span className="smc-detail-value">{p.subCategory || "N/A"}</span></div>
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

          {!isCompleted && (
            <div className="smc-action-buttons">
              <button onClick={() => handleMarkShipped(order._id)} className="smc-btn smc-btn-complete">
                <FaTruck className="smc-btn-icon" />Mark as Shipped
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ✅ ProductCard for the Products section
const ProductCard = ({ product, convertPrice, currencySymbol }) => {
  return (
    <div className="smc-product-card">
      <div className="smc-product-card-image">
        <img src={getImageUrl(product.image)} alt={product.name} />
        {product.discount > 0 && (
          <div className="smc-product-discount">{product.discount}% OFF</div>
        )}
      </div>

      <div className="smc-product-card-details">
        <h3 className="smc-product-name">{product.name}</h3>
        <div className="smc-product-id">ID: {product._id}</div>

        <div className="smc-product-category">
          Category : {product.category}<br />
          SubCategory : {product.subCategory && `${product.subCategory}`}<br />
          SubSubCategory : {product.subSubCategory && `${product.subSubCategory}`}<br />
        </div>

        <div className="smc-product-price-section">
          {product.discount > 0 ? (
            <>
              <span className="smc-product-price">{currencySymbol}{convertPrice(product.price - (product.price * product.discount / 100))}</span>
              <span className="smc-product-original-price">{currencySymbol}{convertPrice(product.price)}</span>
            </>
          ) : (
            <span className="smc-product-price">{currencySymbol}{convertPrice(product.price)}</span>
          )}
        </div>

        <div className="smc-product-stock">
          Stock: <span className={product.stock > 0 ? "smc-in-stock" : "smc-out-of-stock"}>
            {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShippingManagement;