import { useState, useEffect, useContext } from "react"; 
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import "../styles/Login.css"; // Using the same CSS as login

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await axios.post("http://localhost:5000/api/auth/register", { 
        name, 
        email, 
        password 
      });
      
      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Error registering user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ecLogin-container">
      <div className="ecLogin-content">
        {/* Left Side - Icon Animation */}
        <div className="ecLogin-animation-side">
          <div className="ecLogin-icon-animation">
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
              <div className="ecLogin-icon ecLogin-signup-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Already have account Section */}
          <div className="ecLogin-create-account">
            <h3>Already Have an Account?</h3>
            <p>Sign in to access your personalized dashboard and continue your journey with us.</p>
            <Link to="/login" className="ecLogin-create-account-btn">
              Sign In
            </Link>
          </div>
        </div>

        {/* Right Side - Signup Form */}
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
              
              <h2 className="ecLogin-title">Create Account</h2>
              <p className="ecLogin-subtitle">Join us and start your journey</p>
              
              {error && <div className="ecLogin-error">{error}</div>}
              
              <form onSubmit={handleSubmit} className="ecLogin-form">
                <div className="ecLogin-inputGroup">
                  <input
                    name="name"
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="ecLogin-input"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="ecLogin-inputGroup">
                  <input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="ecLogin-input"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="ecLogin-inputGroup">
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    'Create Account'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;