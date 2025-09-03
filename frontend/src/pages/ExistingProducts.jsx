import { useState, useEffect } from "react"; 
import axios from "axios";
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
  Electronics: ["brand", "processor", "displaySize", "battery", "camera", "screenSize"],
  Accessories: ["brand", "material", "color"],
  Clothing: ["size", "color", "material", "fit", "brand"],
  Footwear: ["size", "color", "material", "brand"],
  Home: ["material", "inchs", "color", "type"],
  Beauty: ["brand", "skinType", "hairType", "fragranceType"],
  Sports: ["brand", "size", "material", "weight"],
  Fitness: ["brand", "size", "material", "weight"],
  Personal: ["brand", "skinType", "hairType", "fragranceType"],
  Kitchen: ["brand", "material", "power", "capacity"],
  Stationery: ["brand", "type", "color"],
  "Vehicle Accessories": ["brand", "model", "type"],
  Grocery: ["brand", "packSize", "organic", "type"],
  Default: ["size", "color", "material", "brand"],
};

// Subcategories mapping
const subCategoriesMap = {
  Books: ["Fiction", "Non-Fiction"],
  Electronics: ["Mobile", "Laptop", "Camera"],
  Clothing: ["Men", "Women", "Kids"],
  Footwear: ["Men", "Women", "Kids"],
  "Vehicle Accessories": ["Car", "Bike"],
  Default: [],
};

// Sub-subcategories mapping
const subSubCategoriesMap = {
  Fiction: ["Fantasy", "Thriller", "Romance"],
  "Non-Fiction": ["Biography", "Self", "Science"],
  Mobile: ["Smartphone", "Feature Phone"],
  Laptop: ["Gaming", "Ultrabook"],
  Camera: ["DSLR", "Mirrorless"],
  Car: ["Interior", "Exterior"],
  Bike: ["Helmet", "Cover"],
  Default: [],
};

// Predefined sizes
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];

