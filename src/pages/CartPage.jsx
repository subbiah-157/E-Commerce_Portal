import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { Link, useNavigate } from "react-router-dom";
import Chatbot from "../components/Chatbot";
import Navbar from "../components/Navbar";
import "../styles/CartPage.css";

// Star component
const Star = ({ filled }) => (
  <span style={{ color: filled ? "#ffc107" : "#e4e5e9", fontSize: "16px", marginRight: "2px" }}>
    ★
  </span>
);

const CartPage = () => {
  const { cart, removeFromCart, updateQty } = useContext(CartContext);
  const { currency, changeCurrency } = useContext(CurrencyContext);
  const navigate = useNavigate();

  const [selectedItems, setSelectedItems] = useState([]);

  const currencySymbols = { GBP: "£", INR: "₹", USD: "$", EUR: "€", AUD: "A$", CAD: "C$", JPY: "¥" };
  const currencyRates = { GBP: 1, INR: 0.0095, USD: 0.77, EUR: 0.87, AUD: 0.56, CAD: 0.59, JPY: 0.0056 };

  const convertPrice = (priceGBP) => {
    const priceInSelected = priceGBP / (currencyRates[currency] || 1);
    return currency === "INR" || currency === "JPY"
      ? Math.round(priceInSelected)
      : priceInSelected.toFixed(2);
  };

  const handleChangeQty = (id, size, newQty) => {
    if (newQty < 1) return;
    updateQty(id, newQty, size);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one product to checkout.");
      return;
    }
    const totalAmount = selectedItems.reduce((acc, item) => {
      const originalPrice = Number(item.price) || 0;
      const discountedPrice = item.discount
        ? originalPrice - (originalPrice * item.discount) / 100
        : originalPrice;
      const itemPrice = parseFloat(convertPrice(discountedPrice)) || 0;
      return acc + itemPrice * (item.qty || 0);
    }, 0);

    navigate("/checkout", {
      state: { checkoutItems: selectedItems, totalAmount },
    });
  };

  const toggleSelectItem = (item) => {
    const exists = selectedItems.find((i) => i._id === item._id && i.selectedSize === item.selectedSize);
    if (exists) {
      setSelectedItems(selectedItems.filter((i) => !(i._id === item._id && i.selectedSize === item.selectedSize)));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...cart]);
    }
  };

  const renderStars = (r = 0) => {
    const stars = [];
    const rounded = Math.round(r);
    for (let i = 1; i <= 5; i++) stars.push(<Star key={i} filled={i <= rounded} />);
    return <>{stars}</>;
  };

  // Calculate cart totals
  const cartTotal = selectedItems.reduce((acc, item) => {
    const originalPrice = Number(item.price) || 0;
    const discountedPrice = item.discount
      ? originalPrice - (originalPrice * item.discount) / 100
      : originalPrice;
    const itemPrice = parseFloat(convertPrice(discountedPrice)) || 0;
    return acc + itemPrice * (item.qty || 0);
  }, 0);

  const cartCount = selectedItems.reduce((acc, item) => acc + (item.qty || 0), 0);

  return (
    <><Navbar />
      <div className="cart-container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <div className="currency-selector">
            <label htmlFor="currency" style={{ color: "white" }}>Currency: </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
            >
              {Object.keys(currencySymbols).map((cur) => (
                <option key={cur} value={cur}>
                  {cur} ({currencySymbols[cur]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-content">
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added any items to your cart yet.</p>
              <Link to="/" className="continue-shopping-btn">Continue Shopping</Link>
            </div>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              <div className="cart-items-header">
                <div className="select-all">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === cart.length && cart.length > 0}
                    onChange={toggleSelectAll}
                    id="select-all"
                  />
                  <label htmlFor="select-all">Select all ({cart.length} items)</label>
                </div>
                <div className="price-header">Price</div>
              </div>

              {cart.map((item, index) => {
                const originalPrice = Number(item.price) || 0;
                const discountedPrice = item.discount
                  ? originalPrice - (originalPrice * item.discount) / 100
                  : originalPrice;
                const convertedOriginal = convertPrice(originalPrice);
                const convertedDiscounted = convertPrice(discountedPrice);
                const itemTotal = (parseFloat(convertedDiscounted) || 0) * (item.qty || 0);
                const rating = item.rating
                  ? item.rating
                  : (Math.random() * (4.4 - 3.9) + 3.9).toFixed(1);
                const isOutOfStock = item.stock === 0;
                const isSelected = !!selectedItems.find((i) => i._id === item._id && i.selectedSize === item.selectedSize);

                return (
                  <div key={`${item._id}-${item.selectedSize || index}`} className="cart-item">
                    <div className="item-select">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item)}
                        id={`item-${index}`}
                      />
                    </div>
                    <div className="item-image">
                      {item.image ? (
                        <Link to={`/product/${item._id}`}>
                          <img
                            src={item.image}
                            alt={item.name || "Product image"}
                            onError={(e) => {
                              e.target.src = "/placeholder.png";
                              e.target.onerror = null;
                            }}
                          />
                        </Link>
                      ) : (
                        <div className="image-placeholder">No Image</div>
                      )}
                    </div>

                    <div className="item-details">
                      <h3 className="item-name">{item.name || "Product"}</h3>

                      <div className="item-rating">
                        {renderStars(rating)}
                        <span className="rating-value">({rating})</span>
                      </div>

                      {item.selectedSize && (
                        <div className="item-size">
                          <strong>Size: </strong>
                          <span>{item.selectedSize}</span>
                        </div>
                      )}

                      <div className="item-stock">
                        {isOutOfStock ? (
                          <span className="out-of-stock">Out of Stock</span>
                        ) : (
                          <span className="in-stock">In Stock</span>
                        )}
                      </div>

                      <div className="item-actions">
                        <div className="quantity-selector">
                          <button
                            onClick={() => handleChangeQty(item._id, item.selectedSize, (item.qty || 1) - 1)}
                            disabled={item.qty <= 1}
                          >−</button>
                          <span>{item.qty || 1}</span>
                          <button
                            onClick={() => handleChangeQty(item._id, item.selectedSize, (item.qty || 1) + 1)}
                            disabled={item.qty >= item.stock}
                          >+</button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item._id, item.selectedSize)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                        {/* <button 
  onClick={() => navigate(`/product/${item._id}`)} 
  className="remove-btn"
>
  View Product
</button> */}

                      </div>
                    </div>

                    <div className="item-pricing">
                      {item.discount ? (
                        <>
                          <div className="discounted-price">
                            {currencySymbols[currency]}{convertedDiscounted}
                          </div>
                          <div className="original-price">
                            {currencySymbols[currency]}{convertedOriginal}
                          </div>
                          <div className="discount-badge">
                            Save {item.discount}%
                          </div>
                        </>
                      ) : (
                        <div className="regular-price">
                          {currencySymbols[currency]}{convertedOriginal}
                        </div>
                      )}

                      <div className="item-total">
                        Total: {currencySymbols[currency]}{itemTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-summary">
              <div className="summary-card">
                <h3>Order Summary</h3>

                <div className="summary-row">
                  <span>Items ({cartCount}) :</span>
                  &nbsp;<span>{currencySymbols[currency]}{cartTotal.toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span>Shipping :</span>
                  &nbsp;<span className="free-shipping">FREE</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total">
                  <span>Total :</span>
                  &nbsp;<span>{currencySymbols[currency]}{cartTotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="checkout-btn"
                  disabled={selectedItems.length === 0}
                >
                  Proceed to Checkout ({selectedItems.length} items)
                </button>

                <Link to="/" className="continue-shopping-link">Continue Shopping</Link>
              </div>
            </div>
          </div>
        )}
        <Chatbot />
      </div>
    </>
  );
};

export default CartPage;