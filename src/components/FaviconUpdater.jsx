// src/components/FaviconUpdater.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config"; // ✅ use your config
import "../styles/Loader.css";

const FaviconUpdater = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/company`);
        if (res.data?.data) {
          setCompany(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching company details:", err);
      } finally {
        // Show loader for 3 seconds regardless of fetch time
        setTimeout(() => setLoading(false), 1500);
      }
    };
    fetchCompany();
  }, []);

  useEffect(() => {
    if (company?.logoUrl) {
      let link =
        document.querySelector("link[rel~='icon']") ||
        document.createElement("link");
      link.rel = "icon";
      link.href = company.logoUrl;
      document.head.appendChild(link);
    }

    if (company?.name) {
      document.title = company.name;
    }
  }, [company]);

  if (loading) {
    return (
      <div className="favicon-loader">
        {company?.logoUrl && (
          <img
            src={company.logoUrl}
            alt="Company Logo"
            className="favicon-logo"
          />
        )}
        <div className="favicon-spinner"></div>
      </div>
    );
  }

  return null;
};

export default FaviconUpdater;
