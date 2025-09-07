import { useState, useContext, useEffect, useRef } from "react"; 
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import Chatbot from "../components/Chatbot";
import Footer from "../components/Footer";
import "../styles/Home.css";
import {
  FaShoppingCart,
  FaFilter,
  FaChevronDown,
  FaChevronRight,
  FaTimes,
  FaUser
} from "react-icons/fa";

const Login = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const animationRef = useRef(null);
  
  // Home page states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState("Relevance");
  const productsSectionRef = useRef(null);

  // Handle login form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      console.log("Login response:", res.data);

      // backend sends token + user info directly
      const userData = {
        token: res.data.token,
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        isAdmin: res.data.isAdmin,
        role: res.data.role,
      };

      if (!userData.token) {
        setError("Login failed: No token received. Check backend login response.");
        setIsLoading(false);
        return;
      }
      sessionStorage.setItem("authToken", userData.token);
      sessionStorage.setItem("user", JSON.stringify(userData));

      login(userData);
      setShowLoginPopup(false); // Close popup after successful login

      if (userData.isAdmin) {
        navigate("/"); 
      } else if (userData.name === "Shipping") {
        navigate("/shippingmanagement"); 
      } else if (userData.name === "Delivery") {
        navigate("/deliverymanagement"); 
      } else {
        navigate("/"); 
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Fetch company logo from backend
  const fetchCompanyLogo = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/company");
      if (res.data.data && res.data.data.logo) {
        setCompanyLogo(res.data.data.logo); // logo path stored in DB
      }
    } catch (err) {
      console.error("Error fetching company logo:", err);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");

      const productsWithFullImage = res.data.map((p) => {
        const mainImage =
          p.images && p.images.length > 0
            ? p.images[0]
            : "/placeholder.png";

        return {
          ...p,
          image: mainImage.startsWith("http")
            ? mainImage
            : `http://localhost:5000${mainImage}`,
        };
      });

      setProducts(productsWithFullImage);
    } catch (error) {
      console.error("Failed to fetch products:", error);
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

  // Timer for showing login popup
  useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        setShowLoginPopup(true);
      }, 30000); // 1 minute

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCompanyLogo();
    fetchProducts();
    fetchCategories();
  }, []);

  // Listen for scroll event from Header
  useEffect(() => {
    const handleScrollToProducts = () => {
      scrollToProducts();
    };

    window.addEventListener('scrollToProducts', handleScrollToProducts);
    
    return () => {
      window.removeEventListener('scrollToProducts', handleScrollToProducts);
    };
  }, []);

  // Enhanced search functionality
  useEffect(() => {
    if (search) {
      const searchLower = search.toLowerCase();
      
      // Reset all filters first
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedSubSubCategory("");
      
      // Check categories
      const matchedCategory = categories.find(c => 
        c.name.toLowerCase().includes(searchLower)
      );
      
      if (matchedCategory) {
        setSelectedCategory(matchedCategory.name);
        return;
      }
      
      // Check subcategories across all categories
      for (const category of categories) {
        if (category.subCategories) {
          const matchedSubCategory = category.subCategories.find(sc => 
            sc.name.toLowerCase().includes(searchLower)
          );
          
          if (matchedSubCategory) {
            setSelectedCategory(category.name);
            setSelectedSubCategory(matchedSubCategory.name);
            return;
          }
          
          // Check sub-subcategories - FIXED THIS PART
          for (const subCategory of category.subCategories) {
            if (subCategory.subSubCategories) {
              const matchedSubSubCategory = subCategory.subSubCategories.find(ssc => 
                ssc.toLowerCase().includes(searchLower)
              );
              
              if (matchedSubSubCategory) {
                setSelectedCategory(category.name);
                setSelectedSubCategory(subCategory.name);
                setSelectedSubSubCategory(matchedSubSubCategory);
                return;
              }
            }
          }
        }
      }
    }
  }, [search, categories]);

  // Filter products based on search and selected categories
  const filteredProducts = products.filter((p) => {
    const matchesSearch = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSubCategory = selectedSubCategory ? p.subCategory === selectedSubCategory : true;
    const matchesSubSubCategory = selectedSubSubCategory ? p.subSubCategory === selectedSubSubCategory : true;

    return matchesSearch && matchesCategory && matchesSubCategory && matchesSubSubCategory;
  });

  // Sort products based on selected sort option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "Price: Low to High":
        return a.price - b.price;
      case "Price: High to Low":
        return b.price - a.price;
      case "Newest First":
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  // Function to scroll to products section
  const scrollToProducts = () => {
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory("");
    setSelectedSubSubCategory("");
    setSearch(""); // Clear search when selecting a category
    scrollToProducts();
  };

  const handleSubCategorySelect = (subCategoryName) => {
    setSelectedSubCategory(subCategoryName);
    setSelectedSubSubCategory("");
    setSearch(""); // Clear search when selecting a subcategory
    scrollToProducts();
  };

  const handleSubSubCategorySelect = (subSubCategoryName) => {
    setSelectedSubSubCategory(subSubCategoryName);
    setSearch(""); // Clear search when selecting a sub-subcategory
    scrollToProducts();
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedSubSubCategory("");
    setSearch("");
    setSortBy("Relevance");
  };

  // Function to handle Shop Now button click
  const handleShopNow = () => {
    clearFilters();
    scrollToProducts();
  };

  const handleProtectedClick = () => {
  if (!isAuthenticated) {
    alert("Please login to access the product");
    return false; // stop further action
  }
  return true;
};


  return (
    <div className="homePageContainer">
      {/* Full Login Popup Modal */}
      {showLoginPopup && (
        <div className="loginPopupOverlay">
          <div className="loginPopupFull">
            <button 
              className="closePopupBtn"
              onClick={() => setShowLoginPopup(false)}
            >
              &times;
            </button>
            
            <div className="ecLogin-container">
              <div className="ecLogin-content">
                {/* Left Side - Icon Animation */}
                <div className="ecLogin-animation-side">
                  <div className="ecLogin-icon-animation" ref={animationRef}>
                    <div className="ecLogin-icon-container">
                      <div className="ecLogin-icon ecLogin-user-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ecLogin-icon ecLogin-email-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                          <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                        </svg>
                      </div>
                      <div className="ecLogin-icon ecLogin-password-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ecLogin-icon ecLogin-login-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h12.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Create Account Section */}
                  <div className="ecLogin-create-account">
                    <h3>New to Our Platform?</h3>
                    <p>Create an account to access exclusive features and personalized experience.</p>
                    <Link to="/signup" className="ecLogin-create-account-btn">
                      Create Account
                    </Link>
                  </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="ecLogin-form-side" id="userlogin">
                  <div className="ecLogin-formContainer">
                    <div className="ecLogin-formWrapper">
                      {/* Logo Section */}
                      {companyLogo && (
                        <div className="ecLogin-logoContainer">
                          <img 
                            src={`http://localhost:5000${companyLogo}`} 
                            alt="Company Logo" 
                            className="ecLogin-logo"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <h2 className="ecLogin-title">Welcome Back</h2>
                      <p className="ecLogin-subtitle">Please login to continue</p>
                      
                      {error && <div className="ecLogin-error">{error}</div>}
                      
                      <form onSubmit={handleSubmit} className="ecLogin-form">
                        <div className="ecLogin-inputGroup">
                          <input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="ecLogin-input"
                            disabled={isLoading}
                          />
                        </div>
                        
                        <div className="ecLogin-inputGroup">
                          <input
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="ecLogin-input"
                            disabled={isLoading}
                          />
                        </div>
                        
                        <button 
                          type="submit"
                          className={`ecLogin-submitButton ${isLoading ? 'ecLogin-submitButtonLoading' : ''}`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="ecLogin-spinner"></div>
                          ) : (
                            'Login'
                          )}
                        </button>
                      </form>
                      
                      <button 
                        type="button" 
                        onClick={() => navigate("/forgot-password")}
                        className="ecLogin-forgotPassword"
                        disabled={isLoading}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Header 
        setSearch={setSearch} 
        setSelectedCategory={setSelectedCategory}
        setSelectedSubCategory={setSelectedSubCategory}
        setSelectedSubSubCategory={setSelectedSubSubCategory}
      />

      {/* Hero Banner Section */}
      <section className="heroBanner">
  <div className="bannerContainer">
    <div className="bannerContent">
      <h1 className="bannerTitle">Smart Shopping Experience</h1>
      <p className="bannerSubtitle">Trusted by Millions of Happy Customers</p>
      <p className="bannerDescription">
        Discover the best products at unbeatable prices. Enjoy seamless shopping with
        fast delivery, easy returns, and 24/7 customer support. Your satisfaction is our priority.
      </p>

      <div className="bannerButtons">
        <button className="shopNowBtn" onClick={handleShopNow}>
          <FaShoppingCart className="btnIcon" />
          Shop Now
        </button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <button className="shopNowBtn" onClick={() => setShowLoginPopup(true)}>
          <FaUser className="btnIcon" />
          Login
        </button>
      </div>
    </div>
  </div>
</section>


      {/* Features Section */}
      <section className="featuresSection">
        <div className="featuresContainer">
          <div className="featuresGrid">
            <div className="featureCard">
              <div className="featureIcon">
                <i className="fas fa-shopping-cart"></i>
              </div>
              <h3 className="featureTitle">Smart Shopping</h3>
              <p className="featureDescription">
                AI-powered recommendations and personalized shopping experience tailored just for you.
              </p>
            </div>
            <div className="featureCard">
              <div className="featureIcon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <h3 className="featureTitle">Cash on Delivery</h3>
              <p className="featureDescription">
                Pay only when you receive your order. No upfront payments, complete peace of mind.
              </p>
            </div>
            <div className="featureCard">
              <div className="featureIcon">
                <i className="fas fa-tag"></i>
              </div>
              <h3 className="featureTitle">Lowest Prices</h3>
              <p className="featureDescription">
                Guaranteed best prices with daily deals and exclusive discounts on premium products.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Listing Section */}
      <section className="productsListingSection" id="products" ref={productsSectionRef}>
        <div className="container">
          <div className="productsHeader">
            <h1 className="productsMainTitle">Products For You</h1>
            <div className="productsControls">
              <div className="sortContainer">
                <span className="sortLabel">Sort by : </span>
                <select
                  className="sortSelect"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Relevance">Relevance</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Newest First">Newest First</option>
                </select>
              </div>
              <button
                className="mobileFilterToggle"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <FaFilter /> Filters
              </button>
            </div>
          </div>

          <div className="productsContent">
            {/* Filters Sidebar */}
            <aside className={`filtersSidebar ${showMobileFilters ? 'mobileVisible' : ''}`}>
              <div className="filtersHeader">
                <h3>FILTERS</h3>
                <span className="productsCount">{filteredProducts.length}+ Products</span>
                <button
                  className="closeFiltersBtn"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="filterGroup">
                <h4 className="filterGroupTitle">Category</h4>
                <div className="searchFilter">
                  <input
                    type="text"
                    placeholder="Search"
                    className="filterSearchInput"
                  />
                </div>
                <div className="filterOptions">
                  {categories.map((category) => (
                    <div key={category._id} className="filterOption">
                      <input
                        type="checkbox"
                        id={`category-${category._id}`}
                        checked={selectedCategory === category.name}
                        onChange={() => handleCategorySelect(category.name)}
                        className="filterCheckbox"
                      />
                      <label htmlFor={`category-${category._id}`} className="filterLabel">
                        {category.name}
                        {category.subCategories && category.subCategories.length > 0 && (
                          <FaChevronRight className="filterExpandIcon" />
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCategory && categories.find(c => c.name === selectedCategory)?.subCategories && (
                <div className="filterGroup">
                  <h4 className="filterGroupTitle">Sub Category</h4>
                  <div className="filterOptions">
                    {categories.find(c => c.name === selectedCategory).subCategories.map((subCategory) => (
                      <div key={subCategory._id} className="filterOption">
                        <input
                          type="checkbox"
                          id={`subcategory-${subCategory._id}`}
                          checked={selectedSubCategory === subCategory.name}
                          onChange={() => handleSubCategorySelect(subCategory.name)}
                          className="filterCheckbox"
                        />
                        <label htmlFor={`subcategory-${subCategory._id}`} className="filterLabel">
                          {subCategory.name}
                          {subCategory.subSubCategories && subCategory.subSubCategories.length > 0 && (
                            <FaChevronRight className="filterExpandIcon" />
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubCategory &&
                categories.find(c => c.name === selectedCategory)?.subCategories
                  .find(sc => sc.name === selectedSubCategory)?.subSubCategories && (
                  <div className="filterGroup">
                    <h4 className="filterGroupTitle">Sub-Sub Category</h4>
                    <div className="filterOptions">
                      {categories.find(c => c.name === selectedCategory)
                        .subCategories.find(sc => sc.name === selectedSubCategory)
                        .subSubCategories.map((subSubCategory, index) => (
                          <div key={index} className="filterOption">
                            <input
                              type="checkbox"
                              id={`subsubcategory-${index}`}
                              checked={selectedSubSubCategory === subSubCategory}
                              onChange={() => handleSubSubCategorySelect(subSubCategory)}
                              className="filterCheckbox"
                            />
                            <label htmlFor={`subsubcategory-${index}`} className="filterLabel">
                              {subSubCategory}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              <div className="filterActions">
                <button className="applyFiltersBtn">
                  <i className="fas fa-filter"></i> Apply Filters
                </button>
                <button className="clearFiltersBtn" onClick={clearFilters}>
                  <i className="fas fa-times"></i> Clear All
                </button>
              </div>

            </aside>

            {/* Products Grid */}
            <div className="productsGrid">
  {sortedProducts.length > 0 ? (
    sortedProducts.map((p) => (
      <div
        key={p._id}
        onClick={() => {
          if (handleProtectedClick()) {
            // If logged in, go to product page
            navigate(`/product/${p._id}`);
          }
        }}
      >
        <ProductCard product={p} />
      </div>
    ))
  ) : (
    <p className="noProductsMessage">
      No products found for the selected category/subcategory.
    </p>
  )}
</div>

          </div>
        </div>
      </section>
      <Chatbot />
      <Footer />
    </div>
  );
};

export default Login;