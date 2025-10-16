import { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import "../styles/ExistingProducts.css";

// Import icons
import {
  FaEdit, FaTrash, FaMoneyBillWave, FaBox,
  FaTag, FaWarehouse, FaAlignLeft, FaPlusCircle,
  FaTimes, FaSave, FaUndo, FaImage, FaList,
  FaCog, FaTshirt, FaHome, FaMobile, FaLaptop,
  FaSearch, FaFilter
} from "react-icons/fa";

// Conversion rates relative to GBP
const currencyRates = {
  GBP: 1,
  INR: 0.0095,
  USD: 0.77,
  EUR: 0.87,
  AUD: 0.56,
  CAD: 0.59,
  JPY: 0.0056,
};

// Currency symbols
const currencySymbols = {
  GBP: "£",
  INR: "₹",
  USD: "$",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
};

// Category attributes
const categoryAttributes = {
  Books: ["language", "author", "genre", "format"],
  Electronics: ["brand", "processor", "displaySize", "battery", "camera", "screenSize", "ram", "storage", "type"],
  Accessories: ["brand", "material", "color"],
  Clothing: ["size", "color", "material", "fit", "brand"],
  Footwear: ["size", "color", "material", "brand"],
  Home: ["material", "inchs", "color", "type"],
  Beauty: ["brand", "skinType", "hairType", "fragmentationType"],
  Sports: ["brand", "size", "material", "weight"],
  Fitness: ["brand", "size", "material", "weight"],
  Personal: ["brand", "skinType", "hairType", "fragmentationType"],
  Kitchen: ["brand", "material", "power", "capacity"],
  Stationery: ["brand", "type", "color"],
  "Vehicle Accessories": ["brand", "model", "type"],
  Grocery: ["brand", "packSize", "organic", "type"],
  Default: ["size", "color", "material", "brand"],
};

// Predefined sizes
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];

