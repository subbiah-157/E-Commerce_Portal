import { useState, useContext, useEffect } from "react";       
import axios from "axios";
import API_BASE_URL from "../config";
import { CurrencyContext } from "../context/CurrencyContext";
import "../styles/ProductManagement.css";
import imageCompression from "browser-image-compression";
import { 
  FaBox, FaMoneyBillWave, FaTag, FaWarehouse, FaAlignLeft, 
  FaList, FaPlusCircle, FaTrash, FaImage, FaSave, 
  FaCog, FaTshirt, FaMobile, FaHome, FaInfoCircle,
  FaMapMarkerAlt, FaGlobe, FaCity, FaMapPin,FaMinus,FaPlus
} from "react-icons/fa";

// Currency conversion rates relative to GBP
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

// Category-specific attributes
const categoryAttributes = {
  Books: ["language", "author", "genre", "format"],
  Electronics: ["brand", "ram", "storage", "processor", "displaySize", "battery", "camera", "screenSize", "type"],
  Accessories: ["brand", "material", "color"],
  Clothing: ["size", "color", "material", "fit", "brand"],
  Footwear: ["size", "color", "material", "brand"],
  Home: ["material", "inchs", "color"],
  Beauty: ["brand", "skinType", "hairType", "fragranceType"],
  Sports: ["brand", "size", "material", "weight"],
  Fitness: ["brand", "size", "material", "weight"],
  Personal: ["brand", "skinType", "hairType", "fragranceType"],
  Kitchen: ["brand", "material", "power", "capacity"],
  Stationery: ["brand", "type", "color"],
  "Vehicle Accessories": ["brand", "model"],
  Grocery: ["brand", "packSize", "organic"],
  Default: ["color", "material", "brand"],
};

// Predefined options
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
const ramOptions = ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB"];
const storageOptions = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];
const typeOptions = ["Mobile", "Laptop"];

