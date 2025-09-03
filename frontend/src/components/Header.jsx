import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
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
  FaChevronRight
} from "react-icons/fa";

const Header = ({ setSearch, setSelectedCategory, setSelectedSubCategory, setSelectedSubSubCategory }) => {
  const { user, logout, loading } = useContext(AuthContext);
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
    
    // Parse search query to extract potential category information
    const searchLower = searchQuery.toLowerCase();
    
    // Reset category filters first
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedSubSubCategory("");
    
    // Set the search query
    setSearch(searchQuery);
    sessionStorage.setItem("searchQuery", searchQuery);

    // If we're not on the home page, navigate to home page
    if (window.location.pathname !== "/") {
      navigate("/");
    } else {
      // If we're already on home page, trigger scroll to products section
      const event = new CustomEvent('scrollToProducts');
      window.dispatchEvent(event);
    }
  };

  // Fetch company details (logo)
  const fetchCompanyLogo = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/company");
      if (res.data.data && res.data.data.logo) {
        setCompanyLogo(res.data.data.logo);
      }
    } catch (err) {
      console.error("Error fetching company logo:", err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Function to scroll to products section
  const scrollToProducts = () => {
    const event = new CustomEvent('scrollToProducts');
    window.dispatchEvent(event);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory("");
    setSelectedSubSubCategory("");
    setSearch(""); // Clear search when selecting a category
    setSearchQuery(""); // Clear search input
    scrollToProducts();
  };

  const handleSubCategorySelect = (subCategoryName) => {
    setSelectedSubCategory(subCategoryName);
    setSelectedSubSubCategory("");
    setSearch(""); // Clear search when selecting a subcategory
    setSearchQuery(""); // Clear search input
    scrollToProducts();
  };

  const handleSubSubCategorySelect = (subSubCategoryName) => {
    setSelectedSubSubCategory(subSubCategoryName);
    setSearch(""); // Clear search when selecting a sub-subcategory
    setSearchQuery(""); // Clear search input
    scrollToProducts();
  };

  useEffect(() => {
    setIsMounted(true);
    fetchCompanyLogo();
    fetchCategories();

    // Load search query from sessionStorage on component mount
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
    // Update sessionStorage and home page search in real-time
    if (isMounted) {
      sessionStorage.setItem("searchQuery", searchQuery);
      setSearch(searchQuery);
    }
  }, [searchQuery, isMounted, setSearch]);

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
                  src={`http://localhost:5000${companyLogo}`}
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
            <Link to="/" className="ecHeader-navItem">
              <FaHome className="ecHeader-navIcon" />
              <span className="ecHeader-navLabel">Home</span>
            </Link>

            {user ? (
              <>
                <Link to="/cart" className="ecHeader-navItem">
                  <FaShoppingCart className="ecHeader-navIcon" />
                  <span className="ecHeader-navLabel">Cart</span>
                </Link>

                <Link to="/myorders" className="ecHeader-navItem">
                  <FaBox className="ecHeader-navIcon" />
                  <span className="ecHeader-navLabel">My Orders</span>
                </Link>

                {/* User Profile */}
                <div
                  className="ecHeader-navItem ecHeader-userProfile"
                  onClick={() => navigate("/profile")}
                  title={user?.username}
                >
                  <FaUser className="ecHeader-navIcon" id="profile"/>
                  <span className="ecHeader-navLabel">
                    {user.username ||
                      user.name ||
                      (user.email ? user.email.split("@")[0] : "User")}
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
                  className="ecHeader-navItem ecHeader-logoutBtn" style={{background:"none"}}
                >
                  <FaSignOutAlt className="ecHeader-navIcon" />
                  <span className="ecHeader-navLabel">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="ecHeader-navItem ecHeader-loginBtn">
                <FaUser className="ecHeader-navIcon" />
                <span className="ecHeader-navLabel">Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Category Navigation Bar - Moved to Header */}
      <div className="categoryNavBar" style={{position:"fixed", top:"10%", left:"0%", right:"0%"}}>
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