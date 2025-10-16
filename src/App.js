import { AuthProvider } from "./context/AuthContext"; 
import { CartProvider } from "./context/CartContext";
import CurrencyProvider from "./context/CurrencyContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import FaviconUpdater from "./components/FaviconUpdater";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Navbar from './components/Navbar';
import UserVerification from "./pages/UserVerification";
import HeroBannerSection from "./pages/HeroBannerSection"; 
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import Checkout from "./pages/Checkout";
import CartPage from "./pages/CartPage";
import Profile from "./pages/Profile";
import ProtectedRoute from "./routes/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyOTP from "./pages/VerifyOTP";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import ShippingManagement from "./components/ShippingManagement";
import DeliveryManagement from "./components/DeliveryManagement";
import WarehouseManagement from "./components/WarehouseManagement";
import NotificationsTab from "./components/NotificationsTab";
import SupportManagement from "./components/SupportManagement";
import Chatbot from './components/Chatbot';
import WishlistPage from "./components/WishlistPage";
import keywordMappings from "./utils/keywordMappings";
import AISearch from "./components/AISearch";
import Contact from "./components/Contact";
import Departments from "./pages/Departments"; 
import PasswordConfirmation from "./components/PasswordConfirmation"; 
import DeliveryManager from "./components/DeliveryManager";
import DeliveryEmployeeDashboard from "./components/DeliveryEmployeeDashboard";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CurrencyProvider>
          <Router>
            <FaviconUpdater />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/adminlogin" element={<AdminLogin />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/passwordconfirmation" element={<PasswordConfirmation />} />
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/reset-password" element={<ResetPassword  />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/userverification" element={<UserVerification />} />
              {/* Protected Routes */}
              {[
                { path: "/deliveryemployee", element: <DeliveryEmployeeDashboard /> },
                { path: "/deliverymanager", element: <DeliveryManager /> },
                { path: "/cart", element: <CartPage /> },
                { path: "/checkout", element: <Checkout /> },
                { path: "/orderconfirmation", element: <OrderConfirmation /> },
                { path: "/profile", element: <Profile /> },
                { path: "/myorders", element: <MyOrders /> },
                { path: "/admin", element: <AdminDashboard /> },
                { path: "/shippingmanagement", element: <ShippingManagement /> },
                { path: "/deliverymanagement", element: <DeliveryManagement /> },
                { path: "/warehousemanagement", element: <WarehouseManagement /> },
                { path: "/supportmanagement", element: <SupportManagement /> },
                { path: "/wishlist", element: <WishlistPage /> },
                { path: "/departments", element: <Departments /> },
                { path: "/notifications", element: <NotificationsTab /> }
              ].map(({ path, element }) => (
                <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
              ))}
            </Routes>
          </Router>
        </CurrencyProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
