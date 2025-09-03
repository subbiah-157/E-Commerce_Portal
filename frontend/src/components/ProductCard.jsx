import { useContext, useEffect, useState } from "react";    
import { CartContext } from "../context/CartContext";
import { CurrencyContext } from "../context/CurrencyContext"; 
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ProductCard.css";
import { FaShoppingCart, FaStar, FaRegStar, FaStarHalfAlt, FaTruck, FaGlobe } from "react-icons/fa";

const ProductCard = ({ product }) => {
  const { addToCart, cart } = useContext(CartContext);
  const { currency, changeCurrency } = useContext(CurrencyContext);
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/reviews/${product._id}`);
        const reviews = res.data;
        setReviewCount(reviews.length);

        if (reviews.length > 0) {
          const total = reviews.reduce((sum, r) => sum + r.rating, 0);
          setRating((total / reviews.length).toFixed(1));
        } else {
          const defaultRating = (Math.random() * (4.4 - 3.9) + 3.9).toFixed(1);
          setRating(defaultRating);
        }
      } catch (err) {
        console.error("Failed to fetch rating:", err);
        const defaultRating = (Math.random() * (4.4 - 3.9) + 3.9).toFixed(1);
        setRating(defaultRating);
      }
    };
    fetchRating();
  }, [product._id]);

  const imageUrl = product.image?.startsWith("http")
    ? product.image
    : `http://localhost:5000${product.image}`;

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

  return (
    <div className="pc-card">
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

      <Link to={`/product/${product._id}`} className="pc-link">
        <div className="pc-image-container">
          <img src={imageUrl} alt={product.name} className="pc-image" />
          {product.discount && (
            <div className="pc-discount-badge">{product.discount}% OFF</div>
          )}
        </div>
        
        <h3 className="pc-name">{product.name}</h3>
      </Link>

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
          <span className="pc-current-price">{convertPrice(originalPriceGBP)}</span>
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
        <button
          className={`pc-add-to-cart-btn ${inCart ? 'pc-in-cart' : ''}`}
          onClick={() => addToCart(product)}
          disabled={isOutOfStock}
        >
          <FaShoppingCart className="pc-cart-icon" />
          {inCart ? `In Cart (${inCart.qty})` : "Add to Cart"}
        </button>
        
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
