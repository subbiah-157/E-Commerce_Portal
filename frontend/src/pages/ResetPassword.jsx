import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "../styles/Login.css";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { companyLogo } = useContext(AuthContext);

  const token = location.state?.token;
  const email = location.state?.email;

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token || !email) {
      setError("Invalid or missing reset token. Please request a new password reset.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post("http://localhost:5000/api/auth/reset-password", {
        token,
        email,
        password
      });

      setMessage(res.data.message || "Password reset successfully!");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password. Please try again.");
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
              <div className="ecLogin-icon ecLogin-login-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h12.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Back to Login Section */}
          <div className="ecLogin-create-account">
            <h3>Remember your password?</h3>
            <p>Go back to login and access your account</p>
            <button 
              onClick={() => navigate("/login")} 
              className="ecLogin-create-account-btn"
              disabled={isLoading}
            >
              Back to Login
            </button>
          </div>
        </div>

        {/* Right Side - Reset Password Form */}
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
              
              <h2 className="ecLogin-title">Reset Your Password</h2>
              <p className="ecLogin-subtitle">Enter your new password below</p>
              
              {error && <div className="ecLogin-error">{error}</div>}
              {message && <div className="ecLogin-message">{message}</div>}
              
              <form onSubmit={handleReset} className="ecLogin-form">
                <div className="ecLogin-inputGroup">
                  <input
                    name="password"
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    required
                    className="ecLogin-input"
                    disabled={isLoading}
                    minLength="6"
                  />
                </div>
                
                <div className="ecLogin-inputGroup">
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    required
                    className="ecLogin-input"
                    disabled={isLoading}
                    minLength="6"
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
                    'Reset Password'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}