const ExistingProducts = ({ products, fetchProducts }) => {
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem("selectedCurrency") || "INR";
  });

  const [productForm, setProductForm] = useState({
    name: "",
    price:"",
    discount: "",
    stock: "",
    description: "",
    category: "",
    subCategory: "",
    subSubCategory: "",
    images: [],
    currency: selectedCurrency || "GBP",
    size: [],
    sizes: "",
    color: "",
    material: "",
    fit: "",
    brand: "",
    type: "",
    warranty: "",
    ram: "",
    storage: "",
    inchs: "",
    extraDetails: {},
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [extraDetails, setExtraDetails] = useState([{ key: "", value: "" }]);
  const [currentAttributes, setCurrentAttributes] = useState(categoryAttributes.Default);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [allCategories, setAllCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseStocks, setWarehouseStocks] = useState([]);

  useEffect(() => {
    localStorage.setItem("selectedCurrency", selectedCurrency);
  }, [selectedCurrency]);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/categories`);
        setAllCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/warehouse`);
        setWarehouses(response.data);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      }
    };

    fetchWarehouses();
  }, []);

  // Category change
  useEffect(() => {
    setCurrentAttributes(categoryAttributes[productForm.category] || categoryAttributes.Default);

    // Find subcategories for the selected category
    if (productForm.category) {
      const category = allCategories.find(cat => cat.name === productForm.category);
      setSubCategories(category?.subCategories || []);
    } else {
      setSubCategories([]);
    }
  }, [productForm.category, allCategories]);

  // Subcategory change
  useEffect(() => {
    // Find sub-subcategories for the selected subcategory
    if (productForm.subCategory && productForm.category) {
      const category = allCategories.find(cat => cat.name === productForm.category);
      if (category) {
        const subCategory = category.subCategories.find(sub => sub.name === productForm.subCategory);
        setSubSubCategories(subCategory?.subSubCategories || []);
      }
    } else {
      setSubSubCategories([]);
    }
  }, [productForm.subCategory, productForm.category, allCategories]);

  // Function to calculate total price
  const calculateTotalPrice = () => {
    const price = parseFloat(productForm.price || 0);
    const discount = parseFloat(productForm.discount || 0);
    const total = price - (price * discount / 100);
    return total;
  };

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "All" || product.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ["All", ...new Set(products.map(p => p.category))];

  // Function to calculate discounted price
  const calculateDiscountedPrice = (price, discount, productCurrency) => {
    if (!discount || discount <= 0) return convertPrice(price, productCurrency);
    const discountedPrice = price * (1 - discount / 100);
    return convertPrice(discountedPrice, productCurrency);
  };

  // Convert price from product currency to selected currency
  const convertPrice = (price, productCurrency) => {
    if (!productCurrency) productCurrency = "GBP";
    if (productCurrency === selectedCurrency) return Number(price).toFixed(2);
    const priceInGBP = price * (currencyRates[productCurrency] || 1);
    const converted = priceInGBP / (currencyRates[selectedCurrency] || 1);
    return converted.toFixed(2);
  };

  // Convert FROM any currency TO GBP (for storing)
  const toGBP = (amount, fromCurrency) => {
    if (fromCurrency === "GBP") return amount;
    return amount / (currencyRates[fromCurrency] || 1);
  };

  // Convert FROM GBP TO any currency (for editing/display)
  const fromGBP = (amountGBP, toCurrency) => {
    if (!toCurrency) toCurrency = "GBP";
    if (toCurrency === "GBP") return Number(amountGBP).toFixed(2);
    return (amountGBP * (currencyRates[toCurrency] || 1)).toFixed(2);
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);

    // Handle size attribute based on category
    let sizeValue = [];
    let sizesValue = "";

    if (product.category === "Clothing") {
      sizeValue = Array.isArray(product.size) ? product.size : product.size ? String(product.size).split(",") : [];
    } else if (["Footwear", "Sports", "Fitness"].includes(product.category)) {
      sizesValue = product.size || "";
    }

    const priceInSelectedCurrency = fromGBP(Number(product.price), selectedCurrency || "GBP");

    setProductForm({
      name: product.name || "",
      price: priceInSelectedCurrency,
      discount: product.discount || "",
      stock: product.stock || "",
      description: product.description || "",
      category: product.category || "",
      subCategory: product.subCategory || "",
      subSubCategory: product.subSubCategory || "",
      images: [],
      currency: product.currency || "INR",
      size: sizeValue,
      sizes: sizesValue,
      color: product.color || "",
      material: product.material || "",
      fit: product.fit || "",
      brand: product.brand || "",
      warranty: product.warranty || "",
      type: product.type || "",
      ram: product.ram || "",
      storage: product.storage || "",
      inchs: product.inchs || "",
      extraDetails: product.extraDetails || {},
    });

    const extras = product.extraDetails
      ? Object.entries(product.extraDetails).map(([key, value]) => ({ key, value }))
      : [{ key: "", value: "" }];
    setExtraDetails(extras);

    // Set subcategories and sub-subcategories based on the product's category
    if (product.category) {
      const category = allCategories.find(cat => cat.name === product.category);
      setSubCategories(category?.subCategories || []);

      if (product.subCategory && category) {
        const subCategory = category.subCategories.find(sub => sub.name === product.subCategory);
        setSubSubCategories(subCategory?.subSubCategories || []);
      }
    }
    setWarehouseStocks(product.warehouseStocks || []);
    setImagePreviews([]);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setProductForm({
      name: "",
      price: "",
      discount: "",
      stock: "",
      description: "",
      category: "",
      subCategory: "",
      subSubCategory: "",
      images: [],
      currency: "GBP",
      size: [],
      sizes: "",
      color: "",
      material: "",
      fit: "",
      brand: "",
      type: "",
      warranty: "",
      ram: "",
      storage: "",
      inchs: "",
      extraDetails: {},
    });
    setImagePreviews([]);
    setExtraDetails([{ key: "", value: "" }]);
  };

  const handleWarehouseStockChange = (index, value) => {
    const updated = [...warehouseStocks];
    updated[index].stock = Number(value);
    setWarehouseStocks(updated);
  };

  const handleUpdateProduct = async () => {
    const { name, price, discount, stock, category, currency, images, subCategory, subSubCategory, warranty, type, ram, storage } =
      productForm;
    if (!name || !price || !stock || !category || !currency) return alert("Fill required fields");

    // Convert price from product currency back to GBP for storage
    const priceInGBP = toGBP(Number(price), currency);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", priceInGBP);
    formData.append("discount", discount || 0);
    formData.append("stock", stock);
    formData.append("description", productForm.description);
    formData.append("category", category);
    formData.append("subCategory", subCategory);
    formData.append("subSubCategory", subSubCategory);
    formData.append("currency", currency);
    formData.append("warranty", warranty);
    formData.append("type", type);
    formData.append("ram", ram);
    formData.append("storage", storage);
    formData.append("warehouseStocks", JSON.stringify(warehouseStocks));

    // Handle size attribute based on category
    if (category === "Clothing" && productForm.size.length > 0) {
      formData.append("size", productForm.size.join(","));
    } else if (["Footwear", "Sports", "Fitness"].includes(category) && productForm.sizes) {
      formData.append("size", productForm.sizes);
    }

    // Handle inchs for Home category
    if (category === "Home" && productForm.inchs) {
      formData.append("inchs", productForm.inchs);
    }

    // Handle other attributes
    currentAttributes.forEach((attr) => {
      if (attr !== "size" && attr !== "inchs" && productForm[attr]) {
        formData.append(attr, productForm[attr]);
      }
    });

    const extraDetailsObj = {};
    extraDetails.forEach((detail) => {
      if (detail.key && detail.value) extraDetailsObj[detail.key] = detail.value;
    });
    formData.append("extraDetails", JSON.stringify(extraDetailsObj));

    images.forEach((img) => formData.append("images", img));

    try {
      await axios.put(`${API_BASE_URL}/api/products/${editingProductId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Product updated successfully!");
      cancelEdit();
      fetchProducts();
    } catch (err) {
      console.error("Update error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update product";
      alert("Error: " + msg);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setProductForm({ ...productForm, images: files });
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleExtraChange = (index, field, value) => {
    const updated = [...extraDetails];
    updated[index][field] = value;
    setExtraDetails(updated);

    const extrasObj = {};
    updated.forEach((d) => {
      if (d.key && d.value) extrasObj[d.key] = d.value;
    });
    setProductForm({ ...productForm, extraDetails: extrasObj });
  };

  const addExtraField = () => {
    setExtraDetails([...extraDetails, { key: "", value: "" }]);
  };

  const removeExtraField = (index) => {
    const updated = [...extraDetails];
    updated.splice(index, 1);
    setExtraDetails(updated);
  };

  const getImageUrl = (img) => {
    if (!img) return "/placeholder.png";

    if (
      typeof img === "string" &&
      (img.startsWith("http") || img.startsWith("data:"))
    ) {
      return img;
    }

    if (typeof img === "string") {
      return `${API_BASE_URL}${img}`;
    }

    return "/placeholder.png";
  };

  return (
    <div className="product-management-container">
      <h3><FaBox className="product-management-icon" /> Product Management</h3>

      {/* Search and Filter Controls */}
      <div className="product-management-controls">
        <div className="product-search-box">
          <FaSearch className="product-search-icon" />
          <input
            type="text"
            placeholder="Search by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="product-search-input"
          />
        </div>

        <div className="product-filter-box">
          <FaFilter className="product-filter-icon" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="product-filter-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="product-currency-selector">
          <label><FaMoneyBillWave className="product-management-icon" /> Currency:</label>
          <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
            {Object.keys(currencySymbols).map((cur) => (
              <option key={cur} value={cur}>
                {cur} ({currencySymbols[cur]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="product-management-empty">
          <FaBox className="product-management-empty-icon" />
          <p>No products found.</p>
        </div>
      ) : (
        <div className="product-management-grid">
          {filteredProducts.map((p) => (
            <div key={p._id} className="product-management-card">
              <div className="product-card-header-section">
                {p.image && (
                  <img
                    src={getImageUrl(p.image)}
                    className="product-card-image-view"
                    alt={p.name}
                  />
                )}
                <div className="product-card-info-section">
                  <div className="product-management-name">{p.name}</div>
                  <div className="product-management-price">
                    {p.discount > 0 ? (
                      <>
                        <span className="product-original-price">
                          {currencySymbols[selectedCurrency]} {convertPrice(p.price, p.currency)}
                        </span>&nbsp;&nbsp;
                        <span className="product-discounted-price">
                          {currencySymbols[selectedCurrency]} {calculateDiscountedPrice(p.price, p.discount, p.currency)}
                        </span>
                      </>
                    ) : (
                      <span>{currencySymbols[selectedCurrency]} {convertPrice(p.price, p.currency)}</span>
                    )}
                  </div>
                  <div className="product-management-category">{p.category}</div>
                </div>
              </div>

              {/* Price breakdown section */}
              {p.discount > 0 && (
                <div className="product-price-breakdown">
                  <div className="product-price-item">
                    <span>Original Price:</span>
                    <span>{currencySymbols[selectedCurrency]} {convertPrice(p.price, p.currency)}</span>
                  </div>
                  <div className="product-price-item">
                    <span>Discount:</span>
                    <span>{p.discount}%</span>
                  </div>
                  <div className="product-price-item product-total-price">
                    <span>Total Amount:</span>
                    <span>{currencySymbols[selectedCurrency]} {calculateDiscountedPrice(p.price, p.discount, p.currency)}</span>
                  </div>
                </div>
              )}

              <div className="product-card-details-section">
                <div className="product-detail-item">
                  <FaWarehouse className="product-detail-icon" />
                  <span>Stock: {p.stock}</span>
                </div>
                {p.discount > 0 && (
                  <div className="product-detail-item">
                    <FaTag className="product-detail-icon" />
                    <span>Discount: {p.discount}%</span>
                  </div>
                )}
                {p.subCategory && (
                  <div className="product-detail-item">
                    <FaList className="product-detail-icon" />
                    <span>Sub: {p.subCategory}</span>
                  </div>
                )}
                {p.subSubCategory && (
                  <div className="product-detail-item">
                    <FaList className="product-detail-icon" />
                    <span>Sub: {p.subSubCategory}</span>
                  </div>
                )}
              </div>

              <div className="product-management-actions">
                <button className="product-edit-button" onClick={() => startEditProduct(p)}>
                  <FaEdit /> Edit
                </button>
                <button className="product-delete-button" onClick={() => handleDeleteProduct(p._id)}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingProductId && (
        <div className="product-edit-modal-overlay">
          <div className="product-edit-modal">
            <div className="product-modal-content">
              <div className="product-modal-header">
                <h4>Edit Product</h4>
                <button className="product-modal-close" onClick={cancelEdit}>
                  <FaTimes />
                </button>
              </div>

              <div className="product-modal-body">
                <div className="product-form-section">
                  <h4><FaCog className="product-management-icon" /> Basic Information</h4>
                  <div className="product-form-grid">
                    <div className="product-form-group">
                      <label><FaBox className="product-management-icon" /> Name</label>
                      <input
                        className="product-form-control"
                        name="name"
                        placeholder="Product Name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      />
                    </div>
                    <div className="product-form-group">
                      <label><FaMoneyBillWave className="product-management-icon" /> Price ({currencySymbols[productForm.currency]})</label>
                      <input
                        className="product-form-control"
                        name="price"
                        type="number"
                        placeholder="Price"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      />
                    </div>
                    <div className="product-form-group">
                      <label><FaTag className="product-management-icon" /> Discount (%)</label>
                      <input
                        className="product-form-control"
                        name="discount"
                        type="number"
                        placeholder="Discount"
                        value={productForm.discount}
                        onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })}
                      />
                    </div>
                    <div className="product-form-group">
                      <label><FaWarehouse className="product-management-icon" /> Stock</label>
                      <input
                        className="product-form-control"
                        name="stock"
                        type="number"
                        placeholder="Stock"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                       />
                    </div>

                    <div className="product-form-group">
                      <label><FaWarehouse className="product-management-icon" /> Select Warehouse</label>
                      <select
                        className="product-form-control"
                        value={productForm.warehouse || ""}
                        onChange={(e) => setProductForm({ ...productForm, warehouse: e.target.value })}
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses.map((wh) => (
                          <option key={wh._id} value={wh._id}>
                            {wh.name} - {wh.city}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Warehouse Stock Table */}
                    <div className="product-warehouse-section">
                      <h5><FaBox className="product-management-icon" /> Warehouse Stock Details</h5>
                      <table className="product-warehouse-table">
                        <thead>
                          <tr>
                            <th>Warehouse Name</th>
                            <th>Location</th>
                            <th>Current Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {warehouses
                            .filter((wh) => {
                              const existingStock = warehouseStocks.find((ws) => ws.warehouseId === wh._id)?.stock || 0;
                              return existingStock > 0 || wh._id === productForm.warehouse;
                            })
                            .map((wh) => {
                              const existingStock = warehouseStocks.find((ws) => ws.warehouseId === wh._id)?.stock || 0;

                              return (
                                <tr key={wh._id}>
                                  <td>{wh.name}</td>
                                  <td>{wh.city}</td>
                                  <td>
                                    <input
                                      type="number"
                                      className="product-form-control product-stock-input"
                                      value={existingStock}
                                      onChange={(e) => {
                                        const updated = [...warehouseStocks];
                                        const existing = updated.find((ws) => ws.warehouseId === wh._id);
                                        if (existing) existing.stock = Number(e.target.value);
                                        else updated.push({ warehouseId: wh._id, stock: Number(e.target.value) });
                                        setWarehouseStocks(updated);
                                      }}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total Price Display */}
                  <div className="product-total-section">
                    <div className="product-price-breakdown-edit">
                      <div className="product-price-line">
                        <span>Original Price:</span>
                        <span>{currencySymbols[productForm.currency]} {parseFloat(productForm.price || 0).toFixed(2)}</span>
                      </div>
                      <div className="product-price-line">
                        <span>Discount:</span>
                        <span>{productForm.discount || 0}%</span>
                      </div>
                      <div className="product-price-line product-total-line">
                        <span>Total Amount:</span>
                        <span>{currencySymbols[productForm.currency]} {calculateTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="product-form-section">
                  <h4><FaAlignLeft className="product-management-icon" /> Description</h4>
                  <textarea
                    className="product-form-control"
                    name="description"
                    placeholder="Product Description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="product-form-section">
                  <h4><FaList className="product-management-icon" /> Categories</h4>
                  <div className="product-form-grid">
                    <div className="product-form-group">
                      <label>Category</label>
                      <select
                        className="product-form-control"
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({ ...productForm, category: e.target.value, subCategory: "", subSubCategory: "" })
                        }
                      >
                        <option value="">Select Category</option>
                        {Object.keys(categoryAttributes).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {subCategories.length > 0 && (
                      <div className="product-form-group">
                        <label>SubCategory</label>
                        <select
                          className="product-form-control"
                          value={productForm.subCategory}
                          onChange={(e) =>
                            setProductForm({ ...productForm, subCategory: e.target.value, subSubCategory: "" })
                          }
                        >
                          <option value="">Select SubCategory</option>
                          {subCategories.map((sub) => (
                            <option key={sub.name || sub} value={sub.name || sub}>
                              {sub.name || sub}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {subSubCategories.length > 0 && (
                      <div className="product-form-group">
                        <label>SubSubCategory</label>
                        <select
                          className="product-form-control"
                          value={productForm.subSubCategory}
                          onChange={(e) => setProductForm({ ...productForm, subSubCategory: e.target.value })}
                        >
                          <option value="">Select SubSubCategory</option>
                          {subSubCategories.map((subsub) => (
                            <option key={subsub.name || subsub} value={subsub.name || subsub}>
                              {subsub.name || subsub}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Size for Clothing */}
                {productForm.category === "Clothing" && currentAttributes.includes("size") && (
                  <div className="product-form-section">
                    <h4><FaTshirt className="product-management-icon" /> Sizes</h4>
                    <div className="product-checkbox-group">
                      {sizeOptions.map((size) => (
                        <div className="product-checkbox-item" key={size}>
                          <input
                            type="checkbox"
                            name="size"
                            value={size}
                            checked={productForm.size.includes(size)}
                            onChange={(e) => {
                              const newSizes = [...productForm.size];
                              if (e.target.checked) newSizes.push(size);
                              else newSizes.splice(newSizes.indexOf(size), 1);
                              setProductForm({ ...productForm, size: newSizes });
                            }}
                          />
                          <label>{size}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size for Footwear, Sports, Fitness */}
                {["Footwear", "Sports", "Fitness"].includes(productForm.category) && currentAttributes.includes("size") && (
                  <div className="product-form-section">
                    <h4><FaTshirt className="product-management-icon" /> Size</h4>
                    <input
                      className="product-form-control"
                      type="text"
                      name="sizes"
                      placeholder="Enter size (e.g. 7, 8, 9 or S, M, L)"
                      value={productForm.sizes}
                      onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                    />
                  </div>
                )}

                {/* Inches for Home category */}
                {productForm.category === "Home" && currentAttributes.includes("inchs") && (
                  <div className="product-form-section">
                    <h4><FaHome className="product-management-icon" /> Inches</h4>
                    <input
                      className="product-form-control"
                      type="text"
                      name="inchs"
                      placeholder="Enter inches (e.g. 32, 40, 55)"
                      value={productForm.inchs}
                      onChange={(e) => setProductForm({ ...productForm, inchs: e.target.value })}
                    />
                  </div>
                )}

                {/* Type, RAM, Storage for Electronics */}
                {productForm.category === "Electronics" && (
                  <div className="product-form-section">
                    <h4>{productForm.subCategory === "Mobile" ? <FaMobile className="product-management-icon" /> : <FaLaptop className="product-management-icon" />} Specifications</h4>
                    <div className="product-form-grid">
                      {currentAttributes.includes("type") && (
                        <div className="product-form-group">
                          <label>Type</label>
                          <input
                            className="product-form-control"
                            type="text"
                            placeholder="Enter type"
                            value={productForm.type}
                            onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                          />
                        </div>
                      )}
                      {currentAttributes.includes("ram") && (
                        <div className="product-form-group">
                          <label>RAM</label>
                          <input
                            className="product-form-control"
                            type="text"
                            placeholder="Enter RAM"
                            value={productForm.ram}
                            onChange={(e) => setProductForm({ ...productForm, ram: e.target.value })}
                          />
                        </div>
                      )}
                      {currentAttributes.includes("storage") && (
                        <div className="product-form-group">
                          <label>Storage</label>
                          <input
                            className="product-form-control"
                            type="text"
                            placeholder="Enter Storage"
                            value={productForm.storage}
                            onChange={(e) => setProductForm({ ...productForm, storage: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Other attributes */}
                {currentAttributes
                  .filter((attr) => attr !== "size" && attr !== "inchs")
                  .map((attr) => (
                    <div className="product-form-group" key={attr}>
                      <label>{attr.charAt(0).toUpperCase() + attr.slice(1)}</label>
                      <input
                        className="product-form-control"
                        name={attr}
                        placeholder={attr.charAt(0).toUpperCase() + attr.slice(1)}
                        value={productForm[attr] || ""}
                        onChange={(e) => setProductForm({ ...productForm, [attr]: e.target.value })}
                      />
                    </div>
                  ))}

                {/* Extra Details */}
                <div className="product-form-section">
                  <h4><FaList className="product-management-icon" /> Extra Details</h4>
                  <div className="product-extra-details">
                    {extraDetails.map((detail, idx) => (
                      <div className="product-extra-row" key={idx}>
                        <input
                          className="product-form-control"
                          type="text"
                          placeholder="Key"
                          value={detail.key}
                          onChange={(e) => handleExtraChange(idx, "key", e.target.value)}
                        />
                        <input
                          className="product-form-control"
                          type="text"
                          placeholder="Value"
                          value={detail.value}
                          onChange={(e) => handleExtraChange(idx, "value", e.target.value)}
                        />
                        <button className="product-remove-extra" onClick={() => removeExtraField(idx)}>
                          <FaTimes className="product-management-icon" />
                        </button>
                      </div>
                    ))}
                    <button className="product-add-extra" type="button" onClick={addExtraField}>
                      <FaPlusCircle style={{ color: "white" }} /> Add Field
                    </button>
                  </div>
                </div>

                {/* Images */}
                <div className="product-form-section">
                  <h4><FaImage className="product-management-icon" /> Product Images</h4>
                  <input
                    className="product-form-control"
                    type="file"
                    name="images"
                    multiple
                    onChange={handleImageChange}
                  />
                  {imagePreviews.length > 0 && (
                    <div className="product-image-previews">
                      {imagePreviews.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`preview-${idx}`}
                          className="product-image-preview"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Currency */}
                <div className="product-form-section">
                  <h4><FaMoneyBillWave className="product-management-icon" /> Currency</h4>
                  <select
                    className="product-form-control"
                    name="currency"
                    value={productForm.currency}
                    onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })}
                  >
                    {Object.keys(currencySymbols).map((cur) => (
                      <option key={cur} value={cur}>
                        {cur} ({currencySymbols[cur]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form Actions */}
                <div className="product-modal-actions">
                  <button className="product-save-button" onClick={handleUpdateProduct}>
                    <FaSave style={{ color: "white" }} /> Update Product
                  </button>
                  <button className="product-cancel-button" onClick={cancelEdit}>
                    <FaUndo style={{ color: "white" }} /> Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExistingProducts;