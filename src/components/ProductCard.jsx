import { useContext, useEffect, useState } from "react";    
import { CartContext } from "../context/CartContext";
import { CurrencyContext } from "../context/CurrencyContext"; 
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import "../styles/ProductCard.css";
import { FaShoppingCart, FaStar, FaRegStar, FaStarHalfAlt, FaTruck, FaGlobe, FaHeart, FaRegHeart, FaCheck } from "react-icons/fa";

const ProductCard = ({ product }) => {
  const { addToCart, cart } = useContext(CartContext);
  const { currency, changeCurrency } = useContext(CurrencyContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!product?._id) return;

    const fetchRating = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/reviews/${product._id}`);
        const reviews = Array.isArray(res.data) ? res.data : [];
        setReviewCount(reviews.length);

        if (reviews.length > 0) {
          const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
          setRating((total / reviews.length).toFixed(1));
        } else {
          const defaultRating = (Math.random() * (4.4 - 3.9) + 3.9).toFixed(1);
          setRating(defaultRating);
        }
      } catch (err) {
        if (err.response && err.response.status !== 400) {
          console.error("Failed to fetch rating:", err.message);
        }
        const defaultRating = (Math.random() * (4.4 - 3.9) + 3.9).toFixed(1);
        setRating(defaultRating);
        setReviewCount(0);
      }
    };

    fetchRating();
  }, [product?._id]);

  // Check if product is in user's wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user || !product?._id) {
        setIsWishlisted(false);
        return;
      }

      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(`${API_BASE_URL}/api/wishlist/check/${product._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWishlisted(res.data.isWishlisted);
      } catch (err) {
        console.error("Failed to check wishlist status:", err);
        setIsWishlisted(false);
      }
    };

    checkWishlistStatus();
  }, [user, product?._id]);

  const imageUrl = product.image
    ? product.image
    : product.images.length > 0
    ? product.images[0]
    : "/default-product.png";

  const inCart = cart.find(p => p._id === product._id);

  const currencySymbols = {
    GBP: "£",
    INR: "₹",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
  };

  const currencyRates = {
    GBP: 1,
    INR: 0.0095,
    USD: 0.77,
    EUR: 0.87,
    AUD: 0.56,
    CAD: 0.59,
    JPY: 0.0056,
  };

  const convertPrice = (priceGBP) => {
    const priceInSelected = priceGBP / (currencyRates[currency] || 1);
    if (["INR", "JPY"].includes(currency)) return `${currencySymbols[currency]}${Math.round(priceInSelected)}`;
    return `${currencySymbols[currency]}${priceInSelected.toFixed(2)}`;
  };

  const originalPriceGBP = Number(product.price) || 0;
  const discountedPriceGBP = product.discount
    ? originalPriceGBP - (originalPriceGBP * product.discount) / 100
    : null;

  const isOutOfStock = product.stock === 0;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="pc-star-icon pc-star-filled" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="pc-star-icon pc-star-half" />);
      } else {
        stars.push(<FaRegStar key={i} className="pc-star-icon" />);
      }
    }
    
    return <>{stars}</>;
  };

  const formatReviewCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count;
  };

  const handleCurrencyChange = (newCurrency) => {
    changeCurrency(newCurrency);
    setShowCurrencyDropdown(false);
  };

  const toggleWishlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setWishlistLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      
      if (isWishlisted) {
        // Remove from wishlist
        await axios.delete(`${API_BASE_URL}/api/wishlist/${product._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWishlisted(false);
      } else {
        // Add to wishlist
        await axios.post(`${API_BASE_URL}/api/wishlist`, 
          { productId: product._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      alert("Failed to update wishlist. Please try again.");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleGoToCart = () => {
    navigate("/cart");
  };

  return (
    <div className="pc-card">
      {/* Currency Converter - Left Side */}
      <div className="pc-currency-converter">
        <button 
          className="pc-currency-toggle"
          onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
        >
          <FaGlobe className="pc-globe-icon" />
          {currency} ({currencySymbols[currency]})
        </button>
        
        {showCurrencyDropdown && (
          <div className="pc-currency-dropdown">
            {Object.keys(currencySymbols).map(cur => (
              <button
                key={cur}
                className={`pc-currency-option ${currency === cur ? 'pc-currency-active' : ''}`}
                onClick={() => handleCurrencyChange(cur)}
              >
                {cur} ({currencySymbols[cur]})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wishlist - Right Side */}
      <button 
        className={`pc-wishlist-btn ${isWishlisted ? 'pc-wishlisted' : ''}`}
        onClick={toggleWishlist}
        disabled={wishlistLoading}
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        {isWishlisted ? (
          <FaHeart className="pc-wishlist-icon pc-wishlist-filled" />
        ) : (
          <FaRegHeart className="pc-wishlist-icon" />
        )}
      </button>

      <Link to={`/product/${product._id}`} className="pc-link">
        <div className="pc-image-container">
          <img src={imageUrl} alt={product.name} className="pc-image" />
        </div>
        
        <h3 className="pc-name">{product.name}</h3>
      </Link>

      {/* Discount Badge - Moved below image */}
      <div className="pc-discount-badge">
        {product.discount ? `${product.discount}% OFF` : `0% OFF`}
      </div>

      <div className="pc-rating-container">
        <div className="pc-stars">
          {renderStars(Number(rating))}
          <span className="pc-rating-value">{rating}</span>
        </div>
        <span className="pc-review-count">({formatReviewCount(reviewCount)} Reviews)</span>
      </div>

      <div className="pc-price-container">
        {product.discount ? (
          <>
            <span className="pc-current-price">{convertPrice(discountedPriceGBP)}</span>
            <span className="pc-original-price">{convertPrice(originalPriceGBP)}</span>
            <span className="pc-discount-percent">{product.discount}% off</span>
          </>
        ) : (
          <>
            <span className="pc-current-price">{convertPrice(originalPriceGBP)}</span>
            <span className="pc-discount-percent">0% off</span>
          </>
        )}
      </div>

      <div className="pc-delivery-info">
        <FaTruck className="pc-delivery-icon" />
        <span className="pc-delivery-text">Free Delivery</span>
      </div>

      {isOutOfStock ? (
        <div className="pc-out-of-stock">Out of Stock</div>
      ) : (
        <div className="pc-in-stock">In Stock</div>
      )}

      <div className="pc-action-buttons">
        {inCart ? (
          <button
            className="pc-go-to-cart-btn"
            onClick={handleGoToCart}
          >
            <FaShoppingCart className="pc-cart-icon" />
            Go to Cart
          </button>
        ) : (
          <button
            className="pc-add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <FaShoppingCart className="pc-cart-icon" />
            Add to Cart
          </button>
        )}
        
        <button
          className="pc-buy-now-btn"
          onClick={() => navigate(`/product/${product._id}`)}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? "Out of Stock" : "Buy Now"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;