import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import API_BASE_URL from "../config";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/Header.css";

// Import icons
import {
  FaSearch,
  FaUser,
  FaShoppingCart,
  FaBox,
  FaSignOutAlt,
  FaCog,
  FaHome,
  FaChevronRight,
  FaHeart
} from "react-icons/fa";

const Header = ({ setSearch, setSelectedCategory, setSelectedSubCategory, setSelectedSubSubCategory }) => {
  const location = useLocation();
  const { user, logout, loading } = useContext(AuthContext);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const [companyLogo, setCompanyLogo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [categories, setCategories] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchLower = searchQuery.toLowerCase();

    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedSubSubCategory("");

    setSearch(searchQuery);
    sessionStorage.setItem("searchQuery", searchQuery);

    if (window.location.pathname !== "/") {
      navigate("/");
    } else {
      const event = new CustomEvent('scrollToProducts');
      window.dispatchEvent(event);
    }
  };

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

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories`);
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const scrollToProducts = () => {
    const event = new CustomEvent('scrollToProducts');
    window.dispatchEvent(event);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory("");
    setSelectedSubSubCategory("");
    setSearch("");
    setSearchQuery("");
    scrollToProducts();
  };

  const handleSubCategorySelect = (subCategoryName) => {
    setSelectedSubCategory(subCategoryName);
    setSelectedSubSubCategory("");
    setSearch("");
    setSearchQuery("");
    scrollToProducts();
  };

  const handleSubSubCategorySelect = (subSubCategoryName) => {
    setSelectedSubSubCategory(subSubCategoryName);
    setSearch("");
    setSearchQuery("");
    scrollToProducts();
  };

  useEffect(() => {
    setIsMounted(true);
    fetchCompanyLogo();
    fetchCategories();

    const savedSearch = sessionStorage.getItem("searchQuery");
    if (savedSearch) {
      setSearchQuery(savedSearch);
      setSearch(savedSearch);
    }

    return () => {
      setIsMounted(false);
    };
  }, [setSearch]);

  useEffect(() => {
    if (isMounted) {
      sessionStorage.setItem("searchQuery", searchQuery);
      setSearch(searchQuery);
    }
  }, [searchQuery, isMounted, setSearch]);

  // Utility function to capitalize each word
  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .toLowerCase() // convert all to lowercase first
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };


  if (loading) return <div className="ecHeader-loading">Loading...</div>;

  return (
    <>
      <header className="ecHeader-wrapper">
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
                <h1 style={{ fontSize: "18px" }}>Logo</h1>
              )}
            </Link>
          </div>

          {/* Search Bar */}
          <div className="ecHeader-searchContainer">
            <form onSubmit={handleSearch} className="ecHeader-searchForm">
              <div className="ecHeader-searchInputWrapper">
                <input
                  type="text"
                  placeholder="Try Shirt, Mobile, Category Name or Search by Product Code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ecHeader-searchInput"
                />
                <button type="submit" className="ecHeader-searchButton">
                  <FaSearch className="ecHeader-searchIcon" />
                </button>
              </div>
            </form>
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
                  <FaUser className="ecHeader-navIcon" style={{color:" #333"}}/>&nbsp;
                  <span className="ecHeader-navLabel">
                    {capitalizeWords(user.username || user.name || (user.email ? user.email.split("@")[0] : "User"))}
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

                {/* Logout Button */}
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
              /* Login Button for unauthorized users */
              <Link to="/login" className="ecHeader-navItem ecHeader-loginBtn">
                <FaUser className="ecHeader-navIcon" />
                <span className="ecHeader-navLabel">Login</span>
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* Category Navigation Bar */}
      <div className="categoryNavBar" style={{ position: "sticky", top: "92px", left: "0%", right: "0%", border: "none" }}>
        <div className="categoryNavContainer">
          {categories.map((category) => (
            <div
              key={category._id}
              className="categoryNavItem"
              onMouseEnter={() => setHoveredCategory(category._id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <span
                className="categoryNavLink"
                onClick={() => handleCategorySelect(category.name)}
              >
                {category.name}
              </span>

              {/* Subcategory Dropdown */}
              {hoveredCategory === category._id && category.subCategories && category.subCategories.length > 0 && (
                <div className="subcategoryDropdown">
                  <div className="subcategoryColumns">
                    {category.subCategories.map((subCategory) => (
                      <div
                        key={subCategory._id}
                        className="subcategoryColumn"
                        onMouseEnter={() => setHoveredSubCategory(subCategory._id)}
                        onMouseLeave={() => setHoveredSubCategory(null)}
                      >
                        <h4
                          className="subcategoryTitle"
                          onClick={() => handleSubCategorySelect(subCategory.name)}
                        >
                          {subCategory.name}
                        </h4>
                        <div className="subsubcategoryList">
                          {subCategory.subSubCategories && subCategory.subSubCategories.map((subSubCategory, index) => (
                            <a
                              key={index}
                              href="#"
                              className="subsubcategoryLink"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSubSubCategorySelect(subSubCategory);
                              }}
                            >
                              {subSubCategory}
                            </a>
                          ))}
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
    </>
  );
};

export default Header;