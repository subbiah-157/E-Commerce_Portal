import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  // FaLink,
  FaHome,
  FaInfoCircle,
  FaConciergeBell,
  FaAddressCard,
  FaUserCircle, FaBoxOpen, FaShoppingCart, FaHeart
} from "react-icons/fa";
import "../styles/Footer.css";

const Footer = () => {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/company`)
      .then((res) => setCompany(res.data.data))
      .catch((err) => console.error("Error fetching company details:", err));
  }, []);

  if (!company) return null;

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company Info */}
        <div className="footer-section">
          <h3 className="footer-heading">{company.name}</h3>
          <p className="footer-about">{company.about}</p>
          <div className="social-container">
            {company.facebook && (
              <a href={company.facebook} target="_blank" rel="noreferrer" className="social-link">
                <FaFacebook size={16} />
              </a>
            )}
            {company.twitter && (
              <a href={company.twitter} target="_blank" rel="noreferrer" className="social-link">
                <FaTwitter size={16} />
              </a>
            )}
            {company.instagram && (
              <a href={company.instagram} target="_blank" rel="noreferrer" className="social-link">
                <FaInstagram size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="footer-section">
          <h3 className="footer-heading">Address</h3>
          <div className="contact-item">
            <FaMapMarkerAlt className="contact-icon" />
            <span>
              {company.street}, {company.city}, {company.district},<br />
              {company.state} - {company.postalCode}, {company.country}
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3 className="footer-heading">Quick Links</h3>
          <div className="quick-links">
            <a href="/" className="footer-link">
              <FaHome className="footer-icon" /> Home
            </a>
            <a href="/profile" className="footer-link">
              <FaUserCircle className="footer-icon" /> My Profile
            </a>
            <a href="/myorders" className="footer-link">
              <FaBoxOpen className="footer-icon" /> My Orders
            </a>
            <a href="/cart" className="footer-link">
              <FaShoppingCart className="footer-icon" /> My Carts
            </a>
            <a href="/wishlist" className="footer-link">
              <FaHeart className="footer-icon" /> My Wishlist
            </a>
            <a href="/contact" className="footer-link">
              <FaEnvelope className="footer-icon" /> Contact Us
            </a>
          </div>
        </div>


        {/* Contact Info */}
        <div className="footer-section">
          <h3 className="footer-heading">Contact</h3>
          <div className="footer-contact">
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <span>{company.email}</span>
            </div>
            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <span>{company.phone}</span>
            </div>
            <div className="contact-item">
              <FaWhatsapp className="contact-icon" />
              <span>{company.whatsapp}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;