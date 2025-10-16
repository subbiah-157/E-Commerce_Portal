import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import API_BASE_URL from "../config";
import "../styles/Departments.css";

const PasswordConfirmation = () => {
  const navigate = useNavigate(); 
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: security key, 3: new password
  const [securityKey, setSecurityKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const showMessage = (type, text) => {
  setMessage({ type, text });
  if (window.messageTimeout) clearTimeout(window.messageTimeout);
  window.messageTimeout = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
};

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const emailParam = params.get("email");
  if (emailParam) setEmail(emailParam);
}, []);



  // Step 1: verify email
  const verifyEmail = async () => {
    if (!email) {
      showMessage("error", "Please enter your email");
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/departments/verify-email`, { email });
      setStep(2);
      showMessage("success", "Email verified. Please enter your security key.");
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Email not found");
    }
    setLoading(false);
  };

  // Step 2: verify security key
  const verifyKey = async () => {
    if (!securityKey) {
      showMessage("error", "Please enter your security key");
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/departments/verify-security-key`, { email, securityKey });
      setStep(3);
      showMessage("success", "Security key verified. Please set your new password.");
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Invalid security key");
    }
    setLoading(false);
  };

  // Step 3: set new password
  const updatePassword = async () => {
    if (!newPassword) {
      showMessage("error", "Please enter a new password");
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage("error", "Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/departments/set-password`, { 
        email, 
        newPassword, 
        securityKey 
      });
      
      showMessage("success", "Password updated successfully! You can now log in.");
      setEmail("");
      setSecurityKey("");
      setNewPassword("");
      setStep(1);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Error updating password");
    }
    setLoading(false);
  };

  return (
    <div className="departments-container">
      <div className="department-form">
        <h2>Set Your Password</h2>
        
        {message.text && (
          <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}>
            {message.text}
          </div>
        )}

        {step === 1 && (
          <div className="form-group">
            <label htmlFor="email">Enter Your Email</label>
            <input 
              type="email" 
              id="email"
              className="form-control"
              placeholder="Enter your email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <button 
              className="btn btn-primary"
              onClick={verifyEmail}
              disabled={loading}
              style={{ marginTop: '15px' }}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="form-group">
            <label htmlFor="securityKey">Enter Security Key</label>
            <input 
              type="text" 
              id="securityKey"
              className="form-control"
              placeholder="Enter security key from email" 
              value={securityKey} 
              onChange={e => setSecurityKey(e.target.value)} 
            />
            <button 
              className="btn btn-primary"
              onClick={verifyKey}
              disabled={loading}
              style={{ marginTop: '15px' }}
            >
              {loading ? "Verifying..." : "Verify Security Key"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="form-group">
            <label htmlFor="newPassword">Enter New Password</label>
            <input 
              type="password" 
              id="newPassword"
              className="form-control"
              placeholder="Enter new password (min. 6 characters)" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
            />
            <button 
              className="btn btn-primary"
              onClick={updatePassword}
              disabled={loading}
              style={{ marginTop: '15px' }}
            >
              {loading ? "Updating..." : "Set Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordConfirmation;