import { useEffect, useState, useContext } from "react"; 
import { AuthContext } from "../context/AuthContext";
import ProductManagement from "./ProductManagement";
import CategoryManagement from "./CategoryManagement";
import ExistingProducts from "./ExistingProducts";
import ShippingDetails from "./ShippingDetails";
import DeliveryDetails from "./DeliveryDetails";
import CompanyDetails from "./CompanyDetails";
import UserCarts from "./UserCarts";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/AdminDashboard.css";

// ✅ React Icons
import {
  FaUsers, FaBoxOpen, FaListAlt, FaTruck,
  FaShippingFast, FaBuilding, FaShoppingCart,
  FaBars, FaTimes
} from "react-icons/fa";
import { FaUserShield, FaUser, FaArrowLeft } from "react-icons/fa";

// ✅ Chart.js imports
import { Pie, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler   // ✅ Import Filler plugin
} from "chart.js";

// ✅ Register all necessary chart plugins including Filler
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler    // ✅ Register Filler
);

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    description: "",
    category: "",
    image: null,
  });
  const [activeSection, setActiveSection] = useState("users");

  const getRole = (u) => {
    if (u.isAdmin) return "Admin";
    if (u.role?.toLowerCase() === "shipping" || u.email === "shipping@gmail.com") return "Shipping";
    if (u.role?.toLowerCase() === "delivery" || u.email === "delivery@gmail.com") return "Delivery";
    return "User";
  };

  // ✅ Fetch data
  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchUsers = async () => {
    if (!user?.isAdmin) return;
    try {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchCarts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/cart/admin/all", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCarts(res.data);
    } catch (err) {
      console.error("Failed to fetch carts:", err);
    }
  };

  const fetchOrders = async () => {
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
    fetchProducts();
    fetchCategories();
    fetchUsers();
    fetchCarts();
    fetchOrders();
  }, [user]);

  // ✅ Chart Data
  const getProductChartData = () => ({
    labels: ["Total Products", "Categories"],
    datasets: [
      {
        label: "# of Products",
        data: [products.length, categories.length],
        backgroundColor: ['#522c72', '#ce2453'],
        borderWidth: 0,
        borderRadius: 6
      }
    ]
  });

  const getRoleChartData = () => ({
    labels: ["Admin", "Shipping", "Delivery", "User"],
    datasets: [
      {
        label: "User Roles",
        data: [
          users.filter(u => getRole(u) === "Admin").length,
          users.filter(u => getRole(u) === "Shipping").length,
          users.filter(u => getRole(u) === "Delivery").length,
          users.filter(u => getRole(u) === "User").length,
        ],
        backgroundColor: ['#522c72', '#962964', '#ce2453', '#e79e57'],
        borderWidth: 0,
        borderRadius: 6
      },
    ],
  });

  const getCartChartData = () => ({
    labels: ["Users with Carts", "Users without Carts"],
    datasets: [
      {
        label: "User Carts",
        data: [
          new Set(carts.map(c => c.user?.email)).size,
          users.length - new Set(carts.map(c => c.user?.email)).size,
        ],
        backgroundColor: ['#522c72', '#e79e57'],
        borderWidth: 0,
        borderRadius: 6
      },
    ],
  });

  const shippingCompleted = orders.filter(o => o.shippingCompleted).length;
  const shippingPending = orders.filter(o => !o.shippingCompleted).length;
  const getShippingChartData = () => ({
    labels: ["Shipped Orders", "Pending Orders"],
    datasets: [
      {
        label: "Shipping Status",
        data: [shippingCompleted, shippingPending],
        backgroundColor: ['#522c72', '#ce2453'],
        borderWidth: 0,
        borderRadius: 6
      },
    ],
  });

  const deliveryCompleted = orders.filter(o => o.deliveryCompleted).length;
  const deliveryPending = orders.filter(o => !o.deliveryCompleted && o.shippingCompleted).length;
  const getDeliveryChartData = () => ({
    labels: ["Delivered Orders", "Pending Deliveries"],
    datasets: [
      {
        label: "Delivery Status",
        data: [deliveryCompleted, deliveryPending],
        backgroundColor: ['#522c72', '#e79e57'],
        borderWidth: 0,
        borderRadius: 6
      },
    ],
  });

  const getRedemptionChartData = () => ({
    labels: ["Completed", "Pending"],
    datasets: [
      {
        label: "Shipping",
        data: [shippingCompleted, shippingPending],
        borderColor: '#522c72',
        backgroundColor: 'rgba(82, 44, 114, 0.2)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#522c72',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      },
      {
        label: "Delivery",
        data: [deliveryCompleted, deliveryPending],
        borderColor: '#e79e57',
        backgroundColor: 'rgba(231, 158, 87, 0.2)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#e79e57',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      },
    ],
  });

  // ✅ Sidebar Menu
  const menuItems = [
    { key: "users", label: "Users", icon: <FaUsers /> },
    { key: "categories", label: "Manage Categories", icon: <FaListAlt /> },
    { key: "products", label: "Manage Products", icon: <FaBoxOpen /> },
    { key: "existing", label: "Existing Products", icon: <FaBoxOpen /> },
    { key: "shipping", label: "Shipping Details", icon: <FaShippingFast /> },
    { key: "delivery", label: "Delivery Details", icon: <FaTruck /> },
    { key: "company", label: "Company Details", icon: <FaBuilding /> },
    { key: "carts", label: "User Carts", icon: <FaShoppingCart /> },
  ];

  return (
    <div className="admin-dashboard">
      {/* Sidebar Toggle */}
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <h3>Admin Menu</h3>
        <ul className="admin-menu">
          {menuItems.map((item) => (
            <li key={item.key}>
              <div
                className={`admin-menu-item ${activeSection === item.key ? "active" : ""}`}
                onClick={() => {
                  setActiveSection(item.key);
                  if (window.innerWidth < 992) setSidebarOpen(false);
                }}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </li>
          ))}
          <li>
            <Link to={"/"} className="back-link">
              <FaArrowLeft style={{ marginRight: "6px" }} />
              Back to Site
            </Link>
          </li>
        </ul>
      </div>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-header">
          <h2>Admin Dashboard</h2>
          {user && (
            <div className="welcome-user">
              <FaUser style={{ marginRight: "6px" }} />
              Welcome, &nbsp;<strong>{user.name}</strong>
            </div>
          )}
        </div>

        {/* ✅ Default Dashboard (Users + Charts) */}
        {activeSection === "users" && (
          <div>
            <h3>All Users</h3><br/>
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            {u.role === "admin" && (
                              <span className="role-badge admin-badge">
                                <FaUserShield style={{ marginRight: "6px" }} />Admin
                              </span>
                            )}
                            {u.role === "shipping" && (
                              <span className="role-badge shipping-badge">
                                <FaTruck style={{ marginRight: "6px" }} />Shipping
                              </span>
                            )}
                            {u.role === "delivery" && (
                              <span className="role-badge delivery-badge">
                                <FaShippingFast style={{ marginRight: "6px" }} />Delivery
                              </span>
                            )}
                            {u.role === "user" && (
                              <span className="role-badge user-badge">
                                <FaUser style={{ marginRight: "6px" }} />User
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ✅ All Dashboard Charts */}
                <div className="charts-container">
                  <div className="chart-card">
                    <h4>User Roles</h4>
                    <div className="chart-container">
                      <Pie data={getRoleChartData()} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                  </div>
                  
                  <div className="chart-card">
                    <h4>Shipping Status</h4>
                    <div className="chart-container">
                      <Doughnut data={getShippingChartData()} options={{ rotation: -90, circumference: 180 }} />
                    </div>
                  </div>
                  
                  <div className="chart-card">
                    <h4>Delivery Status</h4>
                    <div className="chart-container">
                      <Doughnut data={getDeliveryChartData()} options={{ rotation: -90, circumference: 180 }} />
                    </div>
                  </div>
                  
                  <div className="chart-card">
                    <h4>Products vs Categories</h4>
                    <div className="chart-container">
                      <Pie data={getProductChartData()} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                  </div>

                  <div className="chart-card">
                    <h4>Business Progress</h4>
                    <div className="chart-container">
                      <Line data={getRedemptionChartData()} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>

                  <div className="chart-card">
                    <h4>User Carts</h4>
                    <div className="chart-container">
                      <Pie data={getCartChartData()} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ✅ Other Sections */}
        {activeSection === "categories" && <CategoryManagement categories={categories} fetchCategories={fetchCategories} />}
        {activeSection === "products" && <ProductManagement products={products} categories={categories} fetchProducts={fetchProducts} productForm={productForm} setProductForm={setProductForm} editingProductId={editingProductId} setEditingProductId={setEditingProductId} />}
        {activeSection === "existing" && <ExistingProducts products={products} fetchProducts={fetchProducts} setEditingProductId={setEditingProductId} setProductForm={setProductForm} />}
        {activeSection === "shipping" && <ShippingDetails orders={orders} />}
        {activeSection === "delivery" && <DeliveryDetails orders={orders} />}
        {activeSection === "carts" && <UserCarts allCarts={carts} />}
        {activeSection === "company" && <CompanyDetails />}
      </div>
    </div>
  );
};

export default AdminDashboard;
