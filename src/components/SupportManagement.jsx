import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import "../styles/SupportManagement.css";

const SupportManagement = () => {
  const [queries, setQueries] = useState([]);
  const [activeTab, setActiveTab] = useState("Incomplete");
  const [userProfile, setUserProfile] = useState({});


  useEffect(() => {
    fetchQueries();
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUserProfile(JSON.parse(storedUser));
    }
  }, []);

  const fetchQueries = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/contact/all`);
      setQueries(res.data);
    } catch (err) {
      console.error("Error fetching queries", err);
    }
  };

   const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token"); // get JWT
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserProfile(res.data.user); // set profile
    } catch (err) {
      console.error("Error fetching user profile", err);
    }
  };

  const markAsCompleted = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/contact/${id}/complete`);
      fetchQueries(); // refresh list
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const filteredQueries = queries.filter((q) =>
    activeTab === "Incomplete" ? q.status === "Pending" : q.status === "Completed"
  );

  const pendingCount = queries.filter(q => q.status === "Pending").length;
  const completedCount = queries.filter(q => q.status === "Completed").length;

  return (
    <div className="support-new-dashboard">
      {/* Sidebar */}
      <div className="support-new-sidebar">
        <div className="support-sidebar-header">
          <h2>Support Panel</h2>
        </div>

        <div className="support-sidebar-content">
          {/* Admin Profile Section */}
          <div className="support-user-welcome">
            <div className="support-user-avatar">
              <i className="fas fa-user-shield support-avatar-icon"></i>
            </div>
            <div className="support-user-info">
              <p className="support-welcome-text">Welcome back,</p>
              <p className="support-username">{userProfile.name}</p>
              <p className="support-user-role">{userProfile.role}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="support-sidebar-nav">
            <div 
              className={`support-nav-item ${activeTab === "Profile" ? "support-nav-active" : ""}`}
              onClick={() => setActiveTab("Profile")}
            >
              <i className="fas fa-user support-nav-icon"></i>
              <span>Profile</span>
            </div>

            <div 
              className={`support-nav-item ${activeTab === "Incomplete" ? "support-nav-active" : ""}`}
              onClick={() => setActiveTab("Incomplete")}
            >
              <i className="fas fa-clock support-nav-icon"></i>
              <span>Incomplete</span>
              {pendingCount > 0 && (
                <span className="support-badge">{pendingCount}</span>
              )}
            </div>

            <div 
              className={`support-nav-item ${activeTab === "Completed" ? "support-nav-active" : ""}`}
              onClick={() => setActiveTab("Completed")}
            >
              <i className="fas fa-check-circle support-nav-icon"></i>
              <span>Completed</span>
              {completedCount > 0 && (
                <span className="support-badge support-badge-completed">{completedCount}</span>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="support-new-main">
        <div className="support-main-header">
          <h1>Support Management Dashboard</h1>
          <div className="support-header-stats">
            <div className="support-stat">
              <span className="support-stat-number">{pendingCount}</span>
              <span className="support-stat-label">Pending</span>
            </div>
            <div className="support-stat">
              <span className="support-stat-number">{completedCount}</span>
              <span className="support-stat-label">Completed</span>
            </div>
            <div className="support-stat">
              <span className="support-stat-number">{queries.length}</span>
              <span className="support-stat-label">Total</span>
            </div>
          </div>
        </div>

        <div className="support-content-area">
          {/* Profile Tab */}
          {activeTab === "Profile" && (
            <div className="support-tab-content">
              <h2 className="support-tab-title">{userProfile.role} Profile</h2>
              <div className="support-profile-card">
                <div className="support-profile-header">
                  <div className="support-profile-avatar">
                    <i className="fas fa-user-shield support-avatar-large"></i>
                  </div>
                  <div className="support-profile-info">
                    <h3>{userProfile.name}</h3>
                    <p className="support-profile-email">
                      <i className="fas fa-envelope support-info-icon"></i>
                      {userProfile.email}
                    </p>
                    <p className="support-profile-role">
                      <i className="fas fa-briefcase support-info-icon"></i>
                      {userProfile.role}
                    </p>
                  </div>
                </div>

                <div className="support-profile-stats">
                  <div className="support-profile-stat">
                    <span className="support-stat-value">{pendingCount}</span>
                    <span className="support-stat-label">Pending Queries</span>
                  </div>
                  <div className="support-profile-stat">
                    <span className="support-stat-value">{completedCount}</span>
                    <span className="support-stat-label">Resolved</span>
                  </div>
                  <div className="support-profile-stat">
                    <span className="support-stat-value">{queries.length}</span>
                    <span className="support-stat-label">Total Handled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Queries Tabs */}
          {(activeTab === "Incomplete" || activeTab === "Completed") && (
            <div className="support-tab-content">
              <div className="support-tab-header">
                <h2 className="support-tab-title">{activeTab} Queries</h2>
                <div className="support-tab-actions">
                  <span className="support-query-count">
                    {filteredQueries.length} {activeTab.toLowerCase()} queries
                  </span>
                </div>
              </div>

              {filteredQueries.length === 0 ? (
                <div className="support-no-queries">
                  <i className="fas fa-inbox support-no-queries-icon"></i>
                  <p>No {activeTab.toLowerCase()} queries found</p>
                </div>
              ) : (
                <div className="support-table-container">
                  <table className="support-data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Message</th>
                        <th>Status</th>
                        {activeTab === "Incomplete" && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQueries.map((q) => (
                        <tr key={q._id} className="support-data-row">
                          <td className="support-user-name">{q.name}</td>
                          <td className="support-user-email">{q.email}</td>
                          <td className="support-query-subject">{q.subject}</td>
                          <td className="support-query-message">{q.message}</td>
                          <td>
                            <span className={`support-status-badge ${
                              q.status === "Completed" ? "support-status-completed" : "support-status-pending"
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          {activeTab === "Incomplete" && (
                            <td>
                              <button 
                                onClick={() => markAsCompleted(q._id)}
                                className="support-complete-btn"
                              >
                                <i className="fas fa-check"></i>
                                Mark Complete
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportManagement;