import { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import HeroBannerSection from "../pages/HeroBannerSection"; 
import Contact from "../components/Contact";
import Chatbot from "../components/Chatbot";
import Footer from "../components/Footer";
import keywordMappings, { findKeyword } from "../utils/keywordMappings";
import "../styles/Home.css";
import "../styles/AISearch.css";
import {
  FaShoppingCart,
  FaFilter,
  FaChevronDown,
  FaChevronRight,
  FaTimes,
  FaSearch,
  FaRobot,
  FaArrowRight
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
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiSearchBudget, setAiSearchBudget] = useState("");
  const [aiSearchResults, setAiSearchResults] = useState([]);
  const [isAiSearchActive, setIsAiSearchActive] = useState(false);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchError, setAiSearchError] = useState("");


  // Ref for the products section
  const productsSectionRef = useRef(null);

  // AI Floating Panel states
  const [isOpen, setIsOpen] = useState(false);

  // Local AI search form states
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // Simplified keyword extraction - focus only on removing truly common words
  const extractKeywords = (text) => {
    // Minimal list of only the most common filler words
    const commonWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'i', 'me', 'my',
      'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them',
      'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who',
      'whom', 'whose', 'where', 'when', 'how', 'why', 'can', 'could',
      'will', 'would', 'shall', 'should', 'may', 'might', 'must'
    ]);

    // Keep all other words, including product-related verbs
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word =>
      word.length > 1 && // Allow shorter words like "pc", "tv"
      !commonWords.has(word)
    );
  };

  // Function to find products matching keywords
  const findProductsByKeywords = (keywords, maxBudget) => {
    if (keywords.length === 0) return [];

    return products.filter(product => {
      // Check if product matches budget
      const budgetMatch = maxBudget ? product.price <= maxBudget : true;

      if (!budgetMatch) return false;

      // Create a comprehensive text search field
      const productText = `
        ${product.name || ''} 
        ${product.category || ''} 
        ${product.subCategory || ''} 
        ${product.subSubCategory || ''} 
        ${product.type || ''}
        ${product.brand || ''}
        ${product.description || ''} 
      `.toLowerCase();

      // Check if any keyword matches the product text
      return keywords.some(keyword => productText.includes(keyword.toLowerCase()));
    });
  };

  useEffect(() => {
    if (!search) return;

    async function mapSearch() {
      const searchLower = search.toLowerCase().trim();

      // 1️⃣ Check static keywordMappings first
      let mapping = keywordMappings[searchLower];

      // 2️⃣ If not found, try normalized keys (ignores spaces/dashes)
      if (!mapping) {
        const normalized = searchLower.replace(/[-\s]/g, "");
        for (const key in keywordMappings) {
          if (normalized === key.replace(/[-\s]/g, "")) {
            mapping = keywordMappings[key];
            break;
          }
        }
      }

      // 3️⃣ If still not found, use API fallback
      if (!mapping) {
        mapping = await findKeyword(searchLower);
      }

      // 4️⃣ Apply mapping if found
      if (mapping) {
        if (mapping.category) setSelectedCategory(mapping.category);
        if (mapping.subCategory) setSelectedSubCategory(mapping.subCategory);
        if (mapping.subSubCategory) setSelectedSubSubCategory(mapping.subSubCategory);

        // Brand handling
        if (mapping.brand) {
          setSearch(mapping.brand);
        } else {
          setSearch("");
        }
        return;
      }

      // 5️⃣ Fallback: search in categories/subCategories/subSubCategories
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedSubSubCategory("");

      const matchedCategory = categories.find(c =>
        c.name.toLowerCase().includes(searchLower)
      );
      if (matchedCategory) {
        setSelectedCategory(matchedCategory.name);
        return;
      }

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

    mapSearch();
  }, [search, categories]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/products`);

        const productsWithFullImage = res.data.map((p) => {
          // ✅ Use the main image from backend if it exists, otherwise fallback to first in images array, else placeholder
          const mainImage = p.image
            ? p.image
            : Array.isArray(p.images) && p.images.length > 0
              ? p.images[0]
              : "/placeholder.png";

          // ✅ If the image is already a base64 string or a full URL, use it directly
          const imageUrl =
            typeof mainImage === "string" &&
              (mainImage.startsWith("data:") || mainImage.startsWith("http"))
              ? mainImage
              : `${API_BASE_URL}${mainImage}`;

          return {
            ...p,
            image: imageUrl,
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
        const res = await axios.get(`${API_BASE_URL}/api/categories`);
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

  // AI Search functionality
  const handleAISearch = async (e) => {
    e.preventDefault();

    if (!aiSearchQuery.trim()) {
      setAiSearchError("Please describe what you're looking for.");
      return;
    }

    setAiSearchLoading(true);
    setAiSearchError("");
    setIsAiSearchActive(true);

    // Add a minimum loading time of 1.5 seconds
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // First try keyword matching (fast and free)
      const keywords = extractKeywords(aiSearchQuery);
      const budgetValue = aiSearchBudget ? parseFloat(aiSearchBudget) : null;

      console.log("Extracted keywords:", keywords);

      const keywordMatchedProducts = findProductsByKeywords(keywords, budgetValue);

      if (keywordMatchedProducts.length > 0) {
        // Wait for the minimum loading time before showing results
        await minLoadingTime;
        setAiSearchResults(keywordMatchedProducts);
        setAiSearchLoading(false);
        // Scroll to products section after search completes
        setTimeout(() => {
          scrollToProducts();
        }, 100);
        return;
      }

      // If no keyword matches found, use AI API for better understanding
      const GEMINI_API_KEY = "AIzaSyDyhqr9Hy1qOBJhPrvYOeFpHoud4jIjT-E";
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

      const promptText = `
        Extract ONLY the product-related keywords from this query: "${aiSearchQuery}" 
        ${budgetValue ? `with budget constraint: ${budgetValue} dollars` : ''}.
        
        Return ONLY a JSON array of the most relevant product search keywords.
        Example: For "I need a good laptop for programming", return ["laptop", "programming"]
        Example: For "wireless headphones for running", return ["wireless headphones", "running"]
        
        Important: Return ONLY the array, no other text or explanations.
      `;

      const body = {
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
      };

      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiText) {
        // Wait for the minimum loading time before showing error
        await minLoadingTime;
        setAiSearchError("No suggestions returned from AI.");
        setAiSearchLoading(false);
        return;
      }

      // Extract search terms from AI response
      let searchTerms = [];
      try {
        const jsonMatch = aiText.match(/\[.*\]/s);
        if (jsonMatch) {
          searchTerms = JSON.parse(jsonMatch[0]);
        } else {
          // If AI didn't return proper JSON, fall back to our keyword extraction
          searchTerms = keywords.length > 0 ? keywords : [aiSearchQuery.trim().toLowerCase()];
        }
      } catch (parseError) {
        console.warn("Could not parse AI response:", parseError);
        searchTerms = keywords.length > 0 ? keywords : [aiSearchQuery.trim().toLowerCase()];
      }

      console.log("AI extracted terms:", searchTerms);

      // Use the search terms to find matching products
      const aiMatchedProducts = products.filter(product => {
        // Check budget first
        const budgetMatch = budgetValue ? product.price <= budgetValue : true;
        if (!budgetMatch) return false;

        // Create a comprehensive text search field
        const productText = `
          ${product.name || ''} 
          ${product.category || ''} 
          ${product.subCategory || ''} 
          ${product.subSubCategory || ''} 
          ${product.type || ''}
          ${product.description || ''} 
          ${product.brand || ''}
        `.toLowerCase();

        // Check if any search term matches the product text
        return searchTerms.some(term =>
          productText.includes(term.toLowerCase())
        );
      });

      // Wait for the minimum loading time before showing results
      await minLoadingTime;
      setAiSearchResults(aiMatchedProducts);

    } catch (err) {
      console.error("AI Search Error:", err);
      // Wait for the minimum loading time before showing error
      await minLoadingTime;
      setAiSearchError("Failed to process your request. Please try again.");
      // Fallback: try simple keyword matching as last resort
      const keywords = extractKeywords(aiSearchQuery);
      const budgetValue = aiSearchBudget ? parseFloat(aiSearchBudget) : null;
      const fallbackResults = findProductsByKeywords(keywords, budgetValue);
      setAiSearchResults(fallbackResults);
    } finally {
      setAiSearchLoading(false);
      // Scroll to products section after search completes
      setTimeout(() => {
        scrollToProducts();
      }, 100);
    }
  };

  // Reset AI search
  const resetAISearch = () => {
    setIsAiSearchActive(false);
    setAiSearchQuery("");
    setAiSearchBudget("");
    setAiSearchResults([]);
    setAiSearchError("");
  };

  // Filter products based on search and selected categories
  const filteredProducts = isAiSearchActive ? aiSearchResults : products.filter((p) => {
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
    setIsAiSearchActive(false); // Reset AI search
    scrollToProducts();
  };

  const handleSubCategorySelect = (subCategoryName) => {
    setSelectedSubCategory(subCategoryName);
    setSelectedSubSubCategory("");
    setSearch(""); // Clear search when selecting a subcategory
    setIsAiSearchActive(false); // Reset AI search
    scrollToProducts();
  };

  const handleSubSubCategorySelect = (subSubCategoryName) => {
    setSelectedSubSubCategory(subSubCategoryName);
    setSearch(""); // Clear search when selecting a sub-subcategory
    setIsAiSearchActive(false); // Reset AI search
    scrollToProducts();
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedSubSubCategory("");
    setSearch("");
    setSortBy("Relevance");
    setIsAiSearchActive(false); // Reset AI search
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
      <HeroBannerSection onShopNow={handleShopNow} />
      

      {/* AI Search Section */}
      <section className="aiSearchSection">
        <div className="ai-search-wrapper">
          {/* Floating Button */}
          {!isOpen && (
            <button
              className="ai-search-floating-btn"
              onClick={() => setIsOpen(true)}
            >
              <FaRobot className="ai-icon" />
            </button>
          )}

          {/* Expanded Panel */}
          {isOpen && (
            <div className="ai-search-expanded">
              {/* Header */}
              <div className="ai-search-header">
                <div className="ai-search-title">
                  <FaRobot className="ai-title-icon" />
                  <h3>AI Product</h3>
                </div>
                <button
                  className="ai-search-close"
                  onClick={() => setIsOpen(false)}
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="ai-search-content">
                <p className="ai-search-subtitle">
                  Describe what you're looking for, and we'll find the perfect products for you.
                </p>

                <form onSubmit={handleAISearch} className="ai-search-form">
                  <div className="ai-search-input-group">
                    {/* Query Input */}
                    <div className="input-wrapper">
                      <FaSearch className="input-icon" />
                      <input
                        type="text"
                        className="ai-search-input"
                        placeholder="Type the product you want to search, e.g., Mobiles"
                        value={aiSearchQuery}
                        onChange={(e) => setAiSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Budget Input */}
                    {/* <div className="input-wrapper">
                      <select
                        className="currency-select"
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                      >
                        <option value="USD">$ USD</option>
                        <option value="GBP">£ GBP</option>
                        <option value="INR">₹ INR</option>
                        <option value="EUR">€ EUR</option>
                        <option value="AUD">A$ AUD</option>
                        <option value="CAD">C$ CAD</option>
                        <option value="JPY">¥ JPY</option>
                      </select>

                      <input
                        type="number"
                        className="ai-search-budget-input"
                        placeholder="Enter budget"
                        value={aiSearchBudget}
                        onChange={(e) => setAiSearchBudget(e.target.value)}
                      />
                    </div> */}
                  </div>

                  {/* Buttons Row */}
                  <div className="ai-search-btn-group">
                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="ai-search-submit-btn"
                      disabled={aiSearchLoading}
                    >
                      {aiSearchLoading ? (
                        <div className="loading-spinner">
                        </div>
                      ) : (
                        <>
                          <span>Find Products</span>
                          <FaArrowRight className="arrow-icon" />
                        </>
                      )}
                    </button>

                    {/* Clear Search Button */}
                    <button
                      type="button"
                      className="ai-search-submit-btn" style={{ background: "white", color: "red", border: "1.5px solid red" }}
                      onClick={() => {
                        setAiSearchQuery("");
                        setAiSearchBudget("");
                      }}
                    >
                      <FaTimes className="clear-icon" />
                      Clear
                    </button>

                  </div>
                </form>

                {/* Error Message */}
                {aiSearchError && (
                  <div className="ai-search-error">
                    <span className="error-icon">⚠️</span>
                    <p>{aiSearchError}</p>
                  </div>
                )}
              </div>
            </div>
          )}
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
            <h1 className="productsMainTitle">
              {isAiSearchActive ? "AI Search Results" : "Products For You"}
            </h1>
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
                    {isAiSearchActive
                      ? "No products found matching your AI search criteria. Try different keywords."
                      : "No products found for the selected category/subcategory."}
                  </p>
                )}
              </div>

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