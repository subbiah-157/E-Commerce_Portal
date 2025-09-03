import { useState, useContext, useEffect, useRef } from "react"; 
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import Signup from "../pages/Signup";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef(null);

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

  useEffect(() => {
    fetchCompanyLogo();
  }, []);

  return (
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
        <div className="ecLogin-form-side">
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
              <p className="ecLogin-subtitle">Sign in to your account</p>
              
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
  );
};

export default Login;