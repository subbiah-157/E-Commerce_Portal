import { useEffect, useState, useRef } from "react";
import axios from "axios";
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
  FaTimes
} from "react-icons/fa";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState("Relevance");
  
  // Ref for the products section
  const productsSectionRef = useRef(null);

  // Fetch products
  useEffect(() => {
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
    fetchProducts();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categories");
        setCategories(res.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
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

  return (
    <div className="homePageContainer">
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
            <button className="shopNowBtn" onClick={handleShopNow}>
              <FaShoppingCart className="btnIcon" />
              Shop Now
            </button>
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
            <div className="productsGridContainer">
              <div className="productsGrid">
                {sortedProducts.length > 0 ? (
                  sortedProducts.map((p) => <ProductCard key={p._id} product={p} />)
                ) : (
                  <p className="noProductsMessage">
                    No products found for the selected category/subcategory.
                  </p>
                )}
              </div>

              {/* Pagination */}
              {/* <div className="pagination">
                <button className="paginationBtn">Previous</button>
                <span className="paginationInfo">1/10</span>
                <button className="paginationBtn">Next</button>
              </div> */}
            </div>
          </div>
        </div>
      </section>
      <Chatbot />
      <Footer />
    </div>
  );
};

export default Home;