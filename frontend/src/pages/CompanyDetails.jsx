import React, { useEffect, useState } from "react";   
import axios from "axios";
import "../styles/CompanyDetails.css";

// Import icons
import {
  FaBuilding, FaFileAlt, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaGlobe, FaFacebook, FaTwitter, FaInstagram, FaWhatsapp,
  FaMoneyBillWave, FaUniversity, FaIdCard, FaBullseye, FaEye,
  FaSave, FaTrash, FaUpload, FaPlusCircle, FaEdit
} from "react-icons/fa";

const CompanyDetails = () => {
  const [company, setCompany] = useState({
    name: "",
    type: "",
    registrationNumber: "",
    about: "",
    street: "",
    city: "",
    district: "",
    state: "",
    postalCode: "",
    country: "",
    email: "",
    phone: "",
    whatsapp: "",
    website: "",
    facebook: "",
    twitter: "",
    instagram: "",
    mission: "",
    vision: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    swift: "",
    taxNumber: "",
    logo: null,
  });

  const [logoPreview, setLogoPreview] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompanyDetails = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/company");
      if (res.data.data) {
        setCompany({
          ...res.data.data,
          logo: null, // We don't auto-populate file input
        });
        if (res.data.data.logoUrl) {
          setLogoPreview(`http://localhost:5000${res.data.data.logoUrl}`);
        }
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  const handleChange = (e) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCompany({ ...company, logo: file });
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setCompany({
      name: "",
      type: "",
      registrationNumber: "",
      about: "",
      street: "",
      city: "",
      district: "",
      state: "",
      postalCode: "",
      country: "",
      email: "",
      phone: "",
      whatsapp: "",
      website: "",
      facebook: "",
      twitter: "",
      instagram: "",
      mission: "",
      vision: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
      swift: "",
      taxNumber: "",
      logo: null,
    });
    setLogoPreview("");
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      for (const key in company) {
        if (company[key] !== null && company[key] !== undefined) {
          formData.append(key, company[key]);
        }
      }

      const res = await axios.post(
        "http://localhost:5000/api/company",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Company details saved successfully!");
      setCompany({ ...res.data.data, logo: null });
      setIsEditing(true);
      if (res.data.data.logoUrl) {
        setLogoPreview(`http://localhost:5000${res.data.data.logoUrl}`);
      }
    } catch (err) {
      console.error("Error saving company details:", err);
      alert("Failed to save company details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  return (
    <div className="company-details-container">
      <div className="company-header">
        <h2 className="company-title">
          <FaBuilding className="title-icon" />
          Company Details
        </h2>
        <p className="company-subtitle">Manage your company information and branding</p>
      </div>

      <form onSubmit={handleSubmit} className="company-form">
        {/* Logo Section */}
        <div className="form-section logo-section">
          <h3 className="section-title">
            <FaUpload className="section-icon" />
            Company Logo
          </h3>
          <div className="logo-upload-container">
            <div className="logo-preview">
              {logoPreview ? (
                <img src={logoPreview} alt="Company Logo" className="logo-image" />
              ) : (
                <div className="logo-placeholder">
                  <FaBuilding className="placeholder-icon" />
                  <span>Upload Logo</span>
                </div>
              )}
            </div>
            <label className="file-input-label">
              <input 
                type="file" 
                name="logo" 
                onChange={handleFileChange} 
                accept="image/*"
                className="file-input"
              />
              <span className="upload-button">
                <FaUpload className="upload-icon" />
                Choose File
              </span>
            </label>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h3 className="section-title">
            <FaBuilding className="section-icon" />
            Basic Information
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <FaBuilding className="input-icon" />
                Company Name
              </label>
              <input 
                type="text" 
                name="name" 
                placeholder="Enter company name" 
                value={company.name} 
                onChange={handleChange} 
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaFileAlt className="input-icon" />
                Company Type
              </label>
              <input 
                type="text" 
                name="type" 
                placeholder="e.g., Private Limited, LLC" 
                value={company.type} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaIdCard className="input-icon" />
                Registration Number
              </label>
              <input 
                type="text" 
                name="registrationNumber" 
                placeholder="Registration number" 
                value={company.registrationNumber} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">
                <FaFileAlt className="input-icon" />
                About Company
              </label>
              <textarea 
                name="about" 
                placeholder="Brief description of your company" 
                value={company.about} 
                onChange={handleChange} 
                className="form-textarea"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="form-section">
          <h3 className="section-title">
            <FaBullseye className="section-icon" />
            Mission & Vision
          </h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">
                <FaBullseye className="input-icon" />
                Mission Statement
              </label>
              <textarea 
                name="mission" 
                placeholder="Company mission statement" 
                value={company.mission} 
                onChange={handleChange} 
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">
                <FaEye className="input-icon" />
                Vision Statement
              </label>
              <textarea 
                name="vision" 
                placeholder="Company vision statement" 
                value={company.vision} 
                onChange={handleChange} 
                className="form-textarea"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="form-section">
          <h3 className="section-title">
            <FaMapMarkerAlt className="section-icon" />
            Address Information
          </h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">
                <FaMapMarkerAlt className="input-icon" />
                Street Address
              </label>
              <input 
                type="text" 
                name="street" 
                placeholder="Street address" 
                value={company.street} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <input 
                type="text" 
                name="city" 
                placeholder="City" 
                value={company.city} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">District</label>
              <input 
                type="text" 
                name="district" 
                placeholder="District" 
                value={company.district} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">State</label>
              <input 
                type="text" 
                name="state" 
                placeholder="State" 
                value={company.state} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Postal Code</label>
              <input 
                type="text" 
                name="postalCode" 
                placeholder="Postal code" 
                value={company.postalCode} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Country</label>
              <input 
                type="text" 
                name="country" 
                placeholder="Country" 
                value={company.country} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="form-section">
          <h3 className="section-title">
            <FaPhone className="section-icon" />
            Contact Details
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <FaEnvelope className="input-icon" />
                Email Address
              </label>
              <input 
                type="email" 
                name="email" 
                placeholder="company@email.com" 
                value={company.email} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaPhone className="input-icon" />
                Phone Number
              </label>
              <input 
                type="text" 
                name="phone" 
                placeholder="Phone number" 
                value={company.phone} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaWhatsapp className="input-icon" />
                WhatsApp Number
              </label>
              <input 
                type="text" 
                name="whatsapp" 
                placeholder="WhatsApp number" 
                value={company.whatsapp} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaGlobe className="input-icon" />
                Website
              </label>
              <input 
                type="text" 
                name="website" 
                placeholder="https://company.com" 
                value={company.website} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="form-section">
          <h3 className="section-title">
            <FaGlobe className="section-icon" />
            Social Media
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <FaFacebook className="input-icon" />
                Facebook
              </label>
              <input 
                type="text" 
                name="facebook" 
                placeholder="Facebook URL" 
                value={company.facebook} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaTwitter className="input-icon" />
                Twitter
              </label>
              <input 
                type="text" 
                name="twitter" 
                placeholder="Twitter URL" 
                value={company.twitter} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaInstagram className="input-icon" />
                Instagram
              </label>
              <input 
                type="text" 
                name="instagram" 
                placeholder="Instagram URL" 
                value={company.instagram} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="form-section">
          <h3 className="section-title">
            <FaUniversity className="section-icon" />
            Financial Information
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <FaUniversity className="input-icon" />
                Bank Name
              </label>
              <input 
                type="text" 
                name="bankName" 
                placeholder="Bank name" 
                value={company.bankName} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaMoneyBillWave className="input-icon" />
                Account Number
              </label>
              <input 
                type="text" 
                name="accountNumber" 
                placeholder="Account number" 
                value={company.accountNumber} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input 
                type="text" 
                name="ifsc" 
                placeholder="IFSC code" 
                value={company.ifsc} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">SWIFT Code</label>
              <input 
                type="text" 
                name="swift" 
                placeholder="SWIFT code" 
                value={company.swift} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaIdCard className="input-icon" />
                Tax Number
              </label>
              <input 
                type="text" 
                name="taxNumber" 
                placeholder="Tax identification number" 
                value={company.taxNumber} 
                onChange={handleChange} 
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <FaSave className="btn-icon" />
                {isEditing ? 'Update' : 'Save'} Company Details
              </>
            )}
          </button>
          
          <button 
            type="button" 
            onClick={handleClear} 
            className="submit-btn"
          >
            <FaTrash className="btn-icon" />
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyDetails;