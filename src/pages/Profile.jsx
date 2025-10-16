import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { 
  FaUser, FaEnvelope, FaPhone, FaHome, 
  FaMapMarkerAlt, FaCity, FaSave, FaEdit,
  FaGlobe, FaCheckCircle
} from "react-icons/fa";
import API_BASE_URL from "../config";
import "../styles/Profile.css";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    regionCode: "+91",
    mobile: "",
    houseNumber: "",
    district: "",
    state: "",
    pincode: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const countryCodes = [
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

  // Load profile
  useEffect(() => {
    if (user?.id) {
      fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setProfile({
            name: data.name || "",
            email: data.email || "",
            regionCode: data.regionCode || "+91",
            mobile: data.mobile || "",
            houseNumber: data.houseNumber || "",
            district: data.district || "",
            state: data.state || "",
            pincode: data.pincode || "",
          });
        })
        .catch((err) => console.error("Error loading profile:", err));
    }
  }, [user]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`,{
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();
      setIsSaved(true);
      setIsEditing(false);
      
      // Reset saved status after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
      
      setProfile((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isSaved) setIsSaved(false);
  };

  return (
    <><Navbar />
    <div className="profile-page-container">
      <div className="profile-page-header">
        <h1 className="profile-page-title">My Profile</h1>
        <div className="profile-page-actions">
          {isEditing ? (
            <button className="profile-btn-save" onClick={handleSave}>
              <FaSave className="profile-btn-icon" />
              Save Changes
            </button>
          ) : (
            <button className="profile-btn-edit" onClick={toggleEdit}>
              <FaEdit className="profile-btn-icon" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {isSaved && (
        <div className="profile-save-notification">
          <FaCheckCircle className="profile-success-icon" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <div className="profile-card-container">
        <div className="profile-avatar-section">
          <div className="profile-avatar-circle">
            <FaUser className="profile-avatar-icon" />
          </div>
          <h2 className="profile-user-name">{profile.name || "User Name"}</h2>
        </div>

        <div className="profile-form-container">
          <div className="profile-form-section">
            <h3 className="profile-section-title">
              <FaUser className="profile-section-icon" />
              Personal Information
            </h3>
            
            <div className="profile-form-row">
              <div className="profile-form-group">
                <label className="profile-input-label">
                  <FaUser className="profile-input-icon" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="profile-form-input"
                  disabled={!isEditing}
                />
              </div>
              
              <div className="profile-form-group">
                <label className="profile-input-label">
                  <FaEnvelope className="profile-input-icon" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="profile-form-input"
                  disabled
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-input-label">
                <FaPhone className="profile-input-icon" />
                Mobile Number
              </label>
              <div className="profile-mobile-input-group">
                <select 
                  name="regionCode" 
                  value={profile.regionCode} 
                  onChange={handleChange} 
                  className="profile-country-code-select"
                  disabled={!isEditing}
                >
                  {countryCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.country} ({c.code})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="mobile"
                  value={profile.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  className="profile-mobile-input"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <h3 className="profile-section-title">
              <FaHome className="profile-section-icon" />
              Address Information
            </h3>
            
            <div className="profile-form-group">
              <label className="profile-input-label">
                <FaHome className="profile-input-icon" />
                House/Apartment Number
              </label>
              <input
                type="text"
                name="houseNumber"
                value={profile.houseNumber}
                onChange={handleChange}
                className="profile-form-input"
                disabled={!isEditing}
              />
            </div>
            
            <div className="profile-form-row">
              <div className="profile-form-group">
                <label className="profile-input-label">
                  <FaCity className="profile-input-icon" />
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={profile.district}
                  onChange={handleChange}
                  className="profile-form-input"
                  disabled={!isEditing}
                />
              </div>
              
              <div className="profile-form-group">
                <label className="profile-input-label">
                  <FaMapMarkerAlt className="profile-input-icon" />
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={profile.state}
                  onChange={handleChange}
                  className="profile-form-input"
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="profile-form-group">
              <label className="profile-input-label">
                <FaGlobe className="profile-input-icon" />
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                value={profile.pincode}
                onChange={handleChange}
                className="profile-form-input"
                disabled={!isEditing}
                style={{marginBottom:"2rem"}}
              />
            </div>
          </div>
        </div>
      </div>
      <Chatbot />
    </div>
    </>
  );
}