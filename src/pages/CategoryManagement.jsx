import { useState } from "react"; 
import axios from "axios";
import API_BASE_URL from "../config";
import { FaPlus, FaEdit, FaTrash, FaLayerGroup } from "react-icons/fa";
import "../styles/CategoryManagement.css"; // external CSS

const CategoryManagement = ({ categories, fetchCategories }) => {
  const [newCategory, setNewCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editingSubId, setEditingSubId] = useState(null);
  const [editingSubName, setEditingSubName] = useState("");
  const [editingSubCatParentId, setEditingSubCatParentId] = useState("");
  const [subSubCategoryName, setSubSubCategoryName] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [editingSubSubIndex, setEditingSubSubIndex] = useState(null);
  const [editingSubSubName, setEditingSubSubName] = useState("");
  const [editingSubSubParentId, setEditingSubSubParentId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // --- CATEGORY OPERATIONS ---
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return alert("Category name cannot be empty");
    try {
      await axios.post(`${API_BASE_URL}/api/categories`, { name: newCategory });
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add category");
    }
  };

  const startEditCategory = (cat) => {
    setEditingCategoryId(cat._id);
    setEditingCategoryName(cat.name);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryName.trim()) return alert("Category name cannot be empty");
    try {
      await axios.put(`${API_BASE_URL}/api/categories/${editingCategoryId}`, { name: editingCategoryName });
      setEditingCategoryId(null);
      setEditingCategoryName("");
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete category");
    }
  };

  // --- SUBCATEGORY OPERATIONS ---
  const handleAddSubCategory = async () => {
    if (!subCategoryName.trim() || !selectedCategoryId)
      return alert("Select category and enter subcategory name");
    try {
      await axios.post(`${API_BASE_URL}/api/categories/sub`, {
        categoryId: selectedCategoryId,
        subCategoryName,
      });
      setSubCategoryName("");
      setSelectedCategoryId("");
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add subcategory");
    }
  };

  const startEditSub = (sub, parentId) => {
    setEditingSubId(sub._id);
    setEditingSubName(sub.name);
    setEditingSubCatParentId(parentId);
  };

  const handleUpdateSub = async () => {
    if (!editingSubName.trim()) return alert("Subcategory name cannot be empty");
    try {
      await axios.put(
        `${API_BASE_URL}/api/categories/${editingSubCatParentId}/sub/${editingSubId}`,
        { name: editingSubName }
      );
      setEditingSubId(null);
      setEditingSubName("");
      setEditingSubCatParentId("");
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update subcategory");
    }
  };

  const handleDeleteSub = async (categoryId, subCategoryId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/categories/${categoryId}/sub/${subCategoryId}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete subcategory");
    }
  };

  // --- SUB-SUBCATEGORY OPERATIONS ---
  const handleAddSubSub = async () => {
    if (!subSubCategoryName.trim() || !selectedSubId)
      return alert("Select subcategory and enter sub-subcategory name");

    const parentCategory = categories.find((cat) =>
      cat.subCategories.some((sub) => sub._id === selectedSubId)
    );
    if (!parentCategory) return alert("Parent category not found");

    try {
      await axios.post(
        `${API_BASE_URL}/api/categories/${parentCategory._id}/sub/${selectedSubId}/subsub`,
        { subSubCategoryName }
      );
      setSubSubCategoryName("");
      setSelectedSubId("");
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add sub-subcategory");
    }
  };

  const startEditSubSub = (index, currentName, parentId) => {
    setEditingSubSubIndex(index);
    setEditingSubSubName(currentName);
    setEditingSubSubParentId(parentId);
  };

  const handleUpdateSubSub = async () => {
    if (!editingSubSubName.trim()) return alert("Sub-subcategory name cannot be empty");
    try {
      await axios.put(
         `${API_BASE_URL}/api/categories/${editingSubSubParentId.categoryId}/sub/${editingSubSubParentId.subCategoryId}/subsub/${editingSubSubIndex}`,
        { name: editingSubSubName }
      );
      setEditingSubSubIndex(null);
      setEditingSubSubName("");
      setEditingSubSubParentId("");
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update sub-subcategory");
    }
  };

  const handleDeleteSubSub = async (parentId, subId, index) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/categories/${parentId}/sub/${subId}/subsub/${index}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete sub-subcategory");
    }
  };

  // --- FILTERING ---
  const filteredCategories = categories
    .map((cat) => {
      const filteredSub = (cat.subCategories || []).filter(
        (sub) =>
          sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sub.subSubCategories || []).some((subSub) =>
            subSub.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      if (cat.name.toLowerCase().includes(searchTerm.toLowerCase())) return cat;
      if (filteredSub.length > 0) return { ...cat, subCategories: filteredSub };
      return null;
    })
    .filter(Boolean);

  return (
    <div className="category-management-container">
      <h2 className="category-heading">Category Management</h2>

      <div className="search-container">
        <input
          placeholder="Search categories, subcategories, sub-subcategories"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add / Edit Category */}
      <div className="add-category-container">
        <input
          placeholder="New Category"
          value={editingCategoryId ? editingCategoryName : newCategory}
          onChange={(e) =>
            editingCategoryId ? setEditingCategoryName(e.target.value) : setNewCategory(e.target.value)
          }
        />
        <button onClick={editingCategoryId ? handleUpdateCategory : handleAddCategory}>
          <FaPlus /> {editingCategoryId ? "Update" : "Add"}
        </button>
      </div>

      <ul className="category-list">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => {
            const subCategories = cat.subCategories || [];
            return (
              <li key={cat._id} className="category-item">
                <div className="category-header">
                  <FaLayerGroup className="category-icon" />
                  <span className="category-name">{cat.name}</span>
                  <div className="category-actions">
                    <button onClick={() => startEditCategory(cat)}><FaEdit /></button>
                    <button onClick={() => handleDeleteCategory(cat._id)}><FaTrash /></button>
                  </div>
                </div>

                {/* Subcategories */}
                {subCategories.length > 0 && (
                  <ul className="subcategory-list">
                    {subCategories.map((sub) => (
                      <li key={sub._id} className="subcategory-item">
                        {editingSubId === sub._id ? (
                          <>
                            <input
                              value={editingSubName}
                              onChange={(e) => setEditingSubName(e.target.value)}
                            />
                            <button onClick={handleUpdateSub}><FaEdit /> Save</button>
                          </>
                        ) : (
                          <>
                            <span>{sub.name}</span>
                            <div className="subcategory-actions">
                              <button onClick={() => startEditSub(sub, cat._id)}><FaEdit /></button>
                              <button onClick={() => handleDeleteSub(cat._id, sub._id)}><FaTrash /></button>
                            </div>
                          </>
                        )}

                        {/* Sub-subcategories */}
                        {sub.subSubCategories && sub.subSubCategories.length > 0 && (
                          <ul className="sub-subcategory-list">
                            {sub.subSubCategories.map((subSub, index) => (
                              <li key={`${sub._id}-${index}`} className="sub-subcategory-item">
                                {editingSubSubIndex === index &&
                                editingSubSubParentId.subCategoryId === sub._id ? (
                                  <>
                                    <input
                                      value={editingSubSubName}
                                      onChange={(e) => setEditingSubSubName(e.target.value)}
                                    />
                                    <button onClick={handleUpdateSubSub}><FaEdit /> Save</button>
                                  </>
                                ) : (
                                  <>
                                    <span>{subSub}</span>
                                    <div className="sub-subcategory-actions">
                                      <button onClick={() => startEditSubSub(index, subSub, { categoryId: cat._id, subCategoryId: sub._id })}>
                                        <FaEdit />
                                      </button>
                                      <button onClick={() => handleDeleteSubSub(cat._id, sub._id, index)}>
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })
        ) : (
          <p>No categories match your search.</p>
        )}
      </ul>

      {/* Add Subcategory */}
      <div className="add-subcategory-container">
        <h4>Add Subcategory</h4>
        <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
          <option value="">Select Category</option>
          {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
        </select>
        <input
          placeholder="Subcategory Name"
          value={subCategoryName}
          onChange={(e) => setSubCategoryName(e.target.value)}
        />
        <button onClick={handleAddSubCategory}><FaPlus /> Add Subcategory</button>
      </div>

      {/* Add Sub-subcategory */}
      <div className="add-subsubcategory-container">
        <h4>Add Sub-subcategory</h4>
        <select value={selectedSubId}className="arrow" onChange={(e) => setSelectedSubId(e.target.value)}>
          <option value="">Select Subcategory</option>
          {categories.flatMap((cat) =>
            (cat.subCategories || []).map((sub) => (
              <option key={sub._id} value={sub._id}>{cat.name} ➝ {sub.name}</option>
            ))
          )}
        </select>
        <input
          placeholder="Sub-subcategory Name"
          value={subSubCategoryName}
          onChange={(e) => setSubSubCategoryName(e.target.value)}
        />
        <button onClick={handleAddSubSub}><FaPlus /> Add Sub-subcategory</button>
      </div>
    </div>
  );
};

export default CategoryManagement;