const ExistingProducts = ({ products, fetchProducts }) => {
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("GBP");
  const [productForm, setProductForm] = useState({
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
  const [imagePreviews, setImagePreviews] = useState([]);
  const [extraDetails, setExtraDetails] = useState([{ key: "", value: "" }]);
  const [currentAttributes, setCurrentAttributes] = useState(categoryAttributes.Default);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Category change
  useEffect(() => {
    setCurrentAttributes(categoryAttributes[productForm.category] || categoryAttributes.Default);
    setSubCategories(subCategoriesMap[productForm.category] || []);
  }, [productForm.category]);

  // Subcategory change
  useEffect(() => {
    setSubSubCategories(subSubCategoriesMap[productForm.subCategory] || []);
  }, [productForm.subCategory]);

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

    setProductForm({
      name: product.name || "",
      price: product.price || "",
      discount: product.discount || "",
      stock: product.stock || "",
      description: product.description || "",
      category: product.category || "",
      subCategory: product.subCategory || "",
      subSubCategory: product.subSubCategory || "",
      images: [],
      currency: product.currency || "GBP",
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

    setSubCategories(subCategoriesMap[product.category] || []);
    setSubSubCategories(subSubCategoriesMap[product.subCategory] || []);
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

  const convertPrice = (price, productCurrency) => {
    if (!productCurrency) productCurrency = "GBP";
    if (productCurrency === selectedCurrency) return Number(price).toFixed(2);
    const priceInGBP = price * (currencyRates[productCurrency] || 1);
    const converted = priceInGBP / (currencyRates[selectedCurrency] || 1);
    return converted.toFixed(2);
  };

  const handleUpdateProduct = async () => {
    const { name, price, discount, stock, category, currency, images, subCategory, subSubCategory, warranty, type, ram, storage } =
      productForm;
    if (!name || !price || !stock || !category || !currency) return alert("Fill required fields");

    const priceInGBP = Number(price) * (currencyRates[currency] || 1);

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
      await axios.put(`http://localhost:5000/api/products/${editingProductId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      cancelEdit();
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to update product");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
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

  return (
    <div className="existing-products-container">
      <h3><FaBox className="product-icon" /> Existing Products</h3>

      {/* Search and Filter Controls */}
      <div className="controls-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="currency-selector">
          <label><FaMoneyBillWave className="product-icon" /> Currency:</label>
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
        <div className="no-products">
          <FaBox className="no-products-icon" />
          <p>No products found.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((p) => (
            <div key={p._id} className="product-card">
              <div className="product-card-header">
                {p.image && (
                  <img
                    src={`http://localhost:5000${p.image}`}
                    className="product-card-image"
                    alt={p.name}
                  />
                )}
                <div className="product-card-info">
                  <div className="product-name">{p.name}</div>
                  <div className="product-price">
                    {currencySymbols[selectedCurrency]} {convertPrice(p.price, p.currency)}
                  </div>
                  <div className="product-category">{p.category}</div>
                </div>
              </div>

              <div className="product-card-details">
                <div className="detail-item">
                  <FaWarehouse className="detail-icon" />
                  <span>Stock: {p.stock}</span>
                </div>
                {p.discount > 0 && (
                  <div className="detail-item">
                    <FaTag className="detail-icon" />
                    <span>Discount: {p.discount}%</span>
                  </div>
                )}
                {p.subCategory && (
                  <div className="detail-item">
                    <FaList className="detail-icon" />
                    <span>Sub: {p.subCategory}</span>
                  </div>
                )}
              </div>

              <div className="product-card-actions">
                <button className="edit-btn" onClick={() => startEditProduct(p)}>
                  <FaEdit /> Edit
                </button>
                <button className="delete-btn" onClick={() => handleDeleteProduct(p._id)}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal - Outside of the card grid */}
      {editingProductId && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h4>Edit Product</h4>
                <button className="close-btn" onClick={cancelEdit}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-section">
                  <h4><FaCog className="product-icon" /> Basic Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label><FaBox className="product-icon" /> Name</label>
                      <input
                        className="form-control"
                        name="name"
                        placeholder="Product Name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label><FaMoneyBillWave className="product-icon" /> Price ({currencySymbols[productForm.currency]})</label>
                      <input
                        className="form-control"
                        name="price"
                        type="number"
                        placeholder="Price"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label><FaTag className="product-icon"/> Discount (%)</label>
                      <input
                        className="form-control"
                        name="discount"
                        type="number"
                        placeholder="Discount"
                        value={productForm.discount}
                        onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label><FaWarehouse className="product-icon" /> Stock</label>
                      <input
                        className="form-control"
                        name="stock"
                        type="number"
                        placeholder="Stock"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4><FaAlignLeft className="product-icon" /> Description</h4>
                  <textarea
                    className="form-control"
                    name="description"
                    placeholder="Product Description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="form-section">
                  <h4><FaList className="product-icon" /> Categories</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        className="form-control"
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
                      <div className="form-group">
                        <label>SubCategory</label>
                        <select
                          className="form-control"
                          value={productForm.subCategory}
                          onChange={(e) =>
                            setProductForm({ ...productForm, subCategory: e.target.value, subSubCategory: "" })
                          }
                        >
                          <option value="">Select SubCategory</option>
                          {subCategories.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {subSubCategories.length > 0 && (
                      <div className="form-group">
                        <label>SubSubCategory</label>
                        <select
                          className="form-control"
                          value={productForm.subSubCategory}
                          onChange={(e) => setProductForm({ ...productForm, subSubCategory: e.target.value })}
                        >
                          <option value="">Select SubSubCategory</option>
                          {subSubCategories.map((subsub) => (
                            <option key={subsub} value={subsub}>
                              {subsub}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Size for Clothing */}
                {productForm.category === "Clothing" && currentAttributes.includes("size") && (
                  <div className="form-section">
                    <h4><FaTshirt className="product-icon" /> Sizes</h4>
                    <div className="checkbox-group">
                      {sizeOptions.map((size) => (
                        <div className="checkbox-item" key={size}>
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
                  <div className="form-section">
                    <h4><FaTshirt className="product-icon" /> Size</h4>
                    <input
                      className="form-control"
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
                  <div className="form-section">
                    <h4><FaHome className="product-icon" /> Inches</h4>
                    <input
                      className="form-control"
                      type="text"
                      name="inchs"
                      placeholder="Enter inches (e.g. 32, 40, 55)"
                      value={productForm.inchs}
                      onChange={(e) => setProductForm({ ...productForm, inchs: e.target.value })}
                    />
                  </div>
                )}

                {/* Type, RAM, Storage for Electronics */}
                {productForm.category === "Electronics" &&
                  (productForm.subCategory === "Mobile" || productForm.subCategory === "Laptop") && (
                  <div className="form-section">
                    <h4>{productForm.subCategory === "Mobile" ? <FaMobile className="product-icon" /> : <FaLaptop className="product-icon" />} Specifications</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Type</label>
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Enter type"
                          value={productForm.type}
                          onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>RAM</label>
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Enter RAM"
                          value={productForm.ram}
                          onChange={(e) => setProductForm({ ...productForm, ram: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Storage</label>
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Enter Storage"
                          value={productForm.storage}
                          onChange={(e) => setProductForm({ ...productForm, storage: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Other attributes */}
                {currentAttributes
                  .filter((attr) => attr !== "size" && attr !== "inchs")
                  .map((attr) => (
                    <div className="form-group" key={attr}>
                      <label>{attr.charAt(0).toUpperCase() + attr.slice(1)}</label>
                      <input
                        className="form-control"
                        name={attr}
                        placeholder={attr.charAt(0).toUpperCase() + attr.slice(1)}
                        value={productForm[attr] || ""}
                        onChange={(e) => setProductForm({ ...productForm, [attr]: e.target.value })}
                      />
                    </div>
                  ))}

                {/* Extra Details */}
                <div className="form-section">
                  <h4><FaList className="product-icon"/> Extra Details</h4>
                  <div className="extra-details-container">
                    {extraDetails.map((detail, idx) => (
                      <div className="extra-detail-row" key={idx}>
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Key"
                          value={detail.key}
                          onChange={(e) => handleExtraChange(idx, "key", e.target.value)}
                        />
                        <input
                          className="form-control"
                          type="text"
                          placeholder="Value"
                          value={detail.value}
                          onChange={(e) => handleExtraChange(idx, "value", e.target.value)}
                        />
                        <button className="remove-detail-btn" onClick={() => removeExtraField(idx)}>
                          <FaTimes className="product-icon" />
                        </button>
                      </div>
                    ))}
                    <button className="add-detail-btn" type="button" onClick={addExtraField}>
                      <FaPlusCircle style={{color:"white"}} /> Add Field
                    </button>
                  </div>
                </div>

                {/* Images */}
                <div className="form-section">
                  <h4><FaImage className="product-icon" /> Product Images</h4>
                  <input
                    className="form-control"
                    type="file"
                    name="images"
                    multiple
                    onChange={handleImageChange}
                  />
                  {imagePreviews.length > 0 && (
                    <div className="image-previews">
                      {imagePreviews.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`preview-${idx}`}
                          className="image-preview"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Currency */}
                <div className="form-section">
                  <h4><FaMoneyBillWave className="product-icon" /> Currency</h4>
                  <select
                    className="form-control"
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
                <div className="modal-actions">
                  <button className="save-btn" onClick={handleUpdateProduct}>
                    <FaSave style={{color:"white"}}/> Update Product
                  </button>
                  <button className="cancel-btn" onClick={cancelEdit}>
                    <FaUndo className="delete-icon" /> Cancel
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