const ProductManagement = ({ products, categories, fetchProducts }) => {
  const { currency, changeCurrency } = useContext(CurrencyContext);
  const [warehouses, setWarehouses] = useState([]);
  const [showWarehouseStock, setShowWarehouseStock] = useState(false);
  const [warehouseStockForm, setWarehouseStockForm] = useState({
    warehouseId: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
    stock: ""
  });
  const [warehouseStocks, setWarehouseStocks] = useState([]);

  // Fetch warehouses on component mount
  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/warehouse`);
      console.log("Fetched warehouses:", response.data); 
      setWarehouses(response.data);
      console.log("Warehouses state after set:", warehouses);
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    }
  };

  const createInitialForm = () => {
    const allAttributes = new Set();
    Object.values(categoryAttributes).forEach(attrs => attrs.forEach(attr => allAttributes.add(attr)));

    return {
      name: "",
      price: "1",
      discount: "0",
      stock: "",
      description: "",
      category: "",
      subCategory: "",
      subSubCategory: "",
      images: [],
      currency: currency,
      size: [],
      sizes: "",
      color: "",
      material: "",
      fit: "",
      brand: "",
      ram: [],
      storage: [],
      processor: "",
      displaySize: "",
      battery: "",
      camera: "",
      screenSize: "",
      type: [],
      skinType: "",
      hairType: "",
      fragranceType: "",
      language: "",
      author: "",
      genre: "",
      format: "",
      packSize: "",
      organic: "",
      model: "",
      power: "",
      capacity: "",
      weight: "",
      warranty: "",
      inchs: "",
    };
  };

  const [productForm, setProductForm] = useState(createInitialForm());
  const [editingProductId, setEditingProductId] = useState(null);
  const [currentAttributes, setCurrentAttributes] = useState(categoryAttributes.Default);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [extraDetails, setExtraDetails] = useState([{ key: "", value: "" }]);

  // Update attributes and subcategories when category changes
  useEffect(() => {
    const selectedCategory = categories.find(cat => cat.name === productForm.category);
    setCurrentAttributes(categoryAttributes[productForm.category] || categoryAttributes.Default);
    setSubCategories(selectedCategory?.subCategories || []);
    setProductForm(prev => ({ ...prev, subCategory: "", subSubCategory: "" }));
    setSubSubCategories([]);
  }, [productForm.category, categories]);

  // Update sub-subcategories when subcategory changes
  useEffect(() => {
    const selectedSub = subCategories.find(sub => sub.name === productForm.subCategory);
    setSubSubCategories(selectedSub?.subSubCategories || []);
    setProductForm(prev => ({ ...prev, subSubCategory: "" }));
  }, [productForm.subCategory, subCategories]);


  useEffect(() => {
  console.log("Warehouses updated in state:", warehouses);
}, [warehouses]);


  // Update total stock when warehouse stocks change
  useEffect(() => {
    const totalStock = warehouseStocks.reduce((sum, ws) => sum + parseInt(ws.stock || 0), 0);
    setProductForm(prev => ({ ...prev, stock: totalStock.toString() }));
  }, [warehouseStocks]);

  // Handle warehouse stock form changes
  const handleWarehouseStockChange = (e) => {
    const { name, value } = e.target;
    setWarehouseStockForm(prev => ({ ...prev, [name]: value }));

    // Auto-fill location details when warehouse is selected
    if (name === "warehouseId" && value) {
      const selectedWarehouse = warehouses.find(w => w._id === value);
      if (selectedWarehouse) {
        setWarehouseStockForm(prev => ({
          ...prev,
          country: selectedWarehouse.country || "",
          state: selectedWarehouse.state || "",
          city: selectedWarehouse.city || "",
          postalCode: selectedWarehouse.postalCode || ""
        }));
      }
    }
  };

  // Add warehouse stock
  const addWarehouseStock = () => {
    const { warehouseId, stock } = warehouseStockForm;
    if (!warehouseId || !stock || parseInt(stock) <= 0) {
      alert("Please select a warehouse and enter valid stock quantity");
      return;
    }

    // Check if warehouse already exists in stocks
    if (warehouseStocks.find(ws => ws.warehouseId === warehouseId)) {
      alert("This warehouse already has stock assigned. Please update the existing entry.");
      return;
    }

    const selectedWarehouse = warehouses.find(w => w._id === warehouseId);
    const newWarehouseStock = {
      warehouseId,
      warehouseName: selectedWarehouse?.name || "Unknown",
      country: selectedWarehouse?.country || "",
      state: selectedWarehouse?.state || "",
      city: selectedWarehouse?.city || "",
      postalCode: selectedWarehouse?.postalCode || "",
      stock: parseInt(stock)
    };

    setWarehouseStocks(prev => [...prev, newWarehouseStock]);
    setWarehouseStockForm({
      warehouseId: "",
      country: "",
      state: "",
      city: "",
      postalCode: "",
      stock: ""
    });
  };

  // Remove warehouse stock
  const removeWarehouseStock = (warehouseId) => {
    setWarehouseStocks(prev => prev.filter(ws => ws.warehouseId !== warehouseId));
  };

  // Update warehouse stock
  const updateWarehouseStock = (warehouseId, newStock) => {
    setWarehouseStocks(prev => 
      prev.map(ws => 
        ws.warehouseId === warehouseId 
          ? { ...ws, stock: parseInt(newStock) || 0 }
          : ws
      )
    );
  };

  // Handle input changes
  const handleProductChange = (e) => {
    const { name, value, files, checked } = e.target;

    if (name === "images") {
      handleImageUpload(e);
    } else if (name === "currency") {
      setProductForm({ ...productForm, currency: value });
      changeCurrency(value);
    } else if (["size", "ram", "storage", "type"].includes(name)) {
      let updated = [...productForm[name]];
      if (checked) updated.push(value);
      else updated = updated.filter(v => v !== value);
      setProductForm({ ...productForm, [name]: updated });
    } else {
      setProductForm({ ...productForm, [name]: value });
    }
  };

  // Extra details handling
  const handleExtraChange = (index, field, val) => {
    const updated = [...extraDetails];
    updated[index][field] = val;
    setExtraDetails(updated);
  };
  const addExtraField = () => setExtraDetails([...extraDetails, { key: "", value: "" }]);
  const removeExtraField = (index) => setExtraDetails(extraDetails.filter((_, idx) => idx !== index));

  // Add/update product
  const handleAddOrUpdateProduct = async () => {
    const { name, price, discount, stock, category, subCategory, subSubCategory, currency: productCurrency } = productForm;
    if (!name || !price || !stock || !category || !productCurrency) return alert("Fill required fields");

    const priceInGBP = Number(price) * (currencyRates[productCurrency] || 1);
    const discountPercent = Number(discount);
    const discountInGBP = priceInGBP * (discountPercent / 100);
    const totalPriceInGBP = priceInGBP - discountInGBP;

    

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", priceInGBP.toFixed(2));
    formData.append("discount", discountPercent.toFixed(2));
    formData.append("totalPrice", totalPriceInGBP.toFixed(2));
    formData.append("stock", stock);
    formData.append("description", productForm.description);
    formData.append("category", category);
    formData.append("subCategory", subCategory);
    formData.append("subSubCategory", subSubCategory);
    formData.append("currency", productCurrency); 
    
    // Add warehouse stocks
    formData.append("warehouseStocks", JSON.stringify(warehouseStocks));

    if (category === "Clothing" && productForm.size.length > 0) formData.append("size", productForm.size.join(","));
    else if (["Footwear", "Sports", "Fitness"].includes(category) && productForm.sizes) formData.append("size", productForm.sizes);
    if (category === "Home" && productForm.inchs) formData.append("inchs", productForm.inchs);

    currentAttributes.forEach(attr => {
      if (["ram", "storage", "type"].includes(attr)) {
        if (productForm[attr].length > 0) formData.append(attr, productForm[attr].join(","));
      } else if (attr !== "size" && attr !== "inchs" && productForm[attr]) {
        formData.append(attr, productForm[attr]);
      }
    });

    if (productForm.warranty) formData.append("warranty", productForm.warranty);

    extraDetails.forEach(detail => {
      if (detail.key && detail.value) formData.append(detail.key, detail.value);
    });

    productForm.images.forEach(file => formData.append("images", file));

    try {
      if (editingProductId) {
        await axios.put(`${API_BASE_URL}/api/products/${editingProductId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        setEditingProductId(null);
      } else {
        await axios.post(`${API_BASE_URL}/api/products`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        alert("Product added successfully!");
      }
      setProductForm(createInitialForm());
      setPreviewImages([]);
      setExtraDetails([{ key: "", value: "" }]);
      setWarehouseStocks([]);
      fetchProducts();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to add/update product");
    }
  };

  const convertPriceForDisplay = (price) => {
    const converted = Number(price) / (currencyRates[currency] || 1);
    return converted.toFixed(2);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) return alert("Maximum 3 images allowed per product");

    const compressedFiles = await Promise.all(
      files.map(file => imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1024 }))
    );
    setProductForm({ ...productForm, images: compressedFiles });
    setPreviewImages(compressedFiles.map(f => URL.createObjectURL(f)));
  };

  // Remove a selected image
const handleRemoveImage = (index) => {
  const updatedImages = productForm.images.filter((_, i) => i !== index);
  const updatedPreviews = previewImages.filter((_, i) => i !== index);
  setProductForm({ ...productForm, images: updatedImages });
  setPreviewImages(updatedPreviews);
};


  return (
    <div className="product-management-container">
      <h3 className="product-management-heading"><FaBox className="product-management-icon"/> {editingProductId ? "Edit Product" : "Add New Product"}</h3>

      <div className="product-form-wrapper">
        {/* Currency + Categories Section */}
        <div className="product-form-section">
          <div className="product-section-title"><FaCog className="product-management-icon"/> Basic Information</div>
          <div className="product-form-row">
            <div className="product-form-group">
              <label><FaMoneyBillWave className="product-management-icon"/> Currency</label>
              <select className="product-form-input" name="currency" value={productForm.currency} onChange={handleProductChange}>
                {Object.keys(currencySymbols).map(cur => <option key={cur} value={cur}>{cur} ({currencySymbols[cur]})</option>)}
              </select>
            </div>

            <div className="product-form-group">
              <label><FaList className="product-management-icon" /> Category</label>
              <select className="product-form-input" name="category" value={productForm.category} onChange={handleProductChange}>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>

            {subCategories.length > 0 && (
              <div className="product-form-group">
                <label><FaList className="product-management-icon" /> Subcategory</label>
                <select className="product-form-input" name="subCategory" value={productForm.subCategory} onChange={handleProductChange}>
                  <option value="">Select Subcategory</option>
                  {subCategories.map(sub => <option key={sub._id} value={sub.name}>{sub.name}</option>)}
                </select>
              </div>
            )}

            {subSubCategories.length > 0 && (
              <div className="product-form-group">
                <label><FaList className="product-management-icon" /> Sub-subcategory</label>
                <select className="product-form-input" name="subSubCategory" value={productForm.subSubCategory} onChange={handleProductChange}>
                  <option value="">Select Sub-subcategory</option>
                  {subSubCategories.map((subSub, idx) => <option key={idx} value={subSub}>{subSub}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Size handling */}
        {productForm.category === "Clothing" && (
          <div className="product-form-section">
            <div className="product-section-title"><FaTshirt className="product-management-icon" /> Sizes</div>
            <div className="product-checkbox-group">
              {sizeOptions.map(size => (
                <div className="product-checkbox-item" key={size}>
                  <input type="checkbox" name="size" value={size} checked={productForm.size.includes(size)} onChange={handleProductChange} />
                  <label>{size}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {["Footwear", "Sports", "Fitness"].includes(productForm.category) && (
          <div className="product-form-section">
            <div className="product-section-title"><FaTshirt className="product-management-icon" /> Size</div>
            <div className="product-form-group">
              <input className="product-form-input" type="text" name="sizes" placeholder="Enter size (e.g. 7, 8, 9)" value={productForm.sizes || ""} onChange={handleProductChange} />
            </div>
          </div>
        )}

        {/* Inches for Home category */}
        {productForm.category === "Home" && (
          <div className="product-form-section">
            <div className="product-section-title"><FaHome className="product-management-icon" /> Inches</div>
            <div className="product-form-group">
              <input className="product-form-input" type="text" name="inchs" placeholder="Enter inches (e.g. 32, 40, 55)" value={productForm.inchs || ""} onChange={handleProductChange} />
            </div>
          </div>
        )}

        {/* RAM - Changed to radio buttons */}
        {currentAttributes.includes("ram") && (
          <div className="product-form-section">
            <div className="product-section-title"><FaMobile className="product-management-icon" /> RAM</div>
            <div className="product-checkbox-group">
              {ramOptions.map(ram => (
                <div className="product-checkbox-item" key={ram}>
                  <input type="radio" name="ram" value={ram} checked={productForm.ram === ram} onChange={handleProductChange} />
                  <label>{ram}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage - Changed to radio buttons */}
        {currentAttributes.includes("storage") && (
          <div className="product-form-section">
            <div className="product-section-title"><FaMobile className="product-management-icon" /> ROM/Storage</div>
            <div className="product-checkbox-group">
              {storageOptions.map(storage => (
                <div className="product-checkbox-item" key={storage}>
                  <input type="radio" name="storage" value={storage} checked={productForm.storage === storage} onChange={handleProductChange} />
                  <label>{storage}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Type (ONLY for Electronics) - Changed to radio buttons */}
        {productForm.category === "Electronics" && currentAttributes.includes("type") && (
          <div className="product-form-section">
            <div className="product-section-title"><FaMobile className="product-management-icon" /> Type</div>
            <div className="product-checkbox-group">
              {typeOptions.map(tp => (
                <div className="product-checkbox-item" key={tp}>
                  <input type="radio" name="type" value={tp} checked={productForm.type === tp} onChange={handleProductChange} />
                  <label>{tp}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Fields Section */}
        <div className="product-form-section">
          <div className="product-section-title"><FaInfoCircle className="product-management-icon" /> Product Details</div>
          <div className="product-form-row">
            <div className="product-form-group">
              <label>Name</label>
              <input className="product-form-input" name="name" placeholder="Product Name" value={productForm.name || ""} onChange={handleProductChange} />
            </div>
            <div className="product-form-group">
              <label><FaMoneyBillWave className="product-management-icon" /> Price ({currencySymbols[productForm.currency]})</label>
              <input className="product-form-input" name="price" type="number" min="1" placeholder="Price" value={productForm.price || ""} onChange={handleProductChange} />
            </div>
          </div>
          
          <div className="product-form-row">
            <div className="product-form-group">
              <label><FaTag className="product-management-icon" /> Discount (%)</label>
              <input className="product-form-input" name="discount" type="number" min="0" max="100" placeholder="Discount" value={productForm.discount || ""} onChange={handleProductChange} />
            </div>
            <div className="product-form-group">
              <label><FaWarehouse className="product-management-icon" /> Total Stock</label>
              <input 
                className="product-form-input" 
                name="stock" 
                type="number" 
                placeholder="Total Stock (Auto-calculated)" 
                value={productForm.stock || ""} 
                onChange={handleProductChange}
                readOnly
              />
              <small className="product-form-hint">Auto-calculated from warehouse stocks</small>
            </div>
          </div>
          
          <div className="product-form-group">
            <label><FaAlignLeft className="product-management-icon" /> Description</label>
            <input className="product-form-input" name="description" placeholder="Product Description" value={productForm.description || ""} onChange={handleProductChange} />
          </div>
        </div>

        {/* Warehouse Stock Management */}
        <div className="product-form-section">
          <div className="product-section-title">
            <FaWarehouse className="product-management-icon" /> Warehouse Stock
            <button 
              type="button" 
              className="product-toggle-warehouse-btn"
              onClick={() => setShowWarehouseStock(!showWarehouseStock)}
            >
              {showWarehouseStock ? <FaMinus /> : <FaPlus />}
            </button>
          </div>

          {showWarehouseStock && (
            <div className="product-warehouse-form">
              <div className="product-form-row">
                <div className="product-form-group">
                  <label><FaMapMarkerAlt className="product-management-icon" /> Select Warehouse</label>
                  <select 
                    className="product-form-input" 
                    name="warehouseId" 
                    value={warehouseStockForm.warehouseId} 
                    onChange={handleWarehouseStockChange}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse._id} value={warehouse._id}>
                        {warehouse.name} - {warehouse.city}, {warehouse.country}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="product-form-group">
                  <label><FaGlobe className="product-management-icon" /> Country</label>
                  <input 
                    className="product-form-input" 
                    type="text" 
                    name="country" 
                    value={warehouseStockForm.country} 
                    onChange={handleWarehouseStockChange}
                    readOnly
                  />
                </div>
              </div>

              <div className="product-form-row">
                <div className="product-form-group">
                  <label><FaMapMarkerAlt className="product-management-icon" /> State</label>
                  <input 
                    className="product-form-input" 
                    type="text" 
                    name="state" 
                    value={warehouseStockForm.state} 
                    onChange={handleWarehouseStockChange}
                    readOnly
                  />
                </div>
                
                <div className="product-form-group">
                  <label><FaCity className="product-management-icon" /> City</label>
                  <input 
                    className="product-form-input" 
                    type="text" 
                    name="city" 
                    value={warehouseStockForm.city} 
                    onChange={handleWarehouseStockChange}
                    readOnly
                  />
                </div>
              </div>

              <div className="product-form-row">
                <div className="product-form-group">
                  <label><FaMapPin className="product-management-icon" /> Postal Code</label>
                  <input 
                    className="product-form-input" 
                    type="text" 
                    name="postalCode" 
                    value={warehouseStockForm.postalCode} 
                    onChange={handleWarehouseStockChange}
                    readOnly
                  />
                </div>
                
                <div className="product-form-group">
                  <label><FaWarehouse className="product-management-icon" /> Stock Quantity</label>
                  <input 
                    className="product-form-input" 
                    type="number" 
                    name="stock" 
                    min="1" 
                    placeholder="Enter stock quantity" 
                    value={warehouseStockForm.stock} 
                    onChange={handleWarehouseStockChange}
                  />
                </div>
              </div>

              <button 
                type="button" 
                className="product-add-warehouse-btn"
                onClick={addWarehouseStock}
              >
                <FaPlusCircle /> Add Warehouse Stock
              </button>
            </div>
          )}

          {/* Warehouse Stocks List */}
          {warehouseStocks.length > 0 && (
            <div className="product-warehouse-list">
              <h4>Warehouse Stocks</h4>
              {warehouseStocks.map((ws) => (
                <div key={ws.warehouseId} className="product-warehouse-item">
                  <div className="product-warehouse-info">
                    <strong>{ws.warehouseName}</strong>
                    <span>{ws.city}, {ws.state}, {ws.country} - {ws.postalCode}</span>
                  </div>
                  <div className="product-warehouse-controls">
                    <input 
                      type="number" 
                      min="0" 
                      value={ws.stock} 
                      onChange={(e) => updateWarehouseStock(ws.warehouseId, e.target.value)}
                      className="product-stock-input"
                    />
                    <button 
                      type="button" 
                      className="product-remove-warehouse-btn"
                      onClick={() => removeWarehouseStock(ws.warehouseId)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              <div className="product-total-stock">
                <strong>Total Stock: {productForm.stock} units</strong>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic attributes */}
        {currentAttributes.filter(attr => !["size", "ram", "storage", "type", "inchs"].includes(attr)).length > 0 && (
          <div className="product-form-section">
            <div className="product-section-title"><FaCog className="product-management-icon" /> Attributes</div>
            <div className="product-form-row">
              {currentAttributes.filter(attr => !["size", "ram", "storage", "type", "inchs"].includes(attr)).map(attr => (
                <div className="product-form-group" key={attr}>
                  <label>{attr.charAt(0).toUpperCase() + attr.slice(1)}</label>
                  <input 
                    className="product-form-input"
                    name={attr} 
                    placeholder={attr.charAt(0).toUpperCase() + attr.slice(1)} 
                    value={productForm[attr] || ""} 
                    onChange={handleProductChange} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warranty */}
        <div className="product-form-section">
          <div className="product-form-group">
            <label><FaInfoCircle className="product-management-icon" /> Warranty & Support</label>
            <input className="product-form-input" name="warranty" placeholder="Warranty Information" value={productForm.warranty || ""} onChange={handleProductChange} />
          </div>
        </div>

        {/* Extra Details */}
        <div className="product-form-section">
          <div className="product-section-title"><FaPlusCircle className="product-management-icon" /> Extra Details</div>
          <div className="product-extra-details">
            {extraDetails.map((detail, idx) => (
              <div className="product-extra-row" key={idx}>
                <input 
                  className="product-form-input"
                  type="text" 
                  placeholder="Key" 
                  value={detail.key || ""} 
                  onChange={e => handleExtraChange(idx, "key", e.target.value)} 
                />
                <input 
                  className="product-form-input"
                  type="text" 
                  placeholder="Value" 
                  value={detail.value || ""} 
                  onChange={e => handleExtraChange(idx, "value", e.target.value)} 
                />
                <button className="product-remove-detail-btn" type="button" onClick={() => removeExtraField(idx)}>
                  <FaTrash />
                </button>
              </div>
            ))}
            <button className="product-add-detail-btn" type="button" onClick={addExtraField}>
              <FaPlusCircle /> Add New Field
            </button>
          </div>
        </div>

        {/* Images */}
        <div className="product-form-group">
  <label><FaImage className="product-management-icon" /> Product Images</label>
  <input
    type="file"
    name="images"
    accept="image/*"
    multiple
    onChange={handleProductChange} className="p-img"
  />
</div>

{/* Image Preview with Remove Button */}
{previewImages.length > 0 && (
  <div className="product-image-preview-container">
    {previewImages.map((img, index) => (
      <div key={index} className="product-image-preview-item">
        <img src={img} alt={`Preview ${index}`} className="product-preview-image" />
        <button
          type="button"
          className="product-remove-image-btn"
          onClick={() => handleRemoveImage(index)}
        >
          <FaTrash />
        </button>
      </div>
    ))}
  </div>
)}


        {/* Submit Button */}
        <button className="product-submit-btn" onClick={handleAddOrUpdateProduct}>
          <FaSave /> {editingProductId ? "Update Product" : "Add Product"}
        </button>

        {/* Final Price */}
        {productForm.price && (
          <div className="product-price-display">
            <p>
              Final Price: {currencySymbols[currency]}{" "}
              {convertPriceForDisplay(Number(productForm.price) * (1 - Number(productForm.discount) / 100) * (currencyRates[productForm.currency] || 1))}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;