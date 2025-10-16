import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import API_BASE_URL from "../config";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/Header.css";

// Import icons
import {
  FaUser,
  FaShoppingCart,
  FaBox,
  FaSignOutAlt,
  FaCog,
  FaHome,
  FaHeart
} from "react-icons/fa";

const Navbar = ({ setSelectedCategory, setSelectedSubCategory, setSelectedSubSubCategory }) => {
  const location = useLocation();
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [companyLogo, setCompanyLogo] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch company details (logo)
  const fetchCompanyLogo = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/company`);
      if (res.data.data && res.data.data.logoUrl) {
        setCompanyLogo(res.data.data.logoUrl);
      }
    } catch (err) {
      console.error("Error fetching company logo:", err);
    }
  };

  useEffect(() => {
    fetchCompanyLogo();
  }, []);

  if (loading) return <div className="ecHeader-loading">Loading...</div>;

  return (
    <>
      <header className="ecHeader-wrapper" style={{
        border: "none",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        WebkitBoxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        MozBoxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
      }}>
        <div className="ecHeader-content">
          {/* Logo Section */}
          <div className="ecHeader-logoContainer">
            <Link to="/" className="ecHeader-logoLink">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Company Logo"
                  className="ecHeader-logoImg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
              ) : (
                <h1 className="ecHeader-logoText">My E-commerce Portal</h1>
              )}
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="ecHeader-navContainer">
            {location.pathname !== "/" && (
              <Link to="/" className="ecHeader-navItem">
                <FaHome className="ecHeader-navIcon" />
                <span className="ecHeader-navLabel">Home</span>
              </Link>
            )}

            {user ? (
              <>
                <Link to="/wishlist" className="ecHeader-navItem">
                  <FaHeart className="ecHeader-navIcon" />
                  <span className="ecHeader-navLabel">Wishlist</span>
                </Link>

                <Link to="/cart" className="ecHeader-navItem">
                  <FaShoppingCart className="ecHeader-navIcon" />
                  <span className="ecHeader-navLabel">Cart</span>
                </Link>

                <Link to="/myorders" className="ecHeader-navItem">
                  <FaBox className="ecHeader-navIcon" />
                  <span className="ecHeader-navLabel">My Orders</span>
                </Link>

                <div
                  className="ecHeader-navItem ecHeader-userProfile"
                  onClick={() => navigate("/profile")}
                  title={user?.username}
                >
                  <FaUser className="ecHeader-navIcon" id="profile" />
                  <span className="ecHeader-navLabel">
                    {(() => {
                      const name =
                        user.username ||
                        user.name ||
                        (user.email ? user.email.split("@")[0] : "User");
                      return name
                        .toLowerCase()
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ");
                    })()}
                  </span>
                </div>

                {user.isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="ecHeader-navItem ecHeader-adminBtn"
                  >
                    <FaCog className="ecHeader-navIcon" />
                    <span className="ecHeader-navLabel">Admin Portal</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="ecHeader-navItem ecHeader-logoutBtn"
                  style={{ background: "none" }}
                >
                  <FaSignOutAlt className="ecHeader-navIcon" />
                  <span className="ecHeader-navLabel">Logout</span>
                </button>
              </>
            ) : (
              location.pathname !== "/login" && (
                <Link to="/login" className="ecHeader-navItem ecHeader-loginBtn">
                  <FaUser className="ecHeader-navIcon" />
                  <span className="ecHeader-navLabel">Login</span>
                </Link>
              )
            )}
          </div>

        </div>
      </header>
    </>
  );
};

export default Navbar;