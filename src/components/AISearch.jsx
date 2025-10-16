import { useState } from "react";
import { FaSearch, FaTimes, FaRobot, FaArrowRight } from "react-icons/fa";
import "../styles/AISearch.css";

const AISearch = ({ allProducts, setSearchResults, setAiSearchActive }) => {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const GEMINI_API_KEY = "AIzaSyDyhqr9Hy1qOBJhPrvYOeFpHoud4jIjT-E";
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  // Simplified keyword extraction - focus only on removing truly common words
  const extractKeywords = (text) => {
    const commonWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'i', 'me', 'my', 
      'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them', 
      'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 
      'whom', 'whose', 'where', 'when', 'how', 'why', 'can', 'could', 
      'will', 'would', 'shall', 'should', 'may', 'might', 'must'
    ]);
    
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => 
      word.length > 1 && !commonWords.has(word)
    );
  };

  // Function to validate if product is furniture-related
  const isValidFurnitureProduct = (product, keywords) => {
    const furnitureCategories = [
      'sofa', 'couch', 'chair', 'table', 'bed', 'cabinet', 'wardrobe',
      'furniture', 'decor', 'home', 'living', 'dining', 'bedroom', 'office',
      'desk', 'shelf', 'rack', 'stool', 'bench', 'ottoman', 'recliner'
    ];
    
    const hasFurnitureCategory = furnitureCategories.some(category =>
      product.category && product.category.toLowerCase().includes(category)
    );
    
    const hasFurnitureName = furnitureCategories.some(category =>
      product.name && product.name.toLowerCase().includes(category)
    );
    
    const hasFurnitureKeyword = keywords.some(keyword =>
      furnitureCategories.some(category => 
        keyword.toLowerCase().includes(category)
      )
    );
    
    return hasFurnitureCategory || hasFurnitureName || hasFurnitureKeyword;
  };

  // Function to find products matching keywords
  const findProductsByKeywords = (keywords, maxBudget) => {
    if (keywords.length === 0) return [];
    
    return allProducts.filter(product => {
      const budgetMatch = maxBudget ? product.price <= maxBudget : true;
      
      if (!budgetMatch) return false;
      
      if (!isValidFurnitureProduct(product, keywords)) return false;
      
      const productText = `
        ${product.name || ''} 
        ${product.category || ''} 
        ${product.subCategory || ''} 
        ${product.subSubCategory || ''} 
        ${product.type || ''}
        ${product.brand || ''}
      `.toLowerCase();
      
      return keywords.some(keyword => productText.includes(keyword.toLowerCase()));
    });
  };

  const handleAISearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      setError("Please describe what you're looking for.");
      return;
    }

    setLoading(true);
    setError("");
    setAiSearchActive(true);

    try {
      const keywords = extractKeywords(query);
      const budgetValue = budget ? parseFloat(budget) : null;
      
      const keywordMatchedProducts = findProductsByKeywords(keywords, budgetValue);
      
      if (keywordMatchedProducts.length > 0) {
        setSearchResults(keywordMatchedProducts);
        setLoading(false);
        return;
      }
      
      const promptText = `
        User is searching for: "${query}" ${budgetValue ? `with max budget: ${budgetValue}` : ''}.
        
        Extract ONLY furniture/home decor product types and categories from this query.
        Return ONLY a JSON array of relevant furniture product categories and types.
        
        Example: For "one sofa", return ["sofa", "couch", "living room furniture"]
        Example: For "wooden chair", return ["chair", "wooden furniture", "dining chair"]
        Example: For "bedroom cabinet", return ["cabinet", "wardrobe", "bedroom furniture"]
        
        Important: Return ONLY the JSON array, no other text.
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
        setError("No suggestions returned from AI.");
        setLoading(false);
        return;
      }

      let searchTerms = [];
      try {
        const jsonMatch = aiText.match(/\[.*\]/s);
        if (jsonMatch) {
          searchTerms = JSON.parse(jsonMatch[0]);
        } else {
          searchTerms = keywords.length > 0 ? keywords : [query.trim().toLowerCase()];
        }
      } catch (parseError) {
        searchTerms = keywords.length > 0 ? keywords : [query.trim().toLowerCase()];
      }

      const aiMatchedProducts = allProducts.filter(product => {
        const budgetMatch = budgetValue ? product.price <= budgetValue : true;
        if (!budgetMatch) return false;
        
        if (!isValidFurnitureProduct(product, searchTerms)) return false;
        
        const productText = `
          ${product.name || ''} 
          ${product.category || ''} 
          ${product.subCategory || ''} 
          ${product.subSubCategory || ''} 
          ${product.type || ''}
          ${product.brand || ''}
        `.toLowerCase();
        
        return searchTerms.some(term => 
          productText.includes(term.toLowerCase())
        );
      });

      if (aiMatchedProducts.length === 0) {
        setError(`No furniture products found for "${query}". Try searching for "sofa", "chair", "table", etc.`);
        setSearchResults([]);
      } else {
        setSearchResults(aiMatchedProducts);
      }

    } catch (err) {
      setError("Failed to process your request. Please try again.");
      const keywords = extractKeywords(query);
      const budgetValue = budget ? parseFloat(budget) : null;
      const fallbackResults = findProductsByKeywords(keywords, budgetValue);
      setSearchResults(fallbackResults);
    } finally {
      setLoading(false);
    }
  };

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setQuery("");
      setBudget("");
      setError("");
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setQuery("");
    setBudget("");
    setError("");
    setAiSearchActive(false);
  };

  return (
    <div className="ai-search-wrapper">
      {/* AI Search Floating Button */}
      {!isExpanded && (
        <button className="ai-search-floating-btn" onClick={toggleSearch}>
          <FaRobot className="ai-icon" />
          <span>AI Search</span>
        </button>
      )}

      {/* Expanded Search Panel */}
      {isExpanded && (
        <div className="ai-search-expanded">
          <div className="ai-search-header">
            <div className="ai-search-title">
              <FaRobot className="ai-title-icon" />
              <h3>AI Product Finder</h3>
            </div>
            <button className="ai-search-close" onClick={handleClose}>
              <FaTimes />
            </button>
          </div>

          <div className="ai-search-content">
            <p className="ai-search-subtitle">
              Describe what you need and our AI will find the perfect products for you
            </p>

            <form onSubmit={handleAISearch} className="ai-search-form">
              <div className="ai-search-input-group">
                <div className="input-wrapper">
                  <FaSearch className="input-icon" />
                  <input
                    type="text"
                    placeholder="What are you looking for? (e.g., 'modern sofa', 'wooden dining table')"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="ai-search-input"
                    autoFocus
                  />
                </div>
                
                <div className="input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    placeholder="Max budget (optional)"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="ai-search-budget-input"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="ai-search-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  <>
                    <span>Find Products</span>
                    <FaArrowRight className="arrow-icon" />
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="ai-search-error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
              </div>
            )}

            {loading && (
              <div className="ai-search-loading">
                <div className="pulse-animation">
                  <FaRobot className="pulse-icon" />
                </div>
                <p>Analyzing your request with AI...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISearch;