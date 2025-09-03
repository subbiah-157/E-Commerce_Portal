import { useState, useContext, useEffect } from "react";    
import axios from "axios";
import { CurrencyContext } from "../context/CurrencyContext";
import "../styles/ProductManagement.css";
// Import icons
import { 
  FaBox, FaMoneyBillWave, FaTag, FaWarehouse, FaAlignLeft, 
  FaList, FaPlusCircle, FaTrash, FaImage, FaSave, 
  FaCog, FaTshirt, FaMobile, FaHome, FaInfoCircle 
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

  // Create a comprehensive initial form with all possible attributes
  const createInitialForm = () => {
    // Get all unique attributes from all categories
    const allAttributes = new Set();
    Object.values(categoryAttributes).forEach(attrs => {
      attrs.forEach(attr => allAttributes.add(attr));
    });
    
    // Build initial form with all possible attributes
    const form = {
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
      inchs: "", // ✅ Added for Home category
    };
    
    return form;
  };

  const [productForm, setProductForm] = useState(createInitialForm());
  const [editingProductId, setEditingProductId] = useState(null);
  const [currentAttributes, setCurrentAttributes] = useState(categoryAttributes.Default);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [extraDetails, setExtraDetails] = useState([{ key: "", value: "" }]);

  useEffect(() => {
    const selectedCategory = categories.find(cat => cat.name === productForm.category);
    setCurrentAttributes(categoryAttributes[productForm.category] || categoryAttributes.Default);
    setSubCategories(selectedCategory?.subCategories || []);
    setProductForm(prev => ({ ...prev, subCategory: "", subSubCategory: "" }));
    setSubSubCategories([]);
  }, [productForm.category, categories]);

  useEffect(() => {
    const selectedSub = subCategories.find(sub => sub.name === productForm.subCategory);
    setSubSubCategories(selectedSub?.subSubCategories || []);
    setProductForm(prev => ({ ...prev, subSubCategory: "" }));
  }, [productForm.subCategory, subCategories]);

  const handleProductChange = (e) => {
    const { name, value, files, checked } = e.target;

    if (name === "images") {
      const fileArray = Array.from(files);
      setProductForm({ ...productForm, images: fileArray });
      setPreviewImages(fileArray.map(f => URL.createObjectURL(f)));
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

  const handleExtraChange = (index, field, val) => {
    const updated = [...extraDetails];
    updated[index][field] = val;
    setExtraDetails(updated);
  };

  const addExtraField = () => setExtraDetails([...extraDetails, { key: "", value: "" }]);
  const removeExtraField = (index) => {
    const updated = [...extraDetails];
    updated.splice(index, 1);
    setExtraDetails(updated);
  };

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

    if (category === "Clothing" && productForm.size.length > 0) {
      formData.append("size", productForm.size.join(","));
    }
    else if (["Footwear", "Sports", "Fitness"].includes(category) && productForm.sizes) {
      formData.append("size", productForm.sizes);
    }

    // Handle inchs for Home category
    if (category === "Home" && productForm.inchs) {
      formData.append("inchs", productForm.inchs);
    }

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
        await axios.put(`http://localhost:5000/api/products/${editingProductId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        setEditingProductId(null);
      } else {
        await axios.post("http://localhost:5000/api/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }

      setProductForm(createInitialForm());
      setPreviewImages([]);
      setExtraDetails([{ key: "", value: "" }]);
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

  return (
    <div className="product-management">
      <h3><FaBox className="product-icon"/> {editingProductId ? "Edit Product" : "Add New Product"}</h3>

      <div className="product-form-container">
        {/* Currency + Categories Section */}
        <div className="form-section">
          <div className="section-title"><FaCog className="product-icon"/> Basic Information</div>
          <div className="form-row">
            <div className="form-group">
              <label><FaMoneyBillWave className="product-icon"/> Currency</label>
              <select className="form-control" name="currency" value={productForm.currency} onChange={handleProductChange}>
                {Object.keys(currencySymbols).map(cur => <option key={cur} value={cur}>{cur} ({currencySymbols[cur]})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label><FaList className="product-icon" /> Category</label>
              <select className="form-control" name="category" value={productForm.category} onChange={handleProductChange}>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>

            {subCategories.length > 0 && (
              <div className="form-group">
                <label><FaList className="product-icon" /> Subcategory</label>
                <select className="form-control" name="subCategory" value={productForm.subCategory} onChange={handleProductChange}>
                  <option value="">Select Subcategory</option>
                  {subCategories.map(sub => <option key={sub._id} value={sub.name}>{sub.name}</option>)}
                </select>
              </div>
            )}

            {subSubCategories.length > 0 && (
              <div className="form-group">
                <label><FaList className="product-icon" /> Sub-subcategory</label>
                <select className="form-control" name="subSubCategory" value={productForm.subSubCategory} onChange={handleProductChange}>
                  <option value="">Select Sub-subcategory</option>
                  {subSubCategories.map((subSub, idx) => <option key={idx} value={subSub}>{subSub}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Size handling */}
        {productForm.category === "Clothing" && (
          <div className="form-section">
            <div className="section-title"><FaTshirt className="product-icon" /> Sizes</div>
            <div className="checkbox-group">
              {sizeOptions.map(size => (
                <div className="checkbox-item" key={size}>
                  <input type="checkbox" name="size" value={size} checked={productForm.size.includes(size)} onChange={handleProductChange} />
                  <label>{size}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {["Footwear", "Sports", "Fitness"].includes(productForm.category) && (
          <div className="form-section">
            <div className="section-title"><FaTshirt className="product-icon" /> Size</div>
            <div className="form-group">
              <input className="form-control" type="text" name="sizes" placeholder="Enter size (e.g. 7, 8, 9)" value={productForm.sizes || ""} onChange={handleProductChange} />
            </div>
          </div>
        )}

        {/* Inches for Home category */}
        {productForm.category === "Home" && (
          <div className="form-section">
            <div className="section-title"><FaHome className="product-icon" /> Inches</div>
            <div className="form-group">
              <input className="form-control" type="text" name="inchs" placeholder="Enter inches (e.g. 32, 40, 55)" value={productForm.inchs || ""} onChange={handleProductChange} />
            </div>
          </div>
        )}

        {/* RAM */}
        {currentAttributes.includes("ram") && (
          <div className="form-section">
            <div className="section-title"><FaMobile className="product-icon" /> RAM</div>
            <div className="checkbox-group">
              {ramOptions.map(ram => (
                <div className="checkbox-item" key={ram}>
                  <input type="checkbox" name="ram" value={ram} checked={productForm.ram.includes(ram)} onChange={handleProductChange} />
                  <label>{ram}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage */}
        {currentAttributes.includes("storage") && (
          <div className="form-section">
            <div className="section-title"><FaMobile className="product-icon" /> ROM/Storage</div>
            <div className="checkbox-group">
              {storageOptions.map(storage => (
                <div className="checkbox-item" key={storage}>
                  <input type="checkbox" name="storage" value={storage} checked={productForm.storage.includes(storage)} onChange={handleProductChange} />
                  <label>{storage}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Type (ONLY for Electronics) */}
        {productForm.category === "Electronics" && currentAttributes.includes("type") && (
          <div className="form-section">
            <div className="section-title"><FaMobile className="product-icon" /> Type</div>
            <div className="checkbox-group">
              {typeOptions.map(tp => (
                <div className="checkbox-item" key={tp}>
                  <input type="checkbox" name="type" value={tp} checked={productForm.type.includes(tp)} onChange={handleProductChange} />
                  <label>{tp}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Fields Section */}
        <div className="form-section">
          <div className="section-title"><FaInfoCircle className="product-icon" /> Product Details</div>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input className="form-control" name="name" placeholder="Product Name" value={productForm.name || ""} onChange={handleProductChange} />
            </div>
            <div className="form-group">
              <label><FaMoneyBillWave className="product-icon" /> Price ({currencySymbols[productForm.currency]})</label>
              <input className="form-control" name="price" type="number" min="1" placeholder="Price" value={productForm.price || ""} onChange={handleProductChange} />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label><FaTag className="product-icon" /> Discount (%)</label>
              <input className="form-control" name="discount" type="number" min="0" max="100" placeholder="Discount" value={productForm.discount || ""} onChange={handleProductChange} />
            </div>
            <div className="form-group">
              <label><FaWarehouse className="product-icon" /> Stock</label>
              <input className="form-control" name="stock" type="number" placeholder="Stock Quantity" value={productForm.stock || ""} onChange={handleProductChange} />
            </div>
          </div>
          
          <div className="form-group">
            <label><FaAlignLeft className="product-icon" /> Description</label>
            <input className="form-control" name="description" placeholder="Product Description" value={productForm.description || ""} onChange={handleProductChange} />
          </div>
        </div>

        {/* Dynamic attributes */}
        {currentAttributes.filter(attr => !["size", "ram", "storage", "type", "inchs"].includes(attr)).length > 0 && (
          <div className="form-section">
            <div className="section-title"><FaCog className="product-icon" /> Attributes</div>
            <div className="form-row">
              {currentAttributes.filter(attr => !["size", "ram", "storage", "type", "inchs"].includes(attr)).map(attr => (
                <div className="form-group" key={attr}>
                  <label>{attr.charAt(0).toUpperCase() + attr.slice(1)}</label>
                  <input 
                    className="form-control"
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
        <div className="form-section">
          <div className="form-group">
            <label><FaInfoCircle className="product-icon" /> Warranty & Support</label>
            <input className="form-control" name="warranty" placeholder="Warranty Information" value={productForm.warranty || ""} onChange={handleProductChange} />
          </div>
        </div>

        {/* Extra Details */}
        <div className="form-section">
          <div className="section-title"><FaPlusCircle className="product-icon" /> Extra Details</div>
          <div className="extra-details-container">
            {extraDetails.map((detail, idx) => (
              <div className="extra-detail-row" key={idx}>
                <input 
                  className="form-control"
                  type="text" 
                  placeholder="Key" 
                  value={detail.key || ""} 
                  onChange={e => handleExtraChange(idx, "key", e.target.value)} 
                />
                <input 
                  className="form-control"
                  type="text" 
                  placeholder="Value" 
                  value={detail.value || ""} 
                  onChange={e => handleExtraChange(idx, "value", e.target.value)} 
                />
                <button className="remove-detail" type="button" onClick={() => removeExtraField(idx)}>
                  <FaTrash />
                </button>
              </div>
            ))}
            <button className="add-detail-btn" type="button" onClick={addExtraField}>
              <FaPlusCircle style={{color:"white"}} /> Add New Field
            </button>
          </div>
        </div>

        {/* Images */}
        <div className="form-section">
          <div className="section-title"><FaImage className="product-icon"/> Product Images</div>
          <div className="form-group">
            <input className="form-control" type="file" name="images" multiple onChange={handleProductChange} />
          </div>
          <div className="image-preview-container">
            {previewImages.map((img, idx) => (
              <div className="image-preview" key={idx}>
                <img src={img} alt="preview" />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button className="submit-btn" onClick={handleAddOrUpdateProduct}>
          <FaSave /> {editingProductId ? "Update Product" : "Add Product"}
        </button>

        {/* Final Price */}
        {productForm.price && (
          <div className="price-display">
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