import { useContext, useState, useEffect } from "react";    
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CurrencyContext } from "../context/CurrencyContext";
import "../styles/Checkout.css";
import API_BASE_URL from "../config";
import { FaPlusCircle } from "react-icons/fa";
import { FaTrash, FaCheckCircle, FaMoneyBillWave } from "react-icons/fa"; 
import Navbar from "../components/Navbar"; 
import Chatbot from "../components/Chatbot";

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const { currency, changeCurrency } = useContext(CurrencyContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const currencyRates = { GBP: 1, INR: 0.0095, USD: 0.77, EUR: 0.87, AUD: 0.56, CAD: 0.59, JPY: 0.0056 };
  const currencySymbols = { GBP: "£", INR: "₹", USD: "$", EUR: "€", AUD: "A$", CAD: "C$", JPY: "¥" };

  const convertPrice = (priceGBP) => {
    const priceNumber = Number(priceGBP) || 0;
    const priceInSelected = priceNumber / (currencyRates[currency] || 1);
    return currency === "INR" || currency === "JPY" 
      ? Math.round(priceInSelected) 
      : parseFloat(priceInSelected.toFixed(2));
  };

  const getImageUrl = (img) => {
  if (!img) return "/placeholder.png"; // fallback
  if (img.startsWith("http") || img.startsWith("data:")) return img; // already full URL or base64
  return `${API_BASE_URL}${img}`; // prepend backend URL
};


  // ✅ Load items from sessionStorage on mount
  useEffect(() => {
    const storedItems = sessionStorage.getItem("checkoutItems");
    if (storedItems) {
      setCheckoutItems(JSON.parse(storedItems));
    }
  }, []);

  // ✅ Handle incoming items (merge with session storage)
  useEffect(() => {
    if (location.state?.checkoutItems) {
      const incomingItems = location.state.checkoutItems.map((item) => {
        const originalPrice = Number(item.price) || 0;
        const discountedPrice = item.discount 
          ? originalPrice - (originalPrice * item.discount) / 100 
          : originalPrice;
        return {
          ...item,
          originalPrice,
          discountedPrice,
          selectedSize: item.selectedSize || "",
        };
      });

      setCheckoutItems((prevItems) => {
        const merged = [...prevItems];
        incomingItems.forEach((item) => {
          const exists = merged.find(
            (i) => i._id === item._id && i.selectedSize === item.selectedSize
          );
          if (!exists) merged.push(item);
        });
        // ✅ Save merged items to sessionStorage
        sessionStorage.setItem("checkoutItems", JSON.stringify(merged));
        return merged;
      });
    } else if (checkoutItems.length === 0) {
      navigate("/cart");
    }
  }, [location.state, navigate]);

  // ✅ Keep sessionStorage updated whenever checkoutItems changes
  useEffect(() => {
    if (checkoutItems.length > 0) {
      sessionStorage.setItem("checkoutItems", JSON.stringify(checkoutItems));
    }
    const total = checkoutItems.reduce(
      (sum, item) => sum + convertPrice(item.discountedPrice) * item.qty,
      0
    );
    setTotalAmount(total);
  }, [checkoutItems, currency]);

  const handleConfirmOrder = () => {
    if (!user || !user.token) {
      alert("Please log in to proceed with payment.");
      return;
    }
    navigate("/orderconfirmation", {
      state: {
        cart: checkoutItems,
        totalAmount,
        currency,
      },
    });
    // ✅ Clear sessionStorage after confirming order
    sessionStorage.removeItem("checkoutItems");
  };

  const incrementQty = (index) => {
    const updatedItems = [...checkoutItems];
    updatedItems[index].qty += 1;
    setCheckoutItems(updatedItems);
  };

  const decrementQty = (index) => {
    const updatedItems = [...checkoutItems];
    if (updatedItems[index].qty > 1) updatedItems[index].qty -= 1;
    setCheckoutItems(updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = [...checkoutItems];
    updatedItems.splice(index, 1);
    setCheckoutItems(updatedItems);
    sessionStorage.setItem("checkoutItems", JSON.stringify(updatedItems));
  };

  const handleAddProduct = () => {
    navigate("/cart");
  };

  if (checkoutItems.length === 0)
    return (
      <div className="checkout-container">
        <div className="loading-message">
          <h2>Loading checkout...</h2>
        </div>
      </div>
    );

  return (
    <><Navbar />
    <div className="checkout-container">
      <div className="checkout-header">
        <h2>Checkout</h2>
      </div>

      <div className="currency-section">
        <div className="currency-selector">
          <label htmlFor="currency">Select Currency: </label>
          <select style={{color: "#333"}}
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
        <button onClick={handleAddProduct} className="add-product-btn">
          <FaPlusCircle style={{ marginRight: "8px", color: "white" }} />
          Add Product
        </button>
      </div>

      <table className="checkout-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product</th>
            <th>Attributes</th>
            <th>Size</th>
            <th>RAM</th>
            <th>Storage</th>
            <th>Original Price</th>
            <th>Discount</th>
            <th>After Discount</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {checkoutItems.map((item, index) => (
            <tr key={item._id || index}>
              <td>
                <img
                  src={getImageUrl(item.image || (item.images && item.images[0]))}
                  alt={item.name}
                  className="product-image"
                />
              </td>
              <td>{item.name}</td>
              <td>
                <div className="product-attributes">
                  {item.color && <p><strong>Color:</strong> {item.color}</p>}
                  {item.material && <p><strong>Material:</strong> {item.material}</p>}
                  {item.brand && <p><strong>Brand:</strong> {item.brand}</p>}
                  {item.category && <p><strong>Category:</strong> {item.category}</p>}
                  {item.subCategory && <p><strong>Subcategory:</strong> {item.subCategory}</p>}
                  {item.subSubCategory && <p><strong>Sub-Subcategory:</strong> {item.subSubCategory}</p>}
                </div>
              </td>
              <td>{item.selectedSize || (Array.isArray(item.size) ? item.size.join(", ") : item.size)}</td>
              <td>{item.ram || "-"}</td>
              <td>{item.storage || "-"}</td>
              <td>{currencySymbols[currency]} {convertPrice(item.originalPrice)}</td>
              <td>{item.discount ? `${item.discount}% OFF` : "-"}</td>
              <td>{currencySymbols[currency]} {convertPrice(item.discountedPrice)}</td>
              <td>
                <div className="quantity-controls">
                  <button onClick={() => decrementQty(index)} className="quantity-btn">-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => incrementQty(index)} className="quantity-btn">+</button>
                </div>
              </td>
              <td>{currencySymbols[currency]} {convertPrice(item.discountedPrice) * item.qty}</td>
              <td>
                <button onClick={() => removeItem(index)} className="remove-btn">
                  <FaTrash style={{ marginRight: "6px", color: "white" }} />
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="total-section">
        <div className="total-amount">
          <FaMoneyBillWave style={{ marginRight: "6px", color: "goldenrod" }} /> 
          Total Amount: {currencySymbols[currency]}{" "}
          {checkoutItems.reduce((sum, item) => sum + convertPrice(item.discountedPrice) * item.qty, 0)}
        </div>
        <button className="confirm-order-btn" onClick={handleConfirmOrder}>
          <FaCheckCircle style={{ marginRight: "6px", color: "white" }} />
          Confirm Order
        </button>
      </div>
      <Chatbot />
    </div>
    </>
  );
};

export default Checkout;