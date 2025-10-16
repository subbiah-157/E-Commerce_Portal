import { useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCheck, FaTimes, FaEdit, FaMoneyBillWave, FaCreditCard,FaPlusCircle } from "react-icons/fa";
import GooglePayButton from "@google-pay/button-react";
import "../styles/OrderConfirmation.css";
import "../styles/AddressModal.css";
import Navbar from "../components/Navbar"; 
import Chatbot from "../components/Chatbot";

const currencyRates = {
  GBP: 1,
  INR: 0.0095,
  USD: 0.77,
  EUR: 0.87,
  AUD: 0.56,
  CAD: 0.59,
  JPY: 0.0056,
};

const OrderConfirmation = () => {
  const { user } = useContext(AuthContext);
  const { clearCart } = useContext(CartContext);
  const { currency, changeCurrency } = useContext(CurrencyContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { cart: initialCart } = location.state || { cart: [] };

  const [cart, setCart] = useState(initialCart);
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    houseNumber: "",
    region: "",
    district: "",
    state: "",
    pincode: "",
    regionCode: "+44",
    mobile: "",
    latitude: null,
    longitude: null,
  });
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const regionOptions = [
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+61", country: "Australia" },
    { code: "+91", country: "India" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+971", country: "UAE" },
    { code: "+86", country: "China" },
  ];

  const currencySymbols = {
    GBP: "£",
    INR: "₹",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
  };

  const convertPrice = (price, productCurrency = "GBP") => {
    const priceNumber = Number(price) || 0;
    const priceInGBP = priceNumber * (currencyRates[productCurrency] || 1);
    const priceInSelected = priceInGBP / (currencyRates[currency] || 1);
    return currency === "INR" || currency === "JPY"
      ? Math.round(priceInSelected)
      : parseFloat(priceInSelected.toFixed(2));
  };

  const fetchUserDetails = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = res.data;
      const region = data.region || data.regionName || "";
      setUserDetails((prev) => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        houseNumber: data.houseNumber || prev.houseNumber,
        region,
        district: data.district || prev.district,
        state: data.state || prev.state,
        pincode: data.pincode || prev.pincode,
        regionCode: data.regionCode || prev.regionCode || "+44",
        mobile: data.mobile || prev.mobile,
      }));
    } catch (err) {
      console.error("Failed to fetch user details:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) fetchUserDetails();
  }, [user, fetchUserDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Function to validate address
  const validateAddress = () => {
    const requiredFields = ['houseNumber', 'region', 'district', 'state', 'pincode', 'mobile'];
    const emptyFields = requiredFields.filter(field => 
      !userDetails[field] || userDetails[field].toString().trim() === ''
    );

    if (emptyFields.length > 0) {
      const fieldNames = {
        houseNumber: 'House Number',
        region: 'Region/Area',
        district: 'District',
        state: 'State',
        pincode: 'Pincode',
        mobile: 'Mobile Number'
      };
      
      const missingFields = emptyFields.map(field => fieldNames[field]).join(', ');
      alert(`Please fill in the following address details: ${missingFields}`);
      return false;
    }

    // Validate mobile number format
    const mobileRegex = /^[0-9]{10,15}$/;
    const mobileWithoutCode = userDetails.mobile.replace(/[^0-9]/g, '');
    if (!mobileRegex.test(mobileWithoutCode)) {
      alert("Please enter a valid mobile number (10-15 digits)");
      return false;
    }

    // Validate pincode format
    const pincodeRegex = /^[0-9]{4,10}$/;
    if (!pincodeRegex.test(userDetails.pincode)) {
      alert("Please enter a valid pincode (4-10 digits)");
      return false;
    }

    return true;
  };

  const saveNewAddress = async () => {
    if (!user?.id) return alert("User not found");
    
    // Validate address before saving
    if (!validateAddress()) {
      return; // Stop execution if validation fails
    }
    
    try {
      await axios.put(`${API_BASE_URL}/api/users/${user.id}`, userDetails, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setShowAddressModal(false);
      alert("User details updated successfully!");
    } catch (err) {
      console.error("Error updating details:", err);
      alert("Failed to update details");
    }
  };

  const fetchAddressByPincode = async () => { 
  if (!userDetails.pincode) return alert("Please enter a postal code");

  try {
    const GEOAPIFY_API_KEY = "bf58eac2ef4d43d3b7c5661f657f2a03"; // ideally from env
    const res = await axios.get("https://api.geoapify.com/v1/geocode/search", {
      params: { 
        text: userDetails.pincode, 
        apiKey: GEOAPIFY_API_KEY
      },
    });

    const feature = res.data.features?.[0];
    if (!feature) return alert("Address not found for this postal code");

    const props = feature.properties;

    const district = props.state_district || props.county || props.city || "";

    // Automatically set country and region code based on state
    let country = prev => prev.country || "";
    let countryCode = userDetails.regionCode; 
    if (props.state === "Tamil Nadu") {
      country = "India";
      countryCode = "+91";
    }
    
    setUserDetails((prev) => ({
      ...prev,
      houseNumber: prev.houseNumber, // keep manual house number
      region: props.country,
      district: district,
      state: props.state || prev.state,
      regionCode: countryCode,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
    }));

    alert("Address fetched successfully!");
  } catch (err) {
    console.error("Error fetching address:", err);
    alert("Failed to fetch address");
  }
};




  const incrementQty = (index) => {
    const updatedCart = [...cart];
    if (updatedCart[index].qty < (updatedCart[index].stock || 1)) {
      updatedCart[index].qty += 1;
    } else {
      alert("This product is out of stock");
    }
    setCart(updatedCart);
  };

  const decrementQty = (index) => {
    const updatedCart = [...cart];
    if (updatedCart[index].qty > 1) updatedCart[index].qty -= 1;
    setCart(updatedCart);
  };

  const getDiscountedPrice = (item) => {
    const price = convertPrice(item.price, item.currency);
    if (!item.discount) return price;
    return parseFloat((price * (1 - item.discount / 100)).toFixed(2));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + getDiscountedPrice(item) * item.qty,
    0
  );

  const placeOrder = async (paymentId = null, paymentStatusOverride = null) => {
    if (!user) return alert("Please login first");

    // Validate address before placing order
    if (!validateAddress()) {
      return; // Stop execution if validation fails
    }

    const outOfStockItem = cart.find(item => item.qty > (item.stock || 0));
    if (outOfStockItem) return alert(`Product "${outOfStockItem.name}" is out of stock`);

    setLoading(true);

    const paymentStatus = paymentMethod === "cod" ? "Pending" : paymentStatusOverride || "Pending";

    const productsTable = cart.map((item) => {
      // Convert original price based on selected currency
      const originalPrice = convertPrice(item.price, item.currency);
      const discountedPrice = getDiscountedPrice(item);

      // Ensure selectedSize is always a string
      let selectedSize = item.selectedSize || item.size || item.selectedOptions?.size || null;
      if (Array.isArray(selectedSize)) selectedSize = selectedSize.join(", "); // convert array to string

      // Ensure sizeInches is picked for home category or inches field
      const sizeInches = item.sizeInches || item.inchs || null;

      // Ensure category, subCategory, subSubCategory are always defined
      const category = item.category || "Uncategorized";
      const subCategory = item.subCategory || "N/A";
      const subSubCategory = item.subSubCategory || "N/A";

      // Calculate total for this product
      const total = parseFloat((discountedPrice * (item.qty || 1)).toFixed(2));

      return {
        name: item.name || "Unknown Product",
        qty: item.qty || 1,
        originalPrice,
        discount: item.discount || 0,
        discountedPrice,
        selectedSize,
        selectedOptions: item.selectedOptions || {},
        category,
        subCategory,
        subSubCategory,
        sizeInches,
        ram: item.ram || null,
        storage: item.storage || null,
        total,
      };
    });

    const totalAmount = productsTable.reduce((sum, p) => sum + p.total, 0);

    const orderData = {
      userId: user.id,
      userDetails: {
        name: userDetails.name || "",
        email: userDetails.email || "",
        houseNumber: userDetails.houseNumber || "",
        region: userDetails.region || "",
        district: userDetails.district || "",
        state: userDetails.state || "",
        pincode: userDetails.pincode || "",
        regionCode: userDetails.regionCode || "+44",
        mobile: userDetails.mobile || "",
      },
      paymentMethod,
      paymentId,
      paymentStatus,
      products: productsTable.map(item => ({
        name: item.name || "Unknown Product",
        qty: Number(item.qty) || 1,
        originalPrice: Number(item.originalPrice) || 0,
        discount: Number(item.discount) || 0,
        discountedPrice: Number(item.discountedPrice) || 0,
        selectedSize: item.selectedSize || null,
        selectedOptions: item.selectedOptions || {},
        category: item.category || "Uncategorized",
        subCategory: item.subCategory || "N/A",
        subSubCategory: item.subSubCategory || "N/A",
        sizeInches: item.sizeInches || null,
        ram: item.ram || null,
        storage: item.storage || null,
        total: Number(item.total) || 0,
      })),
      totalAmount: Number(totalAmount) || 0,
      currency,
      orderStatus: { placeOrder: true, shipping: false, delivery: false },
      createdAt: new Date().toISOString(),
    };

    try {
      await axios.post(`${API_BASE_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      alert("Order placed successfully!");
      clearCart();
      navigate("/myorders");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error || "Failed to place order. Please check stock availability."
      );
    }

    setLoading(false);
  };

  const renderSizeInfo = (item) => {
    if (item.selectedSize) return item.selectedSize;
    if (item.size) return item.size;
    if (item.selectedOptions?.size) return item.selectedOptions.size;
    if (item.inchs) return `${item.inchs} inches`;
    return "N/A";
  };

  // Check if a product is an electronic item
  const isElectronics = (item) => {
    const electronicsCategories = ["electronics", "computers", "phones", "laptops", "tablets"];
    return item.category && electronicsCategories.includes(item.category.toLowerCase());
  };




  return (
    <>
      <Navbar />
      <div className="order-confirmation-container">
        <h2>Order Confirmation</h2>

        {/* Currency Selector */}
        <div className="currency-selector">
          <label htmlFor="currency">Select Currency: </label>
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

        {/* User Info */}
        <div className="section">
          <h3>Your Information</h3>
          <input 
            type="text" 
            name="name" 
            placeholder="Name" 
            value={userDetails.name} 
            onChange={handleChange} 
            className="input-field" 
          />
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            value={userDetails.email} 
            onChange={handleChange} 
            className="input-field" 
          />
          <select 
            name="regionCode" 
            value={userDetails.regionCode} 
            onChange={handleChange} 
            className="input-field"
          >
            {regionOptions.map((option, index) => (
              <option key={index} value={option.code}>
                {option.country} ({option.code})
              </option>
            ))}
          </select>
          <input 
            type="text" 
            name="mobile" 
            placeholder="Mobile Number" 
            value={userDetails.mobile} 
            onChange={handleChange} 
            className="input-field" 
          />
          <button onClick={saveNewAddress} className="btn btn-primary">
            <FaEdit /> Update Info
          </button>
        </div>

        {/* Delivery Address */}
        <div className="section">
          <h3>Delivery Address</h3>
          <div className="address-display">
            {userDetails.houseNumber && userDetails.region && userDetails.district && userDetails.state && userDetails.pincode ? (
              <p>{userDetails.houseNumber}, {userDetails.region}, {userDetails.district}, {userDetails.state} - {userDetails.pincode}</p>
            ) : (
              <p className="address-warning" style={{color: 'red', fontWeight: 'bold'}}>
                ⚠️ Please complete your address details to place an order
              </p>
            )}
            <p><strong>Phone:</strong> {userDetails.regionCode} {userDetails.mobile}</p>
          </div>
          <button onClick={() => setShowAddressModal(true)} className="btn btn-primary">
            <FaEdit /> Change / Add Address
          </button>
        </div>

        {/* Cart Table */}
        <div className="section">
          <h3>Products in Your Cart</h3>
          <div className="cart-table-container">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Sub-Subcategory</th>
                  <th>Size/Inches</th>
                  <th>RAM</th>
                  <th>ROM</th>
                  <th>Original Price</th>
                  <th>Discount %</th>
                  <th>Price After Discount</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => {
                  const originalPrice = convertPrice(item.price, item.currency);
                  const discountedPrice = getDiscountedPrice(item);
                  const inStock = item.qty <= (item.stock || 0);
                  const electronicItem = isElectronics(item);
                  
                  return (
                    <tr key={index}>
                      <td>{item.name || "Unknown Product"}</td>
                      <td>{item.category || "N/A"}</td>
                      <td>{item.subCategory || "N/A"}</td>
                      <td>{item.subSubCategory || "N/A"}</td>
                      <td>{renderSizeInfo(item)}</td>
                      <td>{electronicItem ? (item.ram || "N/A") : "-"}</td>
                      <td>{electronicItem ? (item.storage || "N/A") : "-"}</td>
                      <td>{currencySymbols[currency]} {originalPrice}</td>
                      <td>{item.discount || 0}%</td>
                      <td>{currencySymbols[currency]} {discountedPrice}</td>
                      <td>
                        <div className="qty-controls">
                          <button className="qty-btn" onClick={() => decrementQty(index)}>-</button>
                          {item.qty}
                          <button className="qty-btn" onClick={() => incrementQty(index)}>+</button>
                        </div>
                      </td>
                      <td>{currencySymbols[currency]} {(discountedPrice * item.qty).toFixed(2)}</td>
                      <td className={inStock ? "stock-in" : "stock-out"}>
                        {inStock ? <FaCheck /> : <FaTimes />} {inStock ? "In Stock" : "Out of Stock"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="total-amount">
            Total After Discount: {currencySymbols[currency]} {totalAmount.toFixed(2)}
          </div>
        </div>

        {/* Payment Method */}
        <div className="section">
          <h3>Payment Method</h3>
          <div className="payment-options">
            <label className="payment-option">
              <input 
                type="radio" 
                name="paymentMethod" 
                value="online" 
                checked={paymentMethod === "online"} 
                onChange={(e) => setPaymentMethod(e.target.value)} 
              /> 
              <FaCreditCard /> Online Payment
            </label>
            <label className="payment-option">
              <input 
                type="radio" 
                name="paymentMethod" 
                value="cod" 
                checked={paymentMethod === "cod"} 
                onChange={(e) => setPaymentMethod(e.target.value)} 
              /> 
              <FaMoneyBillWave /> Cash on Delivery
            </label>
          </div>
        </div>

        {/* Place Order */}
        <div className="section">
          {paymentMethod === "online" ? (
            <div className="google-pay-container">
              <GooglePayButton
                environment="TEST"
                buttonSizeMode="fill"
                buttonColor="black"
                paymentRequest={{
                  apiVersion: 2,
                  apiVersionMinor: 0,
                  allowedPaymentMethods: [
                    {
                      type: "CARD",
                      parameters: {
                        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                        allowedCardNetworks: ["VISA", "MASTERCARD"],
                      },
                      tokenizationSpecification: {
                        type: "PAYMENT_GATEWAY",
                        parameters: {
                          gateway: "example", // replace with your gateway
                          gatewayMerchantId: "exampleGatewayMerchantId",
                        },
                      },
                    },
                  ],
                  merchantInfo: {
                    merchantId: "01234567890123456789", // your Merchant ID
                    merchantName: "Your Shop Name",
                  },
                  transactionInfo: {
                    totalPriceStatus: "FINAL",
                    totalPriceLabel: "Total",
                    totalPrice: totalAmount.toFixed(2),
                    currencyCode: currency,
                    countryCode: "US",
                  },
                }}
                onLoadPaymentData={async (paymentData) => {
                  console.log("Google Pay Success", paymentData);
                  await placeOrder(paymentData.paymentMethodData.tokenizationData.token, "Completed");
                }}
                onCancel={() => {
                  console.log("Payment Cancelled");
                  alert("Payment was cancelled.");
                }}
                onError={(error) => {
                  console.error("Google Pay Error", error);
                  alert("Payment failed. Try again.");
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => placeOrder()}
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading || cart.some(item => item.qty > (item.stock || 0))}
            >
              {loading
                ? "Processing..."
                : cart.some(item => item.qty > (item.stock || 0))
                  ? "Out of Stock"
                  : "Place Order (COD)"}
            </button>
          )}
        </div>
  

      {/* Address Modal - This will appear on top of everything */}
      {/* Address Modal - This will appear on top of everything */}
{showAddressModal && (
  <div className="address-modal-overlay">
    <div className="address-modal-content">
      <div className="address-modal-header">
        <h3 className="updaddhead" style={{color:"white"}}>Update Delivery Address</h3>
        <button
          className="address-modal-close"
          onClick={() => setShowAddressModal(false)}
        >
          <FaTimes />
        </button>
      </div>

      <div className="address-form-grid">
        {/* Add New Address Button */}
        <div className="form-group full-width">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setUserDetails((prev) => ({
                ...prev,
                houseNumber: "",
                region: "",
                district: "",
                state: "",
                pincode: "",
                mobile: "",
              }))
            }
          >
            <FaPlusCircle /> Add New Address
          </button>
        </div>

        {/* Pincode at the top */}
        <div className="form-group">
          <label htmlFor="pincode">Pincode </label>
          <input
            type="text"
            id="pincode"
            name="pincode"
            placeholder="Enter pincode"
            value={userDetails.pincode}
            onChange={handleChange}
            className="form-input"
            required
          />
          <button
            type="button"
            className="btn btn-fetch"
            onClick={fetchAddressByPincode}
          >
            Get Address
          </button>
        </div>

        {[ 
          { key: 'houseNumber', label: 'House Number / Street' },
          { key: 'region', label: 'Region' },
          { key: 'district', label: 'District' },
          { key: 'state', label: 'State' },
          { key: 'mobile', label: 'Mobile' }
        ].map(({ key, label }) => (
          <div className={`form-group ${key === 'mobile' ? 'full-width' : ''}`} key={key}>
            <label htmlFor={key}>{label}</label>
            <input
              type="text"
              id={key}
              name={key}
              placeholder={`Enter ${label}`}
              value={userDetails[key]}
              onChange={handleChange}
              className="form-input"
              required={key === 'mobile'}
              disabled={['region','district','state'].includes(key)}
            />
          </div>
        ))}

        <div className="form-group">
          <label htmlFor="regionCode">Country Code</label>
          <select
            id="regionCode"
            name="regionCode"
            value={userDetails.regionCode}
            onChange={handleChange}
            className="form-input"
          >
            {regionOptions.map((option, idx) => (
              <option key={idx} value={option.code}>
                {option.country} ({option.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="address-modal-actions">
        <button
          className="btn btn-cancel"
          onClick={() => setShowAddressModal(false)}
        >
          <FaTimes /> Cancel
        </button>
        <button
          className="btn btn-save"
          onClick={saveNewAddress}
        >
          <FaCheck /> Save Address
        </button>
      </div>
    </div>
  </div>
)}




      <Chatbot />
      </div>

    </>
  );
};

export default OrderConfirmation;