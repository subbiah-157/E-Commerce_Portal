import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import "../styles/CompanyDetails.css";

// Import icons
import {
  FaBuilding, FaFileAlt, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaGlobe, FaFacebook, FaTwitter, FaInstagram, FaWhatsapp,
  FaMoneyBillWave, FaUniversity, FaIdCard, FaBullseye, FaEye,
  FaSave, FaTrash, FaUpload, FaPlusCircle, FaEdit, FaClock
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
    mapLink: "",
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
    workingHours: ""
  });

  const [logoPreview, setLogoPreview] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompanyDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/company`);
      if (res.data.data) {
        const companyData = res.data.data;

        setCompany({
          ...companyData,
          logo: null, // We don't auto-populate file input
        });

        // ✅ Handle base64 Buffer or logoUrl
        if (companyData.logo?.data) {
          // Convert Buffer to base64 preview
          const base64String = `data:${companyData.logo.contentType || "image/png"
            };base64,${companyData.logo.data}`;
          setLogoPreview(base64String);
        } else if (companyData.logoUrl) {
          setLogoPreview(`${API_BASE_URL}${companyData.logoUrl}`);
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
      mapLink: "",
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
      workingHours: ""
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
        `${API_BASE_URL}/api/company`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Company details saved successfully!");
      setCompany({ ...res.data.data, logo: null });
      setIsEditing(true);
      if (res.data.data.logoUrl) {
        setLogoPreview(`${API_BASE_URL}${res.data.data.logoUrl}`);
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

  const stripIframe = (input) => {
    if (!input) return "";
    // Match iframe src
    const match = input.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) return match[1]; // return src URL only
    return input; // if input is already a URL
  };


  return (
    <div className="comp-details-container">
      <div className="comp-header">
        <h2 className="comp-title">
          <FaBuilding className="comp-title-icon" />
          Company Details
        </h2>
        <p className="comp-subtitle">Manage your company information and branding</p>
      </div>

      <form onSubmit={handleSubmit} className="comp-form">
        {/* Logo Section */}
        <div className="comp-form-section comp-logo-section">
          <h3 className="comp-section-title">
            <FaUpload className="comp-section-icon" />
            Company Logo
          </h3>
          <div className="comp-logo-upload-container">
            <div className="comp-logo-preview">
              {logoPreview ? (
                <img src={logoPreview} alt="Company Logo" className="comp-logo-image" />
              ) : (
                <div className="comp-logo-placeholder">
                  <FaBuilding className="comp-placeholder-icon" />
                  <span>Upload Logo</span>
                </div>
              )}
            </div>
            <label className="comp-file-input-label">
              <input
                type="file"
                name="logo"
                onChange={handleFileChange}
                accept="image/*"
                className="comp-file-input"
              />
              <span className="comp-upload-button">
                <FaUpload className="comp-upload-icon" />
                Choose File
              </span>
            </label>
          </div>
        </div>

        {/* Basic Information */}
        <div className="comp-form-section">
          <h3 className="comp-section-title">
            <FaBuilding className="comp-section-icon" />
            Basic Information
          </h3>
          <div className="comp-form-grid">
            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaBuilding className="comp-input-icon" />
                Company Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter company name"
                value={company.name}
                onChange={handleChange}
                className="comp-form-input"
                required
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaFileAlt className="comp-input-icon" />
                Company Type
              </label>
              <input
                type="text"
                name="type"
                placeholder="e.g., Private Limited, LLC"
                value={company.type}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaIdCard className="comp-input-icon" />
                Registration Number
              </label>
              <input
                type="text"
                name="registrationNumber"
                placeholder="Registration number"
                value={company.registrationNumber}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group comp-full-width">
              <label className="comp-form-label">
                <FaFileAlt className="comp-input-icon" />
                About Company
              </label>
              <textarea
                name="about"
                placeholder="Brief description of your company"
                value={company.about}
                onChange={handleChange}
                className="comp-form-textarea"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="comp-form-section">
          <h3 className="comp-section-title">
            <FaBullseye className="comp-section-icon" />
            Mission & Vision
          </h3>
          <div className="comp-form-grid">
            <div className="comp-form-group comp-full-width">
              <label className="comp-form-label">
                <FaBullseye className="comp-input-icon" />
                Mission Statement
              </label>
              <textarea
                name="mission"
                placeholder="Company mission statement"
                value={company.mission}
                onChange={handleChange}
                className="comp-form-textarea"
                rows={3}
              />
            </div>

            <div className="comp-form-group comp-full-width">
              <label className="comp-form-label">
                <FaEye className="comp-input-icon" />
                Vision Statement
              </label>
              <textarea
                name="vision"
                placeholder="Company vision statement"
                value={company.vision}
                onChange={handleChange}
                className="comp-form-textarea"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="comp-form-section">
          <h3 className="comp-section-title">
            <FaMapMarkerAlt className="comp-section-icon" />
            Address Information
          </h3>
          <div className="comp-form-grid">
            <div className="comp-form-group comp-full-width">
              <label className="comp-form-label">
                <FaMapMarkerAlt className="comp-input-icon" />
                Street Address
              </label>
              <input
                type="text"
                name="street"
                placeholder="Street address"
                value={company.street}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>
            <div className="comp-form-group comp-full-width">
              <label className="comp-form-label">
                <FaClock className="comp-input-icon" />
                Working Hours
              </label>
              <input
                type="text"
                name="workingHours"
                placeholder="e.g., 9 AM - 10 PM Monday to Saturday"
                value={company.workingHours || ""}
                onChange={handleChange}
                className="comp-form-input"
              />
              <small>Specify working hours in plain text.</small>
            </div>

            <div className="comp-form-group comp-full-width">
              <label className="comp-form-label">
                <FaMapMarkerAlt className="comp-input-icon" />
                Google Maps Embed URL
              </label>
              <textarea
                name="mapLink"
                placeholder='Paste iframe code or URL here'
                value={company.mapLink || ""}
                onChange={(e) => setCompany({
                  ...company,
                  mapLink: stripIframe(e.target.value)
                })}
                className="comp-form-textarea"
                rows={3}
              />
              <small>Only the URL will be stored. Example: https://www.google.com/maps/embed?... </small>
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">City</label>
              <input
                type="text"
                name="city"
                placeholder="City"
                value={company.city}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">District</label>
              <input
                type="text"
                name="district"
                placeholder="District"
                value={company.district}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">State</label>
              <input
                type="text"
                name="state"
                placeholder="State"
                value={company.state}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                placeholder="Postal code"
                value={company.postalCode}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">Country</label>
              <input
                type="text"
                name="country"
                placeholder="Country"
                value={company.country}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="comp-form-section">
          <h3 className="comp-section-title">
            <FaPhone className="comp-section-icon" />
            Contact Details
          </h3>
          <div className="comp-form-grid">
            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaEnvelope className="comp-input-icon" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="company@email.com"
                value={company.email}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaPhone className="comp-input-icon" />
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                placeholder="Phone number"
                value={company.phone}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaWhatsapp className="comp-input-icon" />
                WhatsApp Number
              </label>
              <input
                type="text"
                name="whatsapp"
                placeholder="WhatsApp number"
                value={company.whatsapp}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaGlobe className="comp-input-icon" />
                Website
              </label>
              <input
                type="text"
                name="website"
                placeholder="https://company.com"
                value={company.website}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="comp-form-section">
          <h3 className="comp-section-title">
            <FaGlobe className="comp-section-icon" />
            Social Media
          </h3>
          <div className="comp-form-grid">
            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaFacebook className="comp-input-icon" />
                Facebook
              </label>
              <input
                type="text"
                name="facebook"
                placeholder="Facebook URL"
                value={company.facebook}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaTwitter className="comp-input-icon" />
                Twitter
              </label>
              <input
                type="text"
                name="twitter"
                placeholder="Twitter URL"
                value={company.twitter}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaInstagram className="comp-input-icon" />
                Instagram
              </label>
              <input
                type="text"
                name="instagram"
                placeholder="Instagram URL"
                value={company.instagram}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="comp-form-section">
          <h3 className="comp-section-title">
            <FaUniversity className="comp-section-icon" />
            Financial Information
          </h3>
          <div className="comp-form-grid">
            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaUniversity className="comp-input-icon" />
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                placeholder="Bank name"
                value={company.bankName}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaMoneyBillWave className="comp-input-icon" />
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                placeholder="Account number"
                value={company.accountNumber}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">IFSC Code</label>
              <input
                type="text"
                name="ifsc"
                placeholder="IFSC code"
                value={company.ifsc}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">SWIFT Code</label>
              <input
                type="text"
                name="swift"
                placeholder="SWIFT code"
                value={company.swift}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>

            <div className="comp-form-group">
              <label className="comp-form-label">
                <FaIdCard className="comp-input-icon" />
                Tax Number
              </label>
              <input
                type="text"
                name="taxNumber"
                placeholder="Tax identification number"
                value={company.taxNumber}
                onChange={handleChange}
                className="comp-form-input"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="comp-form-actions">
          <button
            type="submit"
            className="comp-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="comp-loading-spinner"></div>
            ) : (
              <>
                <FaSave className="comp-btn-icon" />
                {isEditing ? 'Update' : 'Save'} Company Details
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="comp-clear-btn"
          >
            <FaTrash className="comp-btn-icon" />
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyDetails;