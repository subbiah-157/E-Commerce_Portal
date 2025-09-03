import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/UserCarts.css";

// Import icons
import {
  FaShoppingCart, FaUser, FaEnvelope, FaBox, 
  FaImage, FaSearch, FaFilter, FaSortAmountDown,
  FaSortAmountUp, FaEye, FaExclamationTriangle
} from "react-icons/fa";

const UserCarts = ({ allCarts }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterDeleted, setFilterDeleted] = useState("all");

  // Filter and sort carts
  const filteredCarts = allCarts
    .filter(cart => {
      const matchesSearch = 
        cart.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cart.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cart.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterDeleted === "all" || 
        (filterDeleted === "available" && cart.product) ||
        (filterDeleted === "deleted" && !cart.product);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.user?.name || "";
          bValue = b.user?.name || "";
          break;
        case "email":
          aValue = a.user?.email || "";
          bValue = b.user?.email || "";
          break;
        case "product":
          aValue = a.product?.name || "";
          bValue = b.product?.name || "";
          break;
        case "qty":
          aValue = a.qty;
          bValue = b.qty;
          break;
        default:
          aValue = a.user?.name || "";
          bValue = b.user?.name || "";
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleViewProduct = (productId) => {
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  const getTotalItems = () => {
    return allCarts.reduce((total, cart) => total + cart.qty, 0);
  };

  const getTotalUsers = () => {
    return new Set(allCarts.map(cart => cart.user?.email)).size;
  };

  const getDeletedProducts = () => {
    return allCarts.filter(cart => !cart.product).length;
  };

  return (
    <div className="user-carts-container">
      <div className="carts-header">
        <h2 className="carts-title">
          <FaShoppingCart className="title-icon" />
          User Cart Items
        </h2>
        <p className="carts-subtitle">Manage and view all user shopping carts</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card total-carts">
          <div className="stat-icon">
            <FaShoppingCart />
          </div>
          <div className="stat-content">
            <h3>{allCarts.length}</h3>
            <p>Total Cart Items</p>
          </div>
        </div>
        
        <div className="stat-card total-items">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-content">
            <h3>{getTotalItems()}</h3>
            <p>Total Products</p>
          </div>
        </div>
        
        <div className="stat-card total-users">
          <div className="stat-icon">
            <FaUser />
          </div>
          <div className="stat-content">
            <h3>{getTotalUsers()}</h3>
            <p>Active Users</p>
          </div>
        </div>
        
        <div className="stat-card deleted-products">
          <div className="stat-icon">
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <h3>{getDeletedProducts()}</h3>
            <p>Deleted Products</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by user, email, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <select
            value={filterDeleted}
            onChange={(e) => setFilterDeleted(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Products</option>
            <option value="available">Available Only</option>
            <option value="deleted">Deleted Products</option>
          </select>
        </div>
        
        <div className="sort-box">
          {sortOrder === "asc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="product">Sort by Product</option>
            <option value="qty">Sort by Quantity</option>
          </select>
        </div>
      </div>

      {filteredCarts.length === 0 ? (
        <div className="no-carts">
          <FaShoppingCart className="no-carts-icon" />
          <p>No cart items found.</p>
          {searchTerm && <p>Try adjusting your search terms.</p>}
        </div>
      ) : (
        <div className="carts-table-container">
          <table className="carts-table">
            <thead>
              <tr>
                <th 
                  className={sortBy === "name" ? "active-sort" : ""}
                  onClick={() => handleSort("name")}
                >
                  <FaUser className="header-icon" />
                  User
                  {sortBy === "name" && (
                    <span className="sort-indicator">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th 
                  className={sortBy === "email" ? "active-sort" : ""}
                  onClick={() => handleSort("email")}
                >
                  <FaEnvelope className="header-icon" />
                  Email
                  {sortBy === "email" && (
                    <span className="sort-indicator">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th 
                  className={sortBy === "product" ? "active-sort" : ""}
                  onClick={() => handleSort("product")}
                >
                  <FaBox className="header-icon" />
                  Product
                  {sortBy === "product" && (
                    <span className="sort-indicator">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th 
                  className={sortBy === "qty" ? "active-sort" : ""}
                  onClick={() => handleSort("qty")}
                >
                  Qty
                  {sortBy === "qty" && (
                    <span className="sort-indicator">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th>
                  <FaImage className="header-icon" />
                  Image
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCarts.map((item, index) => (
                <tr key={index} className="cart-item">
                  <td className="user-info">
                    <div className="user-name">{item.user?.name || "N/A"}</div>
                  </td>
                  <td className="user-email">{item.user?.email || "N/A"}</td>
                  <td className="product-info">
                    {item.product ? (
                      <div className="product-name">{item.product.name}</div>
                    ) : (
                      <div className="deleted-product">
                        <FaExclamationTriangle className="warning-icon" />
                        <span>Product deleted</span>
                      </div>
                    )}
                  </td>
                  <td className="quantity">
                    <span className="qty-badge">{item.qty}</span>
                  </td>
                  <td className="product-image">
                    {item.product?.image ? (
                      <img
                        src={item.product.image.startsWith("http") ? item.product.image : `http://localhost:5000${item.product.image}`}
                        alt={item.product.name}
                        className="product-img"
                      />
                    ) : (
                      <div className="no-image">
                        <FaImage className="no-image-icon" />
                        <span>No image</span>
                      </div>
                    )}
                  </td>
                  <td className="actions">
                    <button 
                      className="view-btn"
                      onClick={() => handleViewProduct(item.product?._id)}
                      disabled={!item.product}
                      title={item.product ? "View Product Details" : "Product not available"}
                    >
                      <FaEye className="btn-icon" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredCarts.length > 0 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {filteredCarts.length} of {allCarts.length} items
          </span>
        </div>
      )}
    </div>
  );
};

export default UserCarts;