import { useEffect, useState, useContext } from "react";  
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { CurrencyContext } from "../context/CurrencyContext";
import Navbar from "../components/Navbar"; 
import Chatbot from "../components/Chatbot";
import Footer from "../components/Footer";
import "../styles/ProductDetails.css";
import { Link } from "react-router-dom";
import { FaStar, FaRegStar, FaStarHalfAlt, FaTruck, FaShare, FaHeart, FaShoppingCart, FaCalendarAlt, FaStore, FaCashRegister, FaChevronRight, FaFilter, FaTimes } from "react-icons/fa";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const { addToCart, cart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { currency, changeCurrency } = useContext(CurrencyContext);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState(null);

  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ comment: "", rating: 5 });
  const [editingReview, setEditingReview] = useState(null);
  const [overallRating, setOverallRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedSize, setSelectedSize] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [company, setCompany] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [isInCart, setIsInCart] = useState(false);

  const currencyRates = { GBP: 1, INR: 0.0095, USD: 0.77, EUR: 0.87, AUD: 0.56, CAD: 0.59, JPY: 0.0056 };
  const currencySymbols = { GBP: "£", INR: "₹", USD: "$", EUR: "€", AUD: "A$", CAD: "C$", JPY: "¥" };

  const convertPrice = (priceGBP) => {
    const priceInSelected = priceGBP / (currencyRates[currency] || 1);
    if (["INR", "JPY"].includes(currency)) return Math.round(priceInSelected);
    return parseFloat(priceInSelected.toFixed(2));
  };

  const getImageUrl = (img) => { 
  if (!img) return "/placeholder.png"; // fallback image
  if (img.startsWith("http") || img.startsWith("data:")) return img; // full URL or base64
  return `${API_BASE_URL}${img}`; // relative path from server
};


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

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/company`);
        setCompany(res.data.data);
      } catch (err) {
        console.error("Error fetching company details:", err);
        setCompany({
          name: "Bhumi Creation IN",
          rating: 3.8,
          ratingsCount: 6166
        });
      }
    };
    fetchCompanyData();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/products/${id}`);
        const productData = res.data;
        
        // Calculate delivery date (2 days from now at 10 AM)
        const deliveryDateObj = new Date();
        deliveryDateObj.setDate(deliveryDateObj.getDate() + 2);
        deliveryDateObj.setHours(10, 0, 0, 0);
        
        const formattedDate = deliveryDateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        setDeliveryDate(formattedDate);
        setProduct({ ...productData, deliveryDate: deliveryDateObj });
        setSelectedImage(
          productData.images && productData.images.length > 0
            ? productData.images[0]
            : productData.image || null
        );
      } catch (err) {
        console.error("Failed to fetch product:", err);
      }
    };
    
    fetchProduct();
  }, [id]);

    // ✅ Fetch wishlist details
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user || !user.token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/wishlist`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const wishlistItems = res.data;
        const exists = wishlistItems.some((item) => item._id === id);
        setIsWishlisted(exists);
      } catch (err) {
        console.error("Error fetching wishlist:", err);
      }
    };
    fetchWishlist();
  }, [id, user]);

  // ✅ Add or remove wishlist
  const handleWishlist = async () => {
    if (!user || !user.token) {
      alert("Please log in to use wishlist.");
      return;
    }

    try {
      if (isWishlisted) {
        navigate("/wishlist");
      } else {
        await axios.post(
          `${API_BASE_URL}/api/wishlist`,
          { productId: id },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/reviews/${id}`);
        setReviews(res.data);

        if (res.data.length > 0) {
          const total = res.data.reduce((sum, r) => sum + r.rating, 0);
          setOverallRating((total / res.data.length).toFixed(1));
        } else {
          const defaultRating = (Math.random() * (4.5 - 4.0) + 4.0).toFixed(1);
          setOverallRating(defaultRating);
        }
        } catch (err) {
        console.error(err);
        const defaultRating = (Math.random() * (4.5 - 4.0) + 4.0).toFixed(1);
        setOverallRating(defaultRating);
      }
    };
    fetchReviews();
  }, [id]);

  // Check if product is in cart
  useEffect(() => {
    if (product && cart) {
      const inCartItem = cart.find((p) => p._id === product._id && p.selectedSize === selectedSize);
      setIsInCart(!!inCartItem);
    }
  }, [product, cart, selectedSize]);

  if (!product || !company) return <div className="pd-loading">Loading...</div>;

  const originalPriceGBP = Number(product.price) || 0;
  const discountedPriceGBP = product.discount
    ? originalPriceGBP - (originalPriceGBP * product.discount) / 100
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user || !user.token) return alert("Please log in to submit a review.");

    if (editingReview) {
      axios
        .put(
          `${API_BASE_URL}/api/reviews/${editingReview._id}`,
          newReview,
          { headers: { Authorization: `Bearer ${user.token}` } }
        )
        .then((res) => {
          setReviews(reviews.map((rev) => (rev._id === res.data._id ? res.data : rev)));
          setEditingReview(null);
          setNewReview({ comment: "", rating: 5 });
        })
        .catch(console.error);
    } else {
      axios
        .post(
          `${API_BASE_URL}/api/reviews/${id}`,
          newReview,
          { headers: { Authorization: `Bearer ${user.token}` } }
        )
        .then((res) => {
          setReviews([res.data, ...reviews]);
          setNewReview({ comment: "", rating: 5 });
        })
        .catch(console.error);
    }
  };

  const handleDelete = (reviewId) => {
    if (!user || !user.token) return;
    axios
      .delete(`${API_BASE_URL}/api/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(() => setReviews(reviews.filter((rev) => rev._id !== reviewId)))
      .catch(console.error);
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setNewReview({ comment: review.comment, rating: review.rating });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: "Check out this product!",
        url: window.location.href,
      }).catch(err => console.error("Error sharing:", err));
    } else {
      alert("Sharing not supported in this browser.");
    }
  };

  const handleAddToCart = () => {
    // Check if size is required but not selected
    if (shouldShowSizeSelector() && !selectedSize) {
      alert("Please select a size before adding to cart.");
      return;
    }

    addToCart({ 
      ...product, 
      qty, 
      selectedOptions, 
      selectedSize,
      subCategory: product.subCategory || null,
      subSubCategory: product.subSubCategory || null
    });
    
    setIsInCart(true);
  };

  const handleGoToCart = () => {
    navigate("/cart");
  };

  const handleCheckout = () => {
    if (!user || !user.token) {
      alert("Please log in to proceed to checkout.");
      return;
    }
    
    // Check if size is required but not selected
    if (shouldShowSizeSelector() && !selectedSize) {
      alert("Please select a size before proceeding to checkout.");
      return;
    }

    navigate("/checkout", {
      state: {
        checkoutItems: [
          { 
            ...product, 
            qty, 
            selectedOptions, 
            selectedSize,
            subCategory: product.subCategory || null,
            subSubCategory: product.subSubCategory || null
          }
        ],
        currency 
      }
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="pd-star-icon pd-star-filled" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="pd-star-icon pd-star-half" />);
      } else {
        stars.push(<FaRegStar key={i} className="pd-star-icon" />);
      }
    }
    
    return <>{stars}</>;
  };

  const incrementQty = () => { if (qty < product.stock) setQty(qty + 1); };
  const decrementQty = () => { if (qty > 1) setQty(qty - 1); };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const isClothingCategory = () => {
    if (!product.category) return false;
    const category = product.category.toLowerCase();
    return category.includes('clothing') || category.includes('fashion') || category.includes('apparel');
  };

  const isFootwearCategory = () => {
    if (!product.category) return false;
    const category = product.category.toLowerCase();
    return category.includes('footwear') || category.includes('shoe');
  };

  const isHomeCategory = () => {
    if (!product.category) return false;
    const category = product.category.toLowerCase();
    return category.includes('home') || category.includes('furniture');
  };

  const isElectronicsCategory = () => {
    if (!product.category) return false;
    const category = product.category.toLowerCase();
    return category.includes("electronics") || category.includes("mobile");
  };

  const shouldShowSizeSelector = () => {
    return (isClothingCategory() || isFootwearCategory()) && !isHomeCategory() && !isElectronicsCategory();
  };

  const shouldShowSizeInfo = () => {
    return product.size && !isHomeCategory() && !isElectronicsCategory();
  };

  const SizeSelector = () => {
    let sizes = [];
    if (product.size && Array.isArray(product.size) && product.size.length > 0) {
      sizes = product.size;
    } else if (product.size && typeof product.size === 'string') {
      sizes = product.size.split(',').map(s => s.trim());
    } else {
      sizes = isFootwearCategory() ? ["7", "8", "9", "10", "11", "12"] : ["S", "M", "L", "XL", "XXL"];
    }
    
    return (
      <div className="pd-size-selector">
        <h4 className="pd-spec-subtitle">Select Size</h4>
        <div className="pd-size-grid">
          {sizes.map((size) => (
            <div
              key={size}
              className={`pd-size-option ${selectedSize === size ? 'pd-size-selected' : ''}`}
              onClick={() => handleSizeSelect(size)}
            >
              <div className="pd-size-label">{size}</div>
            </div>
          ))}
        </div>
        {shouldShowSizeSelector() && !selectedSize && (
          <div className="pd-size-warning">Please select a size</div>
        )}
      </div>
    );
  };

  const renderProductSpecifications = () => {
    const specifications = [
      { label: "Category", value: product.category },
      { label: "SubCategory", value: product.subCategory },
      { label: "SubSubCategory", value: product.subSubCategory },
      { label: "Brand", value: product.brand },
      { label: "Color", value: product.color },
      { label: "Material", value: product.material },
      { label: "Fit", value: product.fit },
      { label: "RAM", value: product.ram },
      { label: "Storage", value: product.storage },
      { label: "Processor", value: product.processor },
      { label: "Display Size", value: product.displaySize },
      { label: "Battery", value: product.battery },
      { label: "Camera", value: product.camera },
      { label: "Screen Size", value: product.screenSize },
      { label: "Type", value: product.type },
      { label: "Inches", value: product.inchs },
      { label: "Size", value: shouldShowSizeInfo() ? (Array.isArray(product.size) ? product.size.join(", ") : product.size) : null },
    ];

    const validSpecs = specifications.filter(spec => spec.value);
    return (
      <div className="pd-specs-grid">
        {validSpecs.map((spec, index) => (
          <div key={index} className="pd-spec-row">
            <strong>{spec.label}:</strong>
            <span>{spec.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <>
    <Navbar />
    <div className="homePageContainer">
      <div className="pd-container">
        {/* Currency Selector */}
        <div className="pd-currency-selector">
          <label htmlFor="currency">Select Currency: </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => changeCurrency(e.target.value)}
            className="pd-currency-select"
          >
            {Object.keys(currencySymbols).map((cur) => (
              <option key={cur} value={cur}>
                {cur} ({currencySymbols[cur]})
              </option>
            ))}
          </select>
        </div>

        <div className="pd-product-layout">
          {/* Image Gallery */}
          <div className="pd-gallery-column">
            <div className="pd-main-image">
              <img
                src={selectedImage || "/placeholder.png"}
                alt={product.name}
                className="pd-main-img"
              />
            </div>
            <div className="pd-thumbnail-container">
              {(product.images && product.images.length > 0 ? product.images : [product.image]).map((img, index) => (
                <img
                  key={index}
                  src={img || "/placeholder.png"}
                  alt={`${product.name}-${index}`}
                  className={`pd-thumbnail ${selectedImage === img ? 'pd-thumbnail-active' : ''}`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>

          </div>

          {/* Product Info */}
          <div className="pd-info-column">
            <h1 className="pd-product-name">{product.name}</h1>
            
            {/* Brand, RAM, Storage Info */}
            <div className="pd-specs-highlight">
              {product.brand && (
                <div className="pd-spec-item">
                  <strong>Brand:</strong> {product.brand}
                </div>
              )}
              {product.ram && (
                <div className="pd-spec-item">
                  <strong>RAM:</strong> {product.ram}
                </div>
              )}
              {product.storage && (
                <div className="pd-spec-item">
                  <strong>Storage:</strong> {product.storage}
                </div>
              )}
              {product.processor && (
                <div className="pd-spec-item">
                  <strong>Processor:</strong> {product.processor}
                </div>
              )}
            </div>

            {/* Rating and Reviews */}
            <div className="pd-rating-container">
              <div className="pd-stars">
                {renderStars(Number(overallRating))}
                <span className="pd-rating-value">{overallRating}</span>
              </div>
              <span className="pd-review-count">({reviews.length} Ratings, {reviews.length} Reviews)</span>
            </div>

            {/* Price Section */}
            <div className="pd-price-container">
              {product.discount ? (
                <div className="pd-price-discount">
                  <span className="pd-original-price">
                    {currencySymbols[currency]} {convertPrice(originalPriceGBP)}
                  </span>
                  <span className="pd-current-price">
                    {currencySymbols[currency]} {convertPrice(discountedPriceGBP)}
                  </span>
                  <span className="pd-discount-percent">{product.discount}% OFF</span>
                </div>
              ) : (
                <span className="pd-current-price">
                  {currencySymbols[currency]} {convertPrice(originalPriceGBP)}
                </span>
              )}
            </div>

            {/* Delivery Info */}
            <div className="pd-delivery-info">
              <FaTruck className="pd-delivery-icon" />
              <span className="pd-delivery-text">Free Delivery</span>
              {deliveryDate && (
                <span className="pd-delivery-date">
                  <FaCalendarAlt className="pd-calendar-icon" />
                  Delivery by {deliveryDate}
                </span>
              )}
            </div>

            {/* Size Selector */}
            {shouldShowSizeSelector() && <SizeSelector />}

            {/* Quantity Selector */}
            <div className="pd-quantity-selector">
              <span className="pd-quantity-label">Quantity:</span>
              <div className="pd-quantity-controls">
                <button onClick={decrementQty} className="pd-qty-btn">-</button>
                <span className="pd-qty-value">{qty}</span>
                <button onClick={incrementQty} className="pd-qty-btn">+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pd-action-buttons">
              {isInCart ? (
                <button
                  onClick={handleGoToCart}
                  className="pd-add-cart-btn"
                >
                  <FaShoppingCart className="pd-cart-icon" />
                  Go to Cart
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="pd-add-cart-btn"
                >
                  <FaShoppingCart className="pd-cart-icon" />
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              )}
              <button
                onClick={handleCheckout}
                disabled={product.stock === 0}
                className="pd-checkout-btn"
              > <FaCashRegister className="pd-cart-icon" />
                Checkout
              </button>

              <button onClick={handleShare} className="pd-share-btn">
                <FaShare className="pd-share-icon" />
                Share
              </button>

              <button onClick={handleWishlist} className="pd-add-cart-btn">
                  <FaHeart className={`pd-heart-icon ${isWishlisted ? "pd-heart-active" : ""}`} />
                  {isWishlisted ? "Go to Wishlist" : "Add to Wishlist"}
                </button>

            </div>

            {/* Seller Info */}
            {company && (
              <div className="pd-seller-info">
                <h3 className="pd-seller-title">Sold By</h3>
                <div className="pd-seller-card">
                  <div className="pd-seller-header">
                    <span className="pd-seller-name">
                      <FaStore className="pd-store-icon" />
                      {company.name}
                    </span>
                    <div className="pd-seller-rating">
                      <span className="pd-seller-rating-value">{company.rating || 3.8}</span>
                      <div className="pd-seller-stars">
                        {renderStars(company.rating || 3.8)}
                      </div>
                      <span className="pd-seller-review-count">{formatNumber(company.ratingsCount || 6166)} Ratings</span>
                    </div>
                  </div><Link to="/">
                  <button className="pd-view-shop-btn">View Shop</button></Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Tabs */}
        <div className="pd-tabs-section">
          <div className="pd-tab-container">
            <button className={`pd-tab ${activeTab === "description" ? 'pd-tab-active' : ''}`} onClick={() => setActiveTab("description")}>
              Product Details
            </button>
            <button className={`pd-tab ${activeTab === "specifications" ? 'pd-tab-active' : ''}`} onClick={() => setActiveTab("specifications")}>
              Specifications
            </button>
            <button className={`pd-tab ${activeTab === "reviews" ? 'pd-tab-active' : ''}`} onClick={() => setActiveTab("reviews")}>
              Reviews & Ratings
            </button>
            <button className={`pd-tab ${activeTab === "warranty" ? 'pd-tab-active' : ''}`} onClick={() => setActiveTab("warranty")}>
              Warranty & Support
            </button>
          </div>

          <div className="pd-tab-content">
            {activeTab === "description" && (
              <div className="pd-tab-panel">
                <h3 className="pd-tab-title">Product Description</h3>
                <p className="pd-description">{product.description}</p>
                
                <div className="pd-features-list">
                  <h4>Key Features:</h4>
                  <ul>
                    <li>Premium quality material</li>
                    <li>Perfect fit for your device</li>
                    <li>Enhanced protection</li>
                    <li>Stylish design</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="pd-tab-panel">
                <h3 className="pd-tab-title">Product Specifications</h3>
                {renderProductSpecifications()}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="pd-tab-panel">
                <div className="pd-reviews-header">
                  <div className="pd-overall-rating">
                    <h3>{overallRating} ★</h3>
                    <p>Based on {reviews.length} reviews</p>
                  </div>
                  <div className="pd-rating-distribution">
                    <div className="pd-rating-bar">
                      <span>5 ★</span>
                      <div className="pd-bar-container">
                        <div className="pd-bar-fill" style={{width: '70%'}}></div>
                      </div>
                      <span>70%</span>
                    </div>
                    <div className="pd-rating-bar">
                      <span>4 ★</span>
                      <div className="pd-bar-container">
                        <div className="pd-bar-fill" style={{width: '20%'}}></div>
                      </div>
                      <span>20%</span>
                    </div>
                    <div className="pd-rating-bar">
                      <span>3 ★</span>
                      <div className="pd-bar-container">
                        <div className="pd-bar-fill" style={{width: '7%'}}></div>
                      </div>
                      <span>7%</span>
                    </div>
                    <div className="pd-rating-bar">
                      <span>2 ★</span>
                      <div className="pd-bar-container">
                        <div className="pd-bar-fill" style={{width: '2%'}}></div>
                      </div>
                      <span>2%</span>
                    </div>
                    <div className="pd-rating-bar">
                      <span>1 ★</span>
                      <div className="pd-bar-container">
                        <div className="pd-bar-fill" style={{width: '1%'}}></div>
                      </div>
                      <span>1%</span>
                    </div>
                  </div>
                </div>

                <div className="pd-reviews-list">
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div key={rev._id} className="pd-review-card">
                        <div className="pd-review-header">
                          <strong className="pd-review-author">{rev.name}</strong>
                          <div className="pd-review-rating">
                            {renderStars(rev.rating)}
                            <span className="pd-review-date">
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                        </div>
                        <p className="pd-review-comment">{rev.comment}</p>
                        <div className="pd-review-helpful">
                          <span>Helpful ({Math.floor(Math.random() * 20)})</span>
                        </div>
                        {user && user.id === rev.user && (
                          <div className="pd-review-actions">
                            <button className="pd-edit-btn" onClick={() => handleEdit(rev)}>Edit</button>
                            <button className="pd-delete-btn" onClick={() => handleDelete(rev._id)}>Delete</button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="pd-no-reviews">No reviews yet. Be the first to review!</p>
                  )}
                </div>

                {user && (
                  <form className="pd-review-form" onSubmit={handleSubmit}>
                    <h4 className="pd-form-title">{editingReview ? "Edit Your Review" : "Write a Review"}</h4>
                    <div className="pd-rating-input">
                      <label>Rating:</label>
                      <select
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                        className="pd-rating-select"
                      >
                        {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
                      </select>
                    </div>
                    <textarea
                      placeholder="Share your experience with this product..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      className="pd-review-textarea"
                      rows="4"
                    />
                    <div className="pd-form-actions">
                      <button type="submit" className="pd-submit-btn">
                        {editingReview ? "Update Review" : "Submit Review"}
                      </button>
                      {editingReview && (
                        <button 
                          type="button" 
                          className="pd-cancel-btn"
                          onClick={() => { 
                            setEditingReview(null); 
                            setNewReview({ comment: "", rating: 5 }); 
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "warranty" && (
            <div className="pd-tab-panel">
              <h3 className="pd-tab-title">Warranty & Support</h3>
              <div className="pd-warranty-info">
                <div className="pd-warranty-card">
                  <h4>Warranty Information</h4>
                  <p>{product.warranty || "This product comes with a standard manufacturer warranty against manufacturing defects."}</p>
                  <ul>
                    <li><strong>Support:</strong> Email and phone support available</li>
                  </ul>
                </div>
                
                <div className="pd-support-info">
                  <h4>Customer Support</h4>
                  <p>Our customer support team is available to help you with any questions or issues:</p>
                  <div className="pd-support-channels">
                    <div className="pd-support-channel">
                      <strong>Email:</strong> {company.email || "support@example.com"}
                    </div>
                    <div className="pd-support-channel">
                      <strong>Phone:</strong> {company.phone || "+1-800-123-4567"}
                    </div>
                    <div className="pd-support-channel">
                      <strong>Hours:</strong> Mon-Fri, 9AM-6PM EST
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    <Chatbot />
    <Footer />
  </div>
  </>
  );
};

export default ProductDetails;