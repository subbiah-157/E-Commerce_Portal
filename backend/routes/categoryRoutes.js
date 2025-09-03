const express = require("express");
const router = express.Router();
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  addSubSubCategory,
  updateSubSubCategory,
  deleteSubSubCategory,
} = require("../controllers/categoryController");

// Categories
router.get("/", getCategories);
router.post("/", addCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

// Subcategories
router.post("/sub", addSubCategory); // POST /categories/sub
router.put("/:categoryId/sub/:subCategoryId", updateSubCategory); // PUT /categories/:categoryId/sub/:subCategoryId
router.delete("/:categoryId/sub/:subCategoryId", deleteSubCategory);

// Sub-subcategories
router.post("/:categoryId/sub/:subCategoryId/subsub", addSubSubCategory);
router.put("/:categoryId/sub/:subCategoryId/subsub/:subSubIndex", updateSubSubCategory);
router.delete("/:categoryId/sub/:subCategoryId/subsub/:subSubIndex", deleteSubSubCategory);

module.exports = router